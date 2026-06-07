const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Не авторизован' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Только администратор' });
    }
    next();
};

const hasRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Не авторизован' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        next();
    };
};

module.exports = { isAdmin, hasRole };