const { query } = require('../config/database');

// @desc    Aktif bannerları getir
// @route   GET /api/banners
exports.getBanners = async (req, res, next) => {
    try {
        const { position } = req.query;
        let sql = `
            SELECT * FROM banners 
            WHERE is_active = true 
            AND (start_date IS NULL OR start_date <= NOW())
            AND (end_date IS NULL OR end_date >= NOW())
        `;
        const params = [];

        if (position) {
            sql += ` AND position = $1`;
            params.push(position);
        }

        sql += ` ORDER BY sort_order, created_at DESC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};
