const express = require('express');
const router = express.Router();
const loansController = require('../controllers/loansController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', loansController.getLoans);
router.post('/', loansController.createLoan);
router.put('/:id', loansController.updateLoan);
router.delete('/:id', loansController.deleteLoan);

module.exports = router;
