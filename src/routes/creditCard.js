const express = require('express');
const router = express.Router();
const { extractCreditCardInfo, saveCreditCard, getCreditCards } = require('../controllers/creditCardController');

router.post('/extract-credit-card-info', extractCreditCardInfo);

// Add new routes for saving and fetching credit cards
router.post('/', saveCreditCard);
router.get('/', getCreditCards);

module.exports = router; 