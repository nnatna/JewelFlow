import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Jewelry display photos pool for items without uploaded pictures
const jewelryImages = [
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1611591475880-994bb0fd6300?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80'
];

export const apiService = {
  // Check backend connection status
  checkHealth: async () => {
    try {
      await client.get('/categories');
      return true;
    } catch {
      return false;
    }
  },

  // 1. Products
  getProducts: async () => {
    try {
      const res = await client.get('/products');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map((p, idx) => ({
        id: p.id,
        code_sku: p.code_sku,
        barcode: p.barcode || `893000${p.id}`,
        name: p.name,
        category_id: p.category_id,
        metal_type_id: p.metal_type_id,
        category: p.category,
        metal_type: p.metal_type || p.metalType,
        net_weight: parseFloat(p.net_weight) || 5.0,
        gross_weight: parseFloat(p.gross_weight) || 5.5,
        labor_cost: parseFloat(p.labor_cost) || 120.0,
        markup_rate: parseFloat(p.markup_rate) || 15.0,
        stock_qty: parseInt(p.stock_qty, 10) || 0,
        status: p.status || 'active',
        image: (p.image?.path && p.image.path.startsWith('http')) ? p.image.path : jewelryImages[idx % jewelryImages.length],
        gemstones: p.product_gemstones || [],
        description: p.category?.description || 'Exquisite fine jewelry crafted with authentic hallmarked bullion.'
      }));
    } catch (e) {
      console.error('API getProducts error:', e);
      return [];
    }
  },

  addProduct: async (productData) => {
    try {
      const res = await client.post('/products', productData);
      return res.data;
    } catch (e) {
      console.error('Backend addProduct failed:', e.message);
      throw e;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const res = await client.put(`/products/${id}`, productData);
      return res.data;
    } catch (e) {
      console.error('Backend updateProduct failed:', e.message);
      throw e;
    }
  },

  deleteProduct: async (id) => {
    try {
      await client.delete(`/products/${id}`);
      return true;
    } catch (e) {
      console.error('Backend deleteProduct failed:', e.message);
      return false;
    }
  },

  // 2. Gold Rates
  getGoldRates: async () => {
    try {
      const res = await client.get('/gold-rates');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(r => ({
        id: r.id,
        metal_type_id: r.metal_type_id,
        name: r.metal_type?.name || `Metal #${r.metal_type_id}`,
        rate_per_gram: parseFloat(r.sell_rate) || 85.50,
        buy_rate_per_gram: parseFloat(r.buy_rate) || 80.00,
        change_24h: 1.15,
        effective_date: r.effective_date ? r.effective_date.split('T')[0] : 'Today'
      }));
    } catch (e) {
      console.error('API getGoldRates error:', e);
      return [];
    }
  },

  updateGoldRate: async (id, sellRate, buyRate) => {
    try {
      const res = await client.put(`/gold-rates/${id}`, {
        sell_rate: sellRate,
        buy_rate: buyRate,
        effective_date: new Date().toISOString().split('T')[0]
      });
      return res.data;
    } catch (e) {
      console.error('Backend updateGoldRate failed:', e.message);
      return null;
    }
  },

  // 3. Categories
  getCategories: async () => {
    try {
      const res = await client.get('/categories');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getCategories error:', e);
      return [];
    }
  },

  // 4. Metal Types
  getMetalTypes: async () => {
    try {
      const res = await client.get('/metal-types');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getMetalTypes error:', e);
      return [];
    }
  },

  // 5. Gemstones
  getGemstones: async () => {
    try {
      const res = await client.get('/gemstones');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(g => ({
        id: g.id,
        code: `GEM-${String(g.id).padStart(3, '0')}`,
        name: g.name,
        type: g.name.split(' ')[0] || 'Precious Stone',
        cut: g.shape || 'Brilliant Cut',
        clarity: g.clarity || 'VVS1',
        color: g.color || 'D (Colorless)',
        carat_weight: parseFloat(g.carat_weight) || 1.0,
        price_per_carat: parseFloat(g.cost_price) || 2500,
        stock_qty: 8
      }));
    } catch (e) {
      console.error('API getGemstones error:', e);
      return [];
    }
  },

  // 6. Customers
  getCustomers: async () => {
    try {
      const res = await client.get('/customers');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(c => {
        const pts = c.loyalty_points || 50;
        let tier = 'Standard';
        let discount = 0;
        if (pts >= 150) { tier = 'Diamond VIP'; discount = 5.0; }
        else if (pts >= 100) { tier = 'Platinum'; discount = 3.0; }
        else if (pts >= 50) { tier = 'Gold'; discount = 2.0; }

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email || 'client@luxury.com',
          address: c.address || 'Beverly Hills, CA',
          loyalty_points: pts,
          tier,
          discount_rate: discount,
          total_spent: pts * 120
        };
      });
    } catch (e) {
      console.error('API getCustomers error:', e);
      return [];
    }
  },

  addCustomer: async (customerData) => {
    try {
      const res = await client.post('/customers', customerData);
      return res.data;
    } catch (e) {
      console.error('Backend addCustomer failed:', e.message);
      throw e;
    }
  },

  // 7. Sales & POS
  getSales: async () => {
    try {
      const res = await client.get('/sales');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(s => ({
        id: s.id,
        invoice_no: s.invoice_no,
        customer_name: s.customer?.name || 'Walk-in Guest',
        customer_phone: s.customer?.phone || 'N/A',
        user_name: s.user?.name || 'Alexander Cross (Store Manager)',
        sale_date: s.sale_date ? s.sale_date.split('T')[0] : 'Today',
        items: (s.sale_items || []).map(item => ({
          product_name: `Jewelry Item #${item.product_id}`,
          code_sku: `SKU-${item.product_id}`,
          qty: item.qty || 1,
          weight_g: item.weight_sold || 5.0,
          unit_price: parseFloat(item.unit_price) || 1200,
          total: parseFloat(item.subtotal) || 1200
        })),
        total_amount: parseFloat(s.total_amount) || 1200,
        discount: parseFloat(s.discount) || 0,
        tax: parseFloat(s.tax) || 0,
        grand_total: parseFloat(s.grand_total) || 1200,
        payment_method: 'Credit Card',
        payment_status: 'Paid'
      }));
    } catch (e) {
      console.error('API getSales error:', e);
      return [];
    }
  },

  createSale: async (saleData) => {
    try {
      const res = await client.post('/sales', saleData);
      return res.data;
    } catch (e) {
      console.error('Backend createSale failed:', e.message);
      throw e;
    }
  },

  // 8. Buybacks
  getBuybacks: async () => {
    try {
      const res = await client.get('/buybacks');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(b => ({
        id: b.id,
        buyback_no: `BB-2026-${String(b.id).padStart(4, '0')}`,
        customer_name: b.customer?.name || 'Walk-in Customer',
        customer_phone: b.customer?.phone || 'N/A',
        buyback_date: b.buyback_date ? b.buyback_date.split('T')[0] : 'Today',
        metal_name: b.metal_type?.name || '24K Gold',
        gross_weight: parseFloat(b.weight) || 10.0,
        net_weight: parseFloat(b.weight) * 0.98,
        buy_rate_per_gram: parseFloat(b.buyback_rate) || 80.0,
        total_amount: parseFloat(b.total_refund) || 750.0,
        payment_method: 'Cash',
        status: 'Approved & Paid',
        notes: 'Assayed and verified by boutique jeweler.'
      }));
    } catch (e) {
      console.error('API getBuybacks error:', e);
      return [];
    }
  },

  createBuyback: async (buybackData) => {
    try {
      const res = await client.post('/buybacks', buybackData);
      return res.data;
    } catch (e) {
      console.error('Backend createBuyback failed:', e.message);
      throw e;
    }
  },

  // 9. Suppliers
  getSuppliers: async () => {
    try {
      const res = await client.get('/suppliers');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(s => ({
        id: s.id,
        name: s.company_name || s.name,
        contact: s.contact_name || 'Vendor Rep',
        phone: s.phone || '+41 22 555 0199',
        email: 'supply@refinery.com',
        specialty: 'Fine Bullion & Refined Alloys'
      }));
    } catch (e) {
      console.error('API getSuppliers error:', e);
      return [];
    }
  },

  // 10. Live Gold Price & Cambodian Measurements API
  getSpotPrice: async (symbol = 'XAU', currency = 'USD', forceFresh = false) => {
    try {
      const res = await client.get('/gold-price/spot', { params: { symbol, currency, force_fresh: forceFresh } });
      return res.data;
    } catch (e) {
      console.error('API getSpotPrice error:', e);
      return null;
    }
  },

  getCambodianGold: async (purity = '24k', khrRate = 4100) => {
    try {
      const res = await client.get('/gold-price/cambodia', { params: { purity, khr_rate: khrRate } });
      return res.data?.data || null;
    } catch (e) {
      console.error('API getCambodianGold error:', e);
      return null;
    }
  },

  convertGold: async (payload) => {
    try {
      const res = await client.post('/gold-price/convert', payload);
      return res.data;
    } catch (e) {
      console.error('API convertGold error:', e);
      throw e;
    }
  },

  calculateValuation: async (payload) => {
    try {
      const res = await client.post('/gold-price/valuation', payload);
      return res.data?.valuation || null;
    } catch (e) {
      console.error('API calculateValuation error:', e);
      throw e;
    }
  },
};

export default apiService;
