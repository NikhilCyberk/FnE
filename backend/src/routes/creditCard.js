const express = require('express');
const router = express.Router();
const { extractCreditCardInfo, saveCreditCard, getCreditCards, getCreditCardById, updateCreditCard, deleteCreditCard, getCardNameOptions, addCardNameOption } = require('../controllers/creditCardController');

/**
 * @swagger
 * /api/credit-cards/extract-credit-card-info:
 *   post:
 *     summary: Extract credit card information from PDF
 *     tags: [Credit Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pdfFile
 *             properties:
 *               pdfFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing credit card statement
 *     responses:
 *       200:
 *         description: Credit card information extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cardName:
 *                   type: string
 *                 cardNumber:
 *                   type: string
 *                 cardType:
 *                   type: string
 *                 bankName:
 *                   type: string
 *                 statementDate:
 *                   type: string
 *                   format: date
 *                 dueDate:
 *                   type: string
 *                   format: date
 *                 totalAmount:
 *                   type: number
 *                 minimumPayment:
 *                   type: number
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       description:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       category:
 *                         type: string
 *       400:
 *         description: Bad request - invalid file or extraction failed
 *       500:
 *         description: Internal server error during extraction
 */
router.post('/extract-credit-card-info', extractCreditCardInfo);

/**
 * @swagger
 * /api/credit-cards:
 *   get:
 *     summary: Get all credit cards for the authenticated user
 *     tags: [Credit Cards]
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
 *         description: Number of credit cards per page
 *     responses:
 *       200:
 *         description: List of credit cards with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 creditCards:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       cardName:
 *                         type: string
 *                       cardNumber:
 *                         type: string
 *                       cardType:
 *                         type: string
 *                       bankName:
 *                         type: string
 *                       creditLimit:
 *                         type: number
 *                       currentBalance:
 *                         type: number
 *                       availableCredit:
 *                         type: number
 *                       statementDate:
 *                         type: string
 *                         format: date
 *                       dueDate:
 *                         type: string
 *                         format: date
 *                       minimumPayment:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *   post:
 *     summary: Save a new credit card
 *     tags: [Credit Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardName
 *               - cardNumber
 *               - bankName
 *             properties:
 *               cardName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the credit card
 *               cardNumber:
 *                 type: string
 *                 description: Credit card number (will be masked in response)
 *               cardType:
 *                 type: string
 *                 description: Type of credit card (Visa, MasterCard, etc.)
 *               bankName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the issuing bank
 *               creditLimit:
 *                 type: number
 *                 description: Credit limit amount
 *               currentBalance:
 *                 type: number
 *                 description: Current balance
 *               statementDate:
 *                 type: string
 *                 format: date
 *                 description: Statement date
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Payment due date
 *               minimumPayment:
 *                 type: number
 *                 description: Minimum payment amount
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Credit card saved successfully
 *       400:
 *         description: Bad request - validation error
 */
router.post('/', saveCreditCard);
router.get('/', getCreditCards);

/**
 * @swagger
 * /api/credit-cards/card-names:
 *   get:
 *     summary: Get available card name options
 *     tags: [Credit Cards]
 *     responses:
 *       200:
 *         description: List of card name options
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *   post:
 *     summary: Add a new card name option
 *     tags: [Credit Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardName
 *             properties:
 *               cardName:
 *                 type: string
 *                 maxLength: 100
 *                 description: New card name to add
 *     responses:
 *       201:
 *         description: Card name option added successfully
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: Card name already exists
 */
router.get('/card-names', getCardNameOptions);
router.post('/card-names', addCardNameOption);

/**
 * @swagger
 * /api/credit-cards/{id}:
 *   get:
 *     summary: Get credit card by ID
 *     tags: [Credit Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credit card ID
 *     responses:
 *       200:
 *         description: Credit card details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 cardName:
 *                   type: string
 *                 cardNumber:
 *                   type: string
 *                 cardType:
 *                   type: string
 *                 bankName:
 *                   type: string
 *                 creditLimit:
 *                   type: number
 *                 currentBalance:
 *                   type: number
 *                 availableCredit:
 *                   type: number
 *                 statementDate:
 *                   type: string
 *                   format: date
 *                 dueDate:
 *                   type: string
 *                   format: date
 *                 minimumPayment:
 *                   type: number
 *                 notes:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Credit card not found
 *   put:
 *     summary: Update credit card by ID
 *     tags: [Credit Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credit card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the credit card
 *               cardNumber:
 *                 type: string
 *                 description: Credit card number (will be masked in response)
 *               cardType:
 *                 type: string
 *                 description: Type of credit card (Visa, MasterCard, etc.)
 *               bankName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the issuing bank
 *               creditLimit:
 *                 type: number
 *                 description: Credit limit amount
 *               currentBalance:
 *                 type: number
 *                 description: Current balance
 *               statementDate:
 *                 type: string
 *                 format: date
 *                 description: Statement date
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Payment due date
 *               minimumPayment:
 *                 type: number
 *                 description: Minimum payment amount
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Credit card updated successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Credit card not found
 *   delete:
 *     summary: Delete credit card by ID
 *     tags: [Credit Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credit card ID
 *     responses:
 *       200:
 *         description: Credit card deleted successfully
 *       404:
 *         description: Credit card not found
 */
router.get('/:id', getCreditCardById);
router.put('/:id', updateCreditCard);
router.delete('/:id', deleteCreditCard);

module.exports = router; 