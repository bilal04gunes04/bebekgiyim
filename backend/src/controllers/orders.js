const { query } = require('../config/database');
const { sendOrderConfirmation } = require('../services/emailService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Sipariş oluştur
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
    try {
        const { shippingAddressId, paymentMethod, notes, couponCode } = req.body;

        // Sepet kontrolü
        const cartResult = await query(
            `SELECT ci.*, p.name as product_name, p.stock_status, pv.stock_quantity as variant_stock
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             LEFT JOIN product_variants pv ON ci.variant_id = pv.id
             WHERE ci.user_id = $1`,
            [req.user.id]
        );

        if (cartResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Sepetiniz boş' });
        }

        // Adres kontrolü
        const addressResult = await query(
            'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
            [shippingAddressId, req.user.id]
        );

        if (addressResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Adres bulunamadı' });
        }

        const shippingAddress = addressResult.rows[0];

        // Stok kontrolü
        for (const item of cartResult.rows) {
            if (item.variant_id && item.variant_stock < item.quantity) {
                return res.status(400).json({ success: false, message: `${item.product_name} için yeterli stok bulunmamaktadır` });
            }
        }

        // Tutar hesaplama
        const subtotal = cartResult.rows.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);

        const settingsResult = await query("SELECT value FROM settings WHERE key = 'free_shipping_threshold'");
        const freeShippingThreshold = parseFloat(settingsResult.rows[0]?.value || 250);
        const shippingCost = subtotal >= freeShippingThreshold ? 0 : 29.90;

        // Kupon kontrolü
        let discountAmount = 0;
        if (couponCode) {
            const couponResult = await query(
                `SELECT * FROM coupons WHERE code = $1 AND is_active = true`,
                [couponCode]
            );
            if (couponResult.rows.length > 0) {
                const coupon = couponResult.rows[0];
                if (coupon.type === 'percentage') {
                    discountAmount = subtotal * (coupon.value / 100);
                } else {
                    discountAmount = coupon.value;
                }
                if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
                    discountAmount = parseFloat(coupon.max_discount);
                }
            }
        }

        const taxAmount = (subtotal - discountAmount) * 0.18; // %18 KDV
        const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

        // Benzersiz sipariş numarası üret (örn: ORD-1718289123456-482)
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Sipariş oluştur
        const orderResult = await query(
            `INSERT INTO orders (order_number, user_id, status, payment_status, payment_method, shipping_address, billing_address, subtotal, shipping_cost, discount_amount, tax_amount, total_amount, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
                orderNumber,
                req.user.id,
                'pending',
                paymentMethod === 'cod' ? 'pending' : 'pending',
                paymentMethod,
                JSON.stringify(shippingAddress),
                JSON.stringify(shippingAddress),
                subtotal,
                shippingCost,
                discountAmount,
                taxAmount,
                totalAmount,
                notes || null
            ]
        );

        const order = orderResult.rows[0];

        // Sipariş öğelerini ekle
        for (const item of cartResult.rows) {
            await query(
                `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_info, quantity, unit_price, total_price)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    order.id,
                    item.product_id,
                    item.variant_id,
                    item.product_name,
                    JSON.stringify({ size: item.size, color: item.color }),
                    item.quantity,
                    item.unit_price,
                    item.unit_price * item.quantity
                ]
            );

            // Stok güncelle
            if (item.variant_id) {
                await query('UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2', [item.quantity, item.variant_id]);
            }
            await query('UPDATE products SET stock_quantity = stock_quantity - $1, sold_count = sold_count + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }

        // Sepeti temizle
        await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

        // Kupon kullanımını kaydet
        if (couponCode) {
            await query('INSERT INTO coupon_usages (coupon_id, user_id, order_id, discount_amount) VALUES ((SELECT id FROM coupons WHERE code = $1), $2, $3, $4)', [couponCode, req.user.id, order.id, discountAmount]);
            await query('UPDATE coupons SET usage_count = usage_count + 1 WHERE code = $1', [couponCode]);
        }

        // Sipariş durum geçmişi
        await query('INSERT INTO order_status_history (order_id, status, note, created_by) VALUES ($1, $2, $3, $4)', [order.id, 'pending', 'Sipariş oluşturuldu', req.user.id]);

        // Sipariş onayı e-postası gönder (hata sipariş akışını engellemesin)
        const userResult = await query('SELECT first_name, email FROM users WHERE id = $1', [req.user.id]);
        const orderItemsResult = await query('SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = $1', [order.id]);
        sendOrderConfirmation(
            req.user.email,
            order,
            orderItemsResult.rows,
            userResult.rows[0] || {}
        );

        res.status(201).json({ success: true, data: order, message: 'Siparişiniz başarıyla oluşturuldu' });
    } catch (error) {
        next(error);
    }
};

