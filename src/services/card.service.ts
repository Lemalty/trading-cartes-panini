import { getDataSource } from '../config/Database.js';
import { Repository } from 'typeorm';
import {Card} from "../entities/Card.entity.js";
import {AlbumConfig} from "../entities/AlbumConfig.entity.js";
import {CardValidationResult, ParsedCard} from "cards.type.js";

export class CardService {
    private cardRepository: Repository<Card>;
    private albumConfigRepository: Repository<AlbumConfig>;

    constructor() {
        const dataSource = getDataSource();
        this.cardRepository = dataSource.getRepository(Card);
        this.albumConfigRepository = dataSource.getRepository(AlbumConfig);
    }

    /**
     * Parse une chaîne de cartes (ex: "1, 5, 23, I2, A4") et retourne les cartes valides/invalides
     */
    async parseAndValidateCards(cardsString: string): Promise<CardValidationResult> {
        const config = await this.getAlbumConfig();
        const cardNumbers = cardsString
            .split(',')
            .map(c => c.trim().toUpperCase())
            .filter(c => c.length > 0);

        const valid: string[] = [];
        const invalid: string[] = [];

        for (const cardNumber of cardNumbers) {
            if (this.isValidCard(cardNumber, config)) {
                valid.push(cardNumber);
            } else {
                invalid.push(cardNumber);
            }
        }

        return { valid, invalid };
    }

    /**
     * Vérifie si un numéro de carte est valide selon la config
     */
    private isValidCard(cardNumber: string, config: AlbumConfig): boolean {
        // Test si c'est un numéro
        const numericMatch = cardNumber.match(/^(\d+)$/);
        if (numericMatch) {
            const num = parseInt(numericMatch[1], 10);
            return num >= 1 && num <= config.maxNumericCard;
        }

        // Test si c'est un format lettre+chiffre
        const letterMatch = cardNumber.match(/^([A-Z])(\d+)$/);
        if (letterMatch) {
            const letter = letterMatch[1];
            const num = parseInt(letterMatch[2], 10);
            return (
                letter <= config.maxLetterPrefix &&
                num >= 1 &&
                num <= config.maxLetterNumber
            );
        }

        return false;
    }

    /**
     * Crée ou récupère les cartes à partir d'une liste de numéros
     */
    async getOrCreateCards(cardNumbers: string[]): Promise<Card[]> {
        const cards: Card[] = [];

        for (const cardNumber of cardNumbers) {
            let card = await this.cardRepository.findOne({
                where: { cardNumber }
            });

            if (!card) {
                const parsedCard = this.parseCardType(cardNumber);
                card = this.cardRepository.create({
                    cardNumber: parsedCard.cardNumber,
                    cardType: parsedCard.cardType
                });
                await this.cardRepository.save(card);
            }

            cards.push(card);
        }

        return cards;
    }

    /**
     * Détermine le type d'une carte
     */
    private parseCardType(cardNumber: string): ParsedCard {
        const numericMatch = cardNumber.match(/^(\d+)$/);
        if (numericMatch) {
            return {
                cardNumber,
                cardType: 'numeric'
            };
        }
        return {
            cardNumber,
            cardType: 'letter'
        };
    }

    /**
     * Récupère la configuration de l'album
     */
    async getAlbumConfig(): Promise<AlbumConfig> {
        let config = await this.albumConfigRepository.findOne({
            where: { id: 1 }
        });

        if (!config) {
            config = this.albumConfigRepository.create({
                maxNumericCard: 400,
                maxLetterPrefix: 'K',
                maxLetterNumber: 4
            });
            await this.albumConfigRepository.save(config);
        }

        return config;
    }

    /**
     * Met à jour la configuration de l'album
     */
    async updateAlbumConfig(
        maxNumericCard: number,
        maxLetterPrefix: string,
        maxLetterNumber: number
    ): Promise<AlbumConfig> {
        let config = await this.getAlbumConfig();

        config.maxNumericCard = maxNumericCard;
        config.maxLetterPrefix = maxLetterPrefix.toUpperCase();
        config.maxLetterNumber = maxLetterNumber;

        return await this.albumConfigRepository.save(config);
    }

    /**
     * Récupère toutes les cartes avec leurs membres
     */
    async getAllCardsWithMembers() {
        return await this.cardRepository
            .createQueryBuilder('card')
            .leftJoinAndSelect('card.duplicates', 'duplicate')
            .leftJoinAndSelect('duplicate.member', 'member')
            .orderBy('card.cardNumber', 'ASC')
            .getMany();
    }

    /**
     * Recherche les membres qui possèdent une carte spécifique
     */
    async searchMembersByCard(cardNumber: string) {
        const card = await this.cardRepository.findOne({
            where: { cardNumber: cardNumber.toUpperCase() },
            relations: ['duplicates', 'duplicates.member']
        });

        if (!card) {
            return null;
        }

        return {
            cardNumber: card.cardNumber,
            members: card.duplicates.map(d => ({
                id: d.member.id,
                displayName: d.member.displayName
            }))
        };
    }
}