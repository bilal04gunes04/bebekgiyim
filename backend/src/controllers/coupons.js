const { query } = require('../config/database');

// @desc    Kupon doğrula
// @route   POST /api/coupons/validate
exports.validateCoupon = async (req, res, next) => {
    try {
        const { code, subtotal } = req.body;

        const result = await query(
            `SELECT * FROM coupons 
             WHERE code = $1 AND is_active = true 
             AND (start_date IS NULL OR start_date <= NOW())
             AND (end_date IS NULL OR end_date >= NOW())
             AND (usage_limit IS NULL OR usage_count < usage_limit)`,
            [code.toUpperCase()]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş kupon' });
        }

        const coupon = result.rows[0];

        if (parseFloat(subtotal) < parseFloat(coupon.min_purchase)) {
            return res.status(400).json({ success: false, message: `Bu kupon için minimum ${coupon.min_purchase} TL alışveriş yapmalısınız` });
        }

        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = parseFloat(subtotal) * (coupon.value / 100);
        } else if (coupon.type === 'fixed_amount') {
            discountAmount = coupon.value;
        }

        if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
            discountAmount = parseFloat(coupon.max_discount);
        }

        res.json({
            success: true,
            coupon: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discountAmount: discountAmount.toFixed(2)
            }
        });
    } catch (error) {
        next(error);
    }
};
