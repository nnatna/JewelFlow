import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave,
  faCreditCard,
  faBuildingColumns,
  faQrcode,
  faCheckCircle,
  faXmark,
  faUser,
  faHandHoldingDollar,
  faCircleNotch
} from '@fortawesome/free-solid-svg-icons';
import { useApp } from '../../context/AppContext';

export const SettlePaymentModal = ({ sale, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const { exchangeRate, settleSalePayment, showToast } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Calculation helpers
  const fxRate = Number(exchangeRate?.rate) || 4100;
  const grandTotalUsd = parseFloat(sale?.grand_total_usd ?? sale?.grand_total) || 0;
  const grandTotalKhr = parseFloat(sale?.grand_total_khr) || Math.round(grandTotalUsd * fxRate);
  const isCancelled = (sale?.status || '').toLowerCase() === 'cancelled';
  
  // Calculate paid and balance due accurately (if cancelled, charge full price again)
  let paidAmountUsd = isCancelled ? 0 : parseFloat(sale?.paid_amount);
  if (!isCancelled && isNaN(paidAmountUsd)) {
    paidAmountUsd = (sale?.payments || [])
      .filter(p => (p.status || '').toLowerCase() === 'paid')
      .reduce((sum, p) => sum + (p.currency === 'KHR' ? (parseFloat(p.amount) || 0) / fxRate : (parseFloat(p.amount) || 0)), 0);
  }

  let rawBalanceDueUsd = parseFloat(sale?.balance_due);
  let balanceDueUsd = isCancelled
    ? grandTotalUsd
    : ((!isNaN(rawBalanceDueUsd) && rawBalanceDueUsd >= 0)
        ? rawBalanceDueUsd
        : Math.max(0, Math.round((grandTotalUsd - (paidAmountUsd || 0)) * 100) / 100));

  const balanceDueKhr = Math.round(balanceDueUsd * fxRate);

  // Form states
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash', 'KHQR', 'Credit Card', 'Bank Transfer'
  const [payAmount, setPayAmount] = useState(balanceDueUsd > 0 ? balanceDueUsd.toFixed(2) : grandTotalUsd.toFixed(2));
  const [cashTendered, setCashTendered] = useState(balanceDueUsd > 0 ? balanceDueUsd.toFixed(2) : grandTotalUsd.toFixed(2));
  const [referenceNo, setReferenceNo] = useState(`PAY-${Math.floor(10000 + Math.random() * 90000)}`);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync currency switch
  const handleCurrencySwitch = (newCurr) => {
    setCurrency(newCurr);
    if (newCurr === 'KHR') {
      setPayAmount(balanceDueKhr.toString());
      setCashTendered(balanceDueKhr.toString());
    } else {
      setPayAmount(balanceDueUsd.toFixed(2));
      setCashTendered(balanceDueUsd.toFixed(2));
    }
  };

  // Tender Change Calculation
  const numPayAmount = parseFloat(payAmount) || 0;
  const numTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numTendered - numPayAmount);

  // Quick cash options
  const generateUsdOptions = (due) => {
    const list = [{ label: isKhmer ? 'គ្រប់ចំនួន' : 'Exact', value: due }];
    if (due <= 0) return list;

    const standardBills = [10, 20, 50, 100, 200, 500, 1000, 2000];
    const roundedBills = [
      Math.ceil(due / 10) * 10,
      Math.ceil(due / 50) * 50,
      Math.ceil(due / 100) * 100,
      Math.ceil(due / 500) * 500
    ];

    const allOptions = [...standardBills, ...roundedBills]
      .filter(v => v >= due)
      .sort((a, b) => a - b);

    const uniqueOver = [...new Set(allOptions)].slice(0, 5);
    uniqueOver.forEach(val => {
      if (val !== due) {
        list.push({ label: `$${val.toLocaleString()}`, value: val });
      }
    });

    return list;
  };

  const generateKhrOptions = (dueKhr) => {
    const list = [{ label: isKhmer ? 'គ្រប់ចំនួន' : 'Exact', value: dueKhr }];
    if (dueKhr <= 0) return list;

    const denominations = [
      Math.ceil(dueKhr / 10000) * 10000,
      Math.ceil(dueKhr / 50000) * 50000,
      Math.ceil(dueKhr / 100000) * 100000,
      50000, 100000, 200000, 500000, 1000000, 2000000, 5000000
    ].filter(v => v >= dueKhr).sort((a, b) => a - b);

    const uniqueOver = [...new Set(denominations)].slice(0, 5);
    uniqueOver.forEach(val => {
      if (val !== dueKhr) {
        list.push({ label: `${val.toLocaleString()}៛`, value: val });
      }
    });

    return list;
  };

  const cashOptions = currency === 'USD' ? generateUsdOptions(balanceDueUsd) : generateKhrOptions(balanceDueKhr);

  const handleConfirm = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(payAmount);

    if (isNaN(amountVal) || amountVal <= 0) {
      showToast(isKhmer ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់ឲ្យបានត្រឹមត្រូវ!' : 'Please enter a valid payment amount!', 'warning');
      return;
    }

    const normalizedAmountUsd = currency === 'KHR' ? amountVal / fxRate : amountVal;

    setIsSubmitting(true);
    try {
      const updated = await settleSalePayment(sale.id, {
        amount: Math.round(normalizedAmountUsd * 100) / 100,
        payment_method: paymentMethod,
        currency: currency,
        reference_no: referenceNo,
        notes: notes || (isKhmer ? 'ទូទាត់ប្រាក់បង្គ្រប់ការកក់ (Deposit Settlement)' : 'Deposit Settlement Payment')
      });

      const isPendingCrafting = updated?.status === 'pending';
      showToast(
        isPendingCrafting
          ? (isKhmer
              ? `បានទូទាត់ប្រាក់បង្គ្រប់វិក្កយបត្រ #${sale.invoice_no}! ស្ថានភាពនៅ Pending (រង់ចាំជាងផលិតរួច)`
              : `Invoice #${sale.invoice_no} paid in full! Status remains Pending awaiting crafting completion.`)
          : (isKhmer
              ? `បានទូទាត់ប្រាក់បង្គ្រប់ និងបញ្ចប់វិក្កយបត្រ #${sale.invoice_no} (Completed) ជោគជ័យ!`
              : `Invoice #${sale.invoice_no} balance settled & order Completed!`),
        'success'
      );

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      console.error('Error settling payment:', err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការទូទាត់ប្រាក់!' : 'Error processing payment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header matching POS Modal Style */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
              <FontAwesomeIcon icon={faHandHoldingDollar} className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isKhmer ? 'ទូទាត់ប្រាក់បង្គ្រប់ការកក់' : 'Deposit Settlement & Order Completion'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer ? 'វិក្កយបត្រ #' : 'Invoice #'}<strong className="text-slate-700 font-mono">{sale?.invoice_no}</strong> • {sale?.customer_name || 'Walk-in Guest'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
            title={t('common.close', 'Close')}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleConfirm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            
            {/* Customer & Order Details Bar */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-amber-600 w-3.5 h-3.5" />
                <span className="text-slate-700 font-medium">{sale.customer_name || 'Walk-in Guest'}</span>
                {sale.customer_phone && <span className="text-slate-400 font-mono text-[11px]">({sale.customer_phone})</span>}
              </div>
              {isCancelled ? (
                <span className="px-2 py-0.5 rounded-full font-bold text-[10.5px] bg-rose-50 text-rose-800 border border-rose-300">
                  {isKhmer ? 'បោះបង់កន្លងមក (Cancelled Order)' : 'Cancelled Order'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full font-bold text-[10.5px] bg-amber-50 text-amber-900 border border-amber-300">
                  {isKhmer ? 'កក់ប្រាក់ (Deposit)' : 'Partial / Deposit'}
                </span>
              )}
            </div>

            {/* Total Due Banner with Financial Summary Breakdown (POS Style) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-amber-100/50 to-yellow-50/80 border border-amber-200/90 shadow-2xs space-y-3">
              <div className="text-center pb-2.5 border-b border-amber-200/70">
                <span className="text-[11px] text-amber-900/90 uppercase font-bold tracking-wider block">
                  {isCancelled 
                    ? (isKhmer ? 'គិតតម្លៃពេញវិញ (Full Amount Due)' : 'Order Re-settlement (Full Grand Total)')
                    : (isKhmer ? 'សមតុល្យនៅខ្វះត្រូវទូទាត់បង្គ្រប់' : 'Remaining Balance Due to Settle')}
                </span>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-mono font-black text-amber-950 block tracking-tight">
                    ${balanceDueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-amber-800 block mt-0.5">
                    ≈ ៛{balanceDueKhr.toLocaleString()} KHR
                  </span>
                </div>
              </div>

              {/* Subtotal / Deposit / Balance Ledger */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
                <div className="bg-white/90 p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 block font-sans font-semibold mb-0.5">
                    {isKhmer ? 'តម្លៃសរុប (Total)' : 'Grand Total'}
                  </span>
                  <span className="font-extrabold text-slate-900 text-[13px]">${grandTotalUsd.toFixed(2)}</span>
                  <span className="text-[9.5px] text-slate-400 font-sans">≈ ៛{grandTotalKhr.toLocaleString()}</span>
                </div>
                <div className="bg-emerald-50/90 p-2 rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-700 block font-sans font-semibold mb-0.5">
                    {isKhmer ? 'បានកក់រួច (Paid)' : 'Deposit Paid'}
                  </span>
                  <span className="font-extrabold text-emerald-700 text-[13px]">${paidAmountUsd.toFixed(2)}</span>
                  <span className="text-[9.5px] text-emerald-600 font-sans">
                    {grandTotalUsd > 0 ? `${((paidAmountUsd / grandTotalUsd) * 100).toFixed(0)}%` : '0%'}
                  </span>
                </div>
                <div className="bg-rose-50/90 p-2 rounded-xl border border-rose-200 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] text-rose-700 block font-sans font-semibold mb-0.5">
                    {isKhmer ? 'នៅសល់ (Due)' : 'Balance Due'}
                  </span>
                  <span className="font-extrabold text-rose-800 text-[13px]">${balanceDueUsd.toFixed(2)}</span>
                  <span className="text-[9.5px] text-rose-600 font-sans">
                    {grandTotalUsd > 0 ? `${((balanceDueUsd / grandTotalUsd) * 100).toFixed(0)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Currency Selector (POS Style) */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-700 font-semibold">{t('pos.currencyTendered', 'Tender Currency:')}</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleCurrencySwitch('USD')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer font-bold transition-all ${
                    currency === 'USD'
                      ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-xs ring-1 ring-amber-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-mono text-base text-amber-600 font-extrabold">$</span>
                  <span>USD (US Dollar)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencySwitch('KHR')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer font-bold transition-all ${
                    currency === 'KHR'
                      ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-xs ring-1 ring-amber-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-mono text-base text-amber-600 font-extrabold">៛</span>
                  <span>KHR (Khmer Riel)</span>
                </button>
              </div>
            </div>

            {/* Payment Tender Method (POS Style) */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-700 font-semibold">{t('pos.tenderMethod', 'Payment Tender Method:')}</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'Cash', label: isKhmer ? 'សាច់ប្រាក់ (Cash)' : 'Cash', icon: faMoneyBillWave },
                  { id: 'KHQR', label: isKhmer ? 'បាគង KHQR' : 'KHQR', icon: faQrcode },
                  { id: 'Credit Card', label: isKhmer ? 'កាតធនាគារ (Card)' : 'Credit Card', icon: faCreditCard },
                  { id: 'Bank Transfer', label: isKhmer ? 'ផ្ទេរតាមធនាគារ' : 'Bank Transfer', icon: faBuildingColumns },
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-center transition-all ${
                      paymentMethod === method.id
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

            {/* Payment Amount & Reference */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isKhmer ? 'ចំនួនទឹកប្រាក់បង់' : 'Payment Amount'} ({currency})
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold font-mono text-sm">
                    {currency === 'KHR' ? '៛' : '$'}
                  </span>
                  <input
                    type="number"
                    step={currency === 'USD' ? '0.01' : '100'}
                    min="0"
                    value={payAmount}
                    onChange={(e) => {
                      setPayAmount(e.target.value);
                      if (paymentMethod === 'Cash') {
                        setCashTendered(e.target.value);
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-hidden transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isKhmer ? 'លេខយោង' : 'Reference / Ref#'}
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 font-semibold focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-hidden transition-all"
                  placeholder="PAY-XXXX"
                />
              </div>
            </div>

            {/* Cash Tendered Presets (POS Style) */}
            {paymentMethod === 'Cash' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">{isKhmer ? 'សាច់ប្រាក់ទទួល:' : 'Cash Tendered:'}</span>
                  <div className="flex gap-1">
                    {cashOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashTendered(opt.value.toString())}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-amber-400 text-[11px] font-mono font-semibold text-slate-700 hover:bg-amber-50 cursor-pointer transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <input
                      type="number"
                      step={currency === 'USD' ? '0.01' : '100'}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-emerald-700 font-sans">{isKhmer ? 'ប្រាក់អាប់' : 'Change'}:</span>
                    <span className="font-bold text-emerald-900">
                      {currency === 'USD' ? '$' : '៛'}{changeDue.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes / Memo (POS Style) */}
            <div className="space-y-1">
              <label className="text-xs text-slate-600 font-medium">
                {isKhmer ? 'សម្គាល់បន្ថែម (Optional):' : 'Notes / Pickup Memo (Optional):'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isKhmer ? 'ឧ: ទូទាត់លុយបង្គ្រប់ពេលប្រគល់គ្រឿងអលង្ការ' : 'e.g. Remaining balance settled on pickup'}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Pinned Modal Footer (Matching POS Modal) */}
          <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all disabled:opacity-50"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon={faCircleNotch} className="w-3.5 h-3.5 animate-spin" />
                  <span>{isKhmer ? 'កំពុងទូទាត់...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'បញ្ជាក់ការទូទាត់ & បញ្ចប់វិក្កយបត្រ' : 'Confirm Payment & Complete Sale'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettlePaymentModal;
