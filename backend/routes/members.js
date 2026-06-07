const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const {
    getAllMembers,
    createMember,
    deleteMember,
    approveMember,
    rejectMember,
    importMembers,
    updateMemberRole  
} = require('../controllers/membersController');

const router = express.Router();

// GET /api/members - список всех
// POST /api/members - создать пользователя
// DELETE /api/members/:id - удалить пользователя
// PUT /api/members/:id/approve - подтвердить пользователя
// DELETE /api/members/:id/reject - отклонить заявку
// POST /api/members/import - импорт пользователей из JSON
// PATCH /api/members/:id/role - назначить роль (admin/user)

router.get('/', authMiddleware, getAllMembers);
router.post('/', authMiddleware, isAdmin, createMember);
router.delete('/:id', authMiddleware, isAdmin, deleteMember);
router.put('/:id/approve', authMiddleware, isAdmin, approveMember);
router.delete('/:id/reject', authMiddleware, isAdmin, rejectMember);
router.post('/import', authMiddleware, isAdmin, importMembers);
router.patch('/:id/role', authMiddleware, isAdmin, updateMemberRole);

module.exports = router;