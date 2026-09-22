import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import swal, {
  confirmDialog,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showGoldAlert
} from '../utils/swal';

const AppContext = createContext();

// VIP Tier auto-upgrade calculation based on Total Spending
export const calculateCustomerTier = (totalSpent) => {
  const spent = Number(totalSpent) || 0;
  if (spent >= 10000) {
    return { tier: 'Diamond VIP', discount_rate: 5.0 };
  } else if (spent >= 5000) {
    return { tier: 'Platinum', discount_rate: 3.0 };
  } else if (spent >= 1000) {
    return { tier: 'Gold', discount_rate: 2.0 };
  }
  return { tier: 'Standard', discount_rate: 0.0 };
};

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
  const [purchases, setPurchases] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({ all: [], modules: {} });
  const [settings, setSettings] = useState({ language: 'km', low_stock_threshold: 3 });
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
    source: 'Live FX',
    last_updated: ''
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('jewelflow_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('jewelflow_auth_token') || null);

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await apiService.login(email, password);
      if (res && res.token) {
        localStorage.setItem('jewelflow_auth_token', res.token);
        localStorage.setItem('jewelflow_auth_user', JSON.stringify(res.user));
        setAuthToken(res.token);
        setCurrentUser(res.user);
        return res;
      }
      throw new Error(res?.message || 'Login failed');
    } catch (err) {
      console.error('Login error in context:', err);
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('jewelflow_auth_token');
      localStorage.removeItem('jewelflow_auth_user');
      setAuthToken(null);
      setCurrentUser(null);
    }
  };

  // Active Settings Sub-Tab State
  const [settingsTab, setSettingsTab] = useState('profile');

  // Update Current User Profile
  const updateProfile = async (profileData) => {
    try {
      const res = await apiService.updateProfile(profileData);
      if (res && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('jewelflow_auth_user', JSON.stringify(res.user));
        setUsers(prev => prev.map(u => u.id === res.user.id ? { ...u, ...res.user } : u));
        return res.user;
      }
      return null;
    } catch (err) {
      console.error('Error in updateProfile:', err);
      throw err;
    }
  };

  const [backendConnected, setBackendConnected] = useState(false);

  // POS Cart State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxRate, setTaxRate] = useState(7.5); // 7.5% sales tax default

  // Global Search State across entire system
  const [searchQuery, setSearchQuery] = useState('');

  // App Notifications (Navbar Dropdown History)
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Live API connection established with Laravel backend.', type: 'success', time: 'Just now' },
    { id: 2, text: 'Gold bullion and market spot valuations synced ($0.00/oz).', type: 'info', time: 'Just now' }
  ]);

  // Floating Toast Alerts for UI
  const [alerts, setAlerts] = useState([]);

  // Load live data from Backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const isHealthy = await apiService.checkHealth();
        setBackendConnected(isHealthy);

        const [prods, rates, cats, metals, gems, custs, sls, bbs, sups, purchs, promos, tierData, usersData, rolesData, permsData, settingsData, camGold, spotData, fxData] = await Promise.all([
          apiService.getProducts(),
          apiService.getGoldRates(),
          apiService.getCategories(),
          apiService.getMetalTypes(),
          apiService.getGemstones(),
          apiService.getCustomers(),
          apiService.getSales(),
          apiService.getBuybacks(),
          apiService.getSuppliers(),
          apiService.getPurchases(),
          apiService.getPromotions(),
          apiService.getTiers(),
          apiService.getUsers(),
          apiService.getRoles(),
          apiService.getPermissions(),
          apiService.getSettings(),
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
        setSales(sls || []);
        setBuybacks(bbs);
        setSuppliers(sups);
        setPurchases(purchs || []);
        setPromotions(promos || []);
        setTiers(tierData || []);
        setUsers(usersData || []);
        setRoles(rolesData || []);
        if (permsData) setPermissions(permsData);
        setSettings(prev => ({ ...prev, ...(settingsData || {}) }));
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

  // Dismiss an alert by id
  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Clear all active alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  // Show a rich UI Alert / Toast
  const showAlert = (messageOrConfig, type = 'info', options = {}) => {
    let alertObj;
    if (typeof messageOrConfig === 'object' && messageOrConfig !== null && !React.isValidElement(messageOrConfig)) {
      alertObj = {
        id: messageOrConfig.id || (Date.now() + Math.random()),
        title: messageOrConfig.title,
        message: messageOrConfig.message || messageOrConfig.text,
        type: messageOrConfig.type || type || 'info',
        duration: messageOrConfig.duration !== undefined ? messageOrConfig.duration : 4500,
        action: messageOrConfig.action,
        icon: messageOrConfig.icon,
        image: messageOrConfig.image,
      };
    } else {
      alertObj = {
        id: options.id || (Date.now() + Math.random()),
        title: options.title,
        message: messageOrConfig,
        type: type || 'info',
        duration: options.duration !== undefined ? options.duration : 4500,
        action: options.action,
        icon: options.icon,
        image: options.image,
      };
    }

    // Keep maximum 5 active alerts on screen
    setAlerts(prev => [alertObj, ...prev.slice(0, 4)]);
    return alertObj.id;
  };

  // Notification helper: updates Navbar dropdown AND triggers visible single Toast alert
  const addNotification = (text, type = 'info', options = {}) => {
    const newNotif = {
      id: Date.now(),
      text,
      type,
      time: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);

    if (!options.silent) {
      showToast(text, type === 'warning' ? 'warning' : (type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info')));
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Quick alert helper shortcuts (with SweetAlert2 integrations)
  const alert = {
    show: showAlert,
    success: (msg, opts) => showAlert(msg, 'success', opts),
    warning: (msg, opts) => showAlert(msg, 'warning', opts),
    error: (msg, opts) => showAlert(msg, 'error', opts),
    info: (msg, opts) => showAlert(msg, 'info', opts),
    gold: (msg, opts) => showAlert(msg, 'gold', opts),
    dismiss: dismissAlert,
    clear: clearAlerts,
    // SweetAlert2 Luxury Integrations
    swal,
    confirm: confirmDialog,
    toast: showToast,
    modal: {
      success: showSuccess,
      error: showError,
      warning: showWarning,
      info: showInfo,
      gold: showGoldAlert,
    }
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
      return [...prev, { ...product, calculatedPrice: currentPrice, qty: 1, status: 'completed' }];
    });
    addNotification(`Added "${product.name}" to POS cart.`, 'success', {
      title: 'Added to Active Ticket',
      image: product.image
    });
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

  const updateCartItemStatus = (productId, status) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, status } : item));
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
  const completeSale = async (paymentMethod, paymentCurrency = 'USD', paymentOptions = {}) => {
    if (cart.length === 0) return null;

    const options = typeof paymentOptions === 'string' ? { customNotes: paymentOptions } : (paymentOptions || {});
    const pStatus = (options.paymentStatus || 'paid').toLowerCase(); // 'paid' | 'partial' | 'pending'
    const customNotes = options.notes || options.customNotes || '';

    const subtotal = cart.reduce((acc, item) => acc + (item.calculatedPrice * item.qty), 0);
    const discountAmount = (subtotal * (discountPercent / 100));
    const taxableTotal = subtotal - discountAmount;
    const taxAmount = taxableTotal * (taxRate / 100);
    const grandTotal = taxableTotal + taxAmount;
    const grandTotalUsd = Math.round(grandTotal * 100) / 100;
    const currentFxRate = Number(exchangeRate?.rate) || 4100;
    const grandTotalKhr = Math.round(grandTotalUsd * currentFxRate);

    // Calculate paid amount and remaining balance based on currency and paymentStatus
    let actualPaid = 0;
    if (pStatus === 'paid') {
      actualPaid = paymentCurrency === 'KHR' ? grandTotalKhr : grandTotalUsd;
    } else if (pStatus === 'partial') {
      actualPaid = options.paidAmount !== undefined && options.paidAmount !== null && options.paidAmount !== ''
        ? Number(options.paidAmount)
        : (paymentCurrency === 'KHR' ? Math.round(grandTotalKhr * 0.3) : Math.round(grandTotalUsd * 0.3 * 100) / 100);
    } else { // 'pending'
      actualPaid = 0;
    }

    const totalInSelectedCurrency = paymentCurrency === 'KHR' ? grandTotalKhr : grandTotalUsd;
    const remainingBalance = Math.max(0, totalInSelectedCurrency - actualPaid);

    // Determine overall sale status:
    // If cashier explicitly provided saleStatus, use it.
    // Otherwise, if paymentStatus is partial or pending, or any cart item is pending, default to 'pending', else 'completed'.
    const hasAnyPendingItem = cart.some(item => item.status === 'pending');
    const autoStatus = (pStatus === 'partial' || pStatus === 'pending' || hasAnyPendingItem) ? 'pending' : 'completed';
    const finalSaleStatus = options.saleStatus || autoStatus;

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
          total: item.calculatedPrice * item.qty,
          status: item.status || finalSaleStatus || 'completed'
        };
      }),
      total_amount: subtotal,
      discount: discountAmount,
      tax: taxAmount,
      grand_total: grandTotalUsd,
      grand_total_usd: grandTotalUsd,
      grand_total_khr: grandTotalKhr,
      currency: paymentCurrency || 'USD',
      payment_method: paymentMethod,
      payment_status: pStatus === 'partial' ? 'Partial' : (pStatus === 'pending' ? 'Pending' : 'Paid'),
      paid_amount: actualPaid,
      balance_due: remainingBalance,
      status: finalSaleStatus,
      payments: [
        {
          id: Date.now(),
          amount: actualPaid,
          payment_method: paymentMethod,
          currency: paymentCurrency || 'USD',
          payment_date: new Date().toISOString().split('T')[0],
          reference_no: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
          status: pStatus,
        }
      ],
      notes: customNotes
    };

    const payload = {
      invoice_no: invoiceNo,
      customer_id: selectedCustomer?.id || null,
      total_amount: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      tax: Math.round(taxAmount * 100) / 100,
      grand_total: grandTotalUsd,
      grand_total_usd: grandTotalUsd,
      grand_total_khr: grandTotalKhr,
      currency: paymentCurrency || 'USD',
      sale_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod ? paymentMethod.toLowerCase().replace(/\s+/g, '_') : 'cash',
      payment_status: pStatus,
      payment_amount: actualPaid,
      status: finalSaleStatus,
      notes: customNotes,
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
          status: item.status || finalSaleStatus || 'completed'
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

    // Refresh customers from API so DB-computed tier/total_spent is applied
    if (selectedCustomer) {
      try {
        const freshCustomers = await apiService.getCustomers();
        if (freshCustomers && freshCustomers.length > 0) {
          setCustomers(freshCustomers);
          // Notify if tier changed
          const updated = freshCustomers.find(c => c.id === selectedCustomer.id);
          if (updated && updated.tier !== selectedCustomer.tier) {
            const isKhmer = (i18n.language || 'km').startsWith('km');
            addNotification(
              isKhmer
                ? `អតិថិជន "${updated.name}" ត្រូវបានដំឡើងកម្រិត VIP ស្វ័យប្រវត្តិទៅជា ${updated.tier} (បញ្ចុះតម្លៃ ${updated.discount_rate}%)!`
                : `Customer "${updated.name}" upgraded to ${updated.tier} (${updated.discount_rate}% Privilege)!`,
              'success'
            );
          }
        }
      } catch {
        // silent fail — local state is fine
      }
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
  const payload = {
    name: customerData.name?.trim(),
    phone: customerData.phone?.trim(),
    email: customerData.email?.trim() || null,
    address: customerData.address?.trim() || null,
    loyalty_points: Number(customerData.loyalty_points) || 50
  };

  let newCust = {
    id: Date.now(),
    ...customerData,
    ...payload,
    total_spent: 0,
    loyalty_points: payload.loyalty_points,
    tier: customerData.tier || 'Standard',
    discount_rate: customerData.discount_rate !== undefined ? customerData.discount_rate : 0
  };

  try {
    const res = await apiService.addCustomer(payload);
    if (res && res.id) {
      newCust = { ...newCust, id: res.id };
    }
  } catch (e) {
    console.error('Backend addCustomer error:', e);
  }

  setCustomers(prev => [newCust, ...prev]);
  addNotification(`Customer "${newCust.name}" registered.`, 'success');
  return newCust;
};

// Promotions CRUD
const addPromotion = async (promoData) => {
  try {
    const res = await apiService.createPromotion(promoData);
    const newPromo = res || { ...promoData, id: Date.now() };
    setPromotions(prev => [newPromo, ...prev]);
    addNotification(`Promotion "${newPromo.name}" created.`, 'success');
    return newPromo;
  } catch (e) {
    console.error('API createPromotion error, creating locally:', e);
    const fallbackPromo = {
      id: Date.now(),
      ...promoData,
      discount_value: parseFloat(promoData.discount_value) || 0,
      min_purchase: parseFloat(promoData.min_purchase) || 0,
      created_at: new Date().toISOString()
    };
    setPromotions(prev => [fallbackPromo, ...prev]);
    addNotification(`Promotion "${fallbackPromo.name}" created.`, 'success');
    return fallbackPromo;
  }
};

const editPromotion = async (updatedPromo) => {
  try {
    const res = await apiService.updatePromotion(updatedPromo.id, updatedPromo);
    const saved = res || updatedPromo;
    setPromotions(prev => prev.map(p => p.id === saved.id ? saved : p));
    addNotification(`Promotion "${saved.name}" updated.`, 'info');
    return saved;
  } catch (e) {
    console.error('API updatePromotion error, updating locally:', e);
    setPromotions(prev => prev.map(p => p.id === updatedPromo.id ? updatedPromo : p));
    addNotification(`Promotion "${updatedPromo.name}" updated.`, 'info');
    return updatedPromo;
  }
};

const removePromotion = async (id) => {
  try {
    await apiService.deletePromotion(id);
  } catch (e) {
    console.error('API deletePromotion error:', e);
  } finally {
    setPromotions(prev => prev.filter(p => p.id !== id));
    addNotification('Promotion deleted.', 'warning');
  }
};

const addTier = async (tierData) => {
  try {
    const tier = await apiService.createTier(tierData);
    const newTier = tier || { ...tierData, id: Date.now() };
    setTiers(prev => [...prev, newTier].sort((a, b) => Number(a.min_spending) - Number(b.min_spending)));
    addNotification(`Tier "${newTier.name}" created.`, 'success');
    return newTier;
  } catch (e) {
    console.error('API createTier error, saving locally:', e);
    const localTier = { id: Date.now(), ...tierData };
    setTiers(prev => [...prev, localTier].sort((a, b) => Number(a.min_spending) - Number(b.min_spending)));
    addNotification(`Tier "${localTier.name}" created.`, 'success');
    return localTier;
  }
};

const editTier = async (tierData) => {
  try {
    const tier = await apiService.updateTier(tierData.id, tierData);
    const updated = tier || tierData;
    setTiers(prev => prev.map(item => item.id === updated.id ? updated : item).sort((a, b) => Number(a.min_spending) - Number(b.min_spending)));
    addNotification(`Tier "${updated.name}" updated.`, 'info');
    return updated;
  } catch (e) {
    console.error('API updateTier error, updating locally:', e);
    setTiers(prev => prev.map(item => item.id === tierData.id ? tierData : item).sort((a, b) => Number(a.min_spending) - Number(b.min_spending)));
    addNotification(`Tier "${tierData.name}" updated.`, 'info');
    return tierData;
  }
};

const removeTier = async (id) => {
  try {
    await apiService.deleteTier(id);
  } catch (e) {
    console.error('API deleteTier error:', e);
  } finally {
    setTiers(prev => prev.filter(tier => tier.id !== id));
    addNotification('Tier removed.', 'warning');
  }
};

const addSupplier = async (supplierData) => {
  try {
    const created = await apiService.createSupplier(supplierData);
    const newSupplier = {
      id: created.id || Date.now(),
      name: created.company_name || supplierData.company_name,
      company_name: created.company_name || supplierData.company_name,
      contact_name: created.contact_name || supplierData.contact_name,
      contact: created.contact_name || supplierData.contact_name,
      phone: created.phone || supplierData.phone,
      email: created.email || supplierData.email || 'supply@refinery.com',
      address: created.address || supplierData.address || '',
      specialty: created.specialty || supplierData.specialty || 'Fine Bullion & Refined Alloys',
      purchases_count: 0,
      purchases: []
    };
    setSuppliers(prev => [newSupplier, ...prev]);
    addNotification(`Supplier "${newSupplier.company_name}" added.`, 'success');
    return newSupplier;
  } catch (e) {
    console.error('API createSupplier error, adding locally:', e);
    const localSupplier = {
      id: Date.now(),
      name: supplierData.company_name,
      company_name: supplierData.company_name,
      contact_name: supplierData.contact_name,
      contact: supplierData.contact_name,
      phone: supplierData.phone,
      email: supplierData.email || 'supply@refinery.com',
      address: supplierData.address || '',
      specialty: supplierData.specialty || 'Fine Bullion & Refined Alloys',
      purchases_count: 0,
      purchases: []
    };
    setSuppliers(prev => [localSupplier, ...prev]);
    addNotification(`Supplier "${localSupplier.company_name}" added.`, 'success');
    return localSupplier;
  }
};

const updateSupplier = async (id, supplierData) => {
  try {
    const updated = await apiService.updateSupplier(id, supplierData);
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...supplierData, company_name: supplierData.company_name || s.company_name, name: supplierData.company_name || s.name } : s));
    addNotification(`Supplier updated.`, 'info');
    return updated;
  } catch (e) {
    console.error('API updateSupplier error, updating locally:', e);
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...supplierData, company_name: supplierData.company_name || s.company_name, name: supplierData.company_name || s.name } : s));
    addNotification(`Supplier updated.`, 'info');
    return supplierData;
  }
};

