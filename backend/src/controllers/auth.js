const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query } = require('../config/database');
const crypto = require('crypto');
const { sendPasswordReset } = require('../services/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password, firstName, lastName, phone } = req.body;

        // Email kontrolü
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Bu e-posta adresi zaten kayıtlı' });
        }

        // Şifre hashleme
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Kullanıcı oluşturma
        const result = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role`,
            [email, passwordHash, firstName, lastName, phone || null]
        );

        const user = result.rows[0];
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        const result = await query(
            'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Geçersiz e-posta veya şifre' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(401).json({ success: false, message: 'Hesabınız aktif değil' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Geçersiz e-posta veya şifre' });
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mevcut kullanıcı bilgisi
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at,
                    json_agg(json_build_object(
                        'id', a.id, 'title', a.title, 'fullName', a.full_name,
                        'city', a.city, 'district', a.district, 'addressLine', a.address_line,
                        'isDefault', a.is_default
                    )) FILTER (WHERE a.id IS NOT NULL) as addresses
             FROM users u
             LEFT JOIN addresses a ON a.user_id = u.id
             WHERE u.id = $1
             GROUP BY u.id`,
            [req.user.id]
        );

        const user = result.rows[0];
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Profil güncelleme
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const result = await query(
            'UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
            [firstName, lastName, phone, req.user.id]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Şifre sıfırlama isteği
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await query('SELECT id, email FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.json({ success: true, message: 'Eğer bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderilecektir' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 saat

        await query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
            [resetToken, resetTokenExpiry, result.rows[0].id]
        );

        // Şifre sıfırlama e-postası gönder
        await sendPasswordReset(email, resetToken);

        res.json({ success: true, message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Şifre sıfırlama
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const result = await query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş token' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
            [passwordHash, result.rows[0].id]
        );

        res.json({ success: true, message: 'Şifreniz başarıyla güncellendi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Şifre değiştirme
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);

        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mevcut şifre hatalı' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);
        res.json({ success: true, message: 'Şifreniz başarıyla değiştirildi' });
    } catch (error) {
        next(error);
    }
};
