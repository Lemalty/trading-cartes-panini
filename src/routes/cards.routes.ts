import express from 'express';
import { CardsController } from '../controllers/cards.controller.js';

const router = express.Router();
const cardsController = new CardsController();

// Page d'accueil
router.get('/', (req, res) => cardsController.getHomePage(req, res));

// Redirection de l'ancienne page d'ajout vers la connexion
router.get('/member/add', (req, res) => {
    if (req.session.memberId) {
        res.redirect('/my-cards');
    } else {
        res.redirect('/register');
    }
});

// API - Validation de cartes
router.post('/api/cards/validate', (req, res) => cardsController.validateCards(req, res));

// Page de détails d'un membre
router.get('/member/:id', (req, res) => cardsController.getMemberPage(req, res));

// API - Recherche
router.get('/api/search', (req, res) => cardsController.search(req, res));

// API - Suppression d'un membre
router.delete('/api/member/:id', (req, res) => cardsController.deleteMember(req, res));

export default router;
