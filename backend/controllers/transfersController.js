const { query, run } = require('../database');
const { logAction } = require('../services/logService');
const { 
    hasSufficientFunds,
    getBalanceByAccount 
} = require('../services/balanceService');
// все переводы
const getAllTransfers = async (req, res) => {
    try {
        const transfers = await query(`
            SELECT t.*, 
                   fm.login, fm.full_name,
                   a1.account_name as from_account,
                   a2.account_name as to_account
            FROM transfers t
            JOIN family_members fm ON t.member_id = fm.id
            JOIN accounts_types a1 ON t.from_account_id = a1.id
            JOIN accounts_types a2 ON t.to_account_id = a2.id
            ORDER BY t.transfer_date DESC
        `);
        res.json(transfers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// только свои переводы
const getMyTransfers = async (req, res) => {
    try {
        const transfers = await query(`
            SELECT t.*, 
                   a1.account_name as from_account,
                   a2.account_name as to_account
            FROM transfers t
            JOIN accounts_types a1 ON t.from_account_id = a1.id
            JOIN accounts_types a2 ON t.to_account_id = a2.id
            WHERE t.member_id = ?
            ORDER BY t.transfer_date DESC
        `, [req.user.id]);
        res.json(transfers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// добавить перевод
const createTransfer = async (req, res) => {
    let { member_id, from_account_id, to_account_id, amount, transfer_date } = req.body;
    const userRole = req.user.role;
    const currentUserId = req.user.id;

    try {
        if (userRole !== 'admin' && member_id && member_id !== currentUserId) {
            return res.status(403).json({ error: 'Нельзя добавить перевод за другого пользователя' });
        }

        const targetMemberId = member_id || currentUserId;

        if (!from_account_id || !to_account_id || !amount || !transfer_date) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        if (from_account_id === to_account_id) {
            return res.status(400).json({ error: 'Нельзя перевести на тот же счёт' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Сумма должна быть больше 0' });
        }

        if (isNaN(amount) || typeof amount !== 'number') {
            return res.status(400).json({ error: 'Сумма должна быть числом' });
        }

        if (userRole !== 'admin') {
            if (from_account_id !== 3) {
                return res.status(403).json({ 
                    error: 'Вы можете переводить только с заначки' 
                });
            }
            if (to_account_id !== 1 && to_account_id !== 2) {
                return res.status(403).json({ 
                    error: 'Переводить можно только на общий счёт или накопления' 
                });
            }
        }

        // проверка достаточности средств
        const userIdForCheck = from_account_id === 3 ? targetMemberId : null;
        const hasFunds = await hasSufficientFunds(from_account_id, amount, userIdForCheck);
        
        if (!hasFunds) {
            const currentBalance = await getBalanceByAccount(from_account_id, userIdForCheck);
            return res.status(400).json({ 
                error: `Недостаточно средств. Доступно: ${currentBalance.toLocaleString()} ₽` 
            });
        }

        const result = await run(
            `INSERT INTO transfers (member_id, 
            from_account_id, to_account_id, amount, transfer_date) 
            VALUES (?, ?, ?, ?, ?)`,
            [targetMemberId, from_account_id, to_account_id, amount, transfer_date]
        );

        await logAction(targetMemberId, req.user.login, 
            'CREATE_TRANSFER', 'transfer', result.lastID, 
            `Сумма: ${amount}, с ${from_account_id} на ${to_account_id}`);

        res.status(201).json({ id: result.lastID });
    } catch (err) {
        console.error('createTransfer error:', err);
        res.status(500).json({ error: err.message });
    }
};


// удалить перевод 
const deleteTransfer = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const transfer = await query(`SELECT member_id FROM transfers WHERE id = ?`, [id]);

        if (transfer.length === 0) {
            return res.status(404).json({ error: 'Перевод не найден' });
        }

        if (userRole !== 'admin' && transfer[0].member_id !== userId) {
            return res.status(403).json({ error: 'Нельзя удалить чужой перевод' });
        }

        const t = transfer[0];
        await logAction( userId, req.user.login,
            'DELETE_TRANSFER', 'transfer', id,
            `Удаление перевода: сумма ${t.amount}, 
            с ${t.from_account_id} на ${t.to_account_id}`
        );

        await run(`DELETE FROM transfers WHERE id = ?`, [id]);
        res.json({ deleted: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllTransfers,
    getMyTransfers,
    createTransfer,
    deleteTransfer
};