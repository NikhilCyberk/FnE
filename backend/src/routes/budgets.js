const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const budgetsController = require('../controllers/budgetsController');

router.use(auth);

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Get all budgets for the authenticated user
 *     tags: [Budgets]
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
 *         description: Number of budgets per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, archived]
 *         description: Filter by budget status
 *     responses:
 *       200:
 *         description: List of budgets with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 budgets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       spent:
 *                         type: number
 *                       remaining:
 *                         type: number
 *                       startDate:
 *                         type: string
 *                         format: date
 *                       endDate:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, archived]
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
 *     summary: Create a new budget
 *     tags: [Budgets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Budget name
 *               description:
 *                 type: string
 *                 description: Budget description
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 description: Budget amount
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Budget start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Budget end date
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived]
 *                 default: active
 *                 description: Budget status
 *     responses:
 *       201:
 *         description: Budget created successfully
 *       400:
 *         description: Bad request - validation error
 */
router.get('/', budgetsController.getBudgets);
router.post('/', budgetsController.createBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   get:
 *     summary: Get budget by ID
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Budget details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 spent:
 *                   type: number
 *                 remaining:
 *                   type: number
 *                 startDate:
 *                   type: string
 *                   format: date
 *                 endDate:
 *                   type: string
 *                   format: date
 *                 status:
 *                   type: string
 *                   enum: [active, inactive, archived]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Budget not found
 *   put:
 *     summary: Update budget by ID
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Budget name
 *               description:
 *                 type: string
 *                 description: Budget description
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 description: Budget amount
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Budget start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Budget end date
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived]
 *                 description: Budget status
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Budget not found
 *   delete:
 *     summary: Delete budget by ID
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *       404:
 *         description: Budget not found
 */
router.get('/:id', budgetsController.getBudgetById);
router.put('/:id', budgetsController.updateBudget);
router.delete('/:id', budgetsController.deleteBudget);

module.exports = router; 