const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload dizinini oluştur
// Not: Vercel serverless ortamında proje dizini salt-okunurdur, yalnızca /tmp yazılabilir
// ve fonksiyon çağrıları arasında KALICI DEĞİLDİR. Üretimde kalıcı görsel depolama için
// Cloudinary, AWS S3 veya Vercel Blob gibi bir servis kullanılması önerilir.
const uploadDir = process.env.UPLOAD_PATH || (process.env.VERCEL ? '/tmp/uploads' : './uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    console.error('Upload dizini oluşturulamadı:', err.message);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.params.folder || 'general';
        const dest = path.join(uploadDir, folder);
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Sadece JPEG, PNG, WEBP ve GIF dosyaları yüklenebilir'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
    }
});

module.exports = upload;