// @desc    Kullanıcı siparişleri
// @route   GET /api/orders
exports.getOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;

        let sql = `
            SELECT o.*,
                   json_agg(json_build_object(
                       'id', oi.id,
                       'productName', oi.product_name,
                       'quantity', oi.quantity,
                       'unitPrice', oi.unit_price,
                       'totalPrice', oi.total_price,
                       'variantInfo', oi.variant_info
                   )) FILTER (WHERE oi.id IS NOT NULL) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
        `;
        const params = [req.user.id];

        if (status) {
            sql += ` AND o.status = $2`;
            params.push(status);
        }

        sql += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Sipariş detayı
// @route   GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT o.*,
                    json_agg(json_build_object(
                        'id', oi.id, 'productName', oi.product_name, 'quantity', oi.quantity,
                        'unitPrice', oi.unit_price, 'totalPrice', oi.total_price,
                        'variantInfo', oi.variant_info
                    )) FILTER (WHERE oi.id IS NOT NULL) as items,
                    json_agg(json_build_object(
                        'status', osh.status, 'note', osh.note, 'createdAt', osh.created_at
                    )) FILTER (WHERE osh.id IS NOT NULL) as status_history
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN order_status_history osh ON o.id = osh.order_id
             WHERE o.id = $1 AND o.user_id = $2
             GROUP BY o.id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Sipariş durumu güncelle (Admin)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, note, trackingNumber } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Geçersiz durum' });
        }

        const updateFields = ['status = $1', 'updated_at = NOW()'];
        const values = [status];
        let index = 2;

        if (trackingNumber) {
            updateFields.push(`tracking_number = $${index}`);
            values.push(trackingNumber);
            index++;
        }

        if (status === 'shipped') {
            updateFields.push(`shipped_at = NOW()`);
        }
        if (status === 'delivered') {
            updateFields.push(`delivered_at = NOW()`);
        }

        values.push(req.params.id);
        await query(
            `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${index}`,
            values
        );

        await query(
            'INSERT INTO order_status_history (order_id, status, note, created_by) VALUES ($1, $2, $3, $4)',
            [req.params.id, status, note || null, req.user.id]
        );

        res.json({ success: true, message: 'Sipariş durumu güncellendi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Sipariş iptal et
// @route   PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
    try {
        const result = await query(
            'SELECT status FROM orders WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        }

        if (!['pending', 'confirmed'].includes(result.rows[0].status)) {
            return res.status(400).json({ success: false, message: 'Bu sipariş iptal edilemez' });
        }

        await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', req.params.id]);
        await query('INSERT INTO order_status_history (order_id, status, note) VALUES ($1, $2, $3)', [req.params.id, 'cancelled', 'Müşteri tarafından iptal edildi']);

        // Stok iadesi
        const itemsResult = await query('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1', [req.params.id]);
        for (const item of itemsResult.rows) {
            if (item.variant_id) {
                await query('UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.variant_id]);
            }
            await query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }

        res.json({ success: true, message: 'Sipariş iptal edildi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Sipariş istatistikleri (Admin)
// @route   GET /api/orders/stats
exports.getOrderStats = async (req, res, next) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
                COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) as total_revenue,
                COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND status != 'cancelled'), 0) as monthly_revenue
            FROM orders
        `);

        const dailySales = await query(`
            SELECT DATE(created_at) as date, COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '7 days' AND status != 'cancelled'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        res.json({
            success: true,
            data: {
                overview: stats.rows[0],
                dailySales: dailySales.rows
            }
        });
    } catch (error) {
        next(error);
    }
};
