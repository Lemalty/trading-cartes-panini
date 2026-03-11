import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();

router.get('/register', AuthController.showRegister);
router.post('/register', AuthController.register);

router.get('/login', AuthController.showLogin);
router.post('/login', AuthController.login);

router.get('/logout', AuthController.logout);

router.get('/verify-email', AuthController.verifyEmail);

router.get('/forgot-password', AuthController.showForgotPassword);
router.post('/forgot-password', AuthController.forgotPassword);

router.get('/reset-password', AuthController.showResetPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
