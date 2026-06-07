const { run } = require('../database');

const logAction = async (userId, userLogin, action, entityType = null, entityId = null, details = null) => {
    try {
        await run(
            `INSERT INTO logs (user_id, user_login, action, entity_type, entity_id, details, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
            [userId, userLogin, action, entityType, entityId, details]
        );
    } catch (err) {
        console.error('Ошибка записи лога:', err.message);
    }
};

module.exports = { logAction };