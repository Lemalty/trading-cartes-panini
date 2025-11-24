import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import { CardService } from '../services/card.service.js';
import { createAppChildLogger } from '../utils/Logger.js';

const logger = createAppChildLogger('AdminController');

export class AdminController {
    private adminService: AdminService;
    private cardService: CardService;

    constructor() {
        this.adminService = new AdminService();
        this.cardService = new CardService();
    }

    /**
     * Page de connexion admin
     */
    getLoginPage(req: Request, res: Response): void {
        if (req.session.isAdmin) {
            return res.redirect('/admin');
        }
        res.render('admin/login', {
            error: null
        });
    }

    /**
     * Traitement de la connexion admin
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { password } = req.body;

            if (!password) {
                return res.render('admin/login', {
                    error: 'Mot de passe requis'
                });
            }

            const isValid = await this.adminService.verifyPassword(password);

            if (isValid) {
                req.session.isAdmin = true;
                res.redirect('/admin');
            } else {
                res.render('admin/login', {
                    error: 'Mot de passe incorrect'
                });
            }
        } catch (error) {
            logger.error('Error during admin login:', error);
            res.render('admin/login', {
                error: 'Erreur lors de la connexion'
            });
        }
    }

    /**
     * Déconnexion admin
     */
    logout(req: Request, res: Response): void {
        req.session.isAdmin = false;
        req.session.destroy((err) => {
            if (err) {
                logger.error('Error destroying session:', err);
            }
            res.redirect('/');
        });
    }

    /**
     * Page de configuration admin
     */
    async getAdminPage(req: Request, res: Response): Promise<void> {
        try {
            const albumConfig = await this.cardService.getAlbumConfig();

            res.render('admin/config', {
                albumConfig,
                currentPage: 'admin',
                success: req.query.success === 'true'
            });
        } catch (error) {
            logger.error('Error loading admin page:', error);
            res.status(500).render('error', {
                message: 'Erreur lors du chargement de la configuration'
            });
        }
    }

    /**
     * Mise à jour de la configuration de l'album
     */
    async updateAlbumConfig(req: Request, res: Response): Promise<void> {
        try {
            const { maxNumericCard, maxLetterPrefix, maxLetterNumber } = req.body;

            const maxNumeric = parseInt(maxNumericCard, 10);
            const maxLetterNum = parseInt(maxLetterNumber, 10);

            if (isNaN(maxNumeric) || maxNumeric < 1) {
                res.status(400).json({
                    success: false,
                    error: 'Nombre maximum de cartes numériques invalide'
                });
                return;
            }

            if (isNaN(maxLetterNum) || maxLetterNum < 1) {
                res.status(400).json({
                    success: false,
                    error: 'Nombre maximum par lettre invalide'
                });
                return;
            }

            if (!maxLetterPrefix || !/^[A-Z]$/.test(maxLetterPrefix)) {
                res.status(400).json({
                    success: false,
                    error: 'Lettre maximale invalide (doit être une lettre majuscule)'
                });
                return;
            }

            await this.cardService.updateAlbumConfig(
                maxNumeric,
                maxLetterPrefix,
                maxLetterNum
            );

            res.json({
                success: true
            });
        } catch (error) {
            logger.error('Error updating album config:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la mise à jour'
            });
        }
    }
}