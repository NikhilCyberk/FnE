const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const reportsController = require('../controllers/reportsController');

router.use(auth);

/**
 * @swagger
 * /api/reports/spending-summary:
 *   get:
 *     summary: Get spending summary report
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report period
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific account
 *     responses:
 *       200:
 *         description: Spending summary report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSpent:
 *                   type: number
 *                 totalIncome:
 *                   type: number
 *                 netAmount:
 *                   type: number
 *                 averageDailySpending:
 *                   type: number
 *                 topCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoryName:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Bad request - invalid date range
 */
router.get('/spending-summary', reportsController.spendingSummary);

/**
 * @swagger
 * /api/reports/category-breakdown:
 *   get:
 *     summary: Get category breakdown report
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report period
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense, all]
 *           default: expense
 *         description: Transaction type filter
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific account
 *     responses:
 *       200:
 *         description: Category breakdown report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoryId:
 *                         type: string
 *                         format: uuid
 *                       categoryName:
 *                         type: string
 *                       categoryColor:
 *                         type: string
 *                       categoryIcon:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       transactionCount:
 *                         type: integer
 *                 totalAmount:
 *                   type: number
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Bad request - invalid parameters
 */
router.get('/category-breakdown', reportsController.categoryBreakdown);

/**
 * @swagger
 * /api/reports/cash-flow:
 *   get:
 *     summary: Get cash flow report
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report period
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: month
 *         description: Grouping interval for cash flow data
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific account
 *     responses:
 *       200:
 *         description: Cash flow report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cashFlow:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       income:
 *                         type: number
 *                       expenses:
 *                         type: number
 *                       netFlow:
 *                         type: number
 *                       runningBalance:
 *                         type: number
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpenses:
 *                       type: number
 *                     netCashFlow:
 *                       type: number
 *                     averageIncome:
 *                       type: number
 *                     averageExpenses:
 *                       type: number
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Bad request - invalid parameters
 */
router.get('/cash-flow', reportsController.cashFlow);

module.exports = router; 