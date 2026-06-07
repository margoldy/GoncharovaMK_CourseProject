const { query, run } = require('../database');
const { getCommonBalance, getUserStashBalance } = require('../services/balanceService');
const { logAction } = require('../services/logService');

// все расходы
const getAllExpenses = async (req, res) => {
    try {
        const expenses = await query(`
            SELECT e.*, fm.login, fm.full_name, c.name as category_name
            FROM expenses e 
            JOIN family_members fm ON e.member_id = fm.id 
            JOIN categories c ON e.category_id = c.id
            ORDER BY e.expense_date DESC
        `);
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// только свои расходы
const getMyExpenses = async (req, res) => {
    try {
        const expenses = await query(`
            SELECT e.*, c.name as category_name
            FROM expenses e 
            JOIN categories c ON e.category_id = c.id
            WHERE e.member_id = ? 
            ORDER BY e.expense_date DESC
        `, [req.user.id]);
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// добавить расход
const createExpense = async (req, res) => {
    let { member_id, category_id, amount, expense_date, is_planned = 0 } = req.body;
    const userRole = req.user.role;
    const currentUserId = req.user.id;
    const category = await query(`SELECT id, name FROM categories WHERE id = ?`, [category_id]);

    try {
        if (userRole !== 'admin' && member_id && member_id !== currentUserId) {
            return res.status(403).json({ error: 'Нельзя добавить расход за другого пользователя' });
        }
        if (category.length === 0) {
            return res.status(400).json({ error: 'Категория не найдена' });
        }

        const targetMemberId = member_id || currentUserId;

        if (!category_id || !amount || !expense_date) {
            return res.status(400).json({ error: 'Категория, сумма и дата обязательны' });
        }
        if (amount <= 0) {
            return res.status(400).json({ error: 'Сумма должна быть больше 0' });
        }
        if (isNaN(amount) || typeof amount !== 'number') {
            return res.status(400).json({ error: 'Сумма должна быть числом' });
        }
        // 0 фактический, 1 плановый
        if (is_planned !== 0 && is_planned !== 1) {
            return res.status(400).json({ error: 'is_planned должен быть 0 или 1' });
        }

        // с какого счета
        let fromAccountId = 1; // по умолчанию с общего
        if (category[0].name === 'Заначка') {
            fromAccountId = 3;
        }

        if (is_planned === 0) {
            let currentBalance;
            
            if (fromAccountId === 1) {
                currentBalance = await getCommonBalance();
            } else if (fromAccountId === 3) {
                currentBalance = await getUserStashBalance(targetMemberId);
            }
            
            if (amount > currentBalance) {
                const accountName = fromAccountId === 1 ? 'общем счёте' : 'заначке';
                return res.status(400).json({ 
                    error: `Недостаточно средств на ${accountName}. Доступно: ${currentBalance.toLocaleString()} ₽` 
                });
            }
        }

        // сам расход
        const result = await run(
            `INSERT INTO expenses (member_id, category_id, amount, expense_date, is_planned) 
             VALUES (?, ?, ?, ?, ?)`,
            [targetMemberId, category_id, amount, expense_date, is_planned]
        );

        // фактический — создаём перевод
        if (is_planned === 0) {
            await run(
                `INSERT INTO transfers (member_id, from_account_id, to_account_id, amount, transfer_date)
                 VALUES (?, ?, 5, ?, ?)`,
                [targetMemberId, fromAccountId, amount, expense_date]
            );
        }
        await logAction(targetMemberId, req.user.login, 
            'CREATE_EXPENSE', 'expense', result.lastID, 
            `Сумма: ${amount}, категория: ${category_id}, 
            плановый: ${is_planned}`);

        res.status(201).json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// выполнить плановый расход
const executePlannedExpense = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const expense = await query(`
            SELECT e.*, c.name as category_name 
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.id = ?
        `, [id]);

        if (expense.length === 0) {
            return res.status(404).json({ error: 'Расход не найден' });
        }
        const exp = expense[0];

        // проверка прав 
        if (userRole !== 'admin' && exp.member_id !== userId) {
            return res.status(403).json({ error: 'Нельзя выполнить чужой плановый расход' });
        }

        if (exp.is_planned !== 1) {
            return res.status(400).json({ error: 'Это не плановый расход' });
        }

        const targetMemberId = exp.member_id;
        const amount = exp.amount;
        const expenseDate = exp.expense_date;

        // с какого списываем
        let fromAccountId = 1; // по умолчанию с общего счёта
        if (exp.category_name === 'Заначка') {
            fromAccountId = 3;
        }

        // хватает ли средств
        let currentBalance;
        if (fromAccountId === 1) {
            currentBalance = await getCommonBalance();
        } else if (fromAccountId === 3) {
            currentBalance = await getUserStashBalance(targetMemberId);
        }

        if (amount > currentBalance) {
            const accountName = fromAccountId === 1 ? 'общем счёте' : 'заначке';
            return res.status(400).json({ 
                error: `Недостаточно средств на ${accountName}. Доступно: ${currentBalance.toLocaleString()} ₽` 
            });
        }

        const today = new Date().toISOString().split('T')[0];

        await run(`UPDATE expenses SET is_planned = 0, 
            expense_date = ? WHERE id = ?`, [today, id]);

        const transferResult = await run(
            `INSERT INTO transfers (member_id, from_account_id, to_account_id, amount, transfer_date)
             VALUES (?, ?, 5, ?, ?)`,
            [targetMemberId, fromAccountId, amount, today] 
        );

        await logAction(targetMemberId, req.user.login, 
            'EXECUTE_PLANNED', 'expense', id, 
            `Выполнение планового расхода, сумма: ${amount}`);
            
        res.json({ message: 'Плановый расход выполнен', 
            expense_id: id,
            transfer_id: transferResult.lastID
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// удалить расход (свой или админ)
const deleteExpense = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const expense = await query(`SELECT member_id, amount, 
            expense_date, is_planned FROM expenses WHERE id = ?`, [id]);

        if (expense.length === 0) {
            return res.status(404).json({ error: 'Расход не найден' });
        }

        if (userRole !== 'admin' && expense[0].member_id !== userId) {
            return res.status(403).json({ error: 'Нельзя удалить чужой расход' });
        }

        if (expense[0].is_planned === 0) {
            await run(
                `DELETE FROM transfers 
                 WHERE member_id = ? 
                   AND to_account_id = 5 
                   AND amount = ? 
                   AND transfer_date = ?`,
                [expense[0].member_id, expense[0].amount, 
                expense[0].expense_date]
            );
        }

        await run(`DELETE FROM expenses WHERE id = ?`, [id]);

        await logAction(userId, req.user.login, 
            'DELETE_EXPENSE', 'expense', id, `Удаление расхода`);

        res.json({ deleted: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await query(`SELECT id, name FROM categories ORDER BY name`);
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllExpenses,
    getMyExpenses,
    createExpense,
    executePlannedExpense,
    deleteExpense,
    getCategories
};