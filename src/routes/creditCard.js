const express = require('express');
const router = express.Router();
const { extractCreditCardInfo, saveCreditCard, getCreditCards, deleteCreditCard } = require('../controllers/creditCardController');

router.post('/extract-credit-card-info', extractCreditCardInfo);

// Add new routes for saving and fetching credit cards
router.post('/', saveCreditCard);
router.get('/', getCreditCards);
router.delete('/:id', deleteCreditCard);

module.exports = router; 