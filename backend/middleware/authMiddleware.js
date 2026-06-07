const jwt = require('jsonwebtoken');

// проверка токена в каждом защищенном запросе
const authMiddleware = (req, res, next) => {
    // токен через заголовок
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Нет токена. Авторизуйтесь.' });
    }
    
    // извлечение
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Токен просрочен' });
        }
        return res.status(401).json({ error: 'Неверный токен' });
    }
};

module.exports = authMiddleware;