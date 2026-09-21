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
  faUserPlus
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
    discountPercent,
    setDiscountPercent,
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
    tier: 'Gold',
    discount_rate: 2.0
  });
  const [activeInvoice, setActiveInvoice] = useState(null);

  // Held Tickets Tray State
  const [pinnedTickets, setPinnedTickets] = useState([]);

  // Pin / Hold current ticket to recall later
  const handlePinTicket = () => {
    if (cart.length === 0) return;
    const newTicket = {
      id: Date.now(),
      cart: [...cart],
      selectedCustomer,
      discountPercent,
      subtotal,
      grandTotal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setPinnedTickets(prev => [newTicket, ...prev]);
    clearCart();
    showToast(isKhmer ? 'បានផ្អាកការបញ្ជាទិញ (Parked Ticket)!' : 'POS ticket parked on hold.', 'info');
  };

  // Restore a pinned ticket back to active cart
  const handleRestoreTicket = (ticket) => {
    setCart(ticket.cart);
    setSelectedCustomer(ticket.selectedCustomer || null);
    setDiscountPercent(ticket.discountPercent || 0);
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
      showToast(isKhmer ? 'កន្ត្រកត្រូវបានសម្អាត!' : 'Cart cleared.', 'info');
    }
  };

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

  // Calculate totals
  const subtotal = cart.reduce((acc, item) => acc + (item.calculatedPrice * item.qty), 0);
  const totalWeightGrams = cart.reduce((acc, item) => acc + ((Number(item.net_weight) || 0) * item.qty), 0);
  const totalWeightChi = totalWeightGrams / 3.75;
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableTotal = subtotal - discountAmount;
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
              ? `🎁 ប្រម៉ូសិន "${promo.name}" ត្រូវបានអនុវត្ត (-${promo.discount_value}${promo.discount_type === 'percent' ? '%' : '$'})!`
              : `🎁 Promotion "${promo.name}" auto-applied (-${promo.discount_value}${promo.discount_type === 'percent' ? '%' : '$'})!`,
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
    if (!customerId) {
      setSelectedCustomer(null);
      setDiscountPercent(0);
      return;
    }
    const customer = customers.find(c => String(c.id) === String(customerId));
    setSelectedCustomer(customer || null);
    if (customer) {
      setDiscountPercent(customer.discount_rate || 0);
    }
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
    if (!newCustomerForm.name.trim()) {
      showToast(isKhmer ? 'សូមបញ្ចូលឈ្មោះអតិថិជន!' : 'Please enter customer name!', 'warning');
      return;
    }
    if (!newCustomerForm.phone.trim()) {
      showToast(isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter customer phone number!', 'warning');
      return;
    }

    setSavingCustomer(true);
    try {
      const created = await addCustomer({
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        email: newCustomerForm.email.trim() || null,
        address: newCustomerForm.address.trim() || null,
        tier: newCustomerForm.tier || 'Gold',
        discount_rate: Number(newCustomerForm.discount_rate) || 2.0,
        loyalty_points: 50
      });

      setSelectedCustomer(created);
      setDiscountPercent(created.discount_rate || 0);
      setShowAddCustomerModal(false);
      setNewCustomerForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        tier: 'Gold',
        discount_rate: 2.0
      });
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
      const finalized = await completeSale(paymentMethod, paymentCurrency, {
        paymentStatus,
        paidAmount: finalPaid,
        notes: paymentNotes,
        saleStatus
      });
      setShowPaymentModal(false);
      if (finalized) {
        setActiveInvoice(finalized);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការទូទាត់ប្រាក់!' : 'Checkout error occurred.', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-12 gap-5 min-h-0">
      {/* Left Area: Product Browser (7 cols on LG, 8 cols on XL) - Independently Scrollable */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 space-y-3 overflow-hidden">
        {/* Header & Filter Bar */}
        <div className="shrink-0 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {cleanQ && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium text-xs">
                  <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('catalog.filterActive', 'Navbar Filter:')} <strong className="font-bold font-mono text-amber-950">"{cleanQ}"</strong></span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 text-slate-400 hover:text-amber-700 p-0.5 rounded transition-colors cursor-pointer"
                    title={t('common.clear', 'Clear')}
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Spot Benchmark Pill */}
              <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 font-bold text-[11px] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-amber-800">{isKhmer ? 'តាមតម្លៃដើម:' : 'Market Spot:'}</span>
                <span className="font-mono font-extrabold text-amber-950">
                  ${Number(liveSpot?.spot_price_per_oz ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz
                </span>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded font-bold">
                  ${Number(liveSpot?.price_per_chi ?? (Number(liveSpot?.spot_price_per_oz ?? 0) / 31.1034768 * 3.75)).toFixed(2)}/{isKhmer ? 'ជី' : 'chi'}
                </span>
              </div>
            </div>

            {/* Metal Karat Quick Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedMetal('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${selectedMetal === 'all'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${selectedMetal === metal.id
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
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${selectedCategory === 'all'
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
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${selectedCategory === cat.id
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid - Independently Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-3" style={{ scrollbarWidth: 'thin' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filteredProducts.map(product => {
              const currentPrice = calculateProductPrice(product);
              const metal = metalTypes.find(m => m.id === product.metal_type_id);

              return (
                <div
                  key={product.id}
                  className="group p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative rounded-xl overflow-hidden mb-3 aspect-square bg-slate-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-amber-800 border border-amber-200 shadow-xs backdrop-blur-sm">
                          {metal?.name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/95 text-amber-950 border border-amber-300/60 shadow-xs backdrop-blur-sm">
                          {((product.net_weight || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>{product.code_sku}</span>
                      <span className={product.stock_qty <= 2 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                        {product.stock_qty} {t('pos.inStockUnit', 'in stock')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">{t('catalog.livePrice', 'Live Atelier Price')}</div>
                      <div className="text-base font-bold font-mono text-amber-700">
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <button
                      disabled={product.stock_qty <= 0}
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-xs"
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                      {t('pos.add', 'Add')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Area: Active POS Ticket / Cart (5 cols on LG, 4 cols on XL) - Fixed Full Height */}
      <div
        id="active-pos-ticket"
        className="lg:col-span-5 xl:col-span-4 h-full min-h-0 bg-white border border-slate-200 shadow-xs rounded-2xl p-4 sm:p-5 flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900">
            <FontAwesomeIcon icon={faBagShopping} className="w-5 h-5 text-amber-600" />
            <span>{isKhmer ? 'កន្ត្រកបញ្ជាទិញ (POS)' : 'Active POS Ticket'}</span>
            {cart.length > 0 && (
              <span className="text-[11px] font-sans font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                {cart.reduce((sum, item) => sum + item.qty, 0)} {isKhmer ? 'មុខ' : (cart.reduce((sum, item) => sum + item.qty, 0) === 1 ? 'item' : 'items')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Hold Ticket to recall later */}
            {cart.length > 0 && (
              <button
                onClick={handlePinTicket}
                className="text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-semibold px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                title={isKhmer ? 'ផ្អាកកន្ត្រកដើម្បីបំរើអតិថិជនផ្សេង' : 'Hold ticket to serve another guest'}
              >
                <FontAwesomeIcon icon={faBookmark} className="w-3.5 h-3.5 text-amber-700" />
                {isKhmer ? 'ផ្អាកសិន' : 'Hold'}
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 cursor-pointer hover:bg-rose-50 rounded-lg transition-colors"
              >
                {isKhmer ? 'សម្អាត' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Held Tickets Tray */}
        {pinnedTickets.length > 0 && (
          <div className="shrink-0 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faBookmark} className="w-3.5 h-3.5 text-amber-600" />
                {isKhmer ? 'កន្ត្រកបានផ្អាក' : 'Held Tickets'} ({pinnedTickets.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {pinnedTickets.map(pt => (
                <div
                  key={pt.id}
                  className="p-2 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-xs shadow-2xs gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Overlapping thumbnail images preview */}
                    <div className="flex -space-x-2 overflow-hidden shrink-0">
                      {pt.cart.slice(0, 3).map((ci, idx) => (
                        <img
                          key={idx}
                          src={ci.image || fallbackImg}
                          alt={ci.name}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover bg-slate-100"
                          onError={(e) => { e.target.src = fallbackImg; }}
                        />
                      ))}
                      {pt.cart.length > 3 && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-800 ring-2 ring-white">
                          +{pt.cart.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 truncate">
                        {pt.selectedCustomer ? pt.selectedCustomer.name : (isKhmer ? 'ភ្ញៀវទូទៅ' : 'Walk-in Guest')} ({pt.cart.length} {isKhmer ? 'មុខ' : 'items'})
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {pt.time} • ${pt.grandTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRestoreTicket(pt)}
                      className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] cursor-pointer"
                    >
                      {isKhmer ? 'បន្តការលក់' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDeletePinnedTicket(pt)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title={isKhmer ? 'លុប' : 'Delete'}
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Selector */}
        <div className="shrink-0 my-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
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
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none font-medium cursor-pointer"
          >
            <option value="">{t('pos.walkInGuest', 'Walk-in Guest')}</option>
            <option value="__NEW__" className="font-bold text-amber-700 bg-amber-50">
              {isKhmer ? '➕ បញ្ចូលអតិថិជនថ្មី... (+ New Customer)' : '➕ Add New Customer...'}
            </option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.tier} ({c.discount_rate}% Privilege)
              </option>
            ))}
          </select>
          {selectedCustomer && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-amber-800 px-1 font-semibold">
              <span>{isKhmer ? 'កម្រិត' : 'Tier'}: {selectedCustomer.tier}</span>
              <span>{isKhmer ? 'ពិន្ទុសន្សំ' : 'Loyalty'}: {selectedCustomer.loyalty_points} {t('customers.pts', 'pts')}</span>
            </div>
          )}
        </div>

        {/* Cart Item List - Scrollable inside ticket */}
        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 my-2" style={{ scrollbarWidth: 'thin' }}>
          {cart.length === 0 ? (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center py-8 text-center text-slate-400 text-xs">
              <FontAwesomeIcon icon={faBagShopping} className="w-8 h-8 text-slate-300 mb-2" />
              <span>{t('pos.emptyCart', 'No jewelry items in register. Select pieces from inventory grid.')}</span>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-200 transition-colors flex items-center justify-between gap-3 text-xs group"
              >
                {/* Product Thumbnail Image */}
                <div className="relative w-12 h-12 shrink-0">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                    <img
                      src={item.image || fallbackImg}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => { e.target.src = fallbackImg; }}
                    />
                  </div>
                  {item.qty > 1 && (
                    <span className="absolute -bottom-1.5 -right-1.5 bg-amber-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full shadow-xs border border-white z-10">
                      x{item.qty}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate leading-snug">{item.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-sans font-medium">{item.code_sku}</span>
                    <span>•</span>
                    <span className="font-bold text-amber-950">{((item.net_weight || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({item.net_weight}g)</span>
                  </div>
                  <div className="text-xs text-amber-800 font-bold font-mono mt-0.5">
                    ${(item.calculatedPrice * item.qty).toFixed(2)}
                    {item.qty > 1 && (
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        (${item.calculatedPrice.toFixed(2)} ea)
                      </span>
                    )}
                  </div>

                  {/* Status Toggle Pill for each cart item */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCartItemStatus(item.id, item.status === 'pending' ? 'completed' : 'pending')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold border cursor-pointer transition-all active:scale-95 ${
                        item.status === 'pending'
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      }`}
                      title={isKhmer ? 'ចុចដើម្បីប្តូរស្ថានភាពទំនិញ (រួចរាល់ ↔ រង់ចាំកែ)' : 'Click to toggle item status (Ready ↔ Pending)'}
                    >
                      <FontAwesomeIcon icon={item.status === 'pending' ? faClock : faCircleCheck} className="w-3 h-3 text-emerald-600" />
                      <span>
                        {item.status === 'pending'
                          ? (isKhmer ? 'រង់ចាំកែ' : 'Pending / Sizing')
                          : (isKhmer ? 'យកភ្លាម (រួចរាល់)' : 'Ready (In-Stock)')}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      onClick={() => updateCartQty(item.id, item.qty - 1)}
                      className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-mono text-xs font-bold text-slate-800">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.id, item.qty + 1)}
                      className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Summary */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-mono shrink-0 mt-auto">
          <div className="flex justify-between text-slate-700 pb-1 border-b border-dashed border-slate-200">
            <span className="font-sans font-medium">{t('pos.totalWeightChi', 'Total Weight (Chi):')}</span>
            <span className="font-bold text-amber-950">{totalWeightChi.toFixed(2)} {isKhmer ? 'ជី' : 'Chi'} <span className="text-slate-400 font-normal text-[10px]">({totalWeightGrams.toFixed(2)}g)</span></span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{t('pos.subtotal', 'Metal & Labor Subtotal')}:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faPercent} className="w-3 h-3" /> {t('pos.vipDiscount', 'VIP Privilege')} ({discountPercent}%):
              </span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>{t('pos.tax', 'Sales Tax')} ({taxRate}%):</span>
            <span>+${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline text-lg font-bold text-slate-900 pt-2 border-t border-slate-200 font-mono">
            <span>{t('pos.grandTotal', 'Grand Total')}:</span>
            <div className="text-right">
              <span className="text-amber-700 font-extrabold block">
                ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-500 font-medium block">
                ៛{grandTotalKhr.toLocaleString()}
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
            className="col-span-4 py-2.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-2xs"
            title={isKhmer ? 'កំណត់ស្ថានភាពការលក់ & មុខទំនិញ' : 'Configure Sale & Item Statuses'}
          >
            <span className="flex items-center gap-1 text-[11px]">
              <FontAwesomeIcon icon={faBoxesStacked} className="text-amber-700" />
              <span>{isKhmer ? 'ស្ថានភាព' : 'Status'}</span>
            </span>
            <span className="text-[10px] text-amber-800 font-normal truncate max-w-full px-1">
              {cart.some(i => i.status === 'pending') ? (isKhmer ? '⏱ រង់ចាំកែ' : 'Pending') : (isKhmer ? '✓ រួចរាល់' : 'Ready')}
            </span>
          </button>

          {/* Primary Checkout Button: opens Modal 1 (Status) */}
          <button
            disabled={cart.length === 0}
            onClick={handleOpenStatusModal}
            className="col-span-8 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl my-8">
            {/* Header with Step Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center justify-center font-mono">
                  1/2
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif leading-tight">
                    {isKhmer ? 'ស្ថានភាពការលក់ & មុខទំនិញ' : 'Order & Item Statuses'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isKhmer ? 'ជំហានទី ១: កំណត់ស្ថានភាពការលក់ និងទំនិញនីមួយៗ' : 'Step 1 of 2: Set overall order & individual item statuses'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

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
                      : (isKhmer ? 'បានបោះបង់' : 'Cancelled'))}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSaleStatus('completed')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-center transition-all ${
                    saleStatus === 'completed'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FontAwesomeIcon icon={faCircleCheck} className={`w-4 h-4 ${saleStatus === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-[11px]">{isKhmer ? 'បានបញ្ចប់ (Completed)' : 'Completed'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleStatus('pending')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-center transition-all ${
                    saleStatus === 'pending'
                      ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs ring-1 ring-amber-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FontAwesomeIcon icon={faClock} className={`w-4 h-4 ${saleStatus === 'pending' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className="text-[11px]">{isKhmer ? 'រង់ចាំ (Pending)' : 'Pending'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleStatus('cancelled')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-center transition-all ${
                    saleStatus === 'cancelled'
                      ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs ring-1 ring-rose-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FontAwesomeIcon icon={faXmark} className={`w-4 h-4 ${saleStatus === 'cancelled' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className="text-[11px]">{isKhmer ? 'បោះបង់ (Cancelled)' : 'Cancelled'}</span>
                </button>
              </div>
            </div>

            {/* 2. Individual Item Statuses (ទៅនីមួយៗ) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isKhmer ? 'ស្ថានភាពមុខទំនិញនីមួយៗ (ទៅនីមួយៗ):' : 'Individual Item Statuses:'}</span>
                </label>
                {/* Bulk status shortcuts */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetAllItemsStatus('completed')}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-colors"
                  >
                    {isKhmer ? 'យកភ្លាមទាំងអស់' : 'All Ready'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllItemsStatus('pending')}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 cursor-pointer transition-colors"
                  >
                    {isKhmer ? 'រង់ចាំកែទាំងអស់' : 'All Pending'}
                  </button>
                </div>
              </div>

              {/* Scrollable Items List */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-56 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-2.5 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={item.image || fallbackImg}
                        alt={item.name}
                        className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-100"
                        onError={(e) => { e.target.src = fallbackImg; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate text-[11px]">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          x{item.qty} • {((item.net_weight || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'} (${(item.calculatedPrice * item.qty).toFixed(2)})
                        </div>
                      </div>
                    </div>

                    {/* Quick Toggle Buttons for each item */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartItemStatus(item.id, 'completed')}
                        className={`px-2 py-1 rounded-md text-[10.5px] font-bold border cursor-pointer transition-all ${
                          (item.status || 'completed') === 'completed'
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        ✓ {isKhmer ? 'យកភ្លាម' : 'Ready'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateCartItemStatus(item.id, 'pending');
                          if (saleStatus === 'completed') setSaleStatus('pending');
                        }}
                        className={`px-2 py-1 rounded-md text-[10.5px] font-bold border cursor-pointer transition-all ${
                          item.status === 'pending'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        ⏱ {isKhmer ? 'រង់ចាំកែ' : 'Pending'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal 1 Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl my-8">
            {/* Header with Step Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-xs flex items-center justify-center font-mono">
                  2/2
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif leading-tight">
                    {t('pos.finalizePayment', 'Payment Tender & Deposit')}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isKhmer ? 'ជំហានទី ២: ជ្រើសរើសរូបិយប័ណ្ណ លុយកក់ និងវិធីទូទាត់ប្រាក់' : 'Step 2 of 2: Select currency, deposit & tender method'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

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
                    ? (isKhmer ? '✓ បានបញ្ចប់ (Completed)' : 'Completed')
                    : (saleStatus === 'pending'
                      ? (isKhmer ? '⏱ កំពុងរង់ចាំ (Pending)' : 'Pending')
                      : (isKhmer ? '✕ បានបោះបង់ (Cancelled)' : 'Cancelled'))}
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

            {/* Total Due Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 text-center">
              <span className="text-xs text-amber-900/80 uppercase font-semibold tracking-wider block">
                {t('pos.totalDue', 'Total Amount Due')}
              </span>
              <div className="mt-1">
                <span className="text-3xl font-mono font-extrabold text-amber-950 block">
                  ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-mono font-bold text-amber-800 block mt-0.5">
                  ≈ ៛{grandTotalKhr.toLocaleString()} KHR
                </span>
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
                    <span className="leading-tight">
                      ⚠️ {isKhmer ? 'ចំណាំ: សម្រាប់លុយកក់ សូមជ្រើសរើស ឬចុះឈ្មោះអតិថិជន ដើម្បីងាយស្រួលតាមដាន' : 'Note: Assigning a customer is strongly recommended for deposit tracking.'}
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

            {/* Modal 2 Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBackToStatus}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
                <span>{isKhmer ? 'ត្រឡប់ក្រោយ (Back)' : 'Back to Status'}</span>
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif leading-tight">
                    {isKhmer ? 'ចុះឈ្មោះអតិថិជនថ្មី (POS)' : 'New Customer Registration'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isKhmer ? 'បញ្ចូលព័ត៌មានអតិថិជនដើម្បីទទួលបាន VIP Discount & ពិន្ទុ' : 'Create profile and assign directly to active POS ticket.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewCustomer} className="space-y-3.5 text-xs">
              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isKhmer ? 'ឈ្មោះអតិថិជន (Customer Name)' : 'Customer Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isKhmer ? 'ឧ: លោកស្រី សុខ ម៉ាលី' : 'e.g. Eleanor Vance'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden font-medium"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isKhmer ? 'លេខទូរស័ព្ទ (Contact Phone)' : 'Phone Number'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={isKhmer ? 'ឧ: 012 888 999' : 'e.g. +855 12 888 999'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden font-mono"
                />
              </div>

              {/* VIP Tier Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isKhmer ? 'កម្រិត VIP & ការបញ្ចុះតម្លៃ (VIP Privilege Tier):' : 'VIP Tier & Discount Privilege:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { tier: 'Gold', discount: 2.0, label: 'Gold (2%)', desc: 'Default VIP' },
                    { tier: 'Platinum', discount: 3.0, label: 'Platinum (3%)', desc: 'High Spender' },
                    { tier: 'Diamond VIP', discount: 5.0, label: 'Diamond (5%)', desc: 'Elite Collector' },
                    { tier: 'Standard', discount: 0.0, label: 'Standard (0%)', desc: 'Regular Guest' }
                  ].map((item) => (
                    <button
                      key={item.tier}
                      type="button"
                      onClick={() => handleTierSelect(item.tier)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        newCustomerForm.tier === item.tier
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-1 ring-amber-400 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-[11px]">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  {isKhmer ? 'អ៊ីមែល (Email - ស្រេចចិត្ត)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Address / Studio Notes (Optional) */}
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  {isKhmer ? 'អាសយដ្ឋាន / កំណត់ចំណាំ (Address / Note)' : 'Address / Boutique Note'}
                </label>
                <input
                  type="text"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={isKhmer ? 'ឧ: ភ្នំពេញ...' : 'e.g. Phnom Penh, Cambodia'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="w-3.5 h-3.5" />
                  <span>{savingCustomer ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុក & ជ្រើសរើស' : 'Save & Select')}</span>
                </button>
              </div>
            </form>
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
