const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getBalances } = require('../controllers/balancesController');

const router = express.Router();

// GET /api/balances - получить текущие балансы всех счетов
router.get('/', authMiddleware, getBalances);

module.exports = router;