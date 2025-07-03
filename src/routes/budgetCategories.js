const express = require('express');
const router = express.Router();
const budgetCategoriesController = require('../controllers/budgetCategoriesController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get all category allocations for a budget
router.get('/:budgetId', budgetCategoriesController.getBudgetCategories);
// Add a category allocation
router.post('/', budgetCategoriesController.addBudgetCategory);
// Update a category allocation
router.put('/:id', budgetCategoriesController.updateBudgetCategory);
// Delete a category allocation
router.delete('/:id', budgetCategoriesController.deleteBudgetCategory);

module.exports = router; 