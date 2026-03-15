const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const debtsController = require('../controllers/debtsController');

router.use(auth);

router.get('/summary', debtsController.getDebtSummary);

module.exports = router;
