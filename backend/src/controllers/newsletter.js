const { query } = require('../config/database');

// @desc    Bültene abone ol
// @route   POST /api/newsletter/subscribe
exports.subscribe = async (req, res, next) => {
    try {
        const { email } = req.body;
        await query(
            `INSERT INTO newsletter_subscribers (email) VALUES ($1)
             ON CONFLICT (email) DO UPDATE SET is_active = true, subscribed_at = NOW()`,
            [email]
        );
        res.json({ success: true, message: 'Bülten aboneliğiniz başarıyla tamamlandı' });
    } catch (error) {
        next(error);
    }
};

// @desc    Bülten aboneliğini iptal et
// @route   POST /api/newsletter/unsubscribe
exports.unsubscribe = async (req, res, next) => {
    try {
        const { email } = req.body;
        await query('UPDATE newsletter_subscribers SET is_active = false WHERE email = $1', [email]);
        res.json({ success: true, message: 'Bülten aboneliğiniz iptal edildi' });
    } catch (error) {
        next(error);
    }
};
