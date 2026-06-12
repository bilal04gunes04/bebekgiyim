const { query } = require('../config/database');
const { validationResult } = require('express-validator');

// @desc    Adresleri getir
// @route   GET /api/users/addresses
exports.getAddresses = async (req, res, next) => {
    try {
        const result = await query(
            'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Adres ekle
// @route   POST /api/users/addresses
exports.addAddress = async (req, res, next) => {
    try {
        const { title, fullName, phone, city, district, neighborhood, addressLine, postalCode, isDefault } = req.body;

        if (isDefault) {
            await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
        }

        const result = await query(
            `INSERT INTO addresses (user_id, title, full_name, phone, city, district, neighborhood, address_line, postal_code, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [req.user.id, title, fullName, phone, city, district, neighborhood || null, addressLine, postalCode || null, isDefault || false]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Adres güncelle
// @route   PUT /api/users/addresses/:id
exports.updateAddress = async (req, res, next) => {
    try {
        const { title, fullName, phone, city, district, neighborhood, addressLine, postalCode } = req.body;
        const result = await query(
            `UPDATE addresses SET title = $1, full_name = $2, phone = $3, city = $4, district = $5, neighborhood = $6, address_line = $7, postal_code = $8
             WHERE id = $9 AND user_id = $10 RETURNING *`,
            [title, fullName, phone, city, district, neighborhood || null, addressLine, postalCode || null, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Adres bulunamadı' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Adres sil
// @route   DELETE /api/users/addresses/:id
exports.deleteAddress = async (req, res, next) => {
    try {
        await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ success: true, message: 'Adres silindi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Varsayılan adres ayarla
// @route   PUT /api/users/addresses/:id/default
exports.setDefaultAddress = async (req, res, next) => {
    try {
        await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
        await query('UPDATE addresses SET is_default = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ success: true, message: 'Varsayılan adres güncellendi' });
    } catch (error) {
        next(error);
    }
};
