import express from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();
const adminController = new AdminController();

// Page de connexion
router.get('/admin/login', (req, res) => adminController.getLoginPage(req, res));

// Traitement de la connexion
router.post('/admin/login', (req, res) => adminController.login(req, res));

// Déconnexion
router.get('/admin/logout', (req, res) => adminController.logout(req, res));

// Page de configuration (protégée)
router.get('/admin', requireAdmin, (req, res) => adminController.getAdminPage(req, res));

// Mise à jour de la configuration (protégée)
router.post('/admin/config', requireAdmin, (req, res) => adminController.updateAlbumConfig(req, res));

export default router;