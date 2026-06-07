const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllExpenses,
    getMyExpenses,
    createExpense,
    executePlannedExpense,
    deleteExpense,
    getCategories
} = require('../controllers/expensesController');

const router = express.Router();

// GET /api/expenses - все расходы
// GET /api/expenses/my - только свои расходы
// POST /api/expenses - добавить расход
// PUT /api/expenses/:id/execute - выполнить плановый расход
// DELETE /api/expenses/:id - удалить расход
// GET /api/expenses/categories - список всех категорий расходов

router.get('/', authMiddleware, getAllExpenses);
router.get('/my', authMiddleware, getMyExpenses);
router.post('/', authMiddleware, createExpense);
router.put('/:id/execute', authMiddleware, executePlannedExpense);
router.delete('/:id', authMiddleware, deleteExpense);
router.get('/categories', authMiddleware, getCategories);

module.exports = router;