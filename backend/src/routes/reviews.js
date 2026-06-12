const express = require('express');
const { protect } = require('../middleware/auth');
const { getMyReviews } = require('../controllers/reviews');

const router = express.Router();

router.get('/my-reviews', protect, getMyReviews);

module.exports = router;
