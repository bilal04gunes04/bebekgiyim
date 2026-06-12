const { query } = require('../config/database');

// @desc    Favorileri getir
// @route   GET /api/wishlist
exports.getWishlist = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT w.*, p.name, p.slug, p.base_price, p.sale_price,
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
             FROM wishlists w
             JOIN products p ON w.product_id = p.id
             WHERE w.user_id = $1
             ORDER BY w.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Favorilere ekle
// @route   POST /api/wishlist/:productId
exports.addToWishlist = async (req, res, next) => {
    try {
        await query(
            'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.user.id, req.params.productId]
        );
        res.json({ success: true, message: 'Favorilere eklendi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Favorilerden çıkar
// @route   DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res, next) => {
    try {
        await query('DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2', [req.user.id, req.params.productId]);
        res.json({ success: true, message: 'Favorilerden çıkarıldı' });
    } catch (error) {
        next(error);
    }
};
