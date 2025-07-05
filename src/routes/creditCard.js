const express = require('express');
const router = express.Router();
const { extractCreditCardInfo, saveCreditCard, getCreditCards, getCreditCardById, updateCreditCard, deleteCreditCard } = require('../controllers/creditCardController');

router.post('/extract-credit-card-info', extractCreditCardInfo);

// Add new routes for saving and fetching credit cards
router.post('/', saveCreditCard);
router.get('/', getCreditCards);
router.get('/:id', getCreditCardById);
router.put('/:id', updateCreditCard);
router.delete('/:id', deleteCreditCard);

module.exports = router; 