const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, run } = require('../database');
const { logAction } = require('../services/logService');

// регистрация
const register = async (req, res) => {
    const { login, password, full_name, role = 'pending', relation } = req.body;

    if (!login || !password || !full_name) {
        return res.status(400).json({ 
            error: 'Логин, пароль и полное имя обязательны' 
        });
    }
    
    try {
        // не занят ли логин
        const existing = await query(
            'SELECT id FROM family_members WHERE login = ?',
            [login]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Логин уже занят' });
        }
        
        // хэш пароля
        const password_hash = await bcrypt.hash(password, 10);
        
        // и в базу
        const result = await run(
            `INSERT INTO family_members (login, password_hash, full_name, role, relation)
             VALUES (?, ?, ?, ?, ?)`,
            [login, password_hash, full_name, role, relation || null]
        );
        
        await logAction(result.lastID, login, 'REGISTER', 'user', 
            result.lastID, `Регистрация нового пользователя`);
        
        res.status(201).json({
            id: result.lastID,
            login,
            full_name,
            role
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при регистрации' });
    }
};

// вход
const login = async (req, res) => {
    const { login, password } = req.body;
    
    if (!login || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }
    
    try {
        // поиск по логину
        const users = await query(
            'SELECT * FROM family_members WHERE login = ?',
            [login]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        const user = users[0];

        // если админ еще не подтвердил аккаунт
        if (user.role === 'pending') {
        return res.status(403).json({ 
            error: 'Аккаунт ожидает подтверждения администратором' 
        });
    }
        
        // сравниваем с хэшем из базы
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        
        // JWT токен 
        const token = jwt.sign(
            { id: user.id, login: user.login, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        await logAction(user.id, user.login, 
            'LOGIN', 'user', user.id, `Вход в систему`);
        res.json({
            token,
            user: {
                id: user.id,
                login: user.login,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при входе' });
    }
};

module.exports = { register, login };