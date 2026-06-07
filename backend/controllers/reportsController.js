const { query } = require('../database');
const ExcelJS = require('exceljs');


// для таблицы на странице
const getReport = async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ error: 'Укажите from и to (ГГГГ-ММ-ДД)' });
    }

    try {
        // тип дохода, кто получил, сумма, дата
        const incomes = await query(`
            SELECT 
                'Доход' as type,
                COALESCE(it.name, 'Доход') as article,
                fm.full_name as who,
                SUM(i.amount) as sum,
                i.income_date as date
            FROM incomes i
            JOIN family_members fm ON i.member_id = fm.id
            LEFT JOIN income_types it ON i.type_id = it.id
            WHERE i.income_date BETWEEN ? AND ?
            GROUP BY it.id, fm.id, i.income_date
            ORDER BY i.income_date
        `, [from, to]);

        // Расходы
        const expenses = await query(`
            SELECT 
                'Расход' as type,
                c.name as article,
                '' as who,
                e.amount as sum,
                e.expense_date as date
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.is_planned = 0 AND e.expense_date BETWEEN ? AND ?
            GROUP BY c.id, e.expense_date
            ORDER BY e.expense_date
        `, [from, to]);

        // заначка за период
        const stashInResult = await query(`
            SELECT SUM(amount) as total
            FROM transfers
            WHERE to_account_id = 3
              AND transfer_date BETWEEN ? AND ?
        `, [from, to]);

        const stashOutResult = await query(`
            SELECT SUM(amount) as total
            FROM transfers
            WHERE from_account_id = 3
              AND transfer_date BETWEEN ? AND ?
        `, [from, to]);

        const stashIn = stashInResult[0]?.total || 0;
        const stashOut = stashOutResult[0]?.total || 0;
        const stashBalance = stashIn - stashOut;

        const allRows = [...incomes, ...expenses];
        allRows.sort((a, b) => new Date(a.date) - new Date(b.date));

        const totalIncome = incomes.reduce((s, i) => s + i.sum, 0);
        const totalExpense = expenses.reduce((s, e) => s + e.sum, 0);
        const balance = totalIncome - totalExpense;

        res.json({
            rows: allRows,
            total_income: totalIncome,
            total_expense: totalExpense,
            balance: balance,
            stash_balance: stashBalance
        });
    } catch (err) {
        console.error('getReport error:', err);
        res.status(500).json({ error: err.message });
    }
};


module.exports = { getReport };