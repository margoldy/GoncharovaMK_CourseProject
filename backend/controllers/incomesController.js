const { query, run } = require('../database');
const { logAction } = require('../services/logService');

// все доходы
const getAllIncomes = async (req, res) => {
    try {
        const incomes = await query(`
            SELECT i.*, fm.login, fm.full_name 
            FROM incomes i 
            JOIN family_members fm ON i.member_id = fm.id 
            ORDER BY i.income_date DESC
        `);
        res.json(incomes); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// только свои доходы
const getMyIncomes = async (req, res) => {
    try {
        const incomes = await query(`
            SELECT * FROM incomes 
            WHERE member_id = ? 
            ORDER BY income_date DESC
        `, [req.user.id]);
        res.json(incomes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// добавить доход
const createIncome = async (req, res) => {
    let { member_id, amount, income_date, type_id } = req.body;
    const userRole = req.user.role;
    const currentUserId = req.user.id;

    try {
    // проверка кто добавляет
    if (userRole !== 'admin' && member_id && member_id !== currentUserId) {
        return res.status(403).json({ error: 'Нельзя добавить доход за другого пользователя' });
    }    
    const targetMemberId = member_id || currentUserId; // для надежности
    
    if (!amount || !income_date) {
        return res.status(400).json({ error: 'Сумма и дата обязательны' });
    }
    if (amount <= 0) {
        return res.status(400).json({ error: 'Сумма должна быть больше 0' });
    }

    if (isNaN(amount) || typeof amount !== 'number') {
        return res.status(400).json({ error: 'Сумма должна быть числом' });
    }
    
    const result = await run(
        `INSERT INTO incomes (member_id, amount, income_date, type_id) 
        VALUES (?, ?, ?, ?)`,
        [targetMemberId, amount, income_date, type_id || null]
    );

    const commonAmount = amount * 0.7;
    const savingsAmount = amount * 0.2;
    const stashAmount = amount * 0.1;

    await run(`
            INSERT INTO transfers (member_id, from_account_id, 
            to_account_id, amount, transfer_date)
            VALUES 
                (?, 4, 1, ?, date('now')),
                (?, 4, 2, ?, date('now')),
                (?, 4, 3, ?, date('now'))
        `, [
            targetMemberId, commonAmount,
            targetMemberId, savingsAmount,
            targetMemberId, stashAmount
        ]);

    await logAction(targetMemberId, req.user.login, 
        'CREATE_INCOME', 'income', result.lastID, 
        `Сумма: ${amount}, дата: ${income_date}`);

    res.status(201).json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// удалить доход (свой или админ)
const deleteIncome = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    try {
        const income = await query(
            `SELECT member_id, amount, income_date FROM incomes WHERE id = ?`, 
            [id]
        );

        if (income.length === 0) {
            return res.status(404).json({ error: 'Доход не найден' });
        }
        
        if (userRole !== 'admin' && income[0].member_id !== userId) {
            return res.status(403).json({ error: 'Нельзя удалить чужой доход' });
        }

        const { member_id, amount, income_date } = income[0];

        await run(
            `DELETE FROM transfers 
             WHERE member_id = ? 
               AND from_account_id = 4 
               AND to_account_id IN (1, 2, 3)
               AND transfer_date = ?`,
            [member_id, income_date]
        );
        
        await run(`DELETE FROM incomes WHERE id = ?`, [id]);

        await logAction(userId, req.user.login, 
            'DELETE_INCOME', 'income', id, `Удаление дохода`);

        res.json({ deleted: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getIncomeTypes = async (req, res) => {
    try {
        const incomeTypes = await query(`SELECT id, name FROM income_types ORDER BY name`);
        res.json(incomeTypes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllIncomes,
    getMyIncomes,
    createIncome,
    deleteIncome,
    getIncomeTypes
};