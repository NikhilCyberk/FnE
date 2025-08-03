const express = require('express');
const router = express.Router();
const budgetCategoriesController = require('../controllers/budgetCategoriesController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * /api/budget-categories/{budgetId}:
 *   get:
 *     summary: Get all category allocations for a budget
 *     tags: [Budget Categories]
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: List of budget category allocations
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
 *                   budgetId:
 *                     type: string
 *                     format: uuid
 *                   categoryId:
 *                     type: string
 *                     format: uuid
 *                   categoryName:
 *                     type: string
 *                   categoryColor:
 *                     type: string
 *                   categoryIcon:
 *                     type: string
 *                   allocatedAmount:
 *                     type: number
 *                   spentAmount:
 *                     type: number
 *                   remainingAmount:
 *                     type: number
 *                   percentageUsed:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Budget not found
 */
router.get('/:budgetId', budgetCategoriesController.getBudgetCategories);

/**
 * @swagger
 * /api/budget-categories:
 *   post:
 *     summary: Add a category allocation to a budget
 *     tags: [Budget Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budgetId
 *               - categoryId
 *               - allocatedAmount
 *             properties:
 *               budgetId:
 *                 type: string
 *                 format: uuid
 *                 description: Budget ID
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID
 *               allocatedAmount:
 *                 type: number
 *                 minimum: 0
 *                 description: Amount allocated to this category
 *     responses:
 *       201:
 *         description: Budget category allocation created successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Budget or category not found
 *       409:
 *         description: Category already allocated to this budget
 */
router.post('/', budgetCategoriesController.addBudgetCategory);

/**
 * @swagger
 * /api/budget-categories/{id}:
 *   put:
 *     summary: Update a budget category allocation
 *     tags: [Budget Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget category allocation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID
 *               allocatedAmount:
 *                 type: number
 *                 minimum: 0
 *                 description: Amount allocated to this category
 *     responses:
 *       200:
 *         description: Budget category allocation updated successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Budget category allocation not found
 *   delete:
 *     summary: Delete a budget category allocation
 *     tags: [Budget Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget category allocation ID
 *     responses:
 *       200:
 *         description: Budget category allocation deleted successfully
 *       404:
 *         description: Budget category allocation not found
 */
router.put('/:id', budgetCategoriesController.updateBudgetCategory);
router.delete('/:id', budgetCategoriesController.deleteBudgetCategory);

module.exports = router; 