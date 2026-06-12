const { query } = require('../config/database');
const slugify = require('slugify');

// @desc    Dashboard istatistikleri
// @route   GET /api/admin/dashboard
exports.getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
                (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
                (SELECT COUNT(*) FROM orders WHERE status != 'cancelled') as total_orders,
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
                (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = $1) as today_orders,
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = $1 AND status != 'cancelled') as today_revenue,
                (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
                (SELECT COUNT(*) FROM reviews WHERE is_approved = false) as pending_reviews
        `, [today]);

        const recentOrders = await query(`
            SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
                   u.first_name, u.last_name, u.email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        const topProducts = await query(`
            SELECT p.id, p.name, p.sold_count, p.base_price, p.sale_price,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
            FROM products p
            WHERE p.is_active = true
            ORDER BY p.sold_count DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                stats: stats.rows[0],
                recentOrders: recentOrders.rows,
                topProducts: topProducts.rows
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Tüm kullanıcılar
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search;

        let sql = `SELECT id, email, first_name, last_name, phone, role, is_active, created_at FROM users WHERE 1=1`;
        const params = [];
        let index = 1;

        if (search) {
            sql += ` AND (email ILIKE $${index} OR first_name ILIKE $${index} OR last_name ILIKE $${index})`;
            params.push(`%${search}%`);
            index++;
        }

        sql += ` ORDER BY created_at DESC LIMIT $${index} OFFSET $${index + 1}`;
        params.push(limit, offset);

        const result = await query(sql, params);

        const countResult = await query(`SELECT COUNT(*) FROM users WHERE 1=1 ${search ? `AND (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)` : ''}`, search ? [`%${search}%`] : []);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page, limit, total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Kullanıcı rolü güncelle
// @route   PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        await query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
        res.json({ success: true, message: 'Kullanıcı rolü güncellendi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Tüm siparişler
// @route   GET /api/admin/orders
exports.getAllOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;

        let sql = `
            SELECT o.*, u.first_name, u.last_name, u.email,
                   (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let index = 1;

        if (status) { sql += ` AND o.status = $${index++}`; params.push(status); }
        if (search) { sql += ` AND (o.order_number ILIKE $${index++} OR u.email ILIKE $${index++} OR u.first_name ILIKE $${index++})`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

        sql += ` ORDER BY o.created_at DESC LIMIT $${index} OFFSET $${index + 1}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Tüm ürünler (Admin)
// @route   GET /api/admin/products
exports.getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search;
        const status = req.query.status;

        let sql = `
            SELECT p.*, c.name as category_name, b.name as brand_name,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE 1=1
        `;
        const params = [];
        let index = 1;

        if (search) { sql += ` AND (p.name ILIKE $${index++} OR p.sku ILIKE $${index++})`; params.push(`%${search}%`, `%${search}%`); }
        if (status === 'active') { sql += ` AND p.is_active = true`; }
        if (status === 'inactive') { sql += ` AND p.is_active = false`; }
        if (status === 'low_stock') { sql += ` AND p.stock_quantity <= 10`; }

        sql += ` ORDER BY p.created_at DESC LIMIT $${index} OFFSET $${index + 1}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Tüm kategoriler (Admin)
// @route   GET /api/admin/categories
exports.getAllCategories = async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM categories ORDER BY sort_order, name');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Tüm markalar
// @route   GET /api/admin/brands
exports.getAllBrands = async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM brands ORDER BY name');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Marka oluştur
// @route   POST /api/admin/brands
exports.createBrand = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const slug = slugify(name, { lower: true, strict: true });
        const logoUrl = req.file ? `/uploads/brands/${req.file.filename}` : null;

        const result = await query(
            'INSERT INTO brands (name, slug, description, logo_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, slug, description || null, logoUrl]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Marka güncelle
// @route   PUT /api/admin/brands/:id
exports.updateBrand = async (req, res, next) => {
    try {
        const { name, description, isActive } = req.body;
        const updates = [];
        const values = [];
        let index = 1;

        if (name) { updates.push(`name = $${index++}`); values.push(name); }
        if (description !== undefined) { updates.push(`description = $${index++}`); values.push(description); }
        if (isActive !== undefined) { updates.push(`is_active = $${index++}`); values.push(isActive); }
        if (req.file) { updates.push(`logo_url = $${index++}`); values.push(`/uploads/brands/${req.file.filename}`); }

        values.push(req.params.id);
        const result = await query(
            `UPDATE brands SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`,
            values
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Marka sil
// @route   DELETE /api/admin/brands/:id
exports.deleteBrand = async (req, res, next) => {
    try {
        await query('UPDATE brands SET is_active = false WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Marka silindi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Tüm yorumlar
// @route   GET /api/admin/reviews
exports.getAllReviews = async (req, res, next) => {
    try {
        const result = await query(`
            SELECT r.*, p.name as product_name, u.first_name, u.last_name, u.email
            FROM reviews r
            JOIN products p ON r.product_id = p.id
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Yorum onayla
// @route   PUT /api/admin/reviews/:id/approve
exports.approveReview = async (req, res, next) => {
    try {
        await query('UPDATE reviews SET is_approved = true WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Yorum onaylandı' });
    } catch (error) {
        next(error);
    }
};

// @desc    Yorum sil
// @route   DELETE /api/admin/reviews/:id
exports.deleteReview = async (req, res, next) => {
    try {
        await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Yorum silindi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Tüm kuponlar
// @route   GET /api/admin/coupons
exports.getAllCoupons = async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM coupons ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Kupon oluştur
// @route   POST /api/admin/coupons
exports.createCoupon = async (req, res, next) => {
    try {
        const { code, type, value, minPurchase, maxDiscount, usageLimit, startDate, endDate } = req.body;
        const result = await query(
            'INSERT INTO coupons (code, type, value, min_purchase, max_discount, usage_limit, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [code.toUpperCase(), type, value, minPurchase || 0, maxDiscount || null, usageLimit || null, startDate || null, endDate || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Kupon güncelle
// @route   PUT /api/admin/coupons/:id
exports.updateCoupon = async (req, res, next) => {
    try {
        const { isActive } = req.body;
        await query('UPDATE coupons SET is_active = $1 WHERE id = $2', [isActive, req.params.id]);
        res.json({ success: true, message: 'Kupon güncellendi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Kupon sil
// @route   DELETE /api/admin/coupons/:id
exports.deleteCoupon = async (req, res, next) => {
    try {
        await query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Kupon silindi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Tüm bannerlar
// @route   GET /api/admin/banners
exports.getAllBanners = async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM banners ORDER BY sort_order, created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Banner oluştur
// @route   POST /api/admin/banners
exports.createBanner = async (req, res, next) => {
    try {
        const { title, subtitle, linkUrl, position, sortOrder, startDate, endDate } = req.body;
        const imageUrl = req.file ? `/uploads/banners/${req.file.filename}` : null;

        const result = await query(
            'INSERT INTO banners (title, subtitle, image_url, link_url, position, sort_order, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [title || null, subtitle || null, imageUrl, linkUrl || null, position || 'home_main', sortOrder || 0, startDate || null, endDate || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Banner güncelle
// @route   PUT /api/admin/banners/:id
exports.updateBanner = async (req, res, next) => {
    try {
        const { title, subtitle, linkUrl, position, sortOrder, isActive, startDate, endDate } = req.body;
        const updates = [];
        const values = [];
        let index = 1;

        if (title !== undefined) { updates.push(`title = $${index++}`); values.push(title); }
        if (subtitle !== undefined) { updates.push(`subtitle = $${index++}`); values.push(subtitle); }
        if (linkUrl !== undefined) { updates.push(`link_url = $${index++}`); values.push(linkUrl); }
        if (position !== undefined) { updates.push(`position = $${index++}`); values.push(position); }
        if (sortOrder !== undefined) { updates.push(`sort_order = $${index++}`); values.push(sortOrder); }
        if (isActive !== undefined) { updates.push(`is_active = $${index++}`); values.push(isActive); }
        if (startDate !== undefined) { updates.push(`start_date = $${index++}`); values.push(startDate); }
        if (endDate !== undefined) { updates.push(`end_date = $${index++}`); values.push(endDate); }
        if (req.file) { updates.push(`image_url = $${index++}`); values.push(`/uploads/banners/${req.file.filename}`); }

        values.push(req.params.id);
        const result = await query(
            `UPDATE banners SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`,
            values
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Banner sil
// @route   DELETE /api/admin/banners/:id
exports.deleteBanner = async (req, res, next) => {
    try {
        await query('DELETE FROM banners WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Banner silindi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Tüm sayfalar
// @route   GET /api/admin/pages
exports.getAllPages = async (req, res, next) => {
    try {
        const result = await query('SELECT id, title, slug, is_active, created_at FROM pages ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Sayfa oluştur
// @route   POST /api/admin/pages
exports.createPage = async (req, res, next) => {
    try {
        const { title, content, metaTitle, metaDescription } = req.body;
        const slug = slugify(title, { lower: true, strict: true });

        const result = await query(
            'INSERT INTO pages (title, slug, content, meta_title, meta_description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, slug, content, metaTitle || null, metaDescription || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Sayfa güncelle
// @route   PUT /api/admin/pages/:id
exports.updatePage = async (req, res, next) => {
    try {
        const { title, content, metaTitle, metaDescription, isActive } = req.body;
        const updates = [];
        const values = [];
        let index = 1;

        if (title) { updates.push(`title = $${index++}`); values.push(title); }
        if (content !== undefined) { updates.push(`content = $${index++}`); values.push(content); }
        if (metaTitle !== undefined) { updates.push(`meta_title = $${index++}`); values.push(metaTitle); }
        if (metaDescription !== undefined) { updates.push(`meta_description = $${index++}`); values.push(metaDescription); }
        if (isActive !== undefined) { updates.push(`is_active = $${index++}`); values.push(isActive); }

        values.push(req.params.id);
        const result = await query(
            `UPDATE pages SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`,
            values
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Sayfa sil
// @route   DELETE /api/admin/pages/:id
exports.deletePage = async (req, res, next) => {
    try {
        await query('DELETE FROM pages WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Sayfa silindi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Sistem ayarları
// @route   GET /api/admin/settings
exports.getSettings = async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM settings ORDER BY key');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.type === 'number' ? parseFloat(row.value) : 
                                row.type === 'boolean' ? row.value === 'true' : row.value;
        });
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

// @desc    Ayarları güncelle
// @route   PUT /api/admin/settings
exports.updateSettings = async (req, res, next) => {
    try {
        const settings = req.body;
        for (const [key, value] of Object.entries(settings)) {
            const type = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string';
            await query(
                `INSERT INTO settings (key, value, type) VALUES ($1, $2, $3)
                 ON CONFLICT (key) DO UPDATE SET value = $2, type = $3, updated_at = NOW()`,
                [key, String(value), type]
            );
        }
        res.json({ success: true, message: 'Ayarlar güncellendi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Satış raporu
// @route   GET /api/admin/reports/sales
exports.getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const result = await query(`
            SELECT DATE(created_at) as date, 
                   COUNT(*) as order_count,
                   COALESCE(SUM(total_amount), 0) as revenue,
                   COALESCE(SUM(subtotal), 0) as subtotal,
                   COALESCE(SUM(shipping_cost), 0) as shipping,
                   COALESCE(SUM(discount_amount), 0) as discount
            FROM orders
            WHERE created_at BETWEEN $1 AND $2 AND status != 'cancelled'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [startDate || '2024-01-01', endDate || '2030-12-31']);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Stok raporu
// @route   GET /api/admin/reports/inventory
exports.getInventoryReport = async (req, res, next) => {
    try {
        const result = await query(`
            SELECT p.id, p.name, p.sku, p.stock_quantity, p.stock_status,
                   c.name as category_name,
                   COALESCE(SUM(pv.stock_quantity), 0) as variant_stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            WHERE p.is_active = true
            GROUP BY p.id, c.name
            ORDER BY p.stock_quantity ASC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Müşteri raporu
// @route   GET /api/admin/reports/customers
exports.getCustomerReport = async (req, res, next) => {
    try {
        const result = await query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.created_at,
                   COUNT(o.id) as total_orders,
                   COALESCE(SUM(o.total_amount), 0) as total_spent,
                   MAX(o.created_at) as last_order_date
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY total_spent DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};