const deleteSupplier = async (id) => {
  try {
    await apiService.deleteSupplier(id);
  } catch (e) {
    console.error('API deleteSupplier error:', e);
  } finally {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    addNotification('Supplier removed.', 'warning');
  }
};

const addPurchase = async (purchaseData) => {
  try {
    const created = await apiService.createPurchase(purchaseData);
    const supplierObj = suppliers.find(s => s.id === Number(purchaseData.supplier_id)) || null;
    const newPurchase = {
      id: created.id || Date.now(),
      supplier_id: Number(purchaseData.supplier_id),
      supplier: supplierObj,
      supplier_name: supplierObj?.company_name || supplierObj?.name || `Supplier #${purchaseData.supplier_id}`,
      invoice_no: created.invoice_no || purchaseData.invoice_no,
      total_amount: parseFloat(purchaseData.total_amount) || 0,
      purchase_date: purchaseData.purchase_date || new Date().toISOString().split('T')[0],
      status: purchaseData.status || 'pending',
      notes: purchaseData.notes || '',
      created_at: new Date().toISOString()
    };
    setPurchases(prev => [newPurchase, ...prev]);
    addNotification(`Purchase order "${newPurchase.invoice_no}" recorded.`, 'success');
    return newPurchase;
  } catch (e) {
    console.error('API createPurchase error, saving locally:', e);
    const supplierObj = suppliers.find(s => s.id === Number(purchaseData.supplier_id)) || null;
    const localPurchase = {
      id: Date.now(),
      supplier_id: Number(purchaseData.supplier_id),
      supplier: supplierObj,
      supplier_name: supplierObj?.company_name || supplierObj?.name || `Supplier #${purchaseData.supplier_id}`,
      invoice_no: purchaseData.invoice_no,
      total_amount: parseFloat(purchaseData.total_amount) || 0,
      purchase_date: purchaseData.purchase_date || new Date().toISOString().split('T')[0],
      status: purchaseData.status || 'pending',
      notes: purchaseData.notes || '',
      created_at: new Date().toISOString()
    };
    setPurchases(prev => [localPurchase, ...prev]);
    addNotification(`Purchase order "${localPurchase.invoice_no}" recorded.`, 'success');
    return localPurchase;
  }
};

