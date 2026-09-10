import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [goldRates, setGoldRates] = useState([]);
  const [metalTypes, setMetalTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [gemstones, setGemstones] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
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
  const [backendConnected, setBackendConnected] = useState(false);
  
  // POS Cart State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxRate, setTaxRate] = useState(7.5); // 7.5% sales tax default
  
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

        const [prods, rates, cats, metals, gems, custs, sls, bbs, sups, camGold, spotData] = await Promise.all([
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
        ]);

        setProducts(prods);
        setGoldRates(rates);
        setCategories(cats);
        setMetalTypes(metals);
        setGemstones(gems);
        setCustomers(custs);
        setSales(sls);
        setBuybacks(bbs);
        setSuppliers(sups);
        if (camGold) setCambodianGold(camGold);
        if (spotData && spotData.spot_price_per_oz !== undefined) setLiveSpot(spotData);
      } catch (e) {
        console.error('API load error:', e);
      }
    };
    fetchData();

    // Auto-sync real-time live gold spot price every 5 minutes (5mn / 300,000 ms)
    const spotInterval = setInterval(async () => {
      try {
        const fresh = await apiService.getSpotPrice('XAU', 'USD', true);
        if (fresh && fresh.spot_price_per_oz !== undefined) {
          setLiveSpot(prev => (prev?.spot_price_per_oz !== fresh.spot_price_per_oz ? fresh : prev));
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

  // Dynamic Jewelry Price Calculator: Net Weight x Metal Rate + Labor + Gemstones + Markup
  const calculateProductPrice = (product) => {
    if (!product) return 0;
    const rateObj = goldRates.find(r => r.metal_type_id === product.metal_type_id) || goldRates[0];
    const metalRate = rateObj ? rateObj.rate_per_gram : 85.5;
    const metalCost = (Number(product.net_weight) || 0) * metalRate;
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

  // Checkout / Create Sale
  const completeSale = async (paymentMethod, customNotes = '') => {
    if (cart.length === 0) return null;

    const subtotal = cart.reduce((acc, item) => acc + (item.calculatedPrice * item.qty), 0);
    const discountAmount = (subtotal * (discountPercent / 100));
    const taxableTotal = subtotal - discountAmount;
    const taxAmount = taxableTotal * (taxRate / 100);
    const grandTotal = taxableTotal + taxAmount;

    const invoiceNo = `INV-${new Date().getFullYear()}-${String(sales.length + 101).padStart(4, '0')}`;

    const newSale = {
      id: Date.now(),
      invoice_no: invoiceNo,
      customer_id: selectedCustomer?.id || null,
      customer_name: selectedCustomer ? selectedCustomer.name : 'Walk-in Guest',
      customer_phone: selectedCustomer?.phone || 'N/A',
      user_name: 'Alexander Cross (Store Manager)',
      sale_date: new Date().toISOString().split('T')[0],
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        code_sku: item.code_sku,
        qty: item.qty,
        weight_g: item.net_weight,
        metal_rate: 85.5,
        unit_price: item.calculatedPrice,
        total: item.calculatedPrice * item.qty
      })),
      total_amount: subtotal,
      discount: discountAmount,
      tax: taxAmount,
      grand_total: Math.round(grandTotal * 100) / 100,
      payment_method: paymentMethod,
      payment_status: 'Paid',
      notes: customNotes
    };

    await apiService.createSale(newSale);

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

    setSales(prev => [newSale, ...prev]);
    clearCart();
    addNotification(`Invoice ${invoiceNo} completed! Total: $${grandTotal.toLocaleString()}`, 'success');
    return newSale;
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
      CAMBODIAN_STANDARDS,
      convertGramsToChi,
      convertGramsToDamlung,
      convertChiToGrams,
      convertDamlungToGrams
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
