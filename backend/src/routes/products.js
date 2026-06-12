const express = require('express');
const { body } = require('express-validator');
const {
    getProducts,
    getProduct,
    getFeaturedProducts,
    getNewArrivals,
    getProductsByCategory,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductReviews,
    addReview
} = require('../controllers/products');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/search', searchProducts);
router.get('/category/:slug', getProductsByCategory);
router.get('/:slug', getProduct);
router.get('/:id/reviews', getProductReviews);

// Protected routes
router.post('/:id/reviews', protect, [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Puan 1-5 arası olmalıdır'),
    body('comment').optional().trim().isLength({ min: 10 }).withMessage('Yorum en az 10 karakter olmalıdır')
], addReview);

// Admin routes
router.post('/', protect, adminOnly, upload.array('images', 10), createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 10), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
