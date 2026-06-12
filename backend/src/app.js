const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const bannerRoutes = require('./routes/banners');
const pageRoutes = require('./routes/pages');
const couponRoutes = require('./routes/coupons');
const newsletterRoutes = require('./routes/newsletter');
const wishlistRoutes = require('./routes/wishlist');

const app = express();

// Vercel gibi proxy arkasında çalışırken doğru IP/protokol bilgisi için
app.set('trust proxy', 1);

// Güvenlik middleware'leri
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100,
    message: { success: false, message: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.' }
});
app.use('/api/', limiter);

// CORS - CLIENT_URL içinde virgülle ayrılmış birden fazla origin desteklenir
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // origin olmayan istekler (curl, sağlık kontrolleri vb.) her zaman izinli
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS politikası tarafından engellendi'));
    },
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Statik dosyalar
// Not: Vercel serverless ortamında dosya sistemi salt-okunurdur (sadece /tmp yazılabilir
// ve istekler arası kalıcı değildir). Üretimde kalıcı görsel depolama için
// Cloudinary, AWS S3 veya Vercel Blob gibi bir servis kullanılması önerilir.
app.use('/uploads', express.static(process.env.UPLOAD_PATH || 'uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Sayfa bulunamadı' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
