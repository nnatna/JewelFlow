import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { InvoiceModal } from './InvoiceModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
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
  faBookmark
} from '@fortawesome/free-solid-svg-icons';

export const PosTerminal = () => {
  const { t, i18n } = useTranslation();
  const isKhmer = (i18n.language || 'km').startsWith('km');
  const {
    products,
    categories,
    metalTypes,
    customers,
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
    calculateProductPrice,
    completeSale,
    liveSpot
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMetal, setSelectedMetal] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
  };

  // Restore a pinned ticket back to active cart
  const handleRestoreTicket = (ticket) => {
    ticket.cart.forEach(item => addToCart(item));
    setSelectedCustomer(ticket.selectedCustomer || null);
    setDiscountPercent(ticket.discountPercent || 0);
    setPinnedTickets(prev => prev.filter(t => t.id !== ticket.id));
  };

  // Delete a held ticket
  const handleDeletePinnedTicket = (ticketId) => {
    setPinnedTickets(prev => prev.filter(t => t.id !== ticketId));
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category_id === Number(selectedCategory);
    const matchesMetal = selectedMetal === 'all' || p.metal_type_id === Number(selectedMetal);
    return matchesSearch && matchesCategory && matchesMetal;
  });

  // Calculate totals
  const subtotal = cart.reduce((acc, item) => acc + (item.calculatedPrice * item.qty), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableTotal = subtotal - discountAmount;
  const taxAmount = taxableTotal * (taxRate / 100);
  const grandTotal = taxableTotal + taxAmount;

  const handleCustomerChange = (customerId) => {
    if (!customerId) {
      setSelectedCustomer(null);
      setDiscountPercent(0);
      return;
    }
    const customer = customers.find(c => c.id === Number(customerId));
    setSelectedCustomer(customer || null);
    if (customer) {
      setDiscountPercent(customer.discount_rate || 0);
    }
  };

  const handleCheckout = () => {
    const finalized = completeSale(paymentMethod);
    setShowPaymentModal(false);
    if (finalized) {
      setActiveInvoice(finalized);
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
              <div className="relative w-full sm:w-64">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('pos.searchPlaceholder', 'Scan Barcode or Search SKU / Name...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Spot Benchmark Pill */}
              <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 font-bold text-[11px] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-amber-800">{isKhmer ? 'តាមតម្លៃដើម:' : 'Market Spot:'}</span>
                <span className="font-mono font-extrabold text-amber-950">
                  ${(liveSpot?.spot_price_per_oz || 4411.10).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz
                </span>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded font-bold">
                  ${(liveSpot?.price_per_chi || ((liveSpot?.spot_price_per_oz || 4411.10) / 31.1034768 * 3.75)).toFixed(2)}/{isKhmer ? 'ជី' : 'chi'}
                </span>
              </div>
            </div>

            {/* Metal Karat Quick Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedMetal('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                  selectedMetal === 'all'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                    selectedMetal === metal.id
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
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
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
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/90 text-slate-700 shadow-xs backdrop-blur-sm">
                          {product.net_weight}g
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>{product.code_sku}</span>
                      <span className={product.stock_qty <= 2 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                        {product.stock_qty} in stock
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Live Atelier Price</div>
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
                      Add
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
            <span>Active POS Ticket</span>
            {cart.length > 0 && (
              <span className="text-[11px] font-sans font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                {cart.reduce((sum, item) => sum + item.qty, 0)} {cart.reduce((sum, item) => sum + item.qty, 0) === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Hold Ticket to recall later */}
            {cart.length > 0 && (
              <button
                onClick={handlePinTicket}
                className="text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-semibold px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                title="Hold ticket to serve another guest"
              >
                <FontAwesomeIcon icon={faBookmark} className="w-3.5 h-3.5 text-amber-700" />
                Hold
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 cursor-pointer hover:bg-rose-50 rounded-lg transition-colors"
              >
                Clear
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
                Held Tickets ({pinnedTickets.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {pinnedTickets.map(pt => (
                <div
                  key={pt.id}
                  className="p-2 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-xs shadow-2xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {pt.selectedCustomer ? pt.selectedCustomer.name : 'Walk-in Guest'} ({pt.cart.length} items)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {pt.time} • ${pt.grandTotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRestoreTicket(pt)}
                      className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] cursor-pointer"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => handleDeletePinnedTicket(pt.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete"
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
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-amber-600" />
            {t('pos.selectClient', 'Select Customer Clientèle')}
          </label>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none font-medium"
          >
            <option value="">{t('pos.walkInGuest', 'Walk-in Guest')}</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.tier} ({c.discount_rate}% Privilege)
              </option>
            ))}
          </select>
          {selectedCustomer && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-amber-800 px-1 font-semibold">
              <span>Tier: {selectedCustomer.tier}</span>
              <span>Loyalty: {selectedCustomer.loyalty_points} pts</span>
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
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate">{item.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                    <span>{item.net_weight}g</span>
                    <span>•</span>
                    <span className="text-amber-800 font-bold">${item.calculatedPrice.toFixed(2)}</span>
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
          <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200 font-mono">
            <span>{t('pos.grandTotal', 'Grand Total')}:</span>
            <span className="text-amber-700 font-extrabold">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="shrink-0 mt-3">
          <button
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-98"
          >
            {t('pos.processPayment', 'Complete & Print Invoice')}
          </button>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-serif">
              <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-amber-600" />
              Finalize Payment
            </h3>

            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-center">
              <span className="text-xs text-slate-500 block">Total Due:</span>
              <span className="text-3xl font-mono font-bold text-amber-800 mt-1 block">
                ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-700 font-semibold">Select Settlement Method:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'Credit Card', icon: faCreditCard },
                  { id: 'Cash', icon: faMoneyBillWave },
                  { id: 'Bank Wire', icon: faCircleCheck },
                  { id: 'QR Pay', icon: faQrcode },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer text-center transition-all ${
                      paymentMethod === method.id
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={method.icon} className="w-5 h-5 text-amber-600" />
                    <span>{method.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md"
              >
                Confirm & Print Invoice
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
