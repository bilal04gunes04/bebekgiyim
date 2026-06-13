const { query } = require('../config/database');
const slugify = require('slugify');
const { validationResult } = require('express-validator');

// @desc    Tüm ürünleri getir (filtreleme, sıralama, sayfalama)
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 24;
        const offset = (page - 1) * limit;

        const { category, brand, minPrice, maxPrice, size, color, sort, search, tag } = req.query;

        let sql = `
            SELECT p.*, 
                   c.name as category_name, c.slug as category_slug,
                   b.name as brand_name,
                   json_agg(DISTINCT jsonb_build_object('id', pv.id, 'size', pv.size, 'color', pv.color, 'colorHex', pv.color_hex, 'stock', pv.stock_quantity)) FILTER (WHERE pv.id IS NOT NULL) as variants,
                   json_agg(DISTINCT jsonb_build_object('id', pi.id, 'url', pi.image_url, 'isPrimary', pi.is_primary)) FILTER (WHERE pi.id IS NOT NULL) as images,
                   COALESCE(AVG(r.rating), 0) as avg_rating,
                   COUNT(DISTINCT r.id) as review_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
            LEFT JOIN product_images pi ON p.id = pi.product_id
            LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = true
            WHERE p.is_active = true
        `;

        const params = [];
        let paramIndex = 1;

        if (category) {
            sql += ` AND (c.slug = $${paramIndex} OR c.id IN (SELECT id FROM categories WHERE parent_id = (SELECT id FROM categories WHERE slug = $${paramIndex})))`;
            params.push(category);
            paramIndex++;
        }

        if (brand) {
            sql += ` AND b.slug = $${paramIndex}`;
            params.push(brand);
            paramIndex++;
        }

        if (minPrice) {
            sql += ` AND COALESCE(p.sale_price, p.base_price) >= $${paramIndex}`;
            params.push(minPrice);
            paramIndex++;
        }

        if (maxPrice) {
            sql += ` AND COALESCE(p.sale_price, p.base_price) <= $${paramIndex}`;
            params.push(maxPrice);
            paramIndex++;
        }

        if (size) {
            sql += ` AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id AND size = $${paramIndex} AND is_active = true)`;
            params.push(size);
            paramIndex++;
        }

        if (color) {
            sql += ` AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id AND color = $${paramIndex} AND is_active = true)`;
            params.push(color);
            paramIndex++;
        }

        if (search) {
            sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (tag) {
            sql += ` AND EXISTS (SELECT 1 FROM product_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.product_id = p.id AND t.slug = $${paramIndex})`;
            params.push(tag);
            paramIndex++;
        }

        sql += ` GROUP BY p.id, c.name, c.slug, b.name`;

        // Sıralama
        const sortOptions = {
            'price_asc': 'COALESCE(p.sale_price, p.base_price) ASC',
            'price_desc': 'COALESCE(p.sale_price, p.base_price) DESC',
            'newest': 'p.created_at DESC',
            'popular': 'p.sold_count DESC',
            'rating': 'avg_rating DESC',
            'name_asc': 'p.name ASC'
        };
        sql += ` ORDER BY ${sortOptions[sort] || sortOptions['newest']}`;

        // Sayfalama
        sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(sql, params);

        // Toplam sayı
        let countSql = `SELECT COUNT(DISTINCT p.id) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN brands b ON p.brand_id = b.id WHERE p.is_active = true`;
        const countParams = [];
        let countIndex = 1;

        if (category) {
            countSql += ` AND (c.slug = $${countIndex} OR c.id IN (SELECT id FROM categories WHERE parent_id = (SELECT id FROM categories WHERE slug = $${countIndex})))`;
            countParams.push(category);
            countIndex++;
        }
        if (brand) { countSql += ` AND b.slug = $${countIndex}`; countParams.push(brand); countIndex++; }
        if (minPrice) { countSql += ` AND COALESCE(p.sale_price, p.base_price) >= $${countIndex}`; countParams.push(minPrice); countIndex++; }
        if (maxPrice) { countSql += ` AND COALESCE(p.sale_price, p.base_price) <= $${countIndex}`; countParams.push(maxPrice); countIndex++; }
        if (size) { countSql += ` AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id AND size = $${countIndex})`; countParams.push(size); countIndex++; }
        if (color) { countSql += ` AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id AND color = $${countIndex})`; countParams.push(color); countIndex++; }
        if (search) { countSql += ` AND (p.name ILIKE $${countIndex} OR p.description ILIKE $${countIndex})`; countParams.push(`%${search}%`); countIndex++; }

        const countResult = await query(countSql, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Tek ürün detayı
// @route   GET /api/products/:slug
exports.getProduct = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT p.*, 
                    c.name as category_name, c.slug as category_slug,
                    b.name as brand_name, b.slug as brand_slug,
                    json_agg(DISTINCT jsonb_build_object('id', pv.id, 'size', pv.size, 'color', pv.color, 'colorHex', pv.color_hex, 'stock', pv.stock_quantity, 'priceAdjustment', pv.price_adjustment)) FILTER (WHERE pv.id IS NOT NULL) as variants,
                    json_agg(DISTINCT jsonb_build_object('id', pi.id, 'url', pi.image_url, 'alt', pi.alt_text, 'isPrimary', pi.is_primary, 'sortOrder', pi.sort_order)) FILTER (WHERE pi.id IS NOT NULL) as images,
                    json_agg(DISTINCT jsonb_build_object('id', r.id, 'rating', r.rating, 'title', r.title, 'comment', r.comment, 'userName', u.first_name, 'createdAt', r.created_at)) FILTER (WHERE r.id IS NOT NULL AND r.is_approved = true) as reviews,
                    json_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL) as tags
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN brands b ON p.brand_id = b.id
             LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
             LEFT JOIN product_images pi ON p.id = pi.product_id
             LEFT JOIN reviews r ON p.id = r.product_id
             LEFT JOIN users u ON r.user_id = u.id
             LEFT JOIN product_tags pt ON p.id = pt.product_id
             LEFT JOIN tags t ON pt.tag_id = t.id
             WHERE p.slug = $1 AND p.is_active = true
             GROUP BY p.id, c.name, c.slug, b.name, b.slug`,
            [req.params.slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }

        // Görüntülenme sayısını artır
        await query('UPDATE products SET view_count = view_count + 1 WHERE slug = $1', [req.params.slug]);

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Öne çıkan ürünler
// @route   GET /api/products/featured
exports.getFeaturedProducts = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT p.*, c.name as category_name, b.name as brand_name,
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE p.is_featured = true AND p.is_active = true
             ORDER BY p.created_at DESC
             LIMIT 12`,
            []
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Yeni gelenler
// @route   GET /api/products/new-arrivals
exports.getNewArrivals = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT p.*, c.name as category_name, b.name as brand_name,
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE p.is_new_arrival = true AND p.is_active = true
             ORDER BY p.created_at DESC
             LIMIT 12`,
            []
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Kategoriye göre ürünler
// @route   GET /api/products/category/:slug
exports.getProductsByCategory = async (req, res, next) => {
    try {
        req.query.category = req.params.slug;
        return exports.getProducts(req, res, next);
    } catch (error) {
        next(error);
    }
};

// @desc    Ürün ara
// @route   GET /api/products/search
exports.searchProducts = async (req, res, next) => {
    try {
        return exports.getProducts(req, res, next);
    } catch (error) {
        next(error);
    }
};

// @desc    Ürün oluştur (Admin)
// @route   POST /api/products
exports.createProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            name, description, shortDescription, categoryId, brandId,
            basePrice, salePrice, costPrice, sku, barcode, weightKg,
            taxRate, stockQuantity, isFeatured, isNewArrival, metaTitle, metaDescription, variants, imageUrl
        } = req.body;

        const slug = slugify(name, { lower: true, strict: true }) + '-' + Date.now();

        // Boş string olarak gelen opsiyonel alanları null'a çevir (integer/numeric kolonlar için gerekli)
        const safeCategoryId = categoryId || null;
        const safeBrandId = brandId || null;
        const safeSalePrice = (salePrice === '' || salePrice === undefined) ? null : salePrice;
        const safeCostPrice = (costPrice === '' || costPrice === undefined) ? null : costPrice;

        const result = await query(
            `INSERT INTO products (name, slug, description, short_description, category_id, brand_id, base_price, sale_price, cost_price, sku, barcode, weight_kg, tax_rate, stock_quantity, is_featured, is_new_arrival, meta_title, meta_description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
             RETURNING *`,
            [name, slug, description, shortDescription || null, safeCategoryId, safeBrandId, basePrice, safeSalePrice, safeCostPrice, sku || null, barcode || null, weightKg || 0, taxRate || 18, stockQuantity || 0, isFeatured || false, isNewArrival || false, metaTitle || null, metaDescription || null]
        );

        const product = result.rows[0];

        // Varyantları ekle
        if (variants && Array.isArray(variants)) {
            for (const variant of variants) {
                await query(
                    'INSERT INTO product_variants (product_id, size, color, color_hex, sku, stock_quantity, price_adjustment) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [product.id, variant.size, variant.color, variant.colorHex || null, variant.sku || null, variant.stock || 0, variant.priceAdjustment || 0]
                );
            }
        }

        // Görselleri ekle (dosya yükleme)
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                await query(
                    'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES ($1, $2, $3, $4, $5)',
                    [product.id, `/uploads/products/${req.files[i].filename}`, name, i, i === 0]
                );
            }
        }

        // Görsel URL'si ile ekle
        if (imageUrl) {
            await query(
                'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES ($1, $2, $3, $4, $5)',
                [product.id, imageUrl, name, 0, true]
            );
        }

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Ürün güncelle (Admin)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Frontend camelCase alanları veritabanı snake_case kolonlarına eşler
        const fieldMap = {
            name: 'name', description: 'description', shortDescription: 'short_description',
            categoryId: 'category_id', brandId: 'brand_id', basePrice: 'base_price',
            salePrice: 'sale_price', costPrice: 'cost_price', sku: 'sku', barcode: 'barcode',
            weightKg: 'weight_kg', taxRate: 'tax_rate', stockQuantity: 'stock_quantity',
            isFeatured: 'is_featured', isNewArrival: 'is_new_arrival', isActive: 'is_active',
            metaTitle: 'meta_title', metaDescription: 'meta_description'
        };
        const setClauses = [];
        const values = [];
        let index = 1;

        for (const [key, value] of Object.entries(updates)) {
            const column = fieldMap[key];
            if (column) {
                setClauses.push(`${column} = $${index}`);
                values.push(value === '' ? null : value);
                index++;
            }
        }

        let product;
        if (setClauses.length > 0) {
            values.push(id);
            const result = await query(
                `UPDATE products SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
            }
            product = result.rows[0];
        }

        // Görsel URL'si güncelle (varsa mevcut ana görseli güncelle, yoksa ekle)
        if (updates.imageUrl) {
            const existing = await query('SELECT id FROM product_images WHERE product_id = $1 AND is_primary = true LIMIT 1', [id]);
            if (existing.rows.length > 0) {
                await query('UPDATE product_images SET image_url = $1 WHERE id = $2', [updates.imageUrl, existing.rows[0].id]);
            } else {
                await query(
                    'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES ($1, $2, $3, $4, $5)',
                    [id, updates.imageUrl, updates.name || '', 0, true]
                );
            }
        }

        if (!product) {
            const result = await query('SELECT * FROM products WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
            }
            product = result.rows[0];
        }

        res.json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Ürün sil (Admin)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
    try {
        const result = await query('UPDATE products SET is_active = false WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }
        res.json({ success: true, message: 'Ürün başarıyla silindi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Ürün yorumları
// @route   GET /api/products/:id/reviews
exports.getProductReviews = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT r.*, u.first_name, u.last_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = $1 AND r.is_approved = true
             ORDER BY r.created_at DESC`,
            [req.params.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Yorum ekle
// @route   POST /api/products/:id/reviews
exports.addReview = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { rating, title, comment } = req.body;
        const productId = req.params.id;

        // Sipariş kontrolü - sadece satın alanlar yorum yapabilir
        const orderCheck = await query(
            `SELECT o.id FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
             LIMIT 1`,
            [req.user.id, productId]
        );

        const isVerifiedPurchase = orderCheck.rows.length > 0;

        const result = await query(
            `INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase, is_approved)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [productId, req.user.id, rating, title || null, comment || null, isVerifiedPurchase, false]
        );

        // Ürün ortalama puanını güncelle
        await query(
            `UPDATE products SET rating_avg = (SELECT AVG(rating) FROM reviews WHERE product_id = $1 AND is_approved = true),
             rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_approved = true)
             WHERE id = $1`,
            [productId]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Yorumunuz onay için gönderildi' });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────
// VARYANT YÖNETİMİ
// ─────────────────────────────────────────

// @desc    Ürünün varyantlarını getir
// @route   GET /api/products/:id/variants
exports.getVariants = async (req, res, next) => {
    try {
        const result = await query(
            'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY color, size',
            [req.params.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Varyant ekle
// @route   POST /api/products/:id/variants
exports.createVariant = async (req, res, next) => {
    try {
        const { size, color, color_hex, stock_quantity, sku } = req.body;
        if (!size || !color) {
            return res.status(400).json({ success: false, message: 'Beden ve renk zorunludur' });
        }
        const result = await query(
            `INSERT INTO product_variants (product_id, size, color, color_hex, stock_quantity, sku)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.params.id, size.trim(), color.trim(), color_hex || null, stock_quantity || 0, sku || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Bu SKU zaten kullanımda' });
        }
        next(error);
    }
};

// @desc    Varyant güncelle
// @route   PUT /api/products/:id/variants/:variantId
exports.updateVariant = async (req, res, next) => {
    try {
        const { size, color, color_hex, stock_quantity, sku, is_active } = req.body;
        const result = await query(
            `UPDATE product_variants
             SET size = COALESCE($1, size),
                 color = COALESCE($2, color),
                 color_hex = COALESCE($3, color_hex),
                 stock_quantity = COALESCE($4, stock_quantity),
                 sku = COALESCE($5, sku),
                 is_active = COALESCE($6, is_active)
             WHERE id = $7 AND product_id = $8 RETURNING *`,
            [size, color, color_hex, stock_quantity, sku, is_active, req.params.variantId, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Varyant bulunamadı' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Varyant sil
// @route   DELETE /api/products/:id/variants/:variantId
exports.deleteVariant = async (req, res, next) => {
    try {
        await query('DELETE FROM product_variants WHERE id = $1 AND product_id = $2', [req.params.variantId, req.params.id]);
        res.json({ success: true, message: 'Varyant silindi' });
    } catch (error) {
        next(error);
    }
};
