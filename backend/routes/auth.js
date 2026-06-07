const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register - регистрация юзера с ролью pending
// POST /api/auth/login - вход, выдача JWT токена

router.post('/register', register);
router.post('/login', login);  

module.exports = router;