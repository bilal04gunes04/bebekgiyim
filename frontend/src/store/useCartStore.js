import { create } from 'zustand';
import api from '../utils/api';

export const useCartStore = create((set, get) => ({
  items: [],
  summary: {
    subtotal: 0,
    shippingCost: 0,
    discountAmount: 0,
    total: 0,
    itemCount: 0,
  },
  coupon: null,
  isLoading: false,

  fetchCart: async () => {
    try {
      const response = await api.get('/cart');
      const summary = response.data.data.summary || get().summary;
      const coupon = get().coupon;

      // Eğer kupon uygulanmışsa, yeni alt toplam üzerinden tekrar hesapla
      if (coupon) {
        const discount = parseFloat(coupon.discountAmount) || 0;
        summary.discountAmount = discount;
        summary.total = Math.max(0, parseFloat(summary.subtotal) + parseFloat(summary.shippingCost) - discount);
      }

      set({
        items: response.data.data.items || [],
        summary,
      });
    } catch (error) {
      console.error('Sepet yüklenemedi:', error);
    }
  },

  addToCart: async (productId, variantId, quantity = 1) => {
    set({ isLoading: true });
    try {
      await api.post('/cart', { productId, variantId, quantity });
      await get().fetchCart();
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data?.message };
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      await api.put(`/cart/${itemId}`, { quantity });
      await get().fetchCart();
    } catch (error) {
      console.error('Miktar güncellenemedi:', error);
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}`);
      await get().fetchCart();
    } catch (error) {
      console.error('Ürün çıkarılamadı:', error);
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
      set({ items: [], summary: { subtotal: 0, shippingCost: 0, discountAmount: 0, total: 0, itemCount: 0 }, coupon: null });
    } catch (error) {
      console.error('Sepet temizlenemedi:', error);
    }
  },

  applyCoupon: async (code) => {
    try {
      const response = await api.post('/cart/coupon', { code });
      const coupon = response.data.coupon;
      set({ coupon });
      await get().fetchCart();
      return { success: true, coupon };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  removeCoupon: () => {
    set({ coupon: null });
    get().fetchCart();
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
