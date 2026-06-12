const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon } = require('../controllers/cart');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:itemId', protect, updateCartItem);
router.delete('/:itemId', protect, removeFromCart);
router.delete('/', protect, clearCart);
router.post('/coupon', protect, applyCoupon);

module.exports = router;
