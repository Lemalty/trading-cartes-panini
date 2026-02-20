import { getDataSource } from '../config/Database.js';
import { Repository } from 'typeorm';
import { Interest } from '../entities/Interest.entity.js';
import { Duplicate } from '../entities/Duplicate.entity.js';
import { InterestOnMyDuplicate } from 'cards.type.js';

export class InterestService {
    private interestRepository: Repository<Interest>;
    private duplicateRepository: Repository<Duplicate>;

    constructor() {
        const dataSource = getDataSource();
        this.interestRepository = dataSource.getRepository(Interest);
        this.duplicateRepository = dataSource.getRepository(Duplicate);
    }

    /**
     * Ajoute un intérêt pour un doublon.
     * Vérifie que le doublon existe, que l'utilisateur ne montre pas d'intérêt
     * pour son propre doublon, et qu'il n'a pas déjà exprimé son intérêt.
     */
    async addInterest(interestedMemberId: number, duplicateId: number): Promise<void> {
        const duplicate = await this.duplicateRepository.findOne({
            where: { id: duplicateId },
            relations: ['member']
        });

        if (!duplicate) {
            throw new Error('Doublon introuvable');
        }

        if (duplicate.member.id === interestedMemberId) {
            throw new Error('Vous ne pouvez pas vous intéresser à votre propre doublon');
        }

        const existing = await this.interestRepository.findOne({
            where: {
                interestedMember: { id: interestedMemberId },
                duplicate: { id: duplicateId }
            }
        });

        if (existing) {
            throw new Error('Vous avez déjà exprimé votre intérêt pour ce doublon');
        }

        const interest = this.interestRepository.create({
            interestedMember: { id: interestedMemberId },
            duplicate: { id: duplicateId }
        });

        await this.interestRepository.save(interest);
    }

    /**
     * Supprime un intérêt pour un doublon.
     */
    async removeInterest(interestedMemberId: number, duplicateId: number): Promise<void> {
        await this.interestRepository.delete({
            interestedMember: { id: interestedMemberId },
            duplicate: { id: duplicateId }
        });
    }

    /**
     * Vérifie si un membre est déjà intéressé par un doublon.
     */
    async hasInterest(interestedMemberId: number, duplicateId: number): Promise<boolean> {
        const count = await this.interestRepository.count({
            where: {
                interestedMember: { id: interestedMemberId },
                duplicate: { id: duplicateId }
            }
        });
        return count > 0;
    }

    /**
     * Récupère les IDs des doublons pour lesquels un membre a exprimé son intérêt.
     */
    async getInterestedDuplicateIds(interestedMemberId: number): Promise<Set<number>> {
        const interests = await this.interestRepository.find({
            where: { interestedMember: { id: interestedMemberId } },
            relations: ['duplicate']
        });
        return new Set(interests.map(i => i.duplicate.id));
    }

    /**
     * Récupère tous les intérêts exprimés pour les doublons d'un membre (propriétaire).
     */
    async getInterestsOnMyDuplicates(ownerMemberId: number): Promise<InterestOnMyDuplicate[]> {
        const interests = await this.interestRepository
            .createQueryBuilder('interest')
            .innerJoinAndSelect('interest.interestedMember', 'interestedMember')
            .innerJoinAndSelect('interest.duplicate', 'duplicate')
            .innerJoinAndSelect('duplicate.card', 'card')
            .innerJoinAndSelect('duplicate.member', 'owner')
            .where('owner.id = :ownerMemberId', { ownerMemberId })
            .orderBy('card.cardNumber', 'ASC')
            .getMany();

        return interests.map(interest => ({
            duplicateId: interest.duplicate.id,
            cardNumber: interest.duplicate.card.cardNumber,
            interestedMember: {
                id: interest.interestedMember.id,
                displayName: interest.interestedMember.displayName
            }
        }));
    }
}
