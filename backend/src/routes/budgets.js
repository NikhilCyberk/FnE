const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const budgetsController = require('../controllers/budgetsController');

router.use(auth);

router.get('/', budgetsController.getBudgets);
router.post('/', budgetsController.createBudget);
router.get('/:id', budgetsController.getBudgetById);
router.put('/:id', budgetsController.updateBudget);
router.delete('/:id', budgetsController.deleteBudget);

module.exports = router; 