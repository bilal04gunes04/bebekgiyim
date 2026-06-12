# Vercel'de Yayınlama Rehberi

Bu proje 2 ayrı parçadan oluşuyor ve Vercel'de **2 ayrı proje** olarak yayınlanması gerekiyor:

- `backend/` → Express API (Vercel Serverless Functions)
- `frontend/` → React (Create React App) sitesi

Ayrıca **PostgreSQL veritabanı** için Vercel'de barındırma yok; ücretsiz [Neon](https://neon.tech) (Postgres) öneriyorum.

---

## 0) Yapılan hazırlıklar (bilgi amaçlı)

- `backend/src/app.js`: Express uygulaması artık `app.listen()` çağırmadan export ediliyor.
- `backend/api/index.js`: Vercel'in çalıştıracağı serverless fonksiyon girişi.
- `backend/vercel.json`: Tüm istekleri `/api/index`'e yönlendirir.
- `backend/src/config/database.js`: `DATABASE_URL` (Neon/Supabase) + SSL desteği eklendi.
- `frontend/vercel.json`: React Router için SPA yönlendirmesi.
- `frontend/src/pages/Home.js` ve `components/layout/Navbar.js`: build hatası veren 2 küçük hata düzeltildi.
- **Önemli not – Görsel yüklemeler:** `multer` ile yapılan dosya yüklemeleri (ürün görselleri vb.) Vercel'in salt-okunur dosya sisteminde **kalıcı olarak saklanamaz**. Şimdilik çalışır ama yüklenen görseller her deploy/yeniden başlatmada silinir. Üretime geçerken Cloudinary, AWS S3 veya Vercel Blob gibi bir servise geçilmesi gerekir. İstersen bunu birlikte sonra ayarlayabiliriz.

---

## 1) Kodu GitHub'a yükle

```bash
cd bebek-cocuk-giyim-ecommerce
git init
git add .
git commit -m "Vercel deploy hazırlığı"
git branch -M main
git remote add origin <SENİN_GITHUB_REPO_URL'İN>
git push -u origin main
```

> Repo'da `frontend/` ve `backend/` aynı repo içinde iki klasör olarak duruyor — bu normal, Vercel'de proje oluştururken "Root Directory" ile hangisini kullanacağını seçeceğiz.

---

## 2) Veritabanını oluştur (Neon - ücretsiz)

1. [neon.tech](https://neon.tech) → "Sign up" (GitHub ile giriş yapabilirsin).
2. Yeni bir proje oluştur (örn: `bebek-giyim-db`).
3. Dashboard'da **Connection string**'i kopyala. Şuna benzer olacak:
   ```
   postgresql://kullanici:sifre@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Neon'un SQL Editor'ünü aç, `database/schema.sql` dosyasının tüm içeriğini yapıştır ve çalıştır. Bu tabloları oluşturacak.

Bu connection string'i bir kenara not al — backend'in `DATABASE_URL` ortam değişkeni olacak.

---

## 3) Backend'i Vercel'de yayınla

1. [vercel.com](https://vercel.com) → **Add New... → Project**
2. GitHub reponu seç.
3. **Root Directory** alanına `backend` yaz/seç.
4. Framework Preset: "Other" (otomatik algılanabilir, Node olarak bırak).
5. **Environment Variables** kısmına şunları ekle:

   | Değişken | Değer |
   |---|---|
   | `DATABASE_URL` | Neon'dan kopyaladığın connection string |
   | `JWT_SECRET` | Uzun, rastgele bir gizli anahtar (örn: `openssl rand -base64 32` ile üret) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | Şimdilik `http://localhost:3000` yaz, frontend deploy olduktan sonra güncelleyeceğiz |
   | `RATE_LIMIT_WINDOW` | `15` |
   | `RATE_LIMIT_MAX` | `100` |

   (İstersen Stripe/SMTP değişkenlerini de ekleyebilirsin, kullanılmıyorsa boş bırakabilirsin.)

6. **Deploy**'a bas. Bitince sana bir URL verecek, örn:
   `https://bebek-giyim-api.vercel.app`

7. Test et: `https://bebek-giyim-api.vercel.app/api/health` adresine git → `{"status":"OK", ...}` görmelisin.

---

## 4) Frontend'i Vercel'de yayınla

1. Tekrar **Add New... → Project**, aynı repoyu seç.
2. **Root Directory** alanına `frontend` yaz/seç.
3. Framework Preset: "Create React App" (otomatik algılanmalı).
4. **Environment Variables**:

   | Değişken | Değer |
   |---|---|
   | `REACT_APP_API_URL` | `https://bebek-giyim-api.vercel.app/api` (3. adımdaki backend URL'in + `/api`) |

5. **Deploy**'a bas. Bitince sana bir URL verecek, örn:
   `https://bebek-giyim.vercel.app`

---

## 5) Backend'e frontend URL'ini tanıt (CORS)

1. Backend projesine geri dön → **Settings → Environment Variables**.
2. `CLIENT_URL` değerini frontend URL'in ile güncelle (örn: `https://bebek-giyim.vercel.app`).
   - Birden fazla domain (örn. www'lı/www'siz) için virgülle ayırarak yazabilirsin: `https://bebek-giyim.vercel.app,https://www.bebek-giyim.com`
3. **Settings → Deployments** üzerinden son deploy'u "Redeploy" et (env değişikliklerinin etkili olması için yeniden deploy gerekir).

---

## 6) İlk admin kullanıcısını oluşturma

Projede otomatik bir "seed" scripti yok. İlk admin kullanıcısını oluşturmak için:

1. Normal kayıt ekranından (`/kayit`) bir kullanıcı oluştur.
2. Neon SQL Editor'de bu kullanıcının rolünü admin yap:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'senin@email.com';
   ```

---

## Özet

- Backend: `backend/` klasörü → ayrı Vercel projesi → `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` ortam değişkenleri
- Frontend: `frontend/` klasörü → ayrı Vercel projesi → `REACT_APP_API_URL` ortam değişkeni
- Veritabanı: Neon (ücretsiz Postgres) + `database/schema.sql`'i çalıştır
- Görsel yüklemeleri kalıcı yapmak için (Cloudinary/S3/Vercel Blob) sonradan eklenmeli

Herhangi bir adımda hata alırsan, Vercel'deki **deployment loglarını** kopyalayıp bana gönder, birlikte çözelim.
