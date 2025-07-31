const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const reportsController = require('../controllers/reportsController');

router.use(auth);

router.get('/spending-summary', reportsController.spendingSummary);
router.get('/category-breakdown', reportsController.categoryBreakdown);
router.get('/cash-flow', reportsController.cashFlow);

module.exports = router; 