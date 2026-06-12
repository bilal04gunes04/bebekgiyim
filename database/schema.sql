
-- =====================================================
-- BEBEK & ÇOCUK GİYİM E-TİCARET - POSTGRESQL VERİTABANI
-- =====================================================

-- Kullanıcılar (Müşteriler + Admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kullanıcı Adresleri
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL, -- 'Ev', 'İş', vb.
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100),
    address_line TEXT NOT NULL,
    postal_code VARCHAR(10),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ana Kategoriler
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alt Kategoriler / Özellikler
CREATE TABLE IF NOT EXISTS subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    UNIQUE(category_id, slug)
);

-- Markalar
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ürünler
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    base_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    cost_price DECIMAL(10,2), -- Maliyet (admin için)
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    weight_kg DECIMAL(6,2) DEFAULT 0,
    tax_rate DECIMAL(4,2) DEFAULT 18.00,
    stock_quantity INTEGER DEFAULT 0,
    stock_status VARCHAR(20) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'pre_order')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    view_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ürün Varyantları (Beden, Renk)
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(20) NOT NULL, -- '0-3 Ay', '3-6 Ay', '1-2 Yaş', 'S', 'M', 'L'
    color VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7), -- #FF5733
    sku VARCHAR(100) UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    price_adjustment DECIMAL(10,2) DEFAULT 0, -- Farklı beden/renk fiyat farkı
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ürün Görselleri
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ürün Etiketleri
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS product_tags (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

-- Sepet
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- Misafir kullanıcılar için
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, variant_id)
);

-- Siparişler
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    notes TEXT,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sipariş Ürünleri
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL, -- Sipariş anındaki isim
    variant_info JSONB, -- {size: '1-2 Yaş', color: 'Mavi'}
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sipariş Durum Geçmişi
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    note TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndirim Kuponları
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
    value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kullanılan Kuponlar
