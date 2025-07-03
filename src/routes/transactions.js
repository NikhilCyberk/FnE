const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const transactionsController = require('../controllers/transactionsController');

router.use(auth);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions for the authenticated user (with filters)
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter end date
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter by account
 *     responses:
 *       200:
 *         description: List of transactions
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               merchant:
 *                 type: string
 *               transactionDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               receiptUrl:
 *                 type: string
 *               isRecurring:
 *                 type: boolean
 *               recurringRule:
 *                 type: object
 *     responses:
 *       201:
 *         description: Transaction created
 */
router.get('/', transactionsController.getTransactions); // supports filtering
router.post('/', transactionsController.createTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 *   put:
 *     summary: Update transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               merchant:
 *                 type: string
 *               transactionDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               receiptUrl:
 *                 type: string
 *               isRecurring:
 *                 type: boolean
 *               recurringRule:
 *                 type: object
 *     responses:
 *       200:
 *         description: Transaction updated
 *       404:
 *         description: Transaction not found
 *   delete:
 *     summary: Delete transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', transactionsController.getTransactionById);
router.put('/:id', transactionsController.updateTransaction);
router.delete('/:id', transactionsController.deleteTransaction);

module.exports = router; 