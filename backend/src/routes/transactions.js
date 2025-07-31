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
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
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
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by account ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense, transfer]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled, failed]
 *         description: Filter by transaction status
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum amount filter
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum amount filter
 *     responses:
 *       200:
 *         description: List of transactions with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       amount:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [income, expense, transfer]
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, cancelled, failed]
 *                       description:
 *                         type: string
 *                       merchant:
 *                         type: string
 *                       location:
 *                         type: string
 *                       transactionDate:
 *                         type: string
 *                         format: date
 *                       postedDate:
 *                         type: string
 *                         format: date
 *                       referenceNumber:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       notes:
 *                         type: string
 *                       isRecurring:
 *                         type: boolean
 *                       accountName:
 *                         type: string
 *                       accountNumberMasked:
 *                         type: string
 *                       categoryName:
 *                         type: string
 *                       categoryColor:
 *                         type: string
 *                       categoryIcon:
 *                         type: string
 *                       transferAccountName:
 *                         type: string
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - amount
 *               - type
 *               - transactionDate
 *             properties:
 *               accountId:
 *                 type: string
 *                 format: uuid
 *                 description: Source account ID
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID
 *               transferAccountId:
 *                 type: string
 *                 format: uuid
 *                 description: Transfer account ID (required for transfer type)
 *               amount:
 *                 type: number
 *                 description: Transaction amount (must not be zero)
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *                 description: Transaction type
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled, failed]
 *                 default: completed
 *                 description: Transaction status
 *               description:
 *                 type: string
 *                 description: Transaction description
 *               merchant:
 *                 type: string
 *                 maxLength: 100
 *                 description: Merchant name
 *               location:
 *                 type: string
 *                 description: Transaction location
 *               transactionDate:
 *                 type: string
 *                 format: date
 *                 description: Transaction date
 *               postedDate:
 *                 type: string
 *                 format: date
 *                 description: Posted date
 *               referenceNumber:
 *                 type: string
 *                 maxLength: 100
 *                 description: Reference number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Transaction tags
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               receiptUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Receipt URLs
 *               isRecurring:
 *                 type: boolean
 *                 default: false
 *                 description: Whether transaction is recurring
 *               recurringRule:
 *                 type: object
 *                 description: Recurring rule configuration
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Bad request - validation error
 */
router.get('/', transactionsController.getTransactions);
router.post('/', transactionsController.createTransaction);

/**
 * @swagger
 * /api/transactions/stats:
 *   get:
 *     summary: Get transaction statistics
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by account ID
 *     responses:
 *       200:
 *         description: Transaction statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTransactions:
 *                   type: integer
 *                 totalIncome:
 *                   type: number
 *                 totalExpenses:
 *                   type: number
 *                 totalTransfers:
 *                   type: number
 *                 averageAmount:
 *                   type: number
 *                 minAmount:
 *                   type: number
 *                 maxAmount:
 *                   type: number
 */
router.get('/stats', transactionsController.getTransactionStats);

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
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 amount:
 *                   type: number
 *                 type:
 *                   type: string
 *                   enum: [income, expense, transfer]
 *                 status:
 *                   type: string
 *                   enum: [pending, completed, cancelled, failed]
 *                 description:
 *                   type: string
 *                 merchant:
 *                   type: string
 *                 location:
 *                   type: string
 *                 transactionDate:
 *                   type: string
 *                   format: date
 *                 postedDate:
 *                   type: string
 *                   format: date
 *                 referenceNumber:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 notes:
 *                   type: string
 *                 isRecurring:
 *                   type: boolean
 *                 recurringRule:
 *                   type: object
 *                 accountId:
 *                   type: string
 *                   format: uuid
 *                 accountName:
 *                   type: string
 *                 accountNumberMasked:
 *                   type: string
 *                 categoryId:
 *                   type: string
 *                   format: uuid
 *                 categoryName:
 *                   type: string
 *                 categoryColor:
 *                   type: string
 *                 categoryIcon:
 *                   type: string
 *                 transferAccountId:
 *                   type: string
 *                   format: uuid
 *                 transferAccountName:
 *                   type: string
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
 *           format: uuid
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId:
 *                 type: string
 *                 format: uuid
 *                 description: Source account ID
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID
 *               transferAccountId:
 *                 type: string
 *                 format: uuid
 *                 description: Transfer account ID (required for transfer type)
 *               amount:
 *                 type: number
 *                 description: Transaction amount (must not be zero)
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *                 description: Transaction type
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled, failed]
 *                 description: Transaction status
 *               description:
 *                 type: string
 *                 description: Transaction description
 *               merchant:
 *                 type: string
 *                 maxLength: 100
 *                 description: Merchant name
 *               location:
 *                 type: string
 *                 description: Transaction location
 *               transactionDate:
 *                 type: string
 *                 format: date
 *                 description: Transaction date
 *               postedDate:
 *                 type: string
 *                 format: date
 *                 description: Posted date
 *               referenceNumber:
 *                 type: string
 *                 maxLength: 100
 *                 description: Reference number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Transaction tags
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               receiptUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Receipt URLs
 *               isRecurring:
 *                 type: boolean
 *                 description: Whether transaction is recurring
 *               recurringRule:
 *                 type: object
 *                 description: Recurring rule configuration
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       400:
 *         description: Bad request - validation error
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
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', transactionsController.getTransactionById);
router.put('/:id', transactionsController.updateTransaction);
router.delete('/:id', transactionsController.deleteTransaction);

module.exports = router; 