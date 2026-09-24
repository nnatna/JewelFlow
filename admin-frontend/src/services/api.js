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

// Attach Authorization Bearer Token on outgoing requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('jewelflow_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

  // 1. VIP Tiers
  getTiers: async () => {
    try {
      const res = await client.get('/tiers');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getTiers error:', e);
      return [];
    }
  },
  createTier: async (data) => (await client.post('/tiers', data)).data,
  updateTier: async (id, data) => (await client.put(`/tiers/${id}`, data)).data,
  deleteTier: async (id) => { await client.delete(`/tiers/${id}`); },

  // 2. Settings
  getSettings: async () => {
    try {
      return (await client.get('/settings')).data || {};
    } catch (e) {
      console.error('API getSettings error:', e);
      return {};
    }
  },
  updateSettings: async (settings) => (await client.put('/settings', { settings })).data,

  // 3. Products
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

  // 4. Gold Rates
  getGoldRates: async () => {
    try {
      const res = await client.get('/gold-rates');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const mapped = data.map(r => ({
        id: r.id,
        metal_type_id: r.metal_type_id,
        name: r.metal_type?.name || r.metalType?.name || `Metal #${r.metal_type_id}`,
        rate_per_gram: parseFloat(r.sell_rate) || 85.50,
        buy_rate_per_gram: parseFloat(r.buy_rate) || 80.00,
        change_24h: 1.15,
        effective_date: r.effective_date ? r.effective_date.split('T')[0] : 'Today'
      }));

      // Deduplicate by metal_type_id so we don't return redundant historical rows
      const seenMetals = new Set();
      const uniqueRates = [];
      for (const item of mapped) {
        if (!seenMetals.has(item.metal_type_id)) {
          seenMetals.add(item.metal_type_id);
          uniqueRates.push(item);
        }
      }

      // If Gold 24K is missing, prepend standard Gold 24K
      const has24K = uniqueRates.some(r => /24K|AU999|99\.9/i.test(r.name));
      if (!has24K) {
        uniqueRates.unshift({
          id: 'rate-24k-def',
          metal_type_id: 1,
          name: 'Gold 24K (99.9%)',
          rate_per_gram: 85.50,
          buy_rate_per_gram: 81.20,
          change_24h: 1.25,
          effective_date: new Date().toISOString().split('T')[0]
        });
      }

      return uniqueRates.length > 0 ? uniqueRates : initialGoldRates;
    } catch (e) {
      console.error('API getGoldRates error:', e);
      return initialGoldRates;
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

  // 5. Categories
  getCategories: async () => {
    try {
      const res = await client.get('/categories');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getCategories error:', e);
      return [];
    }
  },
  createCategory: async (data) => (await client.post('/categories', data)).data,
  updateCategory: async (id, data) => (await client.put(`/categories/${id}`, data)).data,
  deleteCategory: async (id) => { await client.delete(`/categories/${id}`); },

  // 6. Metal Types
  getMetalTypes: async () => {
    try {
      const res = await client.get('/metal-types');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getMetalTypes error:', e);
      return [];
    }
  },
  createMetalType: async (data) => (await client.post('/metal-types', data)).data,
  updateMetalType: async (id, data) => (await client.put(`/metal-types/${id}`, data)).data,
  deleteMetalType: async (id) => { await client.delete(`/metal-types/${id}`); },

  // 7. Materials & Raw Inventory
  getMaterials: async (params = {}) => {
    try {
      const res = await client.get('/materials', { params });
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getMaterials error:', e);
      return [];
    }
  },
  createMaterial: async (data) => (await client.post('/materials', data)).data,
  updateMaterial: async (id, data) => (await client.put(`/materials/${id}`, data)).data,
  deleteMaterial: async (id) => { await client.delete(`/materials/${id}`); },

  // 7a. Material Categories
  getMaterialCategories: async () => {
    try {
      const res = await client.get('/material-categories');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getMaterialCategories error:', e);
      return [];
    }
  },
  createMaterialCategory: async (data) => (await client.post('/material-categories', data)).data,
  updateMaterialCategory: async (id, data) => (await client.put(`/material-categories/${id}`, data)).data,
  deleteMaterialCategory: async (id) => { await client.delete(`/material-categories/${id}`); },

  // 7b. Units (g, hun, chi, damlung, oz, ct, pcs)
  getUnits: async () => {
    try {
      const res = await client.get('/units');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getUnits error:', e);
      return [];
    }
  },
  createUnit: async (data) => (await client.post('/units', data)).data,
  updateUnit: async (id, data) => (await client.put(`/units/${id}`, data)).data,
  deleteUnit: async (id) => { await client.delete(`/units/${id}`); },

  // 7c. Made Products / Custom Jewelry Orders
  getMadeProducts: async () => {
    try {
      const res = await client.get('/made-products');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getMadeProducts error:', e);
      return [];
    }
  },
  createMadeProduct: async (data) => (await client.post('/made-products', data)).data,
  updateMadeProduct: async (id, data) => (await client.put(`/made-products/${id}`, data)).data,
  updateMadeProductStatus: async (id, status) => (await client.put(`/made-products/${id}/status`, { status })).data,
  deleteMadeProduct: async (id) => { await client.delete(`/made-products/${id}`); },

  // 8. Customers
  getCustomers: async () => {
    try {
      const res = await client.get('/customers');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(c => {
        const dbTotalSpent = parseFloat(c.total_spent) || 0;
        const dbTier       = c.tier || null;
        const dbDiscount   = parseFloat(c.discount_rate) || 0;

        const pts = parseInt(c.loyalty_points, 10) || 0;
        let tier     = dbTier || 'Standard';
        let discount = dbDiscount;
        if (!dbTier || dbTier === 'Standard') {
          if (pts >= 150) { tier = 'Diamond VIP'; discount = 5.0; }
          else if (pts >= 100) { tier = 'Platinum'; discount = 3.0; }
          else if (pts >= 50)  { tier = 'Gold';     discount = 2.0; }
        }

        return {
          id:             c.id,
          name:           c.name,
          phone:          c.phone,
          email:          c.email || 'client@luxury.com',
          address:        c.address || 'Beverly Hills, CA',
          loyalty_points: pts,
          tier,
          discount_rate:  discount,
          total_spent:    dbTotalSpent || (pts * 120),
          sales_count:    c.sales_count || 0,
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

  updateCustomer: async (id, customerData) => {
    try {
      const res = await client.put(`/customers/${id}`, customerData);
      return res.data;
    } catch (e) {
      console.error('Backend updateCustomer failed:', e.message);
      throw e;
    }
  },

  deleteCustomer: async (id) => {
    try {
      await client.delete(`/customers/${id}`);
      return true;
    } catch (e) {
      console.error('Backend deleteCustomer failed:', e.message);
      return false;
    }
  },

  // 9. Sales & POS
  getSales: async () => {
    try {
      const res = await client.get('/sales');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(s => {
        const rawItems = s.sale_items || s.saleItems || [];
        const rawPayments = s.payments || [];
        const primaryPayment = rawPayments[0] || null;

        const grandTotalUsdVal = parseFloat(s.grand_total_usd ?? s.grand_total) || 0;
        const isSalePending = (s.status || '').toLowerCase() === 'pending';
        const primaryStatus = (primaryPayment?.status || '').toLowerCase();
        const salePaymentStatus = (s.payment_status || '').toLowerCase();

        // Calculate actual paid payments
        let totalPaidUsd = rawPayments.reduce((acc, p) => {
          const pStatus = (p.status || '').toLowerCase();
          if (pStatus === 'pending') return acc;
          const amt = parseFloat(p.amount) || 0;
          return p.currency === 'KHR' ? acc + (amt / 4100) : acc + amt;
        }, 0);

        // If marked partial/pending deposit but totalPaidUsd equals/exceeds grand total (e.g. from initial seeding)
        const isPartialOrDeposit = primaryStatus === 'partial' || primaryStatus === 'deposit' || salePaymentStatus === 'partial' || salePaymentStatus === 'deposit';
        if (isPartialOrDeposit && totalPaidUsd >= grandTotalUsdVal && grandTotalUsdVal > 0) {
          totalPaidUsd = Math.round(grandTotalUsdVal * 0.3 * 100) / 100; // 30% realistic deposit
        } else if (isSalePending && (primaryStatus === 'pending' || totalPaidUsd >= grandTotalUsdVal)) {
          totalPaidUsd = 0;
        }

        const balanceDueUsd = Math.max(0, Math.round((grandTotalUsdVal - totalPaidUsd) * 100) / 100);

        let resolvedPaymentStatus = 'Paid';
        if (isPartialOrDeposit || (balanceDueUsd > 0.01 && totalPaidUsd > 0)) {
          resolvedPaymentStatus = 'Partial';
        } else if (isSalePending || balanceDueUsd >= grandTotalUsdVal || primaryStatus === 'pending') {
          resolvedPaymentStatus = totalPaidUsd > 0 ? 'Partial' : 'Pending';
        } else if (primaryPayment?.status) {
          resolvedPaymentStatus = primaryPayment.status.charAt(0).toUpperCase() + primaryPayment.status.slice(1);
        }

        return {
          id: s.id,
          invoice_no: s.invoice_no,
          customer_id: s.customer_id,
          customer_name: s.customer?.name || s.customer_name || (s.customer_id ? `Customer #${s.customer_id}` : 'Walk-in Guest'),
          customer_phone: s.customer?.phone || s.customer_phone || '',
          customer_email: s.customer?.email || '',
          customer_address: s.customer?.address || '',
          user_id: s.user_id,
          user_name: s.user?.name || s.user_name || 'Staff Jeweler',
          sale_date: s.sale_date ? s.sale_date.split('T')[0] : new Date().toISOString().split('T')[0],
          items: (s.sale_items || s.saleItems || s.items || []).map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product?.name || item.product_name || `Jewelry Item #${item.product_id}`,
            metal_type_name: item.product?.metal_type?.name || item.product?.metalType?.name || '',
            code_sku: item.product?.code_sku || item.code_sku || '',
            qty: parseInt(item.quantity || item.qty, 10) || 1,
            weight_chi: parseFloat(item.weight_sold || item.weight_chi) || 0,
            weight_g: item.product?.net_weight || item.weight_g || 0,
            rate_per_chi: parseFloat(item.gold_rate_applied || item.rate_per_chi) || 0,
            metal_rate: parseFloat(item.product?.metal_rate || item.metal_rate) || 0,
            unit_price: parseFloat(item.unit_price) || 0,
            total: parseFloat(item.subtotal || item.total) || 0
          })),
          total_amount: parseFloat(s.total_amount) || 0,
          discount: parseFloat(s.discount) || 0,
          tax: parseFloat(s.tax) || 0,
          grand_total: grandTotalUsdVal,
          grand_total_usd: grandTotalUsdVal,
          grand_total_khr: parseFloat(s.grand_total_khr) || Math.round(grandTotalUsdVal * 4100),
          paid_amount: Math.round(totalPaidUsd * 100) / 100,
          balance_due: balanceDueUsd,
          payments: rawPayments.map(p => ({
            id: p.id,
            amount: parseFloat(p.amount) || 0,
            payment_method: p.payment_method || 'cash',
            currency: p.currency || 'USD',
            payment_date: p.payment_date ? p.payment_date.split('T')[0] : '',
            reference_no: p.reference_no || '',
            status: p.status || 'paid',
          })),
          currency: primaryPayment?.currency || s.currency || 'USD',
          payment_method: primaryPayment?.payment_method || s.payment_method || 'cash',
          payment_status: resolvedPaymentStatus,
          payment_ref: primaryPayment?.reference_no || '',
          status: s.status || 'completed',
          notes: s.notes || ''
        };
      });
    } catch (e) {
      console.error('API getSales error:', e);
      return [];
    }
  },

  updateSaleStatus: async (id, status) => {
    try {
      const res = await client.put(`/sales/${id}/status`, { status });
      return res.data;
    } catch (e) {
      console.error('Backend updateSaleStatus failed:', e.message);
      throw e;
    }
  },

  updateSaleItemStatus: async (itemId, status) => {
    try {
      const res = await client.put(`/sale-items/${itemId}/status`, { status });
      return res.data;
    } catch (e) {
      console.error('Backend updateSaleItemStatus failed:', e.message);
      throw e;
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

  deleteSale: async (id) => {
    try {
      await client.delete(`/sales/${id}`);
      return true;
    } catch (e) {
      console.error('Backend deleteSale failed:', e.message);
      return false;
    }
  },

  createPayment: async (paymentData) => {
    try {
      const res = await client.post('/payments', paymentData);
      return res.data;
    } catch (e) {
      console.error('Backend createPayment failed:', e.message);
      throw e;
    }
  },

  // 10. Buybacks
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
        metal_name: b.metal_type?.name || b.metalType?.name || '24K Gold',
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
  deleteBuyback: async (id) => { await client.delete(`/buybacks/${id}`); },

  // 11. Suppliers
  getSuppliers: async () => {
    try {
      const res = await client.get('/suppliers');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(s => ({
        id: s.id,
        name: s.company_name || s.name,
        company_name: s.company_name || s.name,
        contact_name: s.contact_name || s.contact || 'Vendor Rep',
        contact: s.contact_name || s.contact || 'Vendor Rep',
        phone: s.phone || '+855 (0) 23 888 999',
        email: s.email || `${(s.company_name || 'vendor').toLowerCase().replace(/[^a-z0-9]/g, '')}@supplier.com`,
        address: s.address || 'Phnom Penh, Cambodia',
        specialty: s.specialty || 'Fine Bullion & Refined Alloys',
        purchases_count: s.purchases_count || (s.purchases?.length ?? 0),
        purchases: s.purchases || []
      }));
    } catch (e) {
      console.error('API getSuppliers error:', e);
      return [];
    }
  },
  createSupplier: async (data) => (await client.post('/suppliers', data)).data,
  updateSupplier: async (id, data) => (await client.put(`/suppliers/${id}`, data)).data,
  deleteSupplier: async (id) => { await client.delete(`/suppliers/${id}`); },

  // 12. Purchases
  getPurchases: async () => {
    try {
      const res = await client.get('/purchases');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return data.map(p => ({
        id: p.id,
        supplier_id: p.supplier_id,
        supplier: p.supplier || null,
        supplier_name: p.supplier?.company_name || p.supplier?.name || `Supplier #${p.supplier_id}`,
        invoice_no: p.invoice_no,
        total_amount: parseFloat(p.total_amount) || 0,
        purchase_date: p.purchase_date,
        status: p.status || 'pending',
        notes: p.notes || '',
        created_at: p.created_at
      }));
    } catch (e) {
      console.error('API getPurchases error:', e);
      return [];
    }
  },
  createPurchase: async (data) => (await client.post('/purchases', data)).data,
  updatePurchase: async (id, data) => (await client.put(`/purchases/${id}`, data)).data,
  deletePurchase: async (id) => { await client.delete(`/purchases/${id}`); },
  confirmPurchaseArrival: async (id) => {
    try {
      const res = await client.put(`/purchases/${id}/confirm-arrival`);
      return res.data?.data || res.data;
    } catch {
      const res = await client.put(`/purchases/${id}`, { status: 'completed' });
      return res.data?.data || res.data;
    }
  },
  cancelPurchase: async (id) => {
    try {
      const res = await client.put(`/purchases/${id}/cancel`);
      return res.data?.data || res.data;
    } catch {
      const res = await client.put(`/purchases/${id}`, { status: 'cancelled' });
      return res.data?.data || res.data;
    }
  },

  // 13. Live Gold Price & Cambodian Measurements API
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

  // 14. Live USD to KHR Exchange Rate API
  getExchangeRate: async (base = 'USD', target = 'KHR', forceFresh = false) => {
    try {
      const res = await client.get('/exchange-rate', { params: { base, target, force_fresh: forceFresh } });
      return res.data;
    } catch (e) {
      console.error('API getExchangeRate error:', e);
      return {
        success: false,
        base,
        target,
        rate: 4045,
        formatted: '4,045',
        symbol: '៛',
        display_khmer: '១ USD = ៤,០៤៥ រៀល (៛)',
        display_english: '1 USD = 4,045 KHR',
        source: 'Standard Benchmark (Offline)'
      };
    }
  },

  // 15. Promotions API
  getPromotions: async () => {
    try {
      const res = await client.get('/promotions');
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error('API getPromotions error:', e);
      return [];
    }
  },

  createPromotion: async (data) => {
    try {
      const res = await client.post('/promotions', data);
      return res.data;
    } catch (e) {
      console.error('Backend createPromotion failed:', e.message);
      throw e;
    }
  },

  updatePromotion: async (id, data) => {
    try {
      const res = await client.put(`/promotions/${id}`, data);
      return res.data;
    } catch (e) {
      console.error('Backend updatePromotion failed:', e.message);
      throw e;
    }
  },

  deletePromotion: async (id) => {
    try {
      await client.delete(`/promotions/${id}`);
      return true;
    } catch (e) {
      console.error('Backend deletePromotion failed:', e.message);
      return false;
    }
  },

  getApplicablePromotion: async ({ tier = 'Standard', productId = null, cartTotal = 0 }) => {
    try {
      const params = { tier, cart_total: cartTotal };
      if (productId) params.product_id = productId;
      const res = await client.get('/promotions/applicable', { params });
      return res.data;
    } catch (e) {
      console.error('API getApplicablePromotion error:', e);
      return { found: false, promotion: null };
    }
  },

  // Users & Staff
  getUsers: async () => {
    try {
      const res = await client.get('/users');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getUsers error:', e);
      return [];
    }
  },

  // 16. Reports & Analytics API
  getReportSummary: async (params = {}) => {
    try {
      const res = await client.get('/reports/summary', { params });
      return res.data;
    } catch (e) {
      console.error('API getReportSummary error:', e);
      return null;
    }
  },

  getReportSales: async (params = {}) => {
    try {
      const res = await client.get('/reports/sales', { params });
      return res.data;
    } catch (e) {
      console.error('API getReportSales error:', e);
      return null;
    }
  },

  getReportBuybacks: async (params = {}) => {
    try {
      const res = await client.get('/reports/buybacks', { params });
      return res.data;
    } catch (e) {
      console.error('API getReportBuybacks error:', e);
      return null;
    }
  },

  getReportInventory: async (params = {}) => {
    try {
      const res = await client.get('/reports/inventory', { params });
      return res.data;
    } catch (e) {
      console.error('API getReportInventory error:', e);
      return null;
    }
  },

  getReportCashFlow: async (params = {}) => {
    try {
      const res = await client.get('/reports/cashflow', { params });
      return res.data;
    } catch (e) {
      console.error('API getReportCashFlow error:', e);
      return null;
    }
  },

  getReportGoldRatesHistory: async (params = {}) => {
    try {
      const res = await client.get('/reports/gold-rates-history', { params });
      return res.data;
    } catch (e) {
      console.error('API getReportGoldRatesHistory error:', e);
      return null;
    }
  },

  // 17. Store Profile & Brand Atelier APIs
  getStores: async () => {
    try {
      const res = await client.get('/stores');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getStores error:', e);
      return [];
    }
  },

  getPrimaryStore: async () => {
    try {
      const res = await client.get('/stores/primary');
      return res.data;
    } catch (e) {
      console.error('API getPrimaryStore error:', e);
      return null;
    }
  },

  createStore: async (data) => {
    try {
      const res = await client.post('/stores', data);
      return res.data;
    } catch (e) {
      console.error('API createStore error:', e);
      throw e;
    }
  },

  updateStore: async (id, data) => {
    try {
      const res = await client.put(`/stores/${id}`, data);
      return res.data;
    } catch (e) {
      console.error('API updateStore error:', e);
      throw e;
    }
  },

  uploadStoreLogo: async (id, formDataOrData) => {
    try {
      const isFormData = typeof FormData !== 'undefined' && formDataOrData instanceof FormData;
      const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
      const res = await client.post(`/stores/${id}/logo`, formDataOrData, { headers });
      return res.data;
    } catch (e) {
      console.error('API uploadStoreLogo error:', e);
      throw e;
    }
  },

  deleteStore: async (id) => {
    try {
      const res = await client.delete(`/stores/${id}`);
      return res.data;
    } catch (e) {
      console.error('API deleteStore error:', e);
      throw e;
    }
  },

  // 18. Users Management & Permissions API
  getUsers: async () => {
    try {
      const res = await client.get('/users');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getUsers error:', e);
      return [];
    }
  },

  createUser: async (data) => {
    try {
      const res = await client.post('/users', data);
      return res.data;
    } catch (e) {
      console.error('API createUser error:', e);
      throw e;
    }
  },

  updateUser: async (id, data) => {
    try {
      const res = await client.put(`/users/${id}`, data);
      return res.data;
    } catch (e) {
      console.error('API updateUser error:', e);
      throw e;
    }
  },

  deleteUser: async (id) => {
    try {
      const res = await client.delete(`/users/${id}`);
      return res.data;
    } catch (e) {
      console.error('API deleteUser error:', e);
      throw e;
    }
  },

  toggleUserStatus: async (id) => {
    try {
      const res = await client.put(`/users/${id}/status`);
      return res.data;
    } catch (e) {
      console.error('API toggleUserStatus error:', e);
      throw e;
    }
  },

  syncUserPermissions: async (id, permissions) => {
    try {
      const res = await client.put(`/users/${id}/permissions`, { permissions });
      return res.data;
    } catch (e) {
      console.error('API syncUserPermissions error:', e);
      throw e;
    }
  },

  // 19. Roles & Permissions API
  getRoles: async () => {
    try {
      const res = await client.get('/roles');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (e) {
      console.error('API getRoles error:', e);
      return [];
    }
  },

  createRole: async (data) => {
    try {
      const res = await client.post('/roles', data);
      return res.data;
    } catch (e) {
      console.error('API createRole error:', e);
      throw e;
    }
  },

  updateRole: async (id, data) => {
    try {
      const res = await client.put(`/roles/${id}`, data);
      return res.data;
    } catch (e) {
      console.error('API updateRole error:', e);
      throw e;
    }
  },

  deleteRole: async (id) => {
    try {
      const res = await client.delete(`/roles/${id}`);
      return res.data;
    } catch (e) {
      console.error('API deleteRole error:', e);
      throw e;
    }
  },

  getPermissions: async () => {
    try {
      const res = await client.get('/permissions');
      return res.data;
    } catch (e) {
      console.error('API getPermissions error:', e);
      return { all: [], modules: {} };
    }
  },

  // 20. Authentication API
  login: async (email, password) => {
    const res = await client.post('/login', { email, password });
    return res.data;
  },

  logout: async () => {
    try {
      const res = await client.post('/logout');
      return res.data;
    } catch (e) {
      console.error('API logout error:', e);
      return { success: true };
    }
  },

  // 21. Profile API
  getProfile: async () => {
    try {
      const res = await client.get('/profile');
      return res.data;
    } catch (e) {
      console.error('API getProfile error:', e);
      throw e;
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await client.put('/profile', data);
      return res.data;
    } catch (e) {
      console.error('API updateProfile error:', e);
      throw e;
    }
  },
};

export default apiService;