CREATE TABLE IF NOT EXISTS coupon_usages (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İncelemeler / Yorumlar
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(200),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Favoriler
CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Bülten Abonelikleri
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slider / Banner
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    subtitle VARCHAR(500),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    position VARCHAR(50) DEFAULT 'home_main' CHECK (position IN ('home_main', 'home_secondary', 'category_page', 'product_page')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sayfalar (Hakkımızda, İletişim, vb.)
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sistem Ayarları
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÖRNEK VERİLER
-- =====================================================

-- Admin kullanıcısı (şifre: admin123 - bcrypt hash)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@bebekgiyim.com', '$2b$10$YourHashedPasswordHere', 'Admin', 'User', 'admin');

-- Kategoriler
INSERT INTO categories (name, slug, description, parent_id, image_url, sort_order) VALUES
('Bebek Giyim', 'bebek-giyim', '0-24 ay bebek giyim ürünleri', NULL, '/images/categories/bebek.jpg', 1),
('Kız Çocuk', 'kiz-cocuk', '2-12 yaş kız çocuk giyim', NULL, '/images/categories/kiz.jpg', 2),
('Erkek Çocuk', 'erkek-cocuk', '2-12 yaş erkek çocuk giyim', NULL, '/images/categories/erkek.jpg', 3),
('Aksesuar', 'aksesuar', 'Şapka, çorap, önlük ve daha fazlası', NULL, '/images/categories/aksesuar.jpg', 4),
('Zıbın & Body', 'zibin-body', 'Bebekler için zıbın ve body modelleri', 1, '/images/categories/zibin.jpg', 1),
('Tulum & Salopet', 'tulum-salopet', 'Pratik tulum ve salopetler', 1, '/images/categories/tulum.jpg', 2),
('Elbise', 'elbise', 'Kız çocuk elbiseleri', 2, '/images/categories/elbise.jpg', 1),
('T-Shirt & Gömlek', 'tshirt-gomlek-erkek', 'Erkek çocuk üst giyim', 3, '/images/categories/tshirt.jpg', 1),
('Pantolon & Şort', 'pantolon-sort', 'Alt giyim ürünleri', 3, '/images/categories/pantolon.jpg', 2);

-- Markalar
INSERT INTO brands (name, slug, description) VALUES
('Civil', 'civil', 'Türkiye'nin önde gelen bebek giyim markası'),
('Kanz', 'kanz', 'Kaliteli ve şık çocuk giyim'),
('Mamas & Papas', 'mamas-papas', 'İngiliz bebek giyim markası'),
('Panço', 'panco', 'Yerli üretim çocuk giyim'),
('LC Waikiki Kids', 'lc-waikiki-kids', 'Uygun fiyatlı çocuk giyim'),
('Defacto Kids', 'defacto-kids', 'Trend çocuk giyim koleksiyonu');

-- Etiketler
INSERT INTO tags (name, slug) VALUES
('Yeni Sezon', 'yeni-sezon'),
('İndirim', 'indirim'),
('Organik Pamuk', 'organik-pamuk'),
('Yenidoğan', 'yeni-dogan'),
('Okula Dönüş', 'okula-donus'),
('Yaz Koleksiyonu', 'yaz-koleksiyonu'),
('Kış Koleksiyonu', 'kış-koleksiyonu');

-- Sayfalar
INSERT INTO pages (title, slug, content, meta_title, meta_description) VALUES
('Hakkımızda', 'hakkimizda', '<p>2010 yılından beri bebek ve çocuk giyim sektöründe hizmet vermekteyiz...</p>', 'Hakkımızda | Bebek Giyim', 'Bebek ve çocuk giyim mağazamız hakkında bilgi edinin.'),
('İletişim', 'iletisim', '<p>Bize ulaşmak için...</p>', 'İletişim | Bebek Giyim', 'Bizimle iletişime geçin.'),
('Gizlilik Politikası', 'gizlilik-politikasi', '<p>Kişisel verilerinizin korunması...</p>', 'Gizlilik Politikası', 'Gizlilik politikamızı okuyun.'),
('Kargo ve İade', 'kargo-ve-iade', '<p>Kargo süreleri ve iade koşulları...</p>', 'Kargo ve İade', 'Kargo ve iade koşullarımız.');

-- Sistem Ayarları
INSERT INTO settings (key, value, type, description) VALUES
('site_name', 'MiniModa - Bebek & Çocuk Giyim', 'string', 'Site adı'),
('site_logo', '/images/logo.png', 'string', 'Site logosu'),
('contact_email', 'info@minimoda.com.tr', 'string', 'İletişim e-posta'),
('contact_phone', '0850 123 45 67', 'string', 'İletişim telefon'),
('currency', 'TRY', 'string', 'Para birimi'),
('tax_rate', '18', 'number', 'Varsayılan KDV oranı'),
('free_shipping_threshold', '250', 'number', 'Ücretsiz kargo limiti'),
('shipping_cost', '29.90', 'number', 'Standart kargo ücreti'),
('items_per_page', '24', 'number', 'Sayfa başına ürün sayısı'),
('maintenance_mode', 'false', 'boolean', 'Bakım modu');

-- =====================================================
-- İNDEKSLER
-- =====================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_images_product ON product_images(product_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_session ON cart_items(session_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_wishlist_user ON wishlists(user_id);
CREATE INDEX idx_products_price ON products(base_price);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- =====================================================
-- FONKSİYONLAR
-- =====================================================

-- Ürün stok güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET stock_quantity = (
        SELECT COALESCE(SUM(stock_quantity), 0) 
        FROM product_variants 
        WHERE product_id = NEW.product_id
    ),
    stock_status = CASE 
        WHEN (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE product_id = NEW.product_id) > 0 
        THEN 'in_stock' 
        ELSE 'out_of_stock' 
    END
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_product_stock
AFTER INSERT OR UPDATE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

-- Sipariş numarası oluşturma
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();