const updatePurchase = async (id, purchaseData) => {
  try {
    const updated = await apiService.updatePurchase(id, purchaseData);
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, ...purchaseData } : p));
    addNotification(`Purchase "${purchaseData.invoice_no || id}" updated.`, 'info');
    return updated;
  } catch (e) {
    console.error('API updatePurchase error, updating locally:', e);
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, ...purchaseData } : p));
    addNotification(`Purchase "${purchaseData.invoice_no || id}" updated.`, 'info');
    return purchaseData;
  }
};

const deletePurchase = async (id) => {
  const prevPurchases = purchases;
  setPurchases(prev => prev.filter(p => p.id !== id));
  addNotification('Purchase order deleted.', 'warning');

  try {
    await apiService.deletePurchase(id);
    return true;
  } catch (e) {
    console.error('API deletePurchase error:', e);
    setPurchases(prevPurchases);
    addNotification('Failed to delete purchase from server.', 'error');
    return false;
  }
};

const cancelPurchaseOrder = async (id) => {
  setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' } : p));
  addNotification('Purchase order cancelled.', 'info');

  try {
    await apiService.cancelPurchase(id);
    return true;
  } catch (e) {
    console.error('API cancelPurchase error:', e);
    return false;
  }
};

const confirmPurchaseArrival = async (id) => {
  setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: 'completed' } : p));
  addNotification(`Shipment received & inventory stock updated!`, 'success');

  try {
    await apiService.confirmPurchaseArrival(id);
    return true;
  } catch (e) {
    console.error('API confirmPurchaseArrival error, updating locally:', e);
    return true;
  }
};

