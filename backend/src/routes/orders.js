const express = require('express');
const { createOrder, getOrders, getOrder, updateOrderStatus, cancelOrder, getOrderStats } = require('../controllers/orders');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/stats', protect, adminOnly, getOrderStats);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
