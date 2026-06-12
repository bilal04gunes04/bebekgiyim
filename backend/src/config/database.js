const { Pool } = require('pg');
require('dotenv').config();

// Vercel + Neon/Supabase gibi servisler için DATABASE_URL (bağlantı string'i)
// destekleniyor. Yoksa eski DB_HOST/DB_PORT/... değişkenleri kullanılır (local geliştirme).
const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool({
    ...connectionConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Beklenmedik veritabanı hatası:', err);
});

const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV === 'development') {
            console.log('Query:', { text: text.substring(0, 50) + '...', duration: duration + 'ms', rows: result.rowCount });
        }
        return result;
    } catch (error) {
        console.error('Veritabanı sorgu hatası:', error);
        throw error;
    }
};

module.exports = { pool, query };
