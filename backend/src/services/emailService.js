/**
 * E-posta Servisi — Resend API
 * Resend SDK yerine doğrudan HTTP API kullanıyoruz (ekstra paket gerektirmez).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const SITE_NAME = process.env.SITE_NAME || 'MiniModa';
const SITE_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Resend API ile e-posta gönder
 */
async function sendEmail({ to, subject, html }) {
    if (!RESEND_API_KEY) {
        console.warn('[EmailService] RESEND_API_KEY tanımlı değil, e-posta gönderilmedi.');
        return;
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `${SITE_NAME} <${FROM_EMAIL}>`,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('[EmailService] Gönderim hatası:', error);
        throw new Error(`Resend hatası: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log(`[EmailService] E-posta gönderildi → ${to} (id: ${data.id})`);
    return data;
}

/* ─────────────────────────────────────────
   Şablon: Sipariş Onayı
───────────────────────────────────────── */
function buildOrderConfirmationHtml({ order, items, user }) {
    const itemRows = items.map(item => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #f0f0f0">${item.product_name} ${item.variant_name ? `(${item.variant_name})` : ''}</td>
            <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right">${parseFloat(item.unit_price).toFixed(2)} TL</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="UTF-8"></head>
    <body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <!-- Header -->
        <div style="background:#e91e8c;padding:28px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">🎉 Siparişiniz Alındı!</h1>
          <p style="color:rgba(255,255,255,.9);margin:8px 0 0">${SITE_NAME}</p>
        </div>

        <!-- Body -->
        <div style="padding:32px">
          <p style="color:#333">Merhaba <strong>${user?.first_name || 'Değerli Müşterimiz'}</strong>,</p>
          <p style="color:#555">Siparişiniz başarıyla alındı. Aşağıda sipariş detaylarınızı bulabilirsiniz.</p>

          <!-- Sipariş No -->
          <div style="background:#fdf2f8;border-left:4px solid #e91e8c;padding:12px 16px;border-radius:4px;margin:20px 0">
            <strong>Sipariş No:</strong> ${order.order_number}<br>
            <strong>Tarih:</strong> ${new Date(order.created_at).toLocaleDateString('tr-TR')}<br>
            <strong>Ödeme:</strong> ${order.payment_method === 'cod' ? 'Kapıda Ödeme' : order.payment_method}
          </div>

          <!-- Ürün Tablosu -->
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:10px 8px;text-align:left;font-size:13px">Ürün</th>
                <th style="padding:10px 8px;text-align:center;font-size:13px">Adet</th>
                <th style="padding:10px 8px;text-align:right;font-size:13px">Fiyat</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <!-- Toplam -->
          <div style="text-align:right;margin-top:12px;padding-top:12px;border-top:2px solid #e91e8c">
            <span style="font-size:18px;font-weight:bold;color:#e91e8c">Toplam: ${parseFloat(order.total_amount).toFixed(2)} TL</span>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-top:28px">
            <a href="${SITE_URL}/siparisler"
               style="background:#e91e8c;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              Siparişlerimi Görüntüle
            </a>
          </div>

          <p style="color:#888;font-size:13px;margin-top:28px">
            Herhangi bir sorunuz için <a href="mailto:${FROM_EMAIL}" style="color:#e91e8c">${FROM_EMAIL}</a> adresinden bize ulaşabilirsiniz.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center">
          <p style="color:#aaa;font-size:12px;margin:0">© ${new Date().getFullYear()} ${SITE_NAME}. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>`;
}

/* ─────────────────────────────────────────
   Şablon: Şifre Sıfırlama
───────────────────────────────────────── */
function buildPasswordResetHtml({ resetLink }) {
    return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="UTF-8"></head>
    <body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="background:#e91e8c;padding:28px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">🔐 Şifre Sıfırlama</h1>
          <p style="color:rgba(255,255,255,.9);margin:8px 0 0">${SITE_NAME}</p>
        </div>

        <div style="padding:32px">
          <p style="color:#333">Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.</p>
          <p style="color:#888;font-size:13px">Bu bağlantı <strong>1 saat</strong> geçerlidir. Eğer bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>

          <div style="text-align:center;margin:32px 0">
            <a href="${resetLink}"
               style="background:#e91e8c;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:16px">
              Şifremi Sıfırla
            </a>
          </div>

          <p style="color:#aaa;font-size:12px;word-break:break-all">
            Buton çalışmıyorsa şu bağlantıyı kopyalayın: ${resetLink}
          </p>
        </div>

        <div style="background:#f5f5f5;padding:16px 32px;text-align:center">
          <p style="color:#aaa;font-size:12px;margin:0">© ${new Date().getFullYear()} ${SITE_NAME}. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>`;
}

/* ─────────────────────────────────────────
   Dışa aktarılan fonksiyonlar
───────────────────────────────────────── */

/**
 * Sipariş onayı e-postası gönder
 * @param {string} toEmail - Alıcı e-posta
 * @param {object} order   - Sipariş objesi (order_number, total_amount, payment_method, created_at)
 * @param {Array}  items   - Sipariş kalemleri [{product_name, quantity, unit_price}]
 * @param {object} user    - Kullanıcı objesi (first_name)
 */
async function sendOrderConfirmation(toEmail, order, items, user) {
    try {
        await sendEmail({
            to: toEmail,
            subject: `Siparişiniz Alındı — ${order.order_number} | ${SITE_NAME}`,
            html: buildOrderConfirmationHtml({ order, items, user }),
        });
    } catch (err) {
        // E-posta hatası sipariş akışını engellemesin, sadece logla
        console.error('[EmailService] Sipariş onayı gönderilemedi:', err.message);
    }
}

/**
 * Şifre sıfırlama e-postası gönder
 * @param {string} toEmail    - Alıcı e-posta
 * @param {string} resetToken - Sıfırlama token'ı
 */
async function sendPasswordReset(toEmail, resetToken) {
    const resetLink = `${SITE_URL}/sifre-sifirla?token=${resetToken}`;
    try {
        await sendEmail({
            to: toEmail,
            subject: `Şifre Sıfırlama | ${SITE_NAME}`,
            html: buildPasswordResetHtml({ resetLink }),
        });
    } catch (err) {
        console.error('[EmailService] Şifre sıfırlama e-postası gönderilemedi:', err.message);
    }
}

module.exports = { sendOrderConfirmation, sendPasswordReset };
