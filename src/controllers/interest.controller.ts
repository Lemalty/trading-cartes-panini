import { Request, Response } from 'express';
import { InterestService } from '../services/interest.service.js';
import { createAppChildLogger } from '../utils/Logger.js';

const logger = createAppChildLogger('InterestController');

export class InterestController {
    private interestService: InterestService;

    constructor() {
        this.interestService = new InterestService();
    }

    /**
     * API - Exprimer son intérêt pour un doublon
     * POST /api/interest/:duplicateId
     */
    async addInterest(req: Request, res: Response): Promise<void> {
        try {
            const memberId = req.session.memberId!;
            const duplicateId = parseInt(req.params.duplicateId, 10);

            if (isNaN(duplicateId)) {
                res.status(400).json({ success: false, error: 'ID de doublon invalide' });
                return;
            }

            await this.interestService.addInterest(memberId, duplicateId);

            res.json({ success: true });
        } catch (error: any) {
            logger.error('Error adding interest:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Erreur lors de l\'ajout de l\'intérêt'
            });
        }
    }

    /**
     * API - Retirer son intérêt pour un doublon
     * DELETE /api/interest/:duplicateId
     */
    async removeInterest(req: Request, res: Response): Promise<void> {
        try {
            const memberId = req.session.memberId!;
            const duplicateId = parseInt(req.params.duplicateId, 10);

            if (isNaN(duplicateId)) {
                res.status(400).json({ success: false, error: 'ID de doublon invalide' });
                return;
            }

            await this.interestService.removeInterest(memberId, duplicateId);

            res.json({ success: true });
        } catch (error: any) {
            logger.error('Error removing interest:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors de la suppression de l\'intérêt'
            });
        }
    }
}
