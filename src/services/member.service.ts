import { getDataSource } from '../config/Database.js';
import { Repository } from 'typeorm';
import { CardService } from './card.service.js';
import {MemberWithDuplicates} from "cards.type.js";
import {Duplicate} from "../entities/Duplicate.entity.js";
import {Wanted} from "../entities/Wanted.entity.js";
import {Member} from "../entities/Member.entity.js";

export class MemberService {
    private memberRepository: Repository<Member>;
    private duplicateRepository: Repository<Duplicate>;
    private wantedRepository: Repository<Wanted>;
    private cardService: CardService;

    constructor() {
        const dataSource = getDataSource();
        this.memberRepository = dataSource.getRepository(Member);
        this.duplicateRepository = dataSource.getRepository(Duplicate);
        this.wantedRepository = dataSource.getRepository(Wanted);
        this.cardService = new CardService();
    }

    /**
     * Crée un nouveau membre avec ses cartes en double
     */
    async createMemberWithDuplicates(
        displayName: string,
        cardNumbers: string[]
    ): Promise<Member> {
        const member = this.memberRepository.create({
            displayName: displayName.trim()
        });
        await this.memberRepository.save(member);

        if (cardNumbers.length > 0) {
            await this.addDuplicatesToMember(member.id, cardNumbers);
        }

        return member;
    }

    /**
     * Ajoute des cartes en double à un membre existant
     */
    async addDuplicatesToMember(
        memberId: number,
        cardNumbers: string[]
    ): Promise<void> {
        const member = await this.memberRepository.findOne({
            where: { id: memberId }
        });

        if (!member) {
            throw new Error('Member not found');
        }

        const cards = await this.cardService.getOrCreateCards(cardNumbers);

        for (const card of cards) {
            const existingDuplicate = await this.duplicateRepository.findOne({
                where: {
                    member: { id: memberId },
                    card: { id: card.id }
                }
            });

            if (!existingDuplicate) {
                const duplicate = this.duplicateRepository.create({
                    member,
                    card
                });
                await this.duplicateRepository.save(duplicate);
            }
        }
    }

    /**
     * Supprime des cartes en double d'un membre
     */
    async removeDuplicatesFromMember(
        memberId: number,
        cardNumbers: string[]
    ): Promise<void> {
        for (const cardNumber of cardNumbers) {
            await this.duplicateRepository
                .createQueryBuilder()
                .delete()
                .from(Duplicate)
                .where('memberId = :memberId', { memberId })
                .andWhere('cardId IN (SELECT id FROM cards WHERE cardNumber = :cardNumber)', {
                    cardNumber
                })
                .execute();
        }
    }

    /**
     * Remplace toutes les cartes en double d'un membre
     */
    async replaceDuplicates(memberId: number, cardNumbers: string[]): Promise<void> {
        await this.duplicateRepository
            .createQueryBuilder()
            .delete()
            .from(Duplicate)
            .where('memberId = :memberId', { memberId })
            .execute();

        if (cardNumbers.length > 0) {
            await this.addDuplicatesToMember(memberId, cardNumbers);
        }
    }

    /**
     * Ajoute des cartes recherchées à un membre
     */
    async addWantedToMember(
        memberId: number,
        cardNumbers: string[]
    ): Promise<void> {
        const member = await this.memberRepository.findOne({
            where: { id: memberId }
        });

        if (!member) {
            throw new Error('Member not found');
        }

        const cards = await this.cardService.getOrCreateCards(cardNumbers);

        for (const card of cards) {
            const existingWanted = await this.wantedRepository.findOne({
                where: {
                    member: { id: memberId },
                    card: { id: card.id }
                }
            });

            if (!existingWanted) {
                const wanted = this.wantedRepository.create({
                    member,
                    card
                });
                await this.wantedRepository.save(wanted);
            }
        }
    }

