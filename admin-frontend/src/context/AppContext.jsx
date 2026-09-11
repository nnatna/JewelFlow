import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { initialSales } from '../types/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [goldRates, setGoldRates] = useState([]);
  const [metalTypes, setMetalTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [gemstones, setGemstones] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState(initialSales);
  const [buybacks, setBuybacks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cambodianGold, setCambodianGold] = useState(null);
  const [liveSpot, setLiveSpot] = useState({
    spot_price_per_oz: 0.00,
    spot_price_per_gram: 0.00,
    price_per_chi: 0.00,
    price_per_damlung: 0.00,
    change_24h: 0.00,
    change_percent_24h: 0.00,
  });
  const [exchangeRate, setExchangeRate] = useState({
    rate: 4045,
    formatted: '4,045',
    base: 'USD',
    target: 'KHR',
    symbol: '៛',
    display_khmer: '១ USD = ៤,០៤៥ រៀល (៛)',
    display_english: '1 USD = 4,045 KHR',
    source: 'Live FX',
    last_updated: ''
  });
  const [backendConnected, setBackendConnected] = useState(false);
  
  // POS Cart State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxRate, setTaxRate] = useState(7.5); // 7.5% sales tax default
  
  // Global Search State across entire system
  const [searchQuery, setSearchQuery] = useState('');
  
  // App Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Live API connection established with Laravel backend.', type: 'success', time: 'Just now' },
    { id: 2, text: 'Gold bullion and market spot valuations synced ($0.00/oz).', type: 'info', time: 'Just now' }
  ]);

  // Load live data from Backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const isHealthy = await apiService.checkHealth();
        setBackendConnected(isHealthy);

        const [prods, rates, cats, metals, gems, custs, sls, bbs, sups, camGold, spotData, fxData] = await Promise.all([
          apiService.getProducts(),
          apiService.getGoldRates(),
          apiService.getCategories(),
          apiService.getMetalTypes(),
          apiService.getGemstones(),
          apiService.getCustomers(),
          apiService.getSales(),
          apiService.getBuybacks(),
          apiService.getSuppliers(),
          apiService.getCambodianGold(),
          apiService.getSpotPrice('XAU', 'USD', true),
          apiService.getExchangeRate('USD', 'KHR'),
        ]);

        setProducts(prods);
        setGoldRates(rates);
        setCategories(cats);
        setMetalTypes(metals);
        setGemstones(gems);
        setCustomers(custs);
        setSales(sls && sls.length > 0 ? sls : initialSales);
        setBuybacks(bbs);
        setSuppliers(sups);
        if (camGold) setCambodianGold(camGold);
        if (spotData && spotData.spot_price_per_oz !== undefined) setLiveSpot(spotData);
        if (fxData && fxData.rate) {
          setExchangeRate(fxData);
        } else if (spotData?.exchange_rate?.rate) {
          setExchangeRate(spotData.exchange_rate);
        }
      } catch (e) {
        console.error('API load error:', e);
      }
    };
    fetchData();

    // Auto-sync real-time live gold spot price and exchange rates every 5 minutes (300,000 ms)
    const spotInterval = setInterval(async () => {
      try {
        const [fresh, freshFx] = await Promise.all([
          apiService.getSpotPrice('XAU', 'USD', true),
          apiService.getExchangeRate('USD', 'KHR', true)
        ]);
        if (fresh && fresh.spot_price_per_oz !== undefined) {
          setLiveSpot(prev => (prev?.spot_price_per_oz !== fresh.spot_price_per_oz ? fresh : prev));
        }
        if (freshFx && freshFx.rate) {
          setExchangeRate(freshFx);
        }
      } catch (err) {
        // quiet background fail
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(spotInterval);
  }, []);

  // Notification helper
  const addNotification = (text, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      text,
      type,
      time: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Dynamic Jewelry Price Calculator: Weight in Chi × Rate per Chi + Labor + Gemstones + Markup
  // Base Measurement Unit: 1 Chi = 3.75 grams (គិតខ្នាតជាជី ជាគោល)
  const calculateProductPrice = (product) => {
    if (!product) return 0;
    const rateObj = goldRates.find(r => r.metal_type_id === product.metal_type_id) || goldRates[0];
    const ratePerGram = rateObj ? Number(rateObj.rate_per_gram) : 85.5;
    // Rate per Chi ($/ជី)
    const ratePerChi = rateObj?.rate_per_chi ? Number(rateObj.rate_per_chi) : (ratePerGram * 3.75);

    // Weight in Chi (1 ជី = 3.75g)
    const weightInChi = (Number(product.net_weight) || 0) / 3.75;

    // Metal cost: Weight in Chi × Gold Rate per Chi (គិតតម្លៃតាមទម្ងន់ជី × តម្លៃក្នុង១ជី)
    const metalCost = weightInChi * ratePerChi;
    const labor = Number(product.labor_cost) || 0;
    const gemsCost = (product.gemstones || []).reduce((acc, g) => acc + (Number(g.value) || 0), 0);
    const baseCost = metalCost + labor + gemsCost;
    const markup = 1 + ((Number(product.markup_rate) || 0) / 100);
    return Math.round((baseCost * markup) * 100) / 100;
  };

  // Cart actions
  const addToCart = (product) => {
    const currentPrice = calculateProductPrice(product);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, calculatedPrice: currentPrice, qty: 1 }];
    });
    addNotification(`Added "${product.name}" to POS cart.`, 'success');
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => item.id === productId ? { ...item, qty } : item));
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountPercent(0);
  };

  // Product CRUD
  const addProduct = async (newProduct) => {
    const item = {
      ...newProduct,
      status: 'active',
      gemstones: newProduct.gemstones || []
    };
    await apiService.addProduct(item);
    setProducts(prev => [item, ...prev]);
    addNotification(`New jewelry piece "${item.name}" registered in database.`, 'success');
  };

  const updateProduct = async (updatedProduct) => {
    await apiService.updateProduct(updatedProduct.id, updatedProduct);
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    addNotification(`Jewelry piece "${updatedProduct.name}" updated.`, 'info');
  };

  const deleteProduct = async (id) => {
    await apiService.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    addNotification(`Item removed from catalog database.`, 'warning');
  };

  // Gold Rate Update
  const updateGoldRate = async (metalTypeId, newRate, newBuyRate) => {
    const rateItem = goldRates.find(r => r.metal_type_id === metalTypeId);
    if (rateItem) {
      await apiService.updateGoldRate(rateItem.id, newRate, newBuyRate);
    }
    setGoldRates(prev => prev.map(rate => {
      if (rate.metal_type_id === metalTypeId) {
        const change = ((newRate - rate.rate_per_gram) / rate.rate_per_gram) * 100;
        return {
          ...rate,
          rate_per_gram: parseFloat(newRate),
          buy_rate_per_gram: parseFloat(newBuyRate),
          change_24h: parseFloat(change.toFixed(2)),
          effective_date: new Date().toISOString().split('T')[0]
        };
      }
      return rate;
    }));
    addNotification('Gold rates successfully updated. Live inventory re-priced.', 'success');
  };

  // Refresh live gold spot price
  const refreshSpotPrice = async () => {
    try {
      const fresh = await apiService.getSpotPrice('XAU', 'USD', true);
      if (fresh && fresh.spot_price_per_oz !== undefined) {
        setLiveSpot(fresh);
        addNotification(`Live spot refreshed: $${Number(fresh.spot_price_per_oz).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / oz (${fresh.source || 'Live'})`, 'info');
      }
    } catch (err) {
      console.error('Failed to refresh spot price:', err);
    }
  };

  // Refresh live USD to KHR exchange rate
  const refreshExchangeRate = async () => {
    try {
      const fresh = await apiService.getExchangeRate('USD', 'KHR', true);
      if (fresh && fresh.rate) {
        setExchangeRate(fresh);
        addNotification(`Exchange rate refreshed: 1 USD = ${Number(fresh.rate).toLocaleString()} KHR (${fresh.source || 'Live FX'})`, 'info');
      }
    } catch (err) {
      console.error('Failed to refresh exchange rate:', err);
    }
  };

  // Checkout / Create Sale
  const completeSale = async (paymentMethod, customNotes = '') => {
    if (cart.length === 0) return null;

    const subtotal = cart.reduce((acc, item) => acc + (item.calculatedPrice * item.qty), 0);
    const discountAmount = (subtotal * (discountPercent / 100));
    const taxableTotal = subtotal - discountAmount;
    const taxAmount = taxableTotal * (taxRate / 100);
    const grandTotal = taxableTotal + taxAmount;

    const now = new Date();
    const dateStr = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + now.getFullYear();
    const invoiceNo = `INV${dateStr}${String(sales.length + 1).padStart(4, '0')}`;

    const newSale = {
      id: Date.now(),
      invoice_no: invoiceNo,
      customer_id: selectedCustomer?.id || null,
      customer_name: selectedCustomer ? selectedCustomer.name : 'Walk-in Guest',
      customer_phone: selectedCustomer?.phone || 'N/A',
      user_name: 'Alexander Cross (Store Manager)',
      sale_date: new Date().toISOString().split('T')[0],
      items: cart.map(item => {
        const weightG = Number(item.net_weight) || 0;
        const weightChi = Number((weightG / 3.75).toFixed(3));
        const rateObj = goldRates.find(r => r.metal_type_id === item.metal_type_id) || goldRates[0];
        const ratePerGram = rateObj ? Number(rateObj.rate_per_gram) : 85.5;
        const ratePerChi = Number((ratePerGram * 3.75).toFixed(2));

        return {
          product_id: item.id,
          product_name: item.name,
          code_sku: item.code_sku,
          qty: item.qty,
          weight_chi: weightChi,
          weight_g: weightG,
          rate_per_chi: ratePerChi,
          metal_rate: ratePerGram,
          unit_price: item.calculatedPrice,
          total: item.calculatedPrice * item.qty
        };
      }),
      total_amount: subtotal,
      discount: discountAmount,
      tax: taxAmount,
      grand_total: Math.round(grandTotal * 100) / 100,
      payment_method: paymentMethod,
      payment_status: 'Paid',
      notes: customNotes
    };

    const payload = {
      invoice_no: invoiceNo,
      customer_id: selectedCustomer?.id || null,
      total_amount: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      tax: Math.round(taxAmount * 100) / 100,
      grand_total: Math.round(grandTotal * 100) / 100,
      sale_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod ? paymentMethod.toLowerCase().replace(/\s+/g, '_') : 'cash',
      items: cart.map(item => {
        const rateObj = goldRates.find(r => r.metal_type_id === item.metal_type_id) || goldRates[0];
        const ratePerGram = rateObj ? Number(rateObj.rate_per_gram) : 85.5;
        const ratePerChi = Number((ratePerGram * 3.75).toFixed(2));

        return {
          product_id: item.id,
          quantity: item.qty,
          weight_sold: parseFloat(item.net_weight) || 0,
          gold_rate_applied: ratePerChi, // Base unit: Rate per Chi
          labor_fee: parseFloat(item.labor_cost) || 0,
          gemstone_price: 0,
          unit_price: parseFloat(item.calculatedPrice) || 0,
          subtotal: (parseFloat(item.calculatedPrice) || 0) * item.qty,
          status: 'completed'
        };
      })
    };

    try {
      await apiService.createSale(payload);
      const freshSales = await apiService.getSales();
      if (freshSales && freshSales.length > 0) {
        setSales(freshSales);
      }
    } catch (e) {
      console.error('Failed to create sale in backend:', e);
      // Fallback local update
      setSales(prev => [newSale, ...prev]);
    }

    // Deduct stock quantity
    setProducts(prev => prev.map(prod => {
      const cartMatch = cart.find(c => c.id === prod.id);
      if (cartMatch) {
        const newQty = Math.max(0, prod.stock_qty - cartMatch.qty);
        return { ...prod, stock_qty: newQty, status: newQty === 0 ? 'out_of_stock' : prod.status };
      }
      return prod;
    }));

    // Award loyalty points to customer
    if (selectedCustomer) {
      setCustomers(prev => prev.map(c => {
        if (c.id === selectedCustomer.id) {
          const addedPoints = Math.floor(grandTotal / 50);
          return {
            ...c,
            loyalty_points: c.loyalty_points + addedPoints,
            total_spent: c.total_spent + grandTotal
          };
        }
        return c;
      }));
    }

    clearCart();
    addNotification(`Invoice ${invoiceNo} completed! Total: $${grandTotal.toLocaleString()}`, 'success');
    return newSale;
  };

  // Update Sale Status
  const updateSaleStatus = async (saleId, newStatus) => {
    try {
      setSales(prev => prev.map(s => {
        if (s.id === saleId) {
          return {
            ...s,
            status: newStatus,
            items: (s.items || []).map(it => ({ ...it, status: newStatus }))
          };
        }
        return s;
      }));

      await apiService.updateSaleStatus(saleId, newStatus);
      addNotification(`Invoice status updated to "${newStatus}".`, 'success');
    } catch (e) {
      console.error('Failed to update sale status:', e);
      addNotification('Failed to update sale status in database.', 'warning');
      const fresh = await apiService.getSales();
      setSales(fresh);
    }
  };

  // Update Sale Item Status
  const updateSaleItemStatus = async (saleId, itemId, newStatus) => {
    try {
      setSales(prev => prev.map(s => {
        if (s.id === saleId) {
          const updatedItems = (s.items || []).map(it => it.id === itemId ? { ...it, status: newStatus } : it);
          const distinct = [...new Set(updatedItems.map(it => it.status))];
          const newSaleStatus = distinct.length === 1 ? distinct[0] : (distinct.includes('pending') ? 'pending' : s.status);
          return {
            ...s,
            status: newSaleStatus,
            items: updatedItems
          };
        }
        return s;
      }));

      await apiService.updateSaleItemStatus(itemId, newStatus);
      addNotification(`Line item status updated to "${newStatus}".`, 'info');
    } catch (e) {
      console.error('Failed to update sale item status:', e);
      addNotification('Failed to update line item status.', 'warning');
      const fresh = await apiService.getSales();
      setSales(fresh);
    }
  };

  // Add Buyback
  const processBuyback = async (buybackData) => {
    const buybackNo = `BB-${new Date().getFullYear()}-${String(buybacks.length + 20).padStart(4, '0')}`;
    const newRecord = {
      id: Date.now(),
      buyback_no: buybackNo,
      buyback_date: new Date().toISOString().split('T')[0],
      ...buybackData,
      status: 'Approved & Paid'
    };
    await apiService.createBuyback({
      customer_id: null,
      metal_type_id: 1,
      weight: buybackData.gross_weight,
      buyback_rate: buybackData.buy_rate_per_gram,
      deduction_rate: buybackData.melt_loss_pct,
      labor_deduction: buybackData.appraisal_fee,
      total_refund: buybackData.total_amount,
      buyback_date: newRecord.buyback_date
    });
    setBuybacks(prev => [newRecord, ...prev]);
    addNotification(`Buyback voucher ${buybackNo} issued for $${newRecord.total_amount.toLocaleString()}`, 'success');
    return newRecord;
  };

  // Add Customer
  const addCustomer = async (customerData) => {
    const newCust = {
      id: Date.now(),
      ...customerData,
      total_spent: 0,
      loyalty_points: 50,
      tier: customerData.tier || 'Gold'
    };
    await apiService.addCustomer(newCust);
    setCustomers(prev => [newCust, ...prev]);
    addNotification(`Customer "${newCust.name}" enrolled in backend database.`, 'success');
    return newCust;
  };

  // Cambodian Gold Measurement Standards & Conversions
  const CAMBODIAN_STANDARDS = {
    TROY_OUNCE_GRAMS: 31.1034768,
    CHI_GRAMS: 3.75,
    DAMLUNG_GRAMS: 37.5,
    HUN_GRAMS: 0.375,
    CHI_PER_DAMLUNG: 10,
    DEFAULT_KHR_RATE: 4100
  };

  const convertGramsToChi = (grams) => (Number(grams) || 0) / 3.75;
  const convertGramsToDamlung = (grams) => (Number(grams) || 0) / 37.5;
  const convertChiToGrams = (chi) => (Number(chi) || 0) * 3.75;
  const convertDamlungToGrams = (damlung) => (Number(damlung) || 0) * 37.5;

  // Format weight in Chi (e.g. 1.44 ជី)
  const formatChi = (grams, decimals = 2) => {
    const chi = (Number(grams) || 0) / 3.75;
    return `${chi.toFixed(decimals)} ជី`;
  };

  // Format traditional Khmer weight breakdown (តម្លឹង ជី ហ៊ុន)
  const formatKhmerWeight = (grams) => {
    const totalChi = (Number(grams) || 0) / 3.75;
    if (totalChi <= 0) return '0 ជី';
    const damlung = Math.floor(totalChi / 10);
    const remainingChi = totalChi % 10;
    const chi = Math.floor(remainingChi);
    const hun = Math.round((remainingChi - chi) * 10 * 10) / 10;

    const parts = [];
    if (damlung > 0) parts.push(`${damlung} តម្លឹង`);
    if (chi > 0 || damlung === 0) parts.push(`${chi} ជី`);
    if (hun > 0) parts.push(`${hun} ហ៊ុន`);
    return parts.join(' ');
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      goldRates,
      updateGoldRate,
      metalTypes,
      categories,
      gemstones,
      customers,
      addCustomer,
      sales,
      completeSale,
      updateSaleStatus,
      updateSaleItemStatus,
      buybacks,
      processBuyback,
      suppliers,
      cart,
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      selectedCustomer,
      setSelectedCustomer,
      discountPercent,
      setDiscountPercent,
      taxRate,
      setTaxRate,
      calculateProductPrice,
      notifications,
      addNotification,
      removeNotification,
      backendConnected,
      cambodianGold,
      setCambodianGold,
      liveSpot,
      setLiveSpot,
      refreshSpotPrice,
      exchangeRate,
      setExchangeRate,
      refreshExchangeRate,
      CAMBODIAN_STANDARDS,
      convertGramsToChi,
      convertGramsToDamlung,
      convertChiToGrams,
      convertDamlungToGrams,
      formatChi,
      formatKhmerWeight,
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
