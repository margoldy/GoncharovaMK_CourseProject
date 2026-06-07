const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { query } = require('../database');

const router = express.Router();

router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const logs = await query(`SELECT * FROM logs ORDER BY created_at DESC LIMIT 200`);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;