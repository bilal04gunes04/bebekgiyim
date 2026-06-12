const express = require('express');
const { getBanners } = require('../controllers/banners');

const router = express.Router();

router.get('/', getBanners);

module.exports = router;
