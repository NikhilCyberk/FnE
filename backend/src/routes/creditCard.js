const express = require('express');
const router = express.Router();
const { extractCreditCardInfo, saveCreditCard, getCreditCards, getCreditCardById, updateCreditCard, deleteCreditCard, getCardNameOptions, addCardNameOption } = require('../controllers/creditCardController');

router.post('/extract-credit-card-info', extractCreditCardInfo);

// Add new routes for saving and fetching credit cards
router.post('/', saveCreditCard);
router.get('/', getCreditCards);
router.get('/:id', getCreditCardById);
router.put('/:id', updateCreditCard);
router.delete('/:id', deleteCreditCard);
router.get('/card-names', getCardNameOptions);
router.post('/card-names', addCardNameOption);

module.exports = router; 