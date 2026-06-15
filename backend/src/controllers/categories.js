const { query } = require('../config/database');
const slugify = require('slugify');

// @desc    Tüm kategoriler
// @route   GET /api/categories
exports.getCategories = async (req, res, next) => {
    try {
        const result = await query(
            `WITH RECURSIVE category_tree AS (
                SELECT id, name, slug, description, parent_id, image_url, sort_order, is_active, 0 as level
                FROM categories WHERE parent_id IS NULL AND is_active = true
                UNION ALL
                SELECT c.id, c.name, c.slug, c.description, c.parent_id, c.image_url, c.sort_order, c.is_active, ct.level + 1
                FROM categories c
                JOIN category_tree ct ON c.parent_id = ct.id
                WHERE c.is_active = true
            )
            SELECT * FROM category_tree ORDER BY level, sort_order, name`,
            []
        );

        // Ağaç yapısına dönüştür
        const buildTree = (categories, parentId = null) => {
            return categories
                .filter(c => c.parent_id === parentId)
                .map(c => ({
                    ...c,
                    children: buildTree(categories, c.id)
                }));
        };

        const tree = buildTree(result.rows);

        res.json({ success: true, data: tree });
    } catch (error) {
        next(error);
    }
};

// @desc    Kategori detayı
// @route   GET /api/categories/:slug
exports.getCategory = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT c.*, 
                    json_agg(DISTINCT jsonb_build_object('id', sc.id, 'name', sc.name, 'slug', sc.slug)) FILTER (WHERE sc.id IS NOT NULL) as subcategories
             FROM categories c
             LEFT JOIN categories sc ON sc.parent_id = c.id AND sc.is_active = true
             WHERE c.slug = $1 AND c.is_active = true
             GROUP BY c.id`,
            [req.params.slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Kategori bulunamadı' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Kategori oluştur (Admin)
// @route   POST /api/categories
exports.createCategory = async (req, res, next) => {
    try {
        const { name, description, parentId, sortOrder } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Kategori adı zorunludur' });
        }
        const slug = slugify(name, { lower: true, strict: true });
        const imageUrl = req.file ? `/uploads/categories/${req.file.filename}` : (req.body.imageUrl || null);
        const safeParentId = parentId || null;

        const result = await query(
            'INSERT INTO categories (name, slug, description, parent_id, image_url, sort_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, slug, description || null, safeParentId, imageUrl, sortOrder || 0]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Bu isimde bir kategori zaten mevcut' });
        }
        next(error);
    }
};

// @desc    Kategori güncelle (Admin)
// @route   PUT /api/categories/:id
exports.updateCategory = async (req, res, next) => {
    try {
        const { name, description, parentId, sortOrder, isActive } = req.body;
        const updates = [];
        const values = [];
        let index = 1;

        if (name) { updates.push(`name = $${index++}`); values.push(name); }
        if (description !== undefined) { updates.push(`description = $${index++}`); values.push(description); }
        if (parentId !== undefined) { updates.push(`parent_id = $${index++}`); values.push(parentId || null); }
        if (sortOrder !== undefined) { updates.push(`sort_order = $${index++}`); values.push(sortOrder); }
        if (isActive !== undefined) { updates.push(`is_active = $${index++}`); values.push(isActive); }
        if (req.file) { updates.push(`image_url = $${index++}`); values.push(`/uploads/categories/${req.file.filename}`); }
        else if (req.body.imageUrl !== undefined) { updates.push(`image_url = $${index++}`); values.push(req.body.imageUrl); }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'Güncellenecek alan bulunamadı' });
        }

        values.push(req.params.id);
        const result = await query(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Kategori bulunamadı' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Kategori sil (Admin)
// @route   DELETE /api/categories/:id
exports.deleteCategory = async (req, res, next) => {
    try {
        await query('UPDATE categories SET is_active = false WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Kategori silindi' });
    } catch (error) {
        next(error);
    }
};
