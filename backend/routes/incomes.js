const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllIncomes,
    getMyIncomes,
    createIncome,
    deleteIncome,
    getIncomeTypes
} = require('../controllers/incomesController');

const router = express.Router();

// GET /api/incomes - все доходы
// GET /api/incomes/my - только свои доходы
// POST /api/incomes - добавить доход
// DELETE /api/incomes/:id - удалить доход
// GET /api/incomes/types - список всех типов доходов

router.get('/', authMiddleware, getAllIncomes);
router.get('/my', authMiddleware, getMyIncomes);
router.post('/', authMiddleware, createIncome);
router.delete('/:id', authMiddleware, deleteIncome);
router.get('/types', authMiddleware, getIncomeTypes);

module.exports = router;