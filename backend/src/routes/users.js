const express = require('express');
const { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = require('../controllers/users');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);
router.put('/addresses/:id/default', protect, setDefaultAddress);

module.exports = router;
