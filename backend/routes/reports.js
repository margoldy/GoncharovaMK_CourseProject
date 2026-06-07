const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { 
    getReport, 
    exportToExcel,
    getRecent
} = require('../controllers/reportsController');

const router = express.Router();

// GET /api/reports?from=&to= - отчёт за период

router.get('/', authMiddleware, getReport);
module.exports = router;