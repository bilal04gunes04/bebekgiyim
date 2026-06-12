const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.error('Hata:', err);

    // PostgreSQL unique violation
    if (err.code === '23505') {
        const message = 'Bu kayıt zaten mevcut';
        error = { message, statusCode: 400 };
    }

    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        const message = 'İlişkili kayıt bulunamadı';
        error = { message, statusCode: 400 };
    }

    // JWT hataları
    if (err.name === 'JsonWebTokenError') {
        const message = 'Geçersiz token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token süresi doldu';
        error = { message, statusCode: 401 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Sunucu hatası',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
