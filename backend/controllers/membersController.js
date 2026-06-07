const { query, run } = require('../database');
const bcrypt = require('bcrypt');
const { logAction } = require('../services/logService');

const getUserById = async (id) => {
    const users = await query(`SELECT id, role FROM family_members WHERE id = ?`, [id]);
    return users.length > 0 ? users[0] : null;
};

// список всех
const getAllMembers = async (req, res) => {
    try {
        const members = await query(`SELECT id, login, full_name, role, relation FROM family_members`);
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// создать пользователя (только админ)
const createMember = async (req, res) => {
    const { login, password, full_name, role = 'user', relation } = req.body;
    
    if (!login || !password || !full_name) {
        return res.status(400).json({ error: 'Логин, пароль и имя обязательны' });
    }
    
    try {
        const existing = await query(`SELECT id FROM family_members WHERE login = ?`, [login]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Логин уже занят' });
        }
        
        const password_hash = await bcrypt.hash(password, 10);
        
        const result = await run(
            `INSERT INTO family_members (login, password_hash, full_name, role, relation) VALUES (?, ?, ?, ?, ?)`,
            [login, password_hash, full_name, role, relation || null]
        );

        await logAction(result.lastID, req.user.login, 
            'CREATE_USER', 'user', result.lastID, 
            `Создан пользователь ${login} с ролью ${role}`);
        
        res.status(201).json({ id: result.lastID, login, full_name, role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// удалить пользователя (только админ)
const deleteMember = async (req, res) => {
    const { id } = req.params;
    try {
    const user = await getUserById(id);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (req.user.id == parseInt(id)) {
        return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }

    await logAction(req.user.id, req.user.login, 
            'DELETE_USER', 'user', id, `Удаление пользователя`);
    
    await run(`DELETE FROM family_members WHERE id = ?`, [id]);
    res.json({ deleted: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// подтвердить пользователя
const approveMember = async (req, res) => {
    const { id } = req.params;
    
    try {
    const user = await getUserById(id);
    if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (user.role !== 'pending') {
        return res.status(400).json({ error: 'Пользователь уже подтверждён или является администратором' });
    }
    
    await run(`UPDATE family_members SET role = 'user' WHERE id = ?`, [id]);
    
    res.json({ 
        message: `Пользователь подтверждён, роль изменена с pending на user`,
        user_id: id
    });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// отклонить заявку
const rejectMember = async (req, res) => {
    const { id } = req.params;
    
    try {
    const user = await getUserById(id);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (user.role !== 'pending') {
        return res.status(400).json({ error: 'Можно удалять только ожидающих подтверждения' });
    }
    
    await run(`DELETE FROM family_members WHERE id = ?`, [id]);
    
    res.json({ message: `Заявка отклонена`, deleted_id: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// назначить роль (админ/пользователь)
const updateMemberRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Некорректная роль. Допустимые: admin, user' });
    }
    
    try {
        const user = await getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Нельзя изменить роль у pending 
        if (user.role === 'pending') {
            return res.status(400).json({ error: 'Сначала подтвердите заявку пользователя' });
        }
        
        // Нельзя изменить роль у самого себя
        if (req.user.id == parseInt(id)) {
            return res.status(400).json({ error: 'Нельзя изменить свою роль' });
        }
        
        await run(`UPDATE family_members SET role = ? WHERE id = ?`, [role, id]);

        await logAction(id, req.user.login, 
            'CHANGE_ROLE', 'user', id, 
            `Роль изменена на ${role === 'admin' ? 'администратора' : 'пользователя'}`);
        
        res.json({ 
            message: `Роль изменена на ${role === 'admin' ? 'администратора' : 'пользователя'}`,
            user_id: id,
            new_role: role
        });
    } catch (err) {
        console.error('updateMemberRole error:', err);
        res.status(500).json({ error: err.message });
    }
};

const importMembers = async (req, res) => {
    // ожидаем массив пользователей
    const users = req.body;

    if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ error: 'Передан пустой или невалидный массив' });
    }

    const results = {
        success: [],
        errors: []
    };

    for (const user of users) {
        const { login, password, full_name, role = 'user', relation } = user;

        if (!login || !password || !full_name) {
            results.errors.push({ login, error: 'Логин, пароль и имя обязательны' });
            continue;
        }

        try {
            const existing = await query(`SELECT id FROM family_members WHERE login = ?`, [login]);
            if (existing.length > 0) {
                results.errors.push({ login, error: 'Логин уже занят' });
                continue;
            }

            const password_hash = await bcrypt.hash(password, 10);

            const result = await run(
                `INSERT INTO family_members (login, password_hash, full_name, role, relation) 
                 VALUES (?, ?, ?, ?, ?)`,
                [login, password_hash, full_name, role, relation || null]
            );

            results.success.push({ id: result.lastID, login, full_name, role });
        } catch (err) {
            results.errors.push({ login, error: err.message });
        }
    }

    await logAction(req.user.id, req.user.login, 
        'IMPORT_USERS', 'user', null, 
        `Импортировано ${results.success.length} пользователей, 
        ошибок: ${results.errors.length}`);

    res.status(201).json({
        message: `Импорт завершён: ${results.success.length} успешно, ${results.errors.length} ошибок`,
        results
    });
};

module.exports = {
    getAllMembers,
    createMember,
    deleteMember,
    approveMember,
    rejectMember,
    updateMemberRole,
    importMembers
};