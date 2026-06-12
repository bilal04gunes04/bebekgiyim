const express = require('express');
const { getPage, getPages } = require('../controllers/pages');

const router = express.Router();

router.get('/', getPages);
router.get('/:slug', getPage);

module.exports = router;
