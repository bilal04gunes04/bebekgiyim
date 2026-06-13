const { query } = require('../config/database');

// @desc    Sepeti getir
// @route   GET /api/cart
exports.getCart = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT ci.id, ci.quantity, ci.unit_price,
                    p.id as product_id, p.name as product_name, p.slug as product_slug,
                    pv.id as variant_id, pv.size, pv.color, pv.color_hex,
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
                    COALESCE(p.sale_price, p.base_price) as current_price,
                    (ci.quantity * ci.unit_price) as total
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             LEFT JOIN product_variants pv ON ci.variant_id = pv.id
             WHERE ci.user_id = $1
             ORDER BY ci.created_at DESC`,
            [req.user.id]
        );

        const items = result.rows;
        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total), 0);

        // Kargo ücreti
        const settingsResult = await query("SELECT value FROM settings WHERE key = 'free_shipping_threshold'");
        const freeShippingThreshold = parseFloat(settingsResult.rows[0]?.value || 250);
        const shippingCost = subtotal >= freeShippingThreshold ? 0 : 29.90;

        // Not: Kupon bilgisi şu an cart_items tablosunda saklanmıyor, bu yüzden
        // sabit olarak "kupon yok" kabul ediyoruz.
        const coupon = null;
        const discountAmount = 0;

        const total = subtotal + shippingCost - discountAmount;

        res.json({
            success: true,
            data: {
                items,
                summary: {
                    subtotal: subtotal.toFixed(2),
                    shippingCost: shippingCost.toFixed(2),
                    discountAmount: discountAmount.toFixed(2),
                    total: total.toFixed(2),
                    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
                },
                coupon: coupon ? { code: coupon.coupon_code, discountAmount: coupon.discount_amount } : null
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Sepete ekle
// @route   POST /api/cart
exports.addToCart = async (req, res, next) => {
    try {
        const { productId, variantId, quantity = 1 } = req.body;

        // Ürün ve stok kontrolü
        const productResult = await query(
            'SELECT id, base_price, sale_price, stock_status FROM products WHERE id = $1 AND is_active = true',
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }

        const product = productResult.rows[0];
        const unitPrice = product.sale_price || product.base_price;

        // Varyant kontrolü
        if (variantId) {
            const variantResult = await query(
                'SELECT id, stock_quantity FROM product_variants WHERE id = $1 AND product_id = $2 AND is_active = true',
                [variantId, productId]
            );
            if (variantResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Varyant bulunamadı' });
            }
            if (variantResult.rows[0].stock_quantity < quantity) {
                return res.status(400).json({ success: false, message: 'Yeterli stok bulunmamaktadır' });
            }
        }

        // Sepette var mı kontrolü
        const existingResult = await query(
            'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))',
            [req.user.id, productId, variantId]
        );

        if (existingResult.rows.length > 0) {
            const newQuantity = existingResult.rows[0].quantity + quantity;
            await query(
                'UPDATE cart_items SET quantity = $1, unit_price = $2, updated_at = NOW() WHERE id = $3',
                [newQuantity, unitPrice, existingResult.rows[0].id]
            );
        } else {
            await query(
                'INSERT INTO cart_items (user_id, product_id, variant_id, quantity, unit_price) VALUES ($1, $2, $3, $4, $5)',
                [req.user.id, productId, variantId, quantity, unitPrice]
            );
        }

        res.json({ success: true, message: 'Ürün sepete eklendi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Sepet öğesi güncelle
// @route   PUT /api/cart/:itemId
exports.updateCartItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Geçersiz miktar' });
        }

        const result = await query(
            'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
            [quantity, itemId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sepet öğesi bulunamadı' });
        }

        res.json({ success: true, message: 'Sepet güncellendi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Sepetten çıkar
// @route   DELETE /api/cart/:itemId
exports.removeFromCart = async (req, res, next) => {
    try {
        await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.itemId, req.user.id]);
        res.json({ success: true, message: 'Ürün sepetten çıkarıldı' });
    } catch (error) {
        next(error);
    }
};

// @desc    Sepeti temizle
// @route   DELETE /api/cart
exports.clearCart = async (req, res, next) => {
    try {
        await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
        res.json({ success: true, message: 'Sepet temizlendi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Kupon uygula
// @route   POST /api/cart/coupon
exports.applyCoupon = async (req, res, next) => {
    try {
        const { code } = req.body;

        const couponResult = await query(
            `SELECT * FROM coupons 
             WHERE code = $1 AND is_active = true 
             AND (start_date IS NULL OR start_date <= NOW())
             AND (end_date IS NULL OR end_date >= NOW())
             AND (usage_limit IS NULL OR usage_count < usage_limit)`,
            [code.toUpperCase()]
        );

        if (couponResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş kupon' });
        }

        const coupon = couponResult.rows[0];

        // Sepet toplamını hesapla
        const cartResult = await query(
            'SELECT SUM(quantity * unit_price) as subtotal FROM cart_items WHERE user_id = $1',
            [req.user.id]
        );
        const subtotal = parseFloat(cartResult.rows[0].subtotal || 0);

        if (subtotal < parseFloat(coupon.min_purchase)) {
            return res.status(400).json({ success: false, message: `Bu kupon için minimum ${coupon.min_purchase} TL alışveriş yapmalısınız` });
        }

        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = subtotal * (coupon.value / 100);
        } else if (coupon.type === 'fixed_amount') {
            discountAmount = coupon.value;
        }

        if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
            discountAmount = parseFloat(coupon.max_discount);
        }

        // Kuponu sepete uygula
        await query(
            'UPDATE cart_items SET coupon_code = $1, discount_amount = $2 WHERE user_id = $3',
            [code, discountAmount, req.user.id]
        );

        res.json({ success: true, coupon: { code, discountAmount: discountAmount.toFixed(2) } });
    } catch (error) {
        next(error);
    }
};