const saveSettings = async (nextSettings) => {
  try {
    const saved = await apiService.updateSettings(nextSettings);
    const merged = { ...settings, ...nextSettings, ...(saved?.settings || {}) };
    setSettings(merged);
    addNotification('Settings saved.', 'success');
    return merged;
  } catch (e) {
    console.error('API updateSettings error, saving locally:', e);
    const merged = { ...settings, ...nextSettings };
    setSettings(merged);
    addNotification('Settings saved.', 'success');
    return merged;
  }
};

const addUser = async (userData) => {
  try {
    const created = await apiService.createUser(userData);
    setUsers(prev => [created, ...prev]);
    addNotification(`Staff member "${userData.name}" added successfully.`, 'success');
    return created;
  } catch (e) {
    console.error('API createUser error:', e);
    throw e;
  }
};

const updateUser = async (id, userData) => {
  try {
    const updated = await apiService.updateUser(id, userData);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    addNotification(`Staff member "${userData.name || id}" updated.`, 'info');
    return updated;
  } catch (e) {
    console.error('API updateUser error:', e);
    throw e;
  }
};

const deleteUser = async (id) => {
  const prevUsers = users;
  setUsers(prev => prev.filter(u => u.id !== id));
  addNotification('User account deleted.', 'warning');

  try {
    await apiService.deleteUser(id);
    return true;
  } catch (e) {
    console.error('API deleteUser error:', e);
    setUsers(prevUsers);
    addNotification(e.response?.data?.message || 'Failed to delete user.', 'error');
    throw e;
  }
};

