const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    getDashboardStats,
    getUsers,
    updateUserRole,
    getAllOrders,
    getAllProducts,
    getAllCategories,
    getAllBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    getAllReviews,
    approveReview,
    deleteReview,
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    getSettings,
    updateSettings,
    getAllPages,
    createPage,
    updatePage,
    deletePage,
    getSalesReport,
    getInventoryReport,
    getCustomerReport
} = require('../controllers/admin');

const router = express.Router();

router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Kullanıcılar
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

// Siparişler
router.get('/orders', getAllOrders);

// Ürünler
router.get('/products', getAllProducts);

// Kategoriler
router.get('/categories', getAllCategories);

// Markalar
router.get('/brands', getAllBrands);
router.post('/brands', upload.single('logo'), createBrand);
router.put('/brands/:id', upload.single('logo'), updateBrand);
router.delete('/brands/:id', deleteBrand);

// Yorumlar
router.get('/reviews', getAllReviews);
router.put('/reviews/:id/approve', approveReview);
router.delete('/reviews/:id', deleteReview);

// Kuponlar
router.get('/coupons', getAllCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Bannerlar
router.get('/banners', getAllBanners);
router.post('/banners', upload.single('image'), createBanner);
router.put('/banners/:id', upload.single('image'), updateBanner);
router.delete('/banners/:id', deleteBanner);

// Sayfalar
router.get('/pages', getAllPages);
router.post('/pages', createPage);
router.put('/pages/:id', updatePage);
router.delete('/pages/:id', deletePage);

// Ayarlar
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Raporlar
router.get('/reports/sales', getSalesReport);
router.get('/reports/inventory', getInventoryReport);
router.get('/reports/customers', getCustomerReport);

module.exports = router;
