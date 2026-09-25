import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import apiService from '../../services/api';
import { InvoiceModal } from './InvoiceModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBagShopping,
  faTrashCan,
  faPlus,
  faMinus,
  faCircleCheck,
  faCreditCard,
  faMoneyBillWave,
  faQrcode,
  faUser,
  faPercent,
  faBookmark,
  faFilter,
  faXmark,
  faCoins,
  faClock,
  faBoxesStacked,
  faCheck,
  faArrowRight,
  faArrowLeft,
  faUserPlus,
  faTag,
  faGift,
  faCrown,
  faWandMagicSparkles,
  faTriangleExclamation,
  faCircleInfo,
  faCircleExclamation,
  faHourglassHalf,
  faBan,
  faGem,
  faScaleBalanced,
  faArrowsRotate,
  faBarcode,
  faCartShopping
} from '@fortawesome/free-solid-svg-icons';

const fallbackImg = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80';

export const PosTerminal = () => {
  const { t, i18n } = useTranslation();
  const isKhmer = (i18n.language || 'km').startsWith('km');
  const {
    products,
    categories,
    metalTypes,
    customers,
    addCustomer,
    cart,
    setCart,
    addToCart,
    removeFromCart,
    updateCartQty,
    updateCartItemStatus,
    clearCart,
    selectedCustomer,
    setSelectedCustomer,
    discountPercent: contextDiscountPercent,
    setDiscountPercent: setContextDiscountPercent,
    taxRate,
    calculateProductPrice,
    completeSale,
    exchangeRate,
    liveSpot,
    searchQuery,
    setSearchQuery,
    confirmDialog,
    showToast,
    promotions,
    createMadeProductFromSale,
    setActiveTab,
    materials
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMetal, setSelectedMetal] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paymentCurrency, setPaymentCurrency] = useState('USD');
  const [paymentStatus, setPaymentStatus] = useState('paid'); // 'paid' | 'partial' | 'pending'
  const [saleStatus, setSaleStatus] = useState('completed'); // 'completed' | 'pending' | 'cancelled'
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tier: 'Standard',
    discount_rate: 0.0
  });
  const [custModalErrors, setCustModalErrors] = useState({});
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [craftingPromptModal, setCraftingPromptModal] = useState(null);
  const [creatingCraftingOrder, setCreatingCraftingOrder] = useState(false);

  // Held Tickets Tray State
  const [pinnedTickets, setPinnedTickets] = useState([]);

  // Pin / Hold current ticket to recall later
  const handlePinTicket = () => {
    if (cart.length === 0) return;
    const newTicket = {
      id: Date.now(),
      cart: [...cart],
      selectedCustomer,
      discountMode,
      customDiscountVal,
      selectedPromotionId,
      subtotal,
      grandTotal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setPinnedTickets(prev => [newTicket, ...prev]);
    clearCart();
    setSelectedPromotionId('auto');
    setCustomDiscountVal(0);
    showToast(isKhmer ? 'បានផ្អាកការបញ្ជាទិញ (Parked Ticket)!' : 'POS ticket parked on hold.', 'info');
  };

  // Restore a pinned ticket back to active cart
  const handleRestoreTicket = (ticket) => {
    setCart(ticket.cart);
    setSelectedCustomer(ticket.selectedCustomer || null);
    setDiscountMode(ticket.discountMode || 'percent');
    setCustomDiscountVal(ticket.customDiscountVal !== undefined ? ticket.customDiscountVal : 0);
    setSelectedPromotionId(ticket.selectedPromotionId || 'auto');
    setPinnedTickets(prev => prev.filter(t => t.id !== ticket.id));
    showToast(isKhmer ? 'បានស្ដារការបញ្ជាទិញមកវិញ!' : 'Parked ticket restored to active cart.', 'success');
  };

  // Delete a held ticket with SweetAlert2 confirmation
  const handleDeletePinnedTicket = async (ticket) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'តើអ្នកចង់លុបសំបុត្រដែលបានផ្អាកទុកមែនទេ?' : 'Discard Parked Ticket?',
      text: isKhmer
        ? `សំបុត្រនេះមាន ${ticket.cart?.length || 0} មុខទំនិញ តម្លៃសរុប $${(ticket.grandTotal || 0).toLocaleString()}។`
        : `This ticket contains ${ticket.cart?.length || 0} item(s) totaling $${(ticket.grandTotal || 0).toLocaleString()}.`,
      confirmButtonText: isKhmer ? 'យល់ព្រមលុប' : 'Yes, Discard',
      cancelButtonText: isKhmer ? 'រក្សាទុក' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      setPinnedTickets(prev => prev.filter(t => t.id !== ticket.id));
      showToast(isKhmer ? 'បានលុបសំបុត្រដែលផ្អាកទុក!' : 'Parked ticket discarded.', 'info');
    }
  };

  // Clear active cart with SweetAlert2 confirmation
  const handleClearCart = async () => {
    if (cart.length === 0) return;
    const confirmed = await confirmDialog({
      title: isKhmer ? 'តើអ្នកចង់សម្អាតកន្ត្រកទំនិញមែនទេ?' : 'Clear POS Cart?',
      text: isKhmer
        ? `មុខទំនិញទាំងអស់ (${cart.length}) នឹងត្រូវដកចេញពីការបញ្ជាទិញបច្ចុប្បន្ន។`
        : `All items (${cart.length}) will be removed from the current active cart.`,
      confirmButtonText: isKhmer ? 'យល់ព្រមសម្អាត' : 'Yes, Clear Cart',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      clearCart();
      setSelectedPromotionId('auto');
      setCustomDiscountVal(0);
      showToast(isKhmer ? 'កន្ត្រកត្រូវបានសម្អាត!' : 'Cart cleared.', 'info');
    }
  };

  // Active Promotion & Discount State ('auto' | 'vip' | 'none' | 'custom' | promo_id)
  const [selectedPromotionId, setSelectedPromotionId] = useState('auto');
  const [discountMode, setDiscountMode] = useState('percent'); // 'percent' | 'fixed'
  const [customDiscountVal, setCustomDiscountVal] = useState(0);

  // Filter products using global searchQuery
  const cleanQ = (searchQuery || '').toLowerCase().trim();
  const filteredProducts = products.filter(p => {
    const matchesSearch = !cleanQ || (
      p.name?.toLowerCase().includes(cleanQ) ||
      p.code_sku?.toLowerCase().includes(cleanQ) ||
      p.barcode?.includes(cleanQ)
    );
    const matchesCategory = selectedCategory === 'all' || p.category_id === Number(selectedCategory);
    const matchesMetal = selectedMetal === 'all' || p.metal_type_id === Number(selectedMetal);
    return matchesSearch && matchesCategory && matchesMetal;
  });

  // Calculate base item totals
  const subtotal = cart.reduce((acc, item) => acc + (item.calculatedPrice * item.qty), 0);
  const totalWeightGrams = cart.reduce((acc, item) => acc + ((Number(item.net_weight) || 0) * item.qty), 0);
  const totalWeightChi = totalWeightGrams / 3.75;

  // All active promotions in system
  const allActivePromotions = React.useMemo(() => {
    if (!promotions || !Array.isArray(promotions)) return [];
    return promotions.filter(p => {
      const activeVal = p.is_active;
      return activeVal === true || activeVal === 1 || activeVal === '1';
    });
  }, [promotions]);

  const tierLevel = (tier) => {
    const t = String(tier || '').toLowerCase();
    if (t.includes('diamond')) return 4;
    if (t.includes('platinum')) return 3;
    if (t.includes('gold')) return 2;
    if (t.includes('silver')) return 1;
    return 0;
  };

  // Live Promotion matching: matches active promotions based on customer tier, min purchase, cart items, and valid dates
  const applicablePromotions = React.useMemo(() => {
    if (allActivePromotions.length === 0) return [];
    const today = new Date().toISOString().split('T')[0];
    const customerTier = selectedCustomer?.tier || 'Standard';
    const currentTierLvl = tierLevel(customerTier);

    return allActivePromotions.filter(p => {
      if (p.start_date && p.start_date.split('T')[0] > today) return false;
      if (p.end_date && p.end_date.split('T')[0] < today) return false;
      if (p.product_id && !cart.some(item => Number(item.id) === Number(p.product_id))) return false;
      if (Number(p.min_purchase) > 0 && subtotal < Number(p.min_purchase)) return false;

      // Tier check
      const req = p.tier_requirement;
      if (req && req !== '' && req !== 'All' && req !== 'all' && req !== 'Standard') {
        const reqLvl = tierLevel(req);
        if (selectedCustomer && currentTierLvl < reqLvl) return false;
      }

      return true;
    });
  }, [allActivePromotions, selectedCustomer, cart, subtotal]);

  // Determine active promotion object based on selectedPromotionId or auto-best
  const activePromotion = React.useMemo(() => {
    if (selectedPromotionId === 'none' || selectedPromotionId === 'vip' || selectedPromotionId === 'custom') return null;
    if (selectedPromotionId !== 'auto') {
      return (promotions || []).find(p => String(p.id) === String(selectedPromotionId)) || null;
    }
    if (applicablePromotions.length === 0) return null;
    // Auto mode: find promotion giving highest discount savings in USD
    return applicablePromotions.slice().sort((a, b) => {
      const savingA = a.discount_type === 'percent' ? (subtotal * Number(a.discount_value)) / 100 : Number(a.discount_value);
      const savingB = b.discount_type === 'percent' ? (subtotal * Number(b.discount_value)) / 100 : Number(b.discount_value);
      return savingB - savingA;
    })[0];
  }, [selectedPromotionId, applicablePromotions, promotions, subtotal]);

  const [showQuickDiscountMenu, setShowQuickDiscountMenu] = useState(false);

  // Helper to get effective VIP discount rate from customer tier or discount_rate
  const getCustomerEffectiveDiscountRate = (cust) => {
    if (!cust) return 0;
    const rate = Number(cust.discount_rate || 0);
    if (rate > 0) return rate;
    const tier = String(cust.tier || '').toLowerCase();
    if (tier.includes('diamond')) return 5.0;
    if (tier.includes('platinum')) return 3.0;
    if (tier.includes('gold')) return 2.0;
    if (tier.includes('silver')) return 1.0;
    return 0;
  };

  // Deterministically compute final discount amount ($) and percentage (%)
  const { discountAmount, discountPercent } = React.useMemo(() => {
    if (subtotal <= 0) return { discountAmount: 0, discountPercent: 0 };

    if (selectedPromotionId === 'auto') {
      let promoSaving = 0;
      let promoPct = 0;
      if (activePromotion) {
        if (activePromotion.discount_type === 'percent') {
          promoPct = Number(activePromotion.discount_value) || 0;
          promoSaving = (subtotal * promoPct) / 100;
        } else {
          promoSaving = Math.min(subtotal, Number(activePromotion.discount_value) || 0);
          promoPct = subtotal > 0 ? (promoSaving / subtotal) * 100 : 0;
        }
      }
      const vipRate = getCustomerEffectiveDiscountRate(selectedCustomer);
      const vipSaving = (subtotal * vipRate) / 100;

      if (promoSaving > 0 || vipSaving > 0) {
        if (vipSaving > promoSaving) {
          return {
            discountAmount: Math.min(subtotal, Math.round(vipSaving * 100) / 100),
            discountPercent: vipRate
          };
        } else {
          return {
            discountAmount: Math.min(subtotal, Math.round(promoSaving * 100) / 100),
            discountPercent: Math.round(promoPct * 100) / 100
          };
        }
      }
      return { discountAmount: 0, discountPercent: 0 };
    }

    if (selectedPromotionId === 'vip') {
      const vipRate = getCustomerEffectiveDiscountRate(selectedCustomer);
      const amt = Math.min(subtotal, (subtotal * vipRate) / 100);
      return { discountAmount: Math.round(amt * 100) / 100, discountPercent: vipRate };
    }

    if (selectedPromotionId === 'none') {
      return { discountAmount: 0, discountPercent: 0 };
    }

    if (selectedPromotionId === 'custom') {
      if (discountMode === 'fixed') {
        const amt = Math.min(subtotal, Math.max(0, Number(customDiscountVal) || 0));
        const pct = subtotal > 0 ? (amt / subtotal) * 100 : 0;
        return { discountAmount: Math.round(amt * 100) / 100, discountPercent: Math.round(pct * 100) / 100 };
      } else {
        const pct = Math.min(100, Math.max(0, Number(customDiscountVal) || 0));
        const amt = (subtotal * pct) / 100;
        return { discountAmount: Math.round(amt * 100) / 100, discountPercent: pct };
      }
    }

    // Specific promotion ID selected
    const promo = (promotions || []).find(p => String(p.id) === String(selectedPromotionId));
    if (promo) {
      if (promo.discount_type === 'percent') {
        const pct = Number(promo.discount_value) || 0;
        const amt = (subtotal * pct) / 100;
        return { discountAmount: Math.round(amt * 100) / 100, discountPercent: pct };
      } else {
        const amt = Math.min(subtotal, Number(promo.discount_value) || 0);
        const pct = subtotal > 0 ? (amt / subtotal) * 100 : 0;
        return { discountAmount: Math.round(amt * 100) / 100, discountPercent: Math.round(pct * 100) / 100 };
      }
    }

    return { discountAmount: 0, discountPercent: 0 };
  }, [subtotal, selectedPromotionId, activePromotion, selectedCustomer, discountMode, customDiscountVal, promotions]);

  // Keep AppContext discountPercent in sync for other components if needed
  React.useEffect(() => {
    if (typeof setContextDiscountPercent === 'function') {
      setContextDiscountPercent(discountPercent);
    }
  }, [discountPercent]);

  // Toast Notification Trigger for Auto-Applied Promotions (លោត Auto Promos)
  const lastNotifiedPromoRef = React.useRef(null);
  React.useEffect(() => {
    if (selectedPromotionId === 'auto' && subtotal > 0) {
      if (activePromotion && discountAmount > 0) {
        const promoKey = `promo_${activePromotion.id}_${activePromotion.discount_value}`;
        if (lastNotifiedPromoRef.current !== promoKey) {
          lastNotifiedPromoRef.current = promoKey;
          showToast(
            isKhmer
              ? `🎉 ប្រម៉ូសិន "${activePromotion.name}" ត្រូវបានអនុវត្តដោយស្វ័យប្រវត្តិ (-${activePromotion.discount_value}${activePromotion.discount_type === 'percent' ? '%' : '$'})!`
              : `🎉 Auto-applied promotion "${activePromotion.name}" (-${activePromotion.discount_value}${activePromotion.discount_type === 'percent' ? '%' : '$'})!`,
            'success'
          );
        }
      } else if (selectedCustomer?.tier && selectedCustomer.tier !== 'Standard' && discountPercent > 0) {
        const vipKey = `vip_${selectedCustomer.id}_${selectedCustomer.tier}_${selectedCustomer.discount_rate}`;
        if (lastNotifiedPromoRef.current !== vipKey) {
          lastNotifiedPromoRef.current = vipKey;
          showToast(
            isKhmer
              ? `👑 អតិថិជន VIP "${selectedCustomer.tier}" ទទួលបានការបញ្ចុះតម្លៃ ${selectedCustomer.discount_rate}% ដោយស្វ័យប្រវត្តិ!`
              : `👑 Auto-applied VIP discount (${selectedCustomer.discount_rate}%) for ${selectedCustomer.tier}!`,
            'success'
          );
        }
      } else {
        lastNotifiedPromoRef.current = null;
      }
    } else if (selectedPromotionId !== 'auto' || subtotal === 0) {
      lastNotifiedPromoRef.current = null;
    }
  }, [activePromotion, selectedPromotionId, selectedCustomer, subtotal, discountAmount, discountPercent, isKhmer, showToast]);

  // Final ledger values
  const taxableTotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableTotal * (taxRate / 100);
  const grandTotal = taxableTotal + taxAmount;
  const currentFxRate = Number(exchangeRate?.rate) || 4100;
  const grandTotalKhr = Math.round(grandTotal * currentFxRate);

  const totalInCurrentCurrency = paymentCurrency === 'KHR' ? grandTotalKhr : grandTotal;
  const currentDepositVal = Number(depositAmount) || 0;
  const remainingInCurrentCurrency = Math.max(0, totalInCurrentCurrency - currentDepositVal);

  const handleCurrencyToggle = (newCur) => {
    if (newCur === paymentCurrency) return;
    if (paymentStatus === 'partial' && depositAmount) {
      const depNum = Number(depositAmount) || 0;
      if (newCur === 'KHR') {
        setDepositAmount(Math.round(depNum * currentFxRate));
      } else {
        setDepositAmount(Math.round((depNum / currentFxRate) * 100) / 100);
      }
    }
    setPaymentCurrency(newCur);
  };

  const handlePresetDeposit = (percent) => {
    const total = paymentCurrency === 'KHR' ? grandTotalKhr : grandTotal;
    const calc = total * (percent / 100);
    setDepositAmount(paymentCurrency === 'KHR' ? Math.round(calc) : Math.round(calc * 100) / 100);
  };

  // Modal 1: Open Order & Items Status Modal
  const handleOpenStatusModal = () => {
    if (cart.length === 0) return;
    const hasPendingItem = cart.some(item => item.status === 'pending');
    if (hasPendingItem && saleStatus === 'completed') {
      setSaleStatus('pending');
    }
    setShowStatusModal(true);
  };

  // Step 1 -> Step 2: Proceed from Status Modal to Payment Modal
  const handleProceedToPayment = async () => {
    setShowStatusModal(false);
    const hasPendingItem = cart.some(item => item.status === 'pending');
    if (hasPendingItem && paymentStatus === 'paid') {
      setPaymentStatus('partial');
      if (!depositAmount) {
        const total = paymentCurrency === 'KHR' ? grandTotalKhr : grandTotal;
        const initialDep = paymentCurrency === 'KHR' ? Math.round(total * 0.3) : Math.round(total * 0.3 * 100) / 100;
        setDepositAmount(initialDep);
      }
    }

    // Auto-apply best matching promotion for this customer + cart
    try {
      const customerTier = selectedCustomer?.tier || 'Standard';
      const result = await apiService.getApplicablePromotion({
        tier: customerTier,
        cartTotal: grandTotal,
      });
      if (result?.found && result.promotion) {
        const promo = result.promotion;
        const promoDiscount = promo.discount_type === 'percent'
          ? parseFloat(promo.discount_value) || 0
          : Math.min(100, ((parseFloat(promo.discount_value) || 0) / grandTotal) * 100);
        if (promoDiscount > 0 && promoDiscount > discountPercent) {
          setDiscountPercent(promoDiscount);
          showToast(
            isKhmer
              ? `ប្រម៉ូសិន "${promo.name}" ត្រូវបានអនុវត្ត (-${promo.discount_value}${promo.discount_type === 'percent' ? '%' : '$'})!`
              : `Promotion "${promo.name}" auto-applied (-${promo.discount_value}${promo.discount_type === 'percent' ? '%' : '$'})!`,
            'success'
          );
        }
      }
    } catch {
      // silent — no promo is fine
    }

    setShowPaymentModal(true);
  };

  // Step 2 -> Step 1: Return back to Status Modal from Payment Modal
  const handleBackToStatus = () => {
    setShowPaymentModal(false);
    setShowStatusModal(true);
  };

  // Bulk status update for all items in Modal 1
  const handleSetAllItemsStatus = (status) => {
    cart.forEach(item => updateCartItemStatus(item.id, status));
    if (status === 'pending') {
      setSaleStatus('pending');
    } else if (status === 'completed' && saleStatus === 'pending') {
      setSaleStatus('completed');
    }
  };

  const handleOpenPaymentModal = () => {
    handleOpenStatusModal();
  };

  const handleCustomerChange = (customerId) => {
    if (customerId === '__NEW__') {
      setShowAddCustomerModal(true);
      return;
    }
    setSelectedPromotionId('auto');
    if (!customerId) {
      setSelectedCustomer(null);
      return;
    }
    const customer = customers.find(c => String(c.id) === String(customerId));
    setSelectedCustomer(customer || null);
  };

  const handleTierSelect = (tier) => {
    let discount = 0;
    if (tier === 'Diamond VIP') discount = 5.0;
    else if (tier === 'Platinum') discount = 3.0;
    else if (tier === 'Gold') discount = 2.0;
    else if (tier === 'Standard') discount = 0;
    setNewCustomerForm(prev => ({ ...prev, tier, discount_rate: discount }));
  };

  const handleSaveNewCustomer = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};
    if (!newCustomerForm.name || !newCustomerForm.name.trim()) {
      newErrors.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះអតិថិជន' : 'Please enter customer name';
    }
    if (!newCustomerForm.phone || !newCustomerForm.phone.trim()) {
      newErrors.phone = isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទ' : 'Please enter phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setCustModalErrors(newErrors);
      return;
    }
    setCustModalErrors({});

    setSavingCustomer(true);
    try {
      const created = await addCustomer({
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        email: newCustomerForm.email?.trim() || null,
        address: newCustomerForm.address?.trim() || null,
        tier: newCustomerForm.tier || 'Standard',
        discount_rate: newCustomerForm.discount_rate !== undefined ? newCustomerForm.discount_rate : 0.0,
        loyalty_points: 50
      });

      setSelectedCustomer(created);
      if (typeof setContextDiscountPercent === 'function') {
        setContextDiscountPercent(created.discount_rate || 0);
      }
      setShowAddCustomerModal(false);
      setNewCustomerForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        tier: 'Standard',
        discount_rate: 0.0
      });
      setCustModalErrors({});
      showToast(
        isKhmer ? `បានចុះឈ្មោះអតិថិជន "${created.name}" និងភ្ជាប់ការលក់ដោយជោគជ័យ!` : `Customer "${created.name}" registered and assigned to ticket!`,
        'success'
      );
    } catch (err) {
      console.error('Error adding customer:', err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការចុះឈ្មោះអតិថិជន!' : 'Failed to register customer.', 'error');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleCheckout = async () => {
    const totalVal = paymentCurrency === 'KHR' ? grandTotalKhr : grandTotal;
    let finalPaid = totalVal;

    if (paymentStatus === 'paid') {
      finalPaid = totalVal;
    } else if (paymentStatus === 'partial') {
      const dep = parseFloat(depositAmount);
      if (isNaN(dep) || dep <= 0) {
        showToast(isKhmer ? 'សូមបញ្ចូលចំនួនលុយកក់ឲ្យបានត្រឹមត្រូវ!' : 'Please enter a valid deposit amount!', 'warning');
        return;
      }
      if (dep > totalVal) {
        showToast(isKhmer ? 'លុយកក់មិនអាចលើសពីតម្លៃសរុបទេ!' : 'Deposit amount cannot exceed grand total!', 'warning');
        return;
      }
      finalPaid = dep;
    } else {
      finalPaid = 0;
    }

    try {
      const preOrderItems = cart
        .map(i => {
          const currentProd = products.find(p => p.id === i.id);
          const currentStock = currentProd ? Number(currentProd.stock_qty) || 0 : (Number(i.stock_qty) || 0);
          const inStockQty = Math.min(i.qty, Math.max(0, currentStock));
          const craftQty = i.qty - inStockQty;
          return {
            ...i,
            current_stock: currentStock,
            in_stock_qty: inStockQty,
            craft_qty: craftQty > 0 ? craftQty : (currentStock <= 0 ? i.qty : 0),
            is_deficit: craftQty > 0 || currentStock <= 0 || i.is_preorder
          };
        })
        .filter(i => i.is_deficit);
      const isPreOrderSale = preOrderItems.length > 0;

      const finalized = await completeSale(paymentMethod, paymentCurrency, {
        paymentStatus,
        paidAmount: finalPaid,
        notes: paymentNotes,
        saleStatus: isPreOrderSale ? 'pending' : saleStatus,
        discountAmount,
        discountPercent,
      });
      setShowPaymentModal(false);
      if (finalized) {
        if (isPreOrderSale) {
          setCraftingPromptModal({
            sale: finalized,
            items: preOrderItems
          });
        } else {
          setActiveInvoice(finalized);
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការទូទាត់ប្រាក់!' : 'Checkout error occurred.', 'error');
    }
  };

  const handleSpawnCraftingOrder = async (items) => {
    if (!craftingPromptModal?.sale) return;
    setCreatingCraftingOrder(true);
    try {
      const itemsList = Array.isArray(items) ? items : (craftingPromptModal.items || [items]);
      for (const item of itemsList) {
        await createMadeProductFromSale(craftingPromptModal.sale, item);
      }
      showToast(
        isKhmer
          ? `បានបង្កើតប័ណ្ណកែច្នៃ Made Jewelry ដោយជោគជ័យ!`
          : `Made Jewelry crafting order(s) created successfully!`,
        'success'
      );
      setCraftingPromptModal(null);
      setActiveTab('made_products');
    } catch (err) {
      console.error(err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការបង្កើតប័ណ្ណកែច្នៃ' : 'Failed to create crafting order', 'error');
    } finally {
      setCreatingCraftingOrder(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-12 gap-3.5 min-h-0">
      {/* Left Area: Product Browser (8 cols on LG, 9 cols on XL) - Independently Scrollable */}
      <div className="lg:col-span-8 xl:col-span-9 2xl:col-span-9 flex flex-col h-full min-h-0 space-y-2.5 overflow-hidden">
        {/* Header & Filter Bar */}
        <div className="shrink-0 p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Spot Benchmark Pill */}
              <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 font-bold text-[10.5px] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-amber-800">{isKhmer ? 'តាមតម្លៃដើម:' : 'Market Spot:'}</span>
                <span className="font-mono font-extrabold text-amber-950">
                  ${Number(liveSpot?.spot_price_per_oz ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz
                </span>
                <span className="text-[9.5px] font-mono text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded font-bold">
                  ${Number(liveSpot?.price_per_chi ?? (Number(liveSpot?.spot_price_per_oz ?? 0) / 31.1034768 * 3.75)).toFixed(2)}/{isKhmer ? 'ជី' : 'chi'}
                </span>
              </div>
            </div>

            {/* Metal Karat Quick Filter */}
            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedMetal('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${selectedMetal === 'all'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {t('catalog.allMetals', 'All Metals')}
              </button>
              {metalTypes.slice(0, 4).map(metal => (
                <button
                  key={metal.id}
                  onClick={() => setSelectedMetal(metal.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${selectedMetal === metal.id
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {metal.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${selectedCategory === 'all'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {t('catalog.allCategories', 'All Categories')}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${selectedCategory === cat.id
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid - 4 Columns per Row on Desktop */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-3" style={{ scrollbarWidth: 'thin' }}>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredProducts.map(product => {
              const currentPrice = calculateProductPrice(product);
              const metal = metalTypes.find(m => m.id === product.metal_type_id);
              const isOutOfStock = (Number(product.stock_qty) || 0) <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`group p-2.5 sm:p-3 rounded-xl bg-white border shadow-2xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between select-none cursor-pointer active:scale-[0.99] hover:-translate-y-0.5 ${
                    isOutOfStock
                      ? 'border-amber-200/90 bg-amber-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="relative rounded-lg overflow-hidden mb-2 aspect-square bg-slate-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-white/90 text-amber-800 border border-amber-200 shadow-2xs backdrop-blur-xs">
                          {metal?.name.split(' ')[0]}
                        </span>
                        {isOutOfStock && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white shadow-2xs">
                            {isKhmer ? 'កុម្ម៉ង់' : 'Pre-Order'}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-1.5 right-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-white/95 text-amber-950 border border-amber-300/60 shadow-2xs backdrop-blur-xs">
                          {((product.net_weight || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug group-hover:text-amber-800 transition-colors" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-0.5 font-mono">
                      <span className="truncate max-w-[85px]">{product.code_sku}</span>
                      {isOutOfStock ? (
                        <span className="text-amber-700 font-bold bg-amber-100/80 px-1 py-0.2 rounded text-[9.5px]">
                          {isKhmer ? 'អស់ស្តុក' : 'Out (0)'}
                        </span>
                      ) : (
                        <span className={product.stock_qty <= 2 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                          {product.stock_qty} {t('pos.inStockUnit', 'in stock')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                    <div>
                      <div className="text-[9px] text-slate-400 leading-none mb-0.5">{t('catalog.livePrice', 'Live Atelier Price')}</div>
                      <div className="text-xs font-bold font-mono text-amber-700">
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-all active:scale-95 shadow-2xs ${
                        isOutOfStock
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                      }`}
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" />
                      {isOutOfStock ? (isKhmer ? 'កុម្ម៉ង់' : 'Pre-Order') : t('pos.add', 'Add')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Area: Active POS Ticket / Cart (Compact Width: 4 cols on LG, 3 cols on XL) - Fixed Full Height */}
      <div
        id="active-pos-ticket"
        className="lg:col-span-4 xl:col-span-3 2xl:col-span-3 h-full min-h-0 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-3xl p-3.5 sm:p-4 flex flex-col overflow-hidden transition-all relative"
      >
        {/* Top Gold Subtle Accent Line */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none" />

        {/* Ticket Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 font-serif text-lg font-bold text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 shrink-0">
              <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="tracking-tight">{isKhmer ? 'កន្ត្រកបញ្ជាទិញ (POS)' : 'Active POS Ticket'}</span>
              {cart.length > 0 && (
                <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                  {cart.reduce((sum, item) => sum + item.qty, 0)} {isKhmer ? 'មុខ' : (cart.reduce((sum, item) => sum + item.qty, 0) === 1 ? 'item' : 'items')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1.5 cursor-pointer hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                title={isKhmer ? 'សម្អាតកន្ត្រកទាំងមូល' : 'Clear all items from ticket'}
              >
                {isKhmer ? 'សម្អាត' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Customer Selector Card */}
        <div className="shrink-0 my-2.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('pos.selectClient', 'Select Customer')}</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAddCustomerModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 px-2 py-0.5 rounded-lg cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              <FontAwesomeIcon icon={faUserPlus} className="w-3 h-3 text-amber-600" />
              <span>{isKhmer ? '+ អតិថិជនថ្មី' : '+ New Customer'}</span>
            </button>
          </div>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none font-medium cursor-pointer shadow-2xs transition-all"
          >
            <option value="">{t('pos.walkInGuest', 'Walk-in Guest')}</option>
            <option value="__NEW__" className="font-bold text-amber-700 bg-amber-50">
              {isKhmer ? '+ បញ្ចូលអតិថិជនថ្មី...' : '+ Add New Customer...'}
            </option>
            {customers.map(c => {
              const effRate = getCustomerEffectiveDiscountRate(c);
              const tierName = c.tier || 'Standard';
              return (
                <option key={c.id} value={c.id}>
                  {c.name} — {tierName} {effRate > 0 ? `(${effRate}% Privilege)` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Cart Item List - Scrollable inside ticket */}
        <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-1 my-1" style={{ scrollbarWidth: 'thin' }}>
          {cart.length === 0 ? (
            <div className="h-full min-h-[160px] flex flex-col items-center justify-center py-8 text-center text-slate-400 text-xs px-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-slate-100 border border-amber-200/60 flex items-center justify-center text-amber-600/70 mb-3 shadow-inner">
                <FontAwesomeIcon icon={faCartShopping} className="w-6 h-6" />
              </div>
              <p className="font-serif font-bold text-slate-700 text-sm mb-0.5">
                {isKhmer ? 'កន្ត្រកទំនិញទទេ' : 'Your cart is empty'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-[200px]">
                {t('pos.emptyCart', 'Select jewelry pieces from the catalog to build ticket')}
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white hover:bg-amber-50/30 border border-slate-200/80 hover:border-amber-300/80 transition-all duration-200 flex items-center justify-between gap-3 text-xs shadow-xs hover:shadow-md group relative"
              >
                {/* Product Thumbnail Image */}
                <div className="relative w-12 h-12 shrink-0">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs">
                    <img
                      src={item.image || fallbackImg}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => { e.target.src = fallbackImg; }}
                    />
                  </div>
                  {item.qty > 1 && (
                    <span className="absolute -bottom-1 -right-1 bg-amber-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full shadow-xs border border-white z-10">
                      x{item.qty}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 group-hover:text-amber-950 transition-colors truncate leading-snug">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-sans font-medium">{item.code_sku}</span>
                    <span>•</span>
                    <span className="font-bold text-amber-950 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10.5px]">
                      {((item.net_weight || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">({item.net_weight}g)</span>
                  </div>
                  <div className="text-xs text-amber-800 font-bold font-mono mt-1">
                    ${(item.calculatedPrice * item.qty).toFixed(2)}
                    {item.qty > 1 && (
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        (${item.calculatedPrice.toFixed(2)} ea)
                      </span>
                    )}
                  </div>

                  {/* Status Toggle Pill for each cart item */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {(() => {
                      const productStock = Number(item.stock_qty) || 0;
                      const exceedsStock = item.qty > productStock;
                      const isPending = item.status === 'pending' || exceedsStock;

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (exceedsStock) {
                              showToast(
                                isKhmer
                                  ? `ចំនួន ${item.qty} លើសពីស្តុកដែលមាន (${productStock})! ត្រូវតែជាការកុម្ម៉ង់កែច្នៃ (Pre-Order)។`
                                  : `Quantity (${item.qty}) exceeds stock (${productStock})! Marked as Pre-Order.`,
                                'warning'
                              );
                              return;
                            }
                            updateCartItemStatus(item.id, item.status === 'pending' ? 'completed' : 'pending');
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10.5px] font-semibold border cursor-pointer transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                            isPending
                              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                          }`}
                          title={
                            exceedsStock
                              ? (isKhmer ? `លើសស្តុក (${productStock}) — បញ្ជាកែច្នៃ (Pre-Order)` : `Exceeds available stock (${productStock}) — Pre-Order Required`)
                              : (isKhmer ? 'ចុចដើម្បីប្តូរស្ថានភាពទំនិញ (រួចរាល់ ↔ រង់ចាំកែ)' : 'Click to toggle item status (Ready ↔ Pending)')
                          }
                        >
                          <FontAwesomeIcon icon={isPending ? faClock : faCircleCheck} className={`w-3 h-3 shrink-0 ${isPending ? 'text-amber-600' : 'text-emerald-600'}`} />
                          <span className="whitespace-nowrap">
                            {exceedsStock
                              ? (isKhmer ? 'កុម្ម៉ង់ (Pre-Order)' : 'Pre-Order')
                              : (item.status === 'pending'
                                  ? (isKhmer ? 'រង់ចាំកែ' : 'Pending')
                                  : (isKhmer ? 'យកភ្លាម' : 'Ready'))}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 shadow-2xs p-0.5">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, item.qty - 1)}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg cursor-pointer transition-colors"
                      title={isKhmer ? 'បន្ថយ' : 'Decrease'}
                    >
                      <FontAwesomeIcon icon={faMinus} className="w-2.5 h-2.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          updateCartQty(item.id, val);
                        }
                      }}
                      className="w-7 text-center font-mono text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, item.qty + 1)}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg cursor-pointer transition-colors"
                      title={isKhmer ? 'បន្ថែម' : 'Increase'}
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                    title={isKhmer ? 'លុបចេញពីកន្ត្រក' : 'Remove from ticket'}
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Summary Card */}
        <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs font-mono shrink-0 mt-auto">
          {/* Total Gold Weight Pill */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
            <span className="font-sans font-bold text-slate-700 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faScaleBalanced} className="text-amber-600 w-3 h-3" />
              <span>{t('pos.totalWeightChi', 'Total Weight (Chi):')}</span>
            </span>
            <span className="font-bold text-amber-950 font-mono">
              {totalWeightChi.toFixed(2)} {isKhmer ? 'ជី' : 'Chi'} <span className="text-slate-400 font-normal text-[10px]">({totalWeightGrams.toFixed(2)}g)</span>
            </span>
          </div>

          <div className="flex justify-between text-slate-600 px-1">
            <span>{t('pos.subtotal', 'Metal & Labor Subtotal')}:</span>
            <span className="font-bold">${subtotal.toFixed(2)}</span>
          </div>

          {/* Clean & Interactive Discount Row on Active POS Ticket */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowQuickDiscountMenu(prev => !prev)}
              className="w-full flex justify-between items-center text-slate-700 px-2.5 py-1.5 hover:bg-amber-50/70 transition-colors cursor-pointer text-left text-xs"
              title={isKhmer ? 'ចុចដើម្បីកែប្រែការបញ្ចុះតម្លៃ' : 'Click to adjust discount'}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <FontAwesomeIcon icon={faPercent} className="text-amber-600 w-3 h-3 shrink-0" />
                <span className="font-semibold">{t('pos.discount', 'Discount')}:</span>
                {activePromotion ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 truncate max-w-[130px]" title={activePromotion.name}>
                    <FontAwesomeIcon icon={faGift} className="w-2 h-2 text-emerald-600 shrink-0" />
                    <span className="truncate">{activePromotion.name} (-{activePromotion.discount_value}{activePromotion.discount_type === 'percent' ? '%' : '$'})</span>
                  </span>
                ) : (
                  selectedCustomer?.tier && selectedCustomer.tier !== 'Standard' && discountPercent > 0 ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <FontAwesomeIcon icon={faCrown} className="w-2 h-2 text-amber-600 shrink-0" />
                      <span>{selectedCustomer.tier} ({discountPercent}%)</span>
                    </span>
                  ) : (
                    discountPercent > 0 ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                        {discountPercent}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal hover:text-amber-700 underline underline-offset-2">
                        {isKhmer ? '+ ជ្រើសរើស' : '+ Select'}
                      </span>
                    )
                  )
                )}
              </span>
              <span className={`font-mono font-bold text-xs ${discountAmount > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                {discountAmount > 0 ? `-$${discountAmount.toFixed(2)}` : '$0.00'}
              </span>
            </button>

            {/* Expandable Inline Quick Discount Tray */}
            {showQuickDiscountMenu && (
              <div className="p-2.5 bg-white border-t border-slate-200/80 space-y-2 animate-fadeIn text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-600">
                    {isKhmer ? 'បញ្ចុះតម្លៃរហ័ស (Quick Discount):' : 'Quick Discount:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDiscountMode('percent')}
                      className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded cursor-pointer ${discountMode === 'percent' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountMode('fixed')}
                      className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded cursor-pointer ${discountMode === 'fixed' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      $
                    </button>
                  </div>
                </div>

                {/* Preset Pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPromotionId('auto');
                      setCustomDiscountVal(0);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                      selectedPromotionId === 'auto'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ⚡ Auto
                  </button>

                  {discountMode === 'percent' ? (
                    [0, 2, 3, 5, 10, 15].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setSelectedPromotionId(pct === 0 ? 'none' : 'custom');
                          setDiscountMode('percent');
                          setCustomDiscountVal(pct);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold cursor-pointer transition-all ${
                          (pct === 0 && selectedPromotionId === 'none') || (selectedPromotionId === 'custom' && Number(customDiscountVal) === pct)
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-900 border border-slate-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))
                  ) : (
                    [0, 5, 10, 20, 50].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedPromotionId(amt === 0 ? 'none' : 'custom');
                          setDiscountMode('fixed');
                          setCustomDiscountVal(amt);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold cursor-pointer transition-all ${
                          (amt === 0 && selectedPromotionId === 'none') || (selectedPromotionId === 'custom' && Number(customDiscountVal) === amt)
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-900 border border-slate-200'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))
                  )}
                </div>

                {/* Custom input */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">{isKhmer ? 'បញ្ចូលផ្ទាល់:' : 'Custom:'}</span>
                  <input
                    type="number"
                    min="0"
                    max={discountMode === 'percent' ? 100 : subtotal}
                    step="any"
                    value={selectedPromotionId === 'custom' ? customDiscountVal : ''}
                    placeholder={discountMode === 'percent' ? 'e.g. 8%' : 'e.g. $25'}
                    onChange={(e) => {
                      setSelectedPromotionId('custom');
                      setCustomDiscountVal(e.target.value);
                    }}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickDiscountMenu(false)}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-bold rounded-lg cursor-pointer"
                  >
                    {isKhmer ? 'យល់ព្រម' : 'Done'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between text-slate-600 px-1">
            <span>{t('pos.tax', 'Sales Tax')} ({taxRate}%):</span>
            <span className="font-bold">+${taxAmount.toFixed(2)}</span>
          </div>

          {/* Grand Total Area (Matching Daily Metal Fix Valuation Box) */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl p-3.5 shadow-md flex justify-between items-center">
            <div>
              <span className="text-[11px] font-medium text-amber-100 uppercase tracking-wider block">
                {t('pos.grandTotal', 'Grand Total')}
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-200 block mt-0.5">
                {grandTotalKhr.toLocaleString()} {isKhmer ? '៛ KHR' : 'KHR'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight block">
                ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-sans font-normal text-amber-200 ml-1">USD</span>
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Button Bar: Quick Status + Main Checkout */}
        <div className="shrink-0 mt-3 grid grid-cols-12 gap-2">
          {/* Quick Item Status Button */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleOpenStatusModal}
            className="col-span-4 py-2.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold rounded-2xl text-xs flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-2xs"
            title={isKhmer ? 'កំណត់ស្ថានភាពការលក់ & មុខទំនិញ' : 'Configure Sale & Item Statuses'}
          >
            <span className="flex items-center gap-1 text-[11px]">
              <FontAwesomeIcon icon={faBoxesStacked} className="text-amber-700" />
              <span>{isKhmer ? 'ស្ថានភាព' : 'Status'}</span>
            </span>
            <span className="text-[10px] text-amber-800 font-normal truncate max-w-full px-1">
              {cart.some(i => i.status === 'pending') ? (isKhmer ? 'រង់ចាំកែ' : 'Pending') : (isKhmer ? 'រួចរាល់' : 'Ready')}
            </span>
          </button>

          {/* Primary Checkout Button: opens Modal 1 (Status) */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleOpenStatusModal}
            className="col-span-8 py-2.5 px-3 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-lg shadow-amber-500/25 cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <span>{isKhmer ? 'បន្តការលក់ & បង់ប្រាក់' : 'Checkout & Pay'}</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ស្ថានភាពការលក់ & មុខទំនិញ (Sale & Item Status Modal)              */}
      {/* ========================================================================= */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
            {/* Header with Step Indicator */}
            <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <span className="font-mono text-xs font-black">1/2</span>
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {isKhmer ? 'ស្ថានភាពការលក់ & មុខទំនិញ' : 'Order & Item Statuses'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'ជំហានទី ១: កំណត់ស្ថានភាពការលក់ និងទំនិញនីមួយៗ' : 'Step 1 of 2: Set overall order & individual item statuses'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Scrollable Modal 1 Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* 1. Overall Sale Order Status */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faBoxesStacked} className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isKhmer ? 'ស្ថានភាពការលក់សរុប (Overall Sale Status):' : 'Overall Sale Status:'}</span>
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    saleStatus === 'completed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : (saleStatus === 'pending'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300')
                  }`}>
                    {saleStatus === 'completed'
                      ? (isKhmer ? 'បានបញ្ចប់' : 'Completed')
                      : (saleStatus === 'pending'
                        ? (isKhmer ? 'កំពុងរង់ចាំ' : 'Pending')
                        : (saleStatus === 'cancelled' ? (isKhmer ? 'បានបោះបង់' : 'Cancelled') : saleStatus))}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSaleStatus('completed');
                      setCart(prev => prev.map(i => ({ ...i, status: 'completed' })));
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      saleStatus === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'បានបញ្ចប់' : 'Completed'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaleStatus('pending');
                      setCart(prev => prev.map(i => ({ ...i, status: 'pending' })));
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      saleStatus === 'pending'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={faHourglassHalf} className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'កំពុងរង់ចាំ' : 'Pending'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaleStatus('cancelled');
                      setCart(prev => prev.map(i => ({ ...i, status: 'cancelled' })));
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      saleStatus === 'cancelled'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:border-rose-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={faBan} className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'បានបោះបង់' : 'Cancelled'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Individual Item Statuses */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faGem} className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isKhmer ? 'ស្ថានភាពមុខទំនិញនីមួយៗ (Per-Item Status):' : 'Per-Item Status:'}</span>
                  </label>
                  <span className="text-[10px] text-slate-600">({cart.length} {isKhmer ? 'មុខទំនិញ' : 'items'})</span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {cart.map((item, idx) => (
                    <div key={item.id || idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-800 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-600 font-mono flex items-center gap-2">
                          <span>{item.code || `PROD-${item.id}`}</span>
                          <span>•</span>
                          <span>{item.qty} {item.unit || 'pcs'}</span>
                          <span>•</span>
                          <span className="font-bold text-amber-700">${Number(item.subtotal || item.price * item.qty).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setCart(prev => prev.map((ci, cidx) => cidx === idx ? { ...ci, status: 'completed' } : ci));
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            (item.status || 'completed') === 'completed'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                          }`}
                        >
                          {isKhmer ? 'រួចរាល់' : 'Completed'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCart(prev => prev.map((ci, cidx) => cidx === idx ? { ...ci, status: 'pending' } : ci));
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            item.status === 'pending'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          {isKhmer ? 'រង់ចាំ' : 'Pending'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCart(prev => prev.map((ci, cidx) => cidx === idx ? { ...ci, status: 'cancelled' } : ci));
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            item.status === 'cancelled'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                          }`}
                        >
                          {isKhmer ? 'បោះបង់' : 'Cancelled'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pinned Modal 1 Footer */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <span>{isKhmer ? 'បន្តទៅការទូទាត់ប្រាក់' : 'Next: Payment Tender'}</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ការទូទាត់ប្រាក់ & លុយកក់ (Payment & Deposit Modal)                */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
            {/* Header with Step Indicator */}
            <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 shrink-0">
                  <span className="font-mono text-xs font-black">2/2</span>
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {t('pos.finalizePayment', 'Payment Tender & Deposit')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'ជំហានទី ២: ជ្រើសរើសរូបិយប័ណ្ណ លុយកក់ និងវិធីទូទាត់ប្រាក់' : 'Step 2 of 2: Select currency, deposit & tender method'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Scrollable Modal 2 Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* Current Order Status Banner with Quick Edit Back-link */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">{isKhmer ? 'ស្ថានភាព:' : 'Order Status:'}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] border ${
                    saleStatus === 'completed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : (saleStatus === 'pending'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300')
                  }`}>
                    {saleStatus === 'completed'
                      ? (isKhmer ? 'បានបញ្ចប់ (Completed)' : 'Completed')
                      : (saleStatus === 'pending'
                        ? (isKhmer ? 'កំពុងរង់ចាំ (Pending)' : 'Pending')
                        : (isKhmer ? 'បានបោះបង់ (Cancelled)' : 'Cancelled'))}
                  </span>
                  {cart.some(i => i.status === 'pending') && (
                    <span className="text-[10px] text-amber-800 font-medium hidden sm:inline">
                      ({cart.filter(i => i.status === 'pending').length} {isKhmer ? 'មុខទំនិញរង់ចាំកែ' : 'item(s) pending'})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleBackToStatus}
                  className="text-xs text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                >
                  {isKhmer ? 'កែប្រែ' : 'Edit'}
                </button>
              </div>

              {/* Total Due Banner with Financial Summary Breakdown */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200">
                <div className="text-center pb-2 border-b border-amber-200/80">
                  <span className="text-xs text-amber-900/80 uppercase font-semibold tracking-wider block">
                    {t('pos.totalDue', 'Total Amount Due')}
                  </span>
                  <div className="mt-0.5">
                    <span className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-950 block">
                      ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-800 block mt-0.5">
                      ≈ ៛{grandTotalKhr.toLocaleString()} KHR
                    </span>
                  </div>
                </div>

                {/* Subtotal / Discount / Tax Ledger */}
                <div className="pt-2 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                  <div className="bg-white/70 p-1.5 rounded-lg border border-amber-200/60">
                    <span className="text-[10px] text-slate-500 block font-sans">{isKhmer ? 'សរុបដើម' : 'Subtotal'}</span>
                    <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/70 p-1.5 rounded-lg border border-amber-200/60">
                    <span className="text-[10px] text-emerald-700 block font-sans font-semibold">
                      {isKhmer ? 'បញ្ចុះ' : 'Discount'} ({discountPercent}%)
                    </span>
                    <span className="font-bold text-emerald-700">-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/70 p-1.5 rounded-lg border border-amber-200/60">
                    <span className="text-[10px] text-slate-500 block font-sans">{isKhmer ? 'ពន្ធ' : 'Tax'} ({taxRate}%)</span>
                    <span className="font-bold text-slate-800">+${taxAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Promotions & Discounts Manager (Inside Modal 2) */}
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5">
                <div className="flex justify-between items-center text-slate-700">
                  <div className="flex items-center gap-1.5 font-sans min-w-0 flex-1 mr-2">
                    <FontAwesomeIcon icon={faPercent} className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-bold text-slate-800 text-[11.5px] truncate">
                      {isKhmer ? 'បញ្ចុះតម្លៃ / ប្រម៉ូសិន:' : 'Discount / Promo:'}
                    </span>
                    {activePromotion ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs truncate">
                        <FontAwesomeIcon icon={faGift} className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{activePromotion.name} (-{activePromotion.discount_value}{activePromotion.discount_type === 'percent' ? '%' : '$'})</span>
                      </span>
                    ) : (
                      selectedCustomer?.tier && selectedCustomer.tier !== 'Standard' && (selectedPromotionId === 'vip' || selectedPromotionId === 'auto') && discountPercent > 0 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/90 text-amber-950 border border-amber-300 shadow-2xs shrink-0 flex items-center gap-1">
                          <FontAwesomeIcon icon={faCrown} className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                          <span>{selectedCustomer.tier} VIP ({selectedCustomer.discount_rate}%)</span>
                        </span>
                      ) : null
                    )}
                  </div>

                  {/* Input + Mode Toggle (% / $) + Amount Display */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="inline-flex items-center bg-white border border-amber-300 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountMode('percent');
                          setSelectedPromotionId('custom');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                          discountMode === 'percent' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Percentage discount (%)"
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountMode('fixed');
                          setSelectedPromotionId('custom');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                          discountMode === 'fixed' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Fixed dollar discount ($)"
                      >
                        $
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={discountMode === 'percent' ? '100' : (subtotal || '999999')}
                        step={discountMode === 'percent' ? '0.5' : '1'}
                        value={selectedPromotionId === 'custom' ? customDiscountVal : (discountMode === 'percent' ? discountPercent : discountAmount)}
                        onChange={(e) => {
                          setSelectedPromotionId('custom');
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setCustomDiscountVal(discountMode === 'percent' ? Math.min(100, val) : Math.min(subtotal, val));
                        }}
                        className="w-12 bg-transparent text-center font-mono font-bold text-xs text-slate-900 focus:outline-none px-0.5"
                        title={isKhmer ? 'បញ្ចូលចំនួនបញ្ចុះតម្លៃ' : 'Enter discount value'}
                      />
                    </div>

                    <span className={`font-mono font-bold text-xs min-w-14 text-right ${discountAmount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                      -${discountAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Promotions Quick Selectors & Active Promos List */}
                <div className="space-y-1.5 pt-1.5 border-t border-amber-200/70 text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-sans font-bold text-amber-900 flex items-center gap-1 shrink-0">
                      <FontAwesomeIcon icon={faTag} className="w-2.5 h-2.5 text-amber-600" />
                      <span>{isKhmer ? 'ប្រម៉ូសិន:' : 'Promos:'}</span>
                    </span>

                    {/* Auto Best Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPromotionId('auto');
                        setCustomDiscountVal(0);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        selectedPromotionId === 'auto'
                          ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500'
                          : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
                      }`}
                      title={isKhmer ? 'អនុវត្តប្រម៉ូសិនដែលល្អបំផុតដោយស្វ័យប្រវត្តិ' : 'Auto-apply best matching promotion'}
                    >
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="w-2.5 h-2.5" />
                      <span>{isKhmer ? 'ស្វ័យប្រវត្តិ' : 'Auto Best'}</span>
                    </button>

                    {/* All Active Store Promotions */}
                    {allActivePromotions.map(promo => {
                      const isEligible = applicablePromotions.some(p => p.id === promo.id);
                      const isManuallySelected = String(selectedPromotionId) === String(promo.id);
                      const isAutoApplied = selectedPromotionId === 'auto' && activePromotion?.id === promo.id;
                      return (
                        <button
                          key={promo.id}
                          type="button"
                          onClick={() => {
                            setSelectedPromotionId(promo.id);
                            setCustomDiscountVal(0);
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            isManuallySelected
                              ? 'bg-amber-600 text-white shadow-2xs ring-1 ring-amber-500'
                              : isAutoApplied
                                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500'
                                : isEligible
                                  ? 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-300'
                                  : 'bg-white/70 text-slate-500 hover:bg-white border border-slate-200 opacity-80'
                          }`}
                          title={promo.description || promo.name}
                        >
                          <FontAwesomeIcon icon={faGift} className="w-2.5 h-2.5" />
                          <span>{promo.name} (-{promo.discount_value}{promo.discount_type === 'percent' ? '%' : '$'})</span>
                          {isAutoApplied && <span className="text-[9px] bg-emerald-700/80 text-white px-1 py-0.2 rounded-sm ml-0.5">✓ Auto</span>}
                        </button>
                      );
                    })}

                    {/* Customer VIP Privilege Tier Chip */}
                    {selectedCustomer?.tier && selectedCustomer.tier !== 'Standard' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPromotionId('vip');
                          setCustomDiscountVal(0);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          selectedPromotionId === 'vip'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
                        }`}
                      >
                        <FontAwesomeIcon icon={faCrown} className="w-2.5 h-2.5 text-amber-600" />
                        <span>{selectedCustomer.tier} ({selectedCustomer.discount_rate}%)</span>
                      </button>
                    )}

                    {/* Clear / No Discount Button */}
                    {(selectedPromotionId !== 'none' || discountAmount > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPromotionId('none');
                          setCustomDiscountVal(0);
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 cursor-pointer transition-all"
                        title={isKhmer ? 'សម្អាតការបញ្ចុះតម្លៃ' : 'Clear discount'}
                      >
                        <FontAwesomeIcon icon={faXmark} className="w-2 h-2" />
                        <span>{isKhmer ? 'គ្មាន' : 'None'}</span>
                      </button>
                    )}
                  </div>

                  {/* Quick % and $ Presets */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    <span className="text-[10px] font-sans font-medium text-slate-500 mr-0.5">{isKhmer ? 'ជ្រើសរើស:' : 'Quick:'}</span>
                    {discountMode === 'percent' ? (
                      [0, 2, 3, 5, 10, 15].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setSelectedPromotionId('custom');
                            setDiscountMode('percent');
                            setCustomDiscountVal(pct);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all ${
                            selectedPromotionId === 'custom' && Number(customDiscountVal) === pct
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs'
                              : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))
                    ) : (
                      [0, 5, 10, 20, 50, 100].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setSelectedPromotionId('custom');
                            setDiscountMode('fixed');
                            setCustomDiscountVal(amt);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all ${
                            selectedPromotionId === 'custom' && Number(customDiscountVal) === amt
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs'
                              : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 1. Payment Terms: Paid vs Partial/Deposit (លុយកក់) vs Pending */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold flex items-center justify-between">
                  <span>{t('pos.paymentStatus', isKhmer ? 'លក្ខខណ្ឌនៃការទូទាត់:' : 'Payment Terms & Status:')}</span>
                  {paymentStatus === 'partial' && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      {isKhmer ? 'កក់ប្រាក់ (Deposit)' : 'Partial / Deposit'}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('paid')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-center transition-all ${
                      paymentStatus === 'paid'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className={`w-4 h-4 ${paymentStatus === 'paid' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-[11px]">{isKhmer ? 'បង់ផ្ដាច់ (Paid)' : 'Full Payment'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStatus('partial');
                      if (!depositAmount) {
                        const total = paymentCurrency === 'KHR' ? grandTotalKhr : grandTotal;
                        const initialDep = paymentCurrency === 'KHR' ? Math.round(total * 0.3) : Math.round(total * 0.3 * 100) / 100;
                        setDepositAmount(initialDep);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-center transition-all ${
                      paymentStatus === 'partial'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs ring-1 ring-amber-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCoins} className={`w-4 h-4 ${paymentStatus === 'partial' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span className="text-[11px]">{isKhmer ? 'លុយកក់ (Deposit)' : 'Deposit / Partial'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus('pending')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-center transition-all ${
                      paymentStatus === 'pending'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={faClock} className={`w-4 h-4 ${paymentStatus === 'pending' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-[11px]">{isKhmer ? 'នៅជំពាក់ (Pending)' : 'Unpaid / Later'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Deposit Amount Box (shown when paymentStatus === 'partial') */}
              {paymentStatus === 'partial' && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faCoins} className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isKhmer ? 'ចំនួនលុយកក់ (Deposit Amount):' : 'Deposit Amount Tendered:'}</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold text-amber-900">
                      {paymentCurrency}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold font-mono text-base">
                      {paymentCurrency === 'KHR' ? '៛' : '$'}
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={paymentCurrency === 'KHR' ? grandTotalKhr : grandTotal}
                      step={paymentCurrency === 'KHR' ? '100' : '0.01'}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={paymentCurrency === 'KHR' ? '500000' : '200.00'}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 text-base focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">{isKhmer ? 'កម្រិតភាគរយ:' : 'Quick %:'}</span>
                    {[20, 30, 50, 70].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePresetDeposit(pct)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-amber-200 text-amber-900 hover:bg-amber-100 cursor-pointer transition-colors shadow-2xs font-mono"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  {/* Deposit vs Remaining Balance Calculation */}
                  <div className="pt-2 border-t border-amber-200/80 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 font-medium block">{isKhmer ? 'លុយកក់បង់រួច' : 'Deposit Paid'}:</span>
                      <span className="font-bold text-emerald-900 text-sm block mt-0.5">
                        {paymentCurrency === 'KHR' ? `៛${(Number(depositAmount) || 0).toLocaleString()}` : `$${(Number(depositAmount) || 0).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                      <span className="text-[10px] text-rose-700 font-medium block">{isKhmer ? 'សមតុល្យនៅខ្វះ' : 'Remaining Due'}:</span>
                      <span className="font-bold text-rose-900 text-sm block mt-0.5">
                        {paymentCurrency === 'KHR' ? `៛${remainingInCurrentCurrency.toLocaleString()}` : `$${remainingInCurrentCurrency.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {!selectedCustomer && (
                    <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-sans flex items-center justify-between gap-2">
                      <span className="leading-tight flex items-start gap-1.5">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <span>{isKhmer ? 'ចំណាំ: សម្រាប់លុយកក់ សូមជ្រើសរើស ឬចុះឈ្មោះអតិថិជន ដើម្បីងាយស្រួលតាមដាន' : 'Note: Assigning a customer is strongly recommended for deposit tracking.'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(true)}
                        className="shrink-0 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10.5px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs whitespace-nowrap"
                      >
                        {isKhmer ? '+ ចុះឈ្មោះអតិថិជន' : '+ Add Customer'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Currency Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">{t('pos.currencyTendered', 'Tender Currency:')}</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCurrencyToggle('USD')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer font-bold transition-all ${
                      paymentCurrency === 'USD'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-xs ring-1 ring-amber-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono text-base text-amber-600 font-extrabold">$</span>
                    <span>USD (US Dollar)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCurrencyToggle('KHR')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer font-bold transition-all ${
                      paymentCurrency === 'KHR'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-xs ring-1 ring-amber-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono text-base text-amber-600 font-extrabold">៛</span>
                    <span>KHR (Khmer Riel)</span>
                  </button>
                </div>
              </div>

              {/* 4. Payment Tender Method */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">{t('pos.tenderMethod', 'Payment Tender Method:')}</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'Credit Card', label: isKhmer ? 'កាតធនាគារ (Card)' : 'Credit Card', icon: faCreditCard },
                    { id: 'Cash', label: isKhmer ? 'សាច់ប្រាក់ (Cash)' : 'Cash', icon: faMoneyBillWave },
                    { id: 'Bank Transfer', label: isKhmer ? 'ផ្ទេរតាមធនាគារ' : 'Bank Transfer', icon: faCircleCheck },
                    { id: 'KHQR', label: isKhmer ? 'បាគង KHQR' : 'KHQR', icon: faQrcode },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-center transition-all ${paymentMethod === method.id
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs ring-1 ring-amber-400'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      <FontAwesomeIcon icon={method.icon} className="w-4 h-4 text-amber-600" />
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Notes / Pickup memo */}
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">
                  {isKhmer ? 'សម្គាល់ / កាលបរិច្ឆេទមកយក (Optional):' : 'Notes / Pickup Memo (Optional):'}
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={paymentStatus === 'partial' ? (isKhmer ? 'ឧ: កក់ប្រាក់ មកយកថ្ងៃ...' : 'e.g. Deposit paid, customer pickup next week') : (isKhmer ? 'សម្គាល់បន្ថែម...' : 'Additional notes...')}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Pinned Modal 2 Footer */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleBackToStatus}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
                <span>{isKhmer ? 'ត្រឡប់ក្រោយ (Back)' : 'Back to Status'}</span>
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                {paymentStatus === 'partial'
                  ? (isKhmer ? 'កក់លុយ & ចេញវិក្កយបត្រ' : 'Record Deposit & Print')
                  : (paymentStatus === 'pending'
                    ? (isKhmer ? 'កត់ត្រាជំពាក់' : 'Record Pending Sale')
                    : t('pos.confirmSale', 'Confirm & Record Sale'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ចុះឈ្មោះអតិថិជនថ្មីក្នុង POS (Add New Customer Modal)               */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={faUserPlus} className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {isKhmer ? 'ចុះឈ្មោះអតិថិជនថ្មី (POS)' : 'New Customer Registration'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'បញ្ចូលព័ត៌មានអតិថិជនដើម្បីទទួលបាន VIP Discount & ពិន្ទុ' : 'Create profile and assign directly to active POS ticket.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title={isKhmer ? 'បិទ' : 'Close'}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form noValidate onSubmit={handleSaveNewCustomer} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
                {/* Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {isKhmer ? 'ឈ្មោះអតិថិជន (Customer Name)' : 'Customer Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.name}
                    onChange={(e) => {
                      setNewCustomerForm(prev => ({ ...prev, name: e.target.value }));
                      if (custModalErrors.name) setCustModalErrors(prev => ({ ...prev, name: null }));
                    }}
                    placeholder={isKhmer ? 'ឧ: លោកស្រី សុខ ម៉ាលី' : 'e.g. Eleanor Vance'}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold bg-slate-50 border focus:bg-white focus:outline-none transition-all ${
                      custModalErrors.name
                        ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {custModalErrors.name && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{custModalErrors.name}</span>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {isKhmer ? 'លេខទូរស័ព្ទ (Contact Phone)' : 'Phone Number'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.phone}
                    onChange={(e) => {
                      setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }));
                      if (custModalErrors.phone) setCustModalErrors(prev => ({ ...prev, phone: null }));
                    }}
                    placeholder={isKhmer ? 'ឧ: 012 888 999' : 'e.g. +855 12 888 999'}
                    className={`w-full rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-900 font-semibold bg-slate-50 border focus:bg-white focus:outline-none transition-all ${
                      custModalErrors.phone
                        ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {custModalErrors.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{custModalErrors.phone}</span>
                    </div>
                  )}
                </div>

                {/* VIP Tier Auto-Upgrade Indicator */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {isKhmer ? 'កម្រិតសមាជិកភាព VIP (VIP Privilege Tier):' : 'VIP Privilege Tier:'}
                  </label>
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                        <FontAwesomeIcon icon={faUser} className="text-amber-600 w-3 h-3" />
                        <span>{isKhmer ? 'កម្រិតចាប់ផ្តើម: Standard (0%)' : 'Starting Level: Standard (0%)'}</span>
                      </span>
                      <span className="text-[10px] text-amber-900 font-bold bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded-md">
                        {isKhmer ? 'ដំឡើងស្វ័យប្រវត្តិតាមការទិញ' : 'Auto Upgrade on Purchase'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal flex items-start gap-1.5">
                      <FontAwesomeIcon icon={faCircleInfo} className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <span>
                        {isKhmer
                          ? 'កម្រិត VIP និងការបញ្ចុះតម្លៃត្រូវបានដំឡើងស្វ័យប្រវត្តិតាមរយៈទំហំនៃការទិញជាក់ស្តែង៖ Gold ($1k+ = 2%), Platinum ($5k+ = 3%), Diamond VIP ($10k+ = 5%)។'
                          : 'VIP tier level automatically unlocks & upgrades based on cumulative purchases: Gold ($1,000+ = 2%), Platinum ($5,000+ = 3%), Diamond VIP ($10,000+ = 5%).'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {isKhmer ? 'អ៊ីមែល (Email - ស្រេចចិត្ត)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@example.com"
                    className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 font-mono text-xs text-slate-900 font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>

                {/* Address / Studio Notes (Optional) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {isKhmer ? 'អាសយដ្ឋាន / កំណត់ចំណាំ (Address / Note)' : 'Address / Boutique Note'}
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={isKhmer ? 'ឧ: ភ្នំពេញ...' : 'e.g. Phnom Penh, Cambodia'}
                    className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>
              </div>

              {/* Pinned Customer Modal Footer */}
              <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="w-3.5 h-3.5" />
                  <span>{savingCustomer ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុក & ជ្រើសរើស' : 'Save & Select')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRAFTING ORDER REQUIRED MODAL FOR PRE-ORDERS */}
      {craftingPromptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-slate-900">
                  {isKhmer ? 'ការបញ្ជាទិញកុម្ម៉ង់កែច្នៃ (Pre-Order Crafting)' : 'Pre-Order Crafting Required'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isKhmer
                    ? 'វិក្កយបត្រត្រូវបានកត់ត្រាជា Pending ដោយសារទំនិញអស់ពីស្តុក។'
                    : 'Sale recorded as Pending because item(s) are out-of-stock.'}
                </p>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span className="font-semibold">{isKhmer ? 'លេខវិក្កយបត្រ:' : 'Invoice No:'}</span>
                <span className="font-mono font-bold text-amber-950">{craftingPromptModal.sale?.invoice_no}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-semibold">{isKhmer ? 'អតិថិជន:' : 'Customer:'}</span>
                <span className="font-bold text-slate-900">{craftingPromptModal.sale?.customer_name || 'Walk-in Guest'}</span>
              </div>
              <div className="pt-2 border-t border-amber-200/60">
                <div className="text-[11px] font-bold text-slate-600 mb-1">{isKhmer ? 'មុខទំនិញត្រូវកែច្នៃ:' : 'Items to Craft:'}</div>
                {craftingPromptModal.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-amber-200/40 last:border-0 font-medium">
                    <div className="flex flex-col pr-2">
                      <span className="text-slate-900 font-bold">{item.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {isKhmer
                          ? `សរុប: ${item.qty} (កាត់ស្តុក: ${item.in_stock_qty || 0} ➔ ត្រូវកែច្នៃ: ${item.craft_qty || item.qty})`
                          : `Total: ${item.qty} (From Stock: ${item.in_stock_qty || 0} ➔ To Craft: ${item.craft_qty || item.qty})`}
                      </span>
                    </div>
                    <span className="text-amber-900 font-extrabold text-[11px] bg-amber-200/80 border border-amber-300 px-2.5 py-1 rounded-lg shadow-2xs whitespace-nowrap">
                      {isKhmer ? `កែច្នៃ x${item.craft_qty || item.qty}` : `Craft x${item.craft_qty || item.qty}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCircleInfo} className="text-amber-600 w-3.5 h-3.5" />
                <span>{isKhmer ? 'ជំហានបន្ទាប់នៃដំណើរការ:' : 'Next Pipeline Steps:'}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {isKhmer
                  ? '1. បង្កើតប័ណ្ណកែច្នៃ Made Jewelry ➔ 2. ពិនិត្យស្តុក Materials ➔ 3. ទិញចូលពី Supplier (បើខ្វះ) ➔ 4. កែច្នៃរួចកើនស្តុក & ប្រគល់ជូនអតិថិជន'
                  : '1. Create Made Jewelry order ➔ 2. Verify Materials ➔ 3. Procure from Supplier (if low) ➔ 4. Complete & Fulfill'}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={creatingCraftingOrder}
                onClick={() => handleSpawnCraftingOrder(craftingPromptModal.items)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5" />
                <span>{creatingCraftingOrder ? (isKhmer ? 'កំពុងបង្កើត...' : 'Generating...') : (isKhmer ? 'បង្កើតបញ្ជាកែច្នៃ (Made Jewelry)' : 'Create Made Jewelry Order')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal after sale */}
      {activeInvoice && (
        <InvoiceModal
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
        />
      )}
    </div>
  );
};
