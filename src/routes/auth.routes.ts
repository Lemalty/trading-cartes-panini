import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();
const authController = new AuthController();

// Page de connexion
router.get('/login', (req, res) => authController.getLoginPage(req, res));

// Traitement de la connexion
router.post('/login', (req, res) => authController.login(req, res));

// Page d'inscription
router.get('/register', (req, res) => authController.getRegisterPage(req, res));

// Traitement de l'inscription
router.post('/register', (req, res) => authController.register(req, res));

// Déconnexion
router.get('/logout', (req, res) => authController.logout(req, res));

// Page "Mes cartes" (protégée)
router.get('/my-cards', requireAuth, (req, res) => authController.getMyCardsPage(req, res));

// API - Mise à jour des cartes en double (protégée)
router.post('/api/my-cards/duplicates', requireAuth, (req, res) => authController.updateDuplicates(req, res));

// API - Mise à jour des cartes recherchées (protégée)
router.post('/api/my-cards/wanted', requireAuth, (req, res) => authController.updateWanted(req, res));

export default router;
