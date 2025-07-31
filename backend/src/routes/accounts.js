const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const accountsController = require('../controllers/accountsController');

router.use(auth);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts for the authenticated user
 *     tags: [Accounts]
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
 *           default: 20
 *         description: Number of accounts per page
 *     responses:
 *       200:
 *         description: List of accounts with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       accountName:
 *                         type: string
 *                       accountNumberMasked:
 *                         type: string
 *                       balance:
 *                         type: number
 *                       availableBalance:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       creditLimit:
 *                         type: number
 *                       minimumBalance:
 *                         type: number
 *                       accountStatus:
 *                         type: string
 *                       isPrimary:
 *                         type: boolean
 *                       accountTypeName:
 *                         type: string
 *                       accountTypeCategory:
 *                         type: string
 *                       institutionName:
 *                         type: string
 *                       institutionLogo:
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
 *     summary: Create a new account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountName
 *               - accountTypeId
 *             properties:
 *               accountName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the account
 *               accountTypeId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the account type
 *               institutionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the financial institution
 *               accountNumber:
 *                 type: string
 *                 description: Account number (will be masked in response)
 *               balance:
 *                 type: number
 *                 description: Current balance
 *               availableBalance:
 *                 type: number
 *                 description: Available balance
 *               currency:
 *                 type: string
 *                 pattern: '^[A-Z]{3}$'
 *                 default: INR
 *                 description: Currency code (3-letter ISO)
 *               creditLimit:
 *                 type: number
 *                 description: Credit limit for credit accounts
 *               minimumBalance:
 *                 type: number
 *                 description: Minimum balance requirement
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Bad request - validation error
 */
router.get('/', accountsController.getAccounts);
router.post('/', accountsController.createAccount);

/**
 * @swagger
 * /api/accounts/types:
 *   get:
 *     summary: Get all account types
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: List of account types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   category:
 *                     type: string
 *                     enum: [asset, liability, equity]
 *                   description:
 *                     type: string
 */
router.get('/types', accountsController.getAccountTypes);

/**
 * @swagger
 * /api/accounts/institutions:
 *   get:
 *     summary: Get all financial institutions
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: List of financial institutions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   code:
 *                     type: string
 *                   country:
 *                     type: string
 *                   logoUrl:
 *                     type: string
 */
router.get('/institutions', accountsController.getFinancialInstitutions);

/**
 * @swagger
 * /api/accounts/summary:
 *   get:
 *     summary: Get account summary/overview
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: Account summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAccounts:
 *                   type: integer
 *                 totalAssets:
 *                   type: number
 *                 totalLiabilities:
 *                   type: number
 *                 netWorth:
 *                   type: number
 */
router.get('/summary', accountsController.getAccountSummary);

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 accountName:
 *                   type: string
 *                 accountNumberMasked:
 *                   type: string
 *                 balance:
 *                   type: number
 *                 availableBalance:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 creditLimit:
 *                   type: number
 *                 minimumBalance:
 *                   type: number
 *                 accountStatus:
 *                   type: string
 *                 isPrimary:
 *                   type: boolean
 *                 accountTypeId:
 *                   type: string
 *                   format: uuid
 *                 accountTypeName:
 *                   type: string
 *                 accountTypeCategory:
 *                   type: string
 *                 institutionId:
 *                   type: string
 *                   format: uuid
 *                 institutionName:
 *                   type: string
 *                 institutionLogo:
 *                   type: string
 *       404:
 *         description: Account not found
 *   put:
 *     summary: Update account by ID
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the account
 *               accountTypeId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the account type
 *               institutionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the financial institution
 *               accountNumber:
 *                 type: string
 *                 description: Account number (will be masked in response)
 *               balance:
 *                 type: number
 *                 description: Current balance
 *               availableBalance:
 *                 type: number
 *                 description: Available balance
 *               currency:
 *                 type: string
 *                 pattern: '^[A-Z]{3}$'
 *                 description: Currency code (3-letter ISO)
 *               creditLimit:
 *                 type: number
 *                 description: Credit limit for credit accounts
 *               minimumBalance:
 *                 type: number
 *                 description: Minimum balance requirement
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Account not found
 *   delete:
 *     summary: Delete account by ID
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Cannot delete account with transactions
 *       404:
 *         description: Account not found
 */
router.get('/:id', accountsController.getAccountById);
router.put('/:id', accountsController.updateAccount);
router.delete('/:id', accountsController.deleteAccount);

module.exports = router; 