const toggleUserStatus = async (id) => {
  setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));

  try {
    const res = await apiService.toggleUserStatus(id);
    addNotification(`User account is now ${res.status}.`, 'info');
    return res;
  } catch (e) {
    console.error('API toggleUserStatus error:', e);
    // rollback
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    throw e;
  }
};

const syncUserPermissions = async (id, permsList) => {
  try {
    const res = await apiService.syncUserPermissions(id, permsList);
    setUsers(prev => prev.map(u => u.id === id ? {
      ...u,
      all_permissions: res.all_permissions,
      direct_permissions: res.direct_permissions
    } : u));
    addNotification('Permissions updated successfully.', 'success');
    return res;
  } catch (e) {
    console.error('API syncUserPermissions error:', e);
    throw e;
  }
};

const addRole = async (roleData) => {
  try {
    const created = await apiService.createRole(roleData);
    setRoles(prev => [created, ...prev]);
    addNotification(`Role "${roleData.name}" created.`, 'success');
    return created;
  } catch (e) {
    console.error('API createRole error:', e);
    throw e;
  }
};

const updateRole = async (id, roleData) => {
  try {
    const updated = await apiService.updateRole(id, roleData);
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    addNotification(`Role "${roleData.name || id}" updated.`, 'info');
    return updated;
  } catch (e) {
    console.error('API updateRole error:', e);
    throw e;
  }
};

