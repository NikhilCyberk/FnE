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
 *     responses:
 *       200:
 *         description: List of accounts
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountName:
 *                 type: string
 *               accountType:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *               balance:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created
 */
router.get('/', accountsController.getAccounts);
router.post('/', accountsController.createAccount);

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
 *     responses:
 *       200:
 *         description: Account details
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountName:
 *                 type: string
 *               accountType:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *               balance:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated
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
 *     responses:
 *       200:
 *         description: Account deleted
 *       404:
 *         description: Account not found
 */
router.get('/:id', accountsController.getAccountById);
router.put('/:id', accountsController.updateAccount);
router.delete('/:id', accountsController.deleteAccount);

module.exports = router; 