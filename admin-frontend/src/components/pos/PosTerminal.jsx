import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { InvoiceModal } from './InvoiceModal';
import {
  Search,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Percent,
  Pin,
  PinOff,
  Bookmark,
  Clock
} from 'lucide-react';

export const PosTerminal = () => {
  const { t } = useTranslation();
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
    completeSale
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMetal, setSelectedMetal] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  // Active POS Ticket Pin States
  const [isPinned, setIsPinned] = useState(true);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Area: Product Browser (7 cols on LG, 8 cols on XL) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Header & Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('pos.searchPlaceholder', 'Scan Barcode or Search SKU / Name...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
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

        {/* Product Cards Grid */}
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
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Area: Active POS Ticket / Cart (5 cols on LG, 4 cols on XL) */}
      <div
        id="active-pos-ticket"
        className={`lg:col-span-5 xl:col-span-4 bg-white border rounded-2xl p-4 sm:p-5 flex flex-col transition-all max-h-[calc(100vh-6.5rem)] overflow-y-auto overflow-x-hidden ${
          isPinned
            ? 'sticky top-0 z-20 shadow-md border-amber-300 ring-1 ring-amber-400/20'
            : 'border-slate-200 shadow-xs relative'
        }`}
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <span>Active POS Ticket</span>
            {isPinned && (
              <span className="text-[10px] bg-amber-100 text-amber-900 font-sans font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                <Pin className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                Pinned
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Toggle Pin Sticky */}
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-xs ${
                isPinned
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title={isPinned ? 'Unpin ticket' : 'Pin ticket to stay fixed on screen'}
            >
              {isPinned ? <Pin className="w-3.5 h-3.5 fill-amber-700 text-amber-700" /> : <PinOff className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{isPinned ? 'Pinned' : 'Pin'}</span>
            </button>

            {/* Hold / Pin Ticket to recall later */}
            {cart.length > 0 && (
              <button
                onClick={handlePinTicket}
                className="text-[11px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-semibold px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                title="Hold / Pin ticket to serve another guest"
              >
                <Bookmark className="w-3 h-3 text-amber-700" />
                Hold
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-1.5 py-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Pinned / Held Tickets Tray */}
        {pinnedTickets.length > 0 && (
          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                Held / Pinned Tickets ({pinnedTickets.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
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
                      <Trash2 className="w-3 h-3" />
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
            <User className="w-3.5 h-3.5 text-amber-600" />
            {t('pos.selectClient', 'Client Account')}
          </label>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none font-medium"
          >
            <option value="">{t('pos.walkInGuest', 'Walk-in Boutique Guest (No Privilege Discount)')}</option>
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

        {/* Cart Item List */}
        <div className="space-y-2 flex-1 min-h-[120px] max-h-72 overflow-y-auto pr-1 my-2" style={{ scrollbarWidth: 'thin' }}>
          {cart.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center">
              <ShoppingBag className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
              <span>{t('pos.emptyCart', 'Register is empty.')}</span>
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
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-mono text-xs font-bold text-slate-800">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.id, item.qty + 1)}
                      className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Summary */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-mono shrink-0 mt-auto">
          <div className="flex justify-between text-slate-600">
            <span>{t('pos.subtotal', 'Subtotal')}:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3" /> {t('pos.vipDiscount', 'VIP Privilege')} ({discountPercent}%):
              </span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>{t('pos.tax', 'Sales Tax')} ({taxRate}%):</span>
            <span>+${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200 font-mono">
            <span>{t('pos.grandTotal', 'Payable Total')}:</span>
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
            {t('pos.processPayment', 'Collect Payment & Issue Invoice')}
          </button>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-serif">
              <CreditCard className="w-5 h-5 text-amber-600" />
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
                  { id: 'Credit Card', icon: CreditCard },
                  { id: 'Cash', icon: Banknote },
                  { id: 'Bank Wire', icon: CheckCircle2 },
                  { id: 'QR Pay', icon: QrCode },
                ].map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer text-center transition-all ${
                        paymentMethod === method.id
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-amber-600" />
                      <span>{method.id}</span>
                    </button>
                  );
                })}
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
