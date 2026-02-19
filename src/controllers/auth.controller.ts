import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { MemberService } from '../services/member.service.js';
import { CardService } from '../services/card.service.js';
import { createAppChildLogger } from '../utils/Logger.js';

const logger = createAppChildLogger('AuthController');

export class AuthController {
    private authService: AuthService;
    private memberService: MemberService;
    private cardService: CardService;

    constructor() {
        this.authService = new AuthService();
        this.memberService = new MemberService();
        this.cardService = new CardService();
    }

    /**
     * Page de connexion
     */
    getLoginPage(req: Request, res: Response): void {
        if (req.session.memberId) {
            return res.redirect('/my-cards');
        }
        res.render('auth/login', {
            error: null,
            currentPage: 'login'
        });
    }

    /**
     * Traitement de la connexion
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { displayName, password } = req.body;

            if (!displayName || !password) {
                return res.render('auth/login', {
                    error: 'Nom et mot de passe requis',
                    currentPage: 'login'
                });
            }

            const member = await this.authService.login(displayName, password);

            if (member) {
                req.session.memberId = member.id;
                req.session.memberName = member.displayName;
                res.redirect('/my-cards');
            } else {
                res.render('auth/login', {
                    error: 'Nom ou mot de passe incorrect',
                    currentPage: 'login'
                });
            }
        } catch (error) {
            logger.error('Error during login:', error);
            res.render('auth/login', {
                error: 'Erreur lors de la connexion',
                currentPage: 'login'
            });
        }
    }

    /**
     * Page d'inscription
     */
    getRegisterPage(req: Request, res: Response): void {
        if (req.session.memberId) {
            return res.redirect('/my-cards');
        }
        res.render('auth/register', {
            error: null,
            currentPage: 'register'
        });
    }

    /**
     * Traitement de l'inscription
     */
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { displayName, password, passwordConfirm, team } = req.body;

            if (!displayName || !password) {
                return res.render('auth/register', {
                    error: 'Tous les champs sont requis',
                    currentPage: 'register'
                });
            }

            if (displayName.trim().length < 2) {
                return res.render('auth/register', {
                    error: 'Le nom doit contenir au moins 2 caractères',
                    currentPage: 'register'
                });
            }

            if (password.length < 4) {
                return res.render('auth/register', {
                    error: 'Le mot de passe doit contenir au moins 4 caractères',
                    currentPage: 'register'
                });
            }

            if (password !== passwordConfirm) {
                return res.render('auth/register', {
                    error: 'Les mots de passe ne correspondent pas',
                    currentPage: 'register'
                });
            }

            const isTaken = await this.authService.isDisplayNameTaken(displayName);
            if (isTaken) {
                return res.render('auth/register', {
                    error: 'Ce nom est déjà utilisé',
                    currentPage: 'register'
                });
            }

            const member = await this.authService.register(displayName, password, team);

            req.session.memberId = member.id;
            req.session.memberName = member.displayName;
            res.redirect('/my-cards');
        } catch (error) {
            logger.error('Error during registration:', error);
            res.render('auth/register', {
                error: 'Erreur lors de l\'inscription',
                currentPage: 'register'
            });
        }
    }

    /**
     * Déconnexion
     */
    logout(req: Request, res: Response): void {
        req.session.destroy((err) => {
            if (err) {
                logger.error('Error destroying session:', err);
            }
            res.redirect('/');
        });
    }

    /**
     * Page "Mes cartes"
     */
    async getMyCardsPage(req: Request, res: Response): Promise<void> {
        try {
            const memberId = req.session.memberId!;
            const member = await this.memberService.getMemberWithDuplicates(memberId);

            if (!member) {
                req.session.destroy(() => {});
                return res.redirect('/login');
            }

            res.render('my-cards', {
                member,
                currentPage: 'my-cards'
            });
        } catch (error) {
            logger.error('Error loading my cards page:', error);
            res.status(500).render('error', {
                message: 'Erreur lors du chargement de vos cartes'
            });
        }
    }

    /**
     * API - Mise à jour des cartes en double
     */
    async updateDuplicates(req: Request, res: Response): Promise<void> {
        try {
            const memberId = req.session.memberId!;
            const { cards } = req.body;

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

            await this.memberService.replaceDuplicates(memberId, cardNumbers);

            res.json({ success: true });
        } catch (error) {
            logger.error('Error updating duplicates:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la mise à jour des doubles'
            });
        }
    }

    /**
     * API - Mise à jour des cartes recherchées
     */
    async updateWanted(req: Request, res: Response): Promise<void> {
        try {
            const memberId = req.session.memberId!;
            const { cards } = req.body;

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

            await this.memberService.replaceWanted(memberId, cardNumbers);

            res.json({ success: true });
        } catch (error) {
            logger.error('Error updating wanted cards:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la mise à jour des cartes recherchées'
            });
        }
    }
}
