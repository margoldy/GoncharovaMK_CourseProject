const { query } = require('../database');
const { 
    getCommonBalance,
    getSavingsBalance,
    getTotalStashBalance,
    getUserStashBalance
} = require('../services/balanceService');

const getBalances = async (req, res) => {
    const userId = req.user.id;

    try {
        const commonBalance = await getCommonBalance();
        const savingsBalance = await getSavingsBalance();
        const userStash = await getUserStashBalance(userId);
        const totalStash = await getTotalStashBalance();

        res.json({
            common: commonBalance,
            savings: savingsBalance,
            user_stash: userStash,
            total_stash: totalStash
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getBalances };