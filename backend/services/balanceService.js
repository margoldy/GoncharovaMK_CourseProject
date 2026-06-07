const { query } = require('../database');

const getCommonBalance = async () => {
    const toCommonResult = await query(`SELECT SUM(amount) as total 
        FROM transfers WHERE to_account_id = 1`);
    const fromCommonResult = await query(`SELECT SUM(amount) as total 
        FROM transfers WHERE from_account_id = 1`);
    
    const toCommon = toCommonResult[0]?.total || 0;
    const fromCommon = fromCommonResult[0]?.total || 0;
    
    return toCommon - fromCommon;
};

const getSavingsBalance = async () => {
    const toSavingsResult = await query(`SELECT SUM(amount) as total FROM transfers WHERE to_account_id = 2`);
    const fromSavingsResult = await query(`SELECT SUM(amount) as total FROM transfers WHERE from_account_id = 2`);
    
    const toSavings = toSavingsResult[0]?.total || 0;
    const fromSavings = fromSavingsResult[0]?.total || 0;
    
    return toSavings - fromSavings;
};

const getUserStashBalance = async (userId) => {
    const toStashResult = await query(
        `SELECT SUM(amount) as total FROM transfers 
        WHERE to_account_id = 3 AND member_id = ?`,
        [userId]
    );
    const fromStashResult = await query(
        `SELECT SUM(amount) as total FROM transfers 
        WHERE from_account_id = 3 AND member_id = ?`,
        [userId]
    );
    
    const toStash = toStashResult[0]?.total || 0;
    const fromStash = fromStashResult[0]?.total || 0;
    
    return toStash - fromStash;
};

const getTotalStashBalance = async () => {
    const toStashResult = await query(`SELECT SUM(amount) as total 
        FROM transfers WHERE to_account_id = 3`);
    const fromStashResult = await query(`SELECT SUM(amount) as total 
        FROM transfers WHERE from_account_id = 3`);
    
    const toStash = toStashResult[0]?.total || 0;
    const fromStash = fromStashResult[0]?.total || 0;
    
    return toStash - fromStash;
};

const getBalanceByAccount = async (accountId, userId = null) => {
    if (accountId === 1) {
        return await getCommonBalance();
    } else if (accountId === 2) {
        return await getSavingsBalance();
    } else if (accountId === 3) {
        if (!userId) {
            throw new Error('Для заначки нужен userId');
        }
        return await getUserStashBalance(userId);
    } else {
        throw new Error(`Неизвестный тип счёта: ${accountId}`);
    }
};

const hasSufficientFunds = async (accountId, amount, userId = null) => {
    const currentBalance = await getBalanceByAccount(accountId, userId);
    return amount <= currentBalance;
};

module.exports = {
    getCommonBalance,
    getSavingsBalance,
    getUserStashBalance,
    getTotalStashBalance,
    getBalanceByAccount,
    hasSufficientFunds
};