    /**
     * Remplace toutes les cartes recherchées d'un membre
     */
    async replaceWanted(memberId: number, cardNumbers: string[]): Promise<void> {
        await this.wantedRepository
            .createQueryBuilder()
            .delete()
            .from(Wanted)
            .where('memberId = :memberId', { memberId })
            .execute();

        if (cardNumbers.length > 0) {
            await this.addWantedToMember(memberId, cardNumbers);
        }
    }

    /**
     * Récupère un membre avec ses cartes en double et recherchées
     */
    async getMemberWithDuplicates(memberId: number): Promise<MemberWithDuplicates | null> {
        const member = await this.memberRepository.findOne({
            where: { id: memberId },
            relations: ['duplicates', 'duplicates.card', 'wanted', 'wanted.card']
        });

        if (!member) {
            return null;
        }

        return {
            id: member.id,
            displayName: member.displayName,
            duplicates: member.duplicates
                .map((d: { card: { cardNumber: any; }; }) => d.card.cardNumber)
                .sort((a: string, b: string) => this.sortCardNumbers(a, b)),
            wanted: (member.wanted || [])
                .map((w: { card: { cardNumber: any; }; }) => w.card.cardNumber)
                .sort((a: string, b: string) => this.sortCardNumbers(a, b)),
            createdAt: member.createdAt
        };
    }

    /**
     * Récupère tous les membres avec leurs cartes en double et recherchées
     */
    async getAllMembersWithDuplicates(): Promise<MemberWithDuplicates[]> {
        const members = await this.memberRepository.find({
            relations: ['duplicates', 'duplicates.card', 'wanted', 'wanted.card'],
            order: {
                displayName: 'ASC'
            }
        });

        return members.map(member => ({
            id: member.id,
            displayName: member.displayName,
            duplicates: member.duplicates
                .map((d: { card: { cardNumber: any; }; }) => d.card.cardNumber)
                .sort((a: string, b: string) => this.sortCardNumbers(a, b)),
            wanted: (member.wanted || [])
                .map((w: { card: { cardNumber: any; }; }) => w.card.cardNumber)
                .sort((a: string, b: string) => this.sortCardNumbers(a, b)),
            createdAt: member.createdAt
        }));
    }

    /**
     * Recherche des membres par nom
     */
    async searchMembersByName(query: string): Promise<MemberWithDuplicates[]> {
        const members = await this.memberRepository
            .createQueryBuilder('member')
            .leftJoinAndSelect('member.duplicates', 'duplicate')
            .leftJoinAndSelect('duplicate.card', 'card')
            .leftJoinAndSelect('member.wanted', 'wanted')
            .leftJoinAndSelect('wanted.card', 'wantedCard')
            .where('LOWER(member.displayName) LIKE :query', {
                query: `%${query.toLowerCase()}%`
            })
            .orderBy('member.displayName', 'ASC')
            .getMany();

        return members.map(member => ({
            id: member.id,
            displayName: member.displayName,
            duplicates: member.duplicates
                .map(d => d.card.cardNumber)
                .sort((a, b) => this.sortCardNumbers(a, b)),
            wanted: (member.wanted || [])
                .map(w => w.card.cardNumber)
                .sort((a, b) => this.sortCardNumbers(a, b)),
            createdAt: member.createdAt
        }));
    }

    /**
     * Supprime un membre et tous ses duplicates
     */
    async deleteMember(memberId: number): Promise<void> {
        await this.memberRepository.delete(memberId);
    }

    /**
     * Trie les numéros de cartes (numérique puis lettres)
     */
    private sortCardNumbers(a: string, b: string): number {
        const aIsNumeric = /^\d+$/.test(a);
        const bIsNumeric = /^\d+$/.test(b);

        if (aIsNumeric && bIsNumeric) {
            return parseInt(a, 10) - parseInt(b, 10);
        }

        if (aIsNumeric) return -1;
        if (bIsNumeric) return 1;

        return a.localeCompare(b);
    }
}
