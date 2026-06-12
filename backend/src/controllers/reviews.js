const { query } = require('../config/database');

// @desc    Kullanıcının yorumları
// @route   GET /api/reviews/my-reviews
exports.getMyReviews = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT r.*, p.name as product_name, p.slug as product_slug,
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as product_image
             FROM reviews r
             JOIN products p ON r.product_id = p.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};