const deleteRole = async (id) => {
  const prevRoles = roles;
  setRoles(prev => prev.filter(r => r.id !== id));

  try {
    await apiService.deleteRole(id);
    addNotification('Role deleted.', 'warning');
    return true;
  } catch (e) {
    console.error('API deleteRole error:', e);
    setRoles(prevRoles);
    addNotification(e.response?.data?.message || 'Failed to delete role.', 'error');
    throw e;
  }
};

  const addCategory = async (categoryData) => {
    try {
      const created = await apiService.createCategory(categoryData);
      const newCat = {
        ...created,
        products_count: 0,
        products: []
      };
      setCategories(prev => [newCat, ...prev]);
      addNotification(`Category "${categoryData.name}" created successfully.`, 'success');
      return newCat;
    } catch (e) {
      console.error('API createCategory error:', e);
      throw e;
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const updated = await apiService.updateCategory(id, categoryData);
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      addNotification(`Category "${categoryData.name || id}" updated.`, 'info');
      return updated;
    } catch (e) {
      console.error('API updateCategory error:', e);
      throw e;
    }
  };

  const deleteCategory = async (id) => {
    const prevCategories = categories;
    setCategories(prev => prev.filter(c => c.id !== id));
    addNotification('Category deleted.', 'warning');

    try {
      await apiService.deleteCategory(id);
      return true;
    } catch (e) {
      console.error('API deleteCategory error:', e);
      setCategories(prevCategories);
      addNotification(e.response?.data?.message || 'Failed to delete category.', 'error');
      throw e;
    }
  };

  const refreshCategories = async () => {
    try {
      const cats = await apiService.getCategories();
      if (cats) setCategories(cats);
    } catch (e) {
      console.error('API refreshCategories error:', e);
    }
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
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
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
    addSupplier,
    updateSupplier,
    deleteSupplier,
    purchases,
    setPurchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    confirmPurchaseArrival,
    cancelPurchaseOrder,
    promotions,
    addPromotion,
    editPromotion,
    removePromotion,
    tiers,
    addTier,
    editTier,
    removeTier,
    users,
    setUsers,
    roles,
    setRoles,
    permissions,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    syncUserPermissions,
    addRole,
    updateRole,
    deleteRole,
    settings,
    saveSettings,
    cart,
    setCart,
    addToCart,
    removeFromCart,
    updateCartQty,
    updateCartItemStatus,
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
    alerts,
    showAlert,
    dismissAlert,
    clearAlerts,
    alert,
    swal,
    confirmDialog,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showGoldAlert,
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
    setSearchQuery,
    currentUser,
    setCurrentUser,
    authToken,
    login,
    logout,
    settingsTab,
    setSettingsTab,
    updateProfile
  }}>
    {children}
  </AppContext.Provider>
);
};

export const useApp = () => useContext(AppContext);
