import { Request, Response } from 'express';
import { MemberService } from '../services/member.service.js';
import { CardService } from '../services/card.service.js';
import { createAppChildLogger } from '../utils/Logger.js';

const logger = createAppChildLogger('CardsController');

export class CardsController {
    private memberService: MemberService;
    private cardService: CardService;

    constructor() {
        this.memberService = new MemberService();
        this.cardService = new CardService();
    }

    /**
     * Page d'accueil - Recherche de cartes et membres
     */
    async getHomePage(req: Request, res: Response): Promise<void> {
        try {
            const memberCount = await this.memberService.getMemberCount();

            res.render('index', {
                memberCount,
                currentPage: 'home'
            });
        } catch (error) {
            logger.error('Error loading home page:', error);
            res.status(500).render('error', {
                message: 'Erreur lors du chargement de la page'
            });
        }
    }

    /**
     * Page d'ajout d'un membre
     */
    getAddMemberPage(req: Request, res: Response): void {
        res.render('add-member', {
            currentPage: 'add'
        });
    }

    /**
     * Traitement de l'ajout d'un membre avec ses cartes
     */
    async addMember(req: Request, res: Response): Promise<void> {
        try {
            const { displayName, cards } = req.body;

            if (!displayName || displayName.trim() === '') {
                res.status(400).json({
                    success: false,
                    error: 'Le nom est requis'
                });
                return;
            }

            let cardNumbers: string[] = [];
            if (cards && cards.trim() !== '') {
                const validation = await this.cardService.parseAndValidateCards(cards);

                if (validation.invalid.length > 0) {
                    res.status(400).json({
                        success: false,
                        error: 'Cartes invalides',
                        invalid: validation.invalid
                    });
                    return;
                }

                cardNumbers = validation.valid;
            }

            const member = await this.memberService.createMemberWithDuplicates(
                displayName,
                cardNumbers
            );

            res.json({
                success: true,
                member: {
                    id: member.id,
                    displayName: member.displayName
                }
            });
        } catch (error) {
            logger.error('Error adding member:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'ajout du membre'
            });
        }
    }

    /**
     * API - Validation des cartes
     */
    async validateCards(req: Request, res: Response): Promise<void> {
        try {
            const { cards } = req.body;

            if (!cards) {
                res.status(400).json({
                    success: false,
                    error: 'Aucune carte fournie'
                });
                return;
            }

            const validation = await this.cardService.parseAndValidateCards(cards);

            res.json({
                success: true,
                validation
            });
        } catch (error) {
            logger.error('Error validating cards:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la validation'
            });
        }
    }

    /**
     * Page de détails d'un membre
     */
    async getMemberPage(req: Request, res: Response): Promise<void> {
        try {
            const memberId = parseInt(req.params.id, 10);

            if (isNaN(memberId)) {
                return res.status(400).render('error', {
                    message: 'ID de membre invalide'
                });
            }

            const viewingMemberId: number | undefined = req.session.memberId;
            const member = await this.memberService.getMemberPageData(memberId, viewingMemberId);

            if (!member) {
                return res.status(404).render('error', {
                    message: 'Membre non trouvé'
                });
            }

            res.render('member', {
                member,
                currentPage: 'member'
            });
        } catch (error) {
            logger.error('Error loading member page:', error);
            res.status(500).render('error', {
                message: 'Erreur lors du chargement du membre'
            });
        }
    }

    /**
     * API - Recherche (membres ou cartes)
     */
    async search(req: Request, res: Response): Promise<void> {
        try {
            const { query, type } = req.query;

            if (!query || typeof query !== 'string') {
                 res.status(400).json({
                    success: false,
                    error: 'Requête invalide'
                });
                return;
            }

            if (type === 'card') {
                const result = await this.cardService.searchMembersByCard(query);
                res.json({
                    success: true,
                    type: 'card',
                    result
                });
            } else {
                const members = await this.memberService.searchMembersByName(query);
                res.json({
                    success: true,
                    type: 'member',
                    members
                });
            }
        } catch (error) {
            logger.error('Error searching:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche'
            });
        }
    }

    /**
     * Suppression d'un membre
     */
    async deleteMember(req: Request, res: Response): Promise<void> {
        try {
            const memberId = parseInt(req.params.id, 10);

            if (isNaN(memberId)) {
                res.status(400).json({
                    success: false,
                    error: 'ID invalide'
                });
                return;
            }

            await this.memberService.deleteMember(memberId);

            res.json({
                success: true
            });
        } catch (error) {
            logger.error('Error deleting member:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la suppression'
            });
        }
    }
}