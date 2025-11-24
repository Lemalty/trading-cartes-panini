import express from 'express';
import { CardsController } from '../controllers/cards.controller.js';

const router = express.Router();
const cardsController = new CardsController();

// Page d'accueil
router.get('/', (req, res) => cardsController.getHomePage(req, res));

// Page d'ajout d'un membre
router.get('/member/add', (req, res) => cardsController.getAddMemberPage(req, res));

// API - Ajout d'un membre
router.post('/api/member', (req, res) => cardsController.addMember(req, res));

// API - Validation de cartes
router.post('/api/cards/validate', (req, res) => cardsController.validateCards(req, res));

// Page de détails d'un membre
router.get('/member/:id', (req, res) => cardsController.getMemberPage(req, res));

// API - Recherche
router.get('/api/search', (req, res) => cardsController.search(req, res));

// API - Suppression d'un membre
router.delete('/api/member/:id', (req, res) => cardsController.deleteMember(req, res));

export default router;