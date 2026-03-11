const express = require('express');
const router = express.Router();
const {
  getCashSources,
  createCashSource,
  updateCashSource,
  deleteCashSource
} = require('../controllers/cashSourcesController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/cash-sources - Get all active cash sources
router.get('/', getCashSources);

// POST /api/cash-sources - Create new cash source (admin only in future)
router.post('/', createCashSource);

// PUT /api/cash-sources/:id - Update cash source (admin only in future)
router.put('/:id', updateCashSource);

// DELETE /api/cash-sources/:id - Delete cash source (admin only in future)
router.delete('/:id', deleteCashSource);

module.exports = router;
