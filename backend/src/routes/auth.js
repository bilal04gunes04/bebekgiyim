const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, forgotPassword, resetPassword, changePassword } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
    body('firstName').trim().notEmpty().withMessage('Ad alanı zorunludur'),
    body('lastName').trim().notEmpty().withMessage('Soyad alanı zorunludur'),
    body('phone').optional().isMobilePhone('tr-TR').withMessage('Geçerli bir telefon numarası giriniz')
], register);

router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
    body('password').notEmpty().withMessage('Şifre alanı zorunludur')
], login);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', [body('email').isEmail()], forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);

module.exports = router;
