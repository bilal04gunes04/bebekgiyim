const express = require('express');
const { getCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/categories');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getCategories);
router.get('/:slug', getCategory);
router.post('/', protect, adminOnly, upload.single('image'), createCategory);
router.put('/:id', protect, adminOnly, upload.single('image'), updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
