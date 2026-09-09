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
  
  // POS Cart State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxRate, setTaxRate] = useState(7.5); // 7.5% sales tax default
  
  // App Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Gold (24K) market rate updated +1.25% today', type: 'info', time: '10m ago' },
    { id: 2, text: 'Low stock warning: Royal Heritage 24K Necklace (3 left)', type: 'warning', time: '1h ago' }
  ]);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      const [prods, rates, custs, sls, bbs] = await Promise.all([
        apiService.getProducts(),
        apiService.getGoldRates(),
        apiService.getCustomers(),
        apiService.getSales(),
        apiService.getBuybacks(),
      ]);
      setProducts(prods);
      setGoldRates(rates);
      setCustomers(custs);
      setSales(sls);
      setBuybacks(bbs);
      setMetalTypes(apiService.getMetalTypes());
      setCategories(apiService.getCategories());
      setGemstones(apiService.getGemstones());
      setSuppliers(apiService.getSuppliers());
    };
    init();
  }, []);

  // Save changes to storage
  useEffect(() => {
    if (products.length > 0) apiService.saveProducts(products);
  }, [products]);

  useEffect(() => {
    if (goldRates.length > 0) apiService.saveGoldRates(goldRates);
  }, [goldRates]);

  useEffect(() => {
    if (sales.length > 0) apiService.saveSales(sales);
  }, [sales]);

  useEffect(() => {
    if (buybacks.length > 0) apiService.saveBuybacks(buybacks);
  }, [buybacks]);

  useEffect(() => {
    if (customers.length > 0) apiService.saveCustomers(customers);
  }, [customers]);

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
    const metalRate = rateObj ? rateObj.rate_per_gram : 65.0;
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
  const addProduct = (newProduct) => {
    const item = {
      ...newProduct,
      id: Date.now(),
      status: 'active',
      gemstones: newProduct.gemstones || []
    };
    setProducts(prev => [item, ...prev]);
    addNotification(`New jewelry item "${item.name}" registered in inventory.`, 'success');
  };

  const updateProduct = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    addNotification(`Jewelry item "${updatedProduct.name}" updated.`, 'info');
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    addNotification(`Item removed from catalog.`, 'warning');
  };

  // Gold Rate Update
  const updateGoldRate = (metalTypeId, newRate, newBuyRate) => {
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
    addNotification(`Gold rates successfully updated. Live inventory re-priced.`, 'success');
  };

  // Checkout / Create Sale
  const completeSale = (paymentMethod, customNotes = '') => {
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
        product_name: item.name,
        code_sku: item.code_sku,
        qty: item.qty,
        weight_g: item.net_weight,
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
  const processBuyback = (buybackData) => {
    const buybackNo = `BB-${new Date().getFullYear()}-${String(buybacks.length + 20).padStart(4, '0')}`;
    const newRecord = {
      id: Date.now(),
      buyback_no: buybackNo,
      buyback_date: new Date().toISOString().split('T')[0],
      ...buybackData,
      status: 'Approved & Paid'
    };
    setBuybacks(prev => [newRecord, ...prev]);
    addNotification(`Buyback voucher ${buybackNo} issued for $${newRecord.total_amount.toLocaleString()}`, 'success');
    return newRecord;
  };

  // Add Customer
  const addCustomer = (customerData) => {
    const newCust = {
      id: Date.now(),
      ...customerData,
      total_spent: 0,
      loyalty_points: 50,
      tier: 'Standard'
    };
    setCustomers(prev => [newCust, ...prev]);
    addNotification(`Customer "${newCust.name}" enrolled.`, 'success');
    return newCust;
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
      removeNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
