const { query } = require('../config/database');

// @desc    Tüm sayfalar
// @route   GET /api/pages
exports.getPages = async (req, res, next) => {
    try {
        const result = await query('SELECT id, title, slug FROM pages WHERE is_active = true ORDER BY title');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Sayfa detayı
// @route   GET /api/pages/:slug
exports.getPage = async (req, res, next) => {
    try {
        const result = await query(
            'SELECT * FROM pages WHERE slug = $1 AND is_active = true',
            [req.params.slug]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sayfa bulunamadı' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};
