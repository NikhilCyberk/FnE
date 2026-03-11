const express = require('express');
const router = express.Router();
const {
  createCreditCardTransaction,
  getCreditCardTransactions,
  updateCreditCardTransaction,
  deleteCreditCardTransaction,
  getCreditCardTransactionSummary
} = require('../controllers/creditCardTransactionsController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/credit-cards/:creditCardId/transactions - Create new transaction
router.post('/:creditCardId/transactions', createCreditCardTransaction);

// GET /api/credit-cards/:creditCardId/transactions - Get all transactions for a credit card
router.get('/:creditCardId/transactions', getCreditCardTransactions);

// GET /api/credit-cards/:creditCardId/transactions/summary - Get transaction summary
router.get('/:creditCardId/transactions/summary', getCreditCardTransactionSummary);

// PUT /api/credit-cards/:creditCardId/transactions/:transactionId - Update transaction
router.put('/:creditCardId/transactions/:transactionId', updateCreditCardTransaction);

// DELETE /api/credit-cards/:creditCardId/transactions/:transactionId - Delete transaction
router.delete('/:creditCardId/transactions/:transactionId', deleteCreditCardTransaction);

module.exports = router;
