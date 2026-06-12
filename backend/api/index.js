// Vercel serverless fonksiyon girişi.
// Express uygulamasını doğrudan export ediyoruz; Vercel'in Node.js runtime'ı
// Express app'lerini otomatik olarak serverless fonksiyona dönüştürür.
module.exports = require('../src/app');
