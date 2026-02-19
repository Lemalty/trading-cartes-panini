import express from 'express';
import { InterestController } from '../controllers/interest.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();
const interestController = new InterestController();

// API - Exprimer son intérêt pour un doublon (protégée)
router.post('/api/interest/:duplicateId', requireAuth, (req, res) => interestController.addInterest(req, res));

// API - Retirer son intérêt pour un doublon (protégée)
router.delete('/api/interest/:duplicateId', requireAuth, (req, res) => interestController.removeInterest(req, res));

export default router;
