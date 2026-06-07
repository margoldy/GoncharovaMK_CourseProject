const express = require('express');
const { isAdmin } = require('../middleware/roleMiddleware'); 
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllTransfers,
    getMyTransfers,
    createTransfer,
    deleteTransfer
} = require('../controllers/transfersController');

const router = express.Router();

// GET /api/transfers - все переводы
// GET /api/transfers/my - только свои переводы
// POST /api/transfers - добавить перевод
// DELETE /api/transfers/:id - удалить перевод

router.get('/', authMiddleware, getAllTransfers);
router.get('/my', authMiddleware, getMyTransfers);
router.post('/', authMiddleware, createTransfer);
router.delete('/:id', authMiddleware, isAdmin, deleteTransfer);

module.exports = router;