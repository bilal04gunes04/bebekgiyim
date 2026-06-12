const express = require('express');
const { validateCoupon } = require('../controllers/coupons');

const router = express.Router();

router.post('/validate', validateCoupon);

module.exports = router;
