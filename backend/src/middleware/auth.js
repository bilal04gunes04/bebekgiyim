const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const result = await query(
                'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
                [decoded.id]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı' });
            }

            req.user = result.rows[0];
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token bulunamadı' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Bu işlem için admin yetkisi gereklidir' });
    }
};

const moderatorOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Bu işlem için yetki gereklidir' });
    }
};

module.exports = { protect, adminOnly, moderatorOrAdmin };
