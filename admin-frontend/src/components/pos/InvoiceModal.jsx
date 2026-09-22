import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPrint,
  faCircleCheck,
  faXmark,
  faGem
} from '@fortawesome/free-solid-svg-icons';
import { useApp } from '../../context/AppContext';

export const InvoiceModal = ({ invoice, onClose }) => {
  const { t, i18n } = useTranslation();
  const { exchangeRate, settings } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');
  const [data, setData] = useState(() => (invoice && typeof invoice.then !== 'function' ? invoice : null));

  useEffect(() => {
    document.body.classList.add('invoice-modal-open');
    return () => {
      document.body.classList.remove('invoice-modal-open');
    };
  }, []);

  // Defensively resolve invoice if passed as a Promise
  useEffect(() => {
    if (!invoice) {
      setData(null);
      return;
    }
    if (typeof invoice.then === 'function') {
      invoice
        .then(resolved => setData(resolved))
        .catch(err => {
          console.error('Failed to resolve invoice promise:', err);
        });
    } else {
      setData(invoice);
    }
  }, [invoice]);

  if (!data) return null;

  // Comprehensive data normalization across backend & local formats
  const invoiceNo = data.invoice_no || `INV-${data.id || 'NEW'}`;
  const saleDate = data.sale_date || (data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
  const customerName = data.customer_name || data.customer?.name || (data.customer_id ? `Customer #${data.customer_id}` : 'Walk-in Guest');
  const customerPhone = data.customer_phone || data.customer?.phone || 'N/A';
  const userName = data.user_name || data.user?.name || 'Alexander Cross (Store Manager)';
  const paymentMethod = data.payment_method || data.payments?.[0]?.payment_method || 'Cash';
  const paymentCurrency = data.currency || data.payment_currency || data.payments?.[0]?.currency || 'USD';
  const paymentStatus = (data.payment_status || data.payments?.[0]?.status || 'paid').toLowerCase();
  const saleStatus = (data.status || 'completed').toLowerCase();
  const notes = data.notes || '';

  const rawItems = data.items || data.sale_items || data.saleItems || [];
  const items = rawItems.map((it, idx) => {
    const pName = it.product_name || it.product?.name || `Jewelry Item #${it.product_id || (idx + 1)}`;
    const metalName = it.metal_type_name || it.product?.metal_type?.name || it.product?.metalType?.name || '';
    const sku = it.code_sku || it.product?.code_sku || 'JW-LUX';
    const qty = parseInt(it.qty || it.quantity, 10) || 1;
    const weightG = parseFloat(it.weight_g || it.product?.net_weight || (it.weight_sold ? it.weight_sold * 3.75 : 0)) || 0;
    const weightChi = parseFloat(it.weight_chi || it.weight_sold || (weightG ? weightG / 3.75 : 0)) || 0;
    const unitPrice = parseFloat(it.unit_price || (it.total ? it.total / qty : 0)) || 0;
    const total = parseFloat(it.total || it.subtotal || (unitPrice * qty)) || 0;
    const itemStatus = (it.status || saleStatus || 'completed').toLowerCase();

    return {
      product_name: pName,
      metal_type_name: metalName,
      code_sku: sku,
      qty,
      weight_g: weightG,
      weight_chi: weightChi,
      unit_price: unitPrice,
      total,
      status: itemStatus
    };
  });

  const totalAmount = parseFloat(data.total_amount) || items.reduce((acc, it) => acc + it.total, 0);
  const discount = parseFloat(data.discount) || 0;
  const tax = parseFloat(data.tax) || 0;
  const grandTotalUsd = parseFloat(data.grand_total_usd ?? data.grand_total) || Math.max(0, totalAmount - discount + tax);
  const currentFxRate = Number(exchangeRate?.rate) || 4100;
  const grandTotalKhr = parseFloat(data.grand_total_khr) || Math.round(grandTotalUsd * currentFxRate);
  const rawPaidAmount = parseFloat(data.paid_amount ?? data.payments?.[0]?.amount);
  const paidAmount = !isNaN(rawPaidAmount)
    ? rawPaidAmount
    : (paymentStatus === 'paid' ? (paymentCurrency === 'KHR' ? grandTotalKhr : grandTotalUsd) : 0);
  const rawBalanceDue = parseFloat(data.balance_due);
  const balanceDue = !isNaN(rawBalanceDue)
    ? rawBalanceDue
    : Math.max(0, (paymentCurrency === 'KHR' ? grandTotalKhr : grandTotalUsd) - paidAmount);

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="invoice-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:m-0 print:bg-transparent print:static print:overflow-visible animate-fadeIn">
      <div className="invoice-modal-container relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 print:border-none print:rounded-none print:shadow-none print:my-0 print:w-full print:max-w-none print:static print:overflow-visible">
        
        {/* Modal Top Actions (no-print) */}
        <div className="no-print p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-xs sm:text-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
            </div>
            <span>{isKhmer ? 'ការលក់ត្រូវបានកត់ត្រាជោគជ័យ' : t('invoiceModal.finalized', 'Sale Finalized & Recorded')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'បោះពុម្ពវិក្កយបត្រ' : t('invoiceModal.printInvoice', 'Print Invoice')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
              title={t('common.close', 'Close')}
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Tax Invoice Body */}
        <div className="printable-invoice p-6 sm:p-8 bg-white text-slate-900 print:p-0 print:border-none print:shadow-none">
          {/* Header */}
          <div className="border-b-2 border-amber-400 pb-4 print:pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs print:rounded-md print:bg-amber-500 print:text-white shrink-0 overflow-hidden">
                  {settings?.store_logo ? (
                    <img src={settings.store_logo} alt="Store Logo" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <FontAwesomeIcon icon={faGem} className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl print:text-lg font-serif font-bold text-slate-900 tracking-wider">
                    {settings?.store_name || 'JEWELFLOW ATELIER'}
                  </h1>
                  <p className="text-xs print:text-[10px] text-amber-800 font-semibold">
                    {settings?.vat_tin ? `VAT TIN: ${settings.vat_tin}` : 'Haute Joaillerie & Precious Bullion'}
                  </p>
                </div>
              </div>
              <p className="text-[11px] print:text-[9.5px] text-slate-500 mt-1">
                {settings?.store_address || '#88 Preah Norodom Blvd, Phnom Penh, Cambodia'} • Tel: {settings?.store_phone || '+855 23 999 888'}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300 inline-block print:bg-amber-50 print:text-amber-900 print:border-amber-300">
                {isKhmer ? 'វិក្កយបត្រពន្ធផ្លូវការ (TAX INVOICE)' : 'OFFICIAL TAX INVOICE'}
              </span>
              <div className="text-base print:text-sm font-mono font-bold text-slate-900 mt-1.5">{invoiceNo}</div>
              <div className="text-xs print:text-[10px] text-slate-500">{t('salesHistory.date', 'Date')}: {saleDate}</div>
            </div>
          </div>

          {/* Client & Jeweler Info */}
          <div className="grid grid-cols-2 gap-4 py-3.5 print:py-2.5 border-b border-amber-200/80 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] print:text-[9px] block font-bold">{t('invoiceModal.billedTo', 'Billed To:')}</span>
              <span className="text-sm print:text-xs font-bold text-slate-900 block mt-0.5">{customerName}</span>
              <span className="text-slate-500 block font-mono text-xs print:text-[10px]">{customerPhone}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] print:text-[9px] block font-bold">{t('invoiceModal.staffJeweler', 'Staff Jeweler:')}</span>
              <span className="text-slate-800 font-semibold block mt-0.5 text-xs">{userName}</span>
              <div className="text-slate-500 mt-1 text-xs print:text-[10px] flex items-center justify-end gap-1.5 flex-wrap">
                <span>{t('invoiceModal.payment', 'Payment:')} <strong className="text-amber-900 font-bold">{paymentMethod}</strong></span>
                
                {/* Currency Badge */}
                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-950 font-mono text-[10px] font-bold border border-amber-300/60">
                  {paymentCurrency}
                </span>

                {/* Payment Status Badge */}
                <span className={`px-2 py-0.2 rounded font-mono text-[10px] font-bold border uppercase tracking-wider ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : (paymentStatus === 'partial'
                      ? 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold'
                      : 'bg-indigo-100 text-indigo-800 border-indigo-300')
                }`}>
                  {paymentStatus === 'partial'
                    ? (isKhmer ? 'លុយកក់ (Deposit)' : 'Deposit')
                    : (paymentStatus === 'pending'
                      ? (isKhmer ? 'នៅជំពាក់ (Pending)' : 'Pending')
                      : (isKhmer ? 'បង់ផ្ដាច់ (Paid)' : 'Paid'))}
                </span>

                {/* Sale Status Badge */}
                <span className={`px-2 py-0.2 rounded font-mono text-[10px] font-bold border uppercase tracking-wider ${
                  saleStatus === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : (saleStatus === 'pending'
                      ? 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold'
                      : 'bg-rose-100 text-rose-800 border-rose-300')
                }`}>
                  {saleStatus === 'completed'
                    ? (isKhmer ? 'បានបញ្ចប់' : 'Completed')
                    : (saleStatus === 'pending'
                      ? (isKhmer ? 'រង់ចាំ' : 'Pending')
                      : (isKhmer ? 'បានបោះបង់' : 'Cancelled'))}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-3 print:py-2">
            <table className="w-full text-left text-xs print:text-[10px]">
              <thead className="border-b-2 border-amber-400 bg-amber-50/80 text-amber-950 text-[11px] print:text-[10px] font-bold">
                <tr>
                  <th className="py-2 print:py-1 px-1.5">{t('invoiceModal.itemDescription', 'Item & Description')}</th>
                  <th className="py-2 print:py-1 px-1.5 text-center whitespace-nowrap">{t('invoiceModal.sku', 'SKU')}</th>
                  <th className="py-2 print:py-1 px-1.5 text-center whitespace-nowrap">{t('invoiceModal.netWeightChi', isKhmer ? 'ទម្ងន់សុទ្ធ (ជី)' : 'Net Wt. (Chi)')}</th>
                  <th className="py-2 print:py-1 px-1.5 text-center whitespace-nowrap">{t('invoiceModal.qty', 'Qty')}</th>
                  <th className="py-2 print:py-1 px-1.5 text-right whitespace-nowrap">{t('invoiceModal.unitPrice', 'Unit Price')}</th>
                  <th className="py-2 print:py-1 px-1.5 text-right whitespace-nowrap">{t('invoiceModal.total', 'Total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-mono">
                {items.map((item, idx) => (
                  <tr key={idx} className="py-2 print:py-1">
                    <td className="py-2 print:py-1.5 px-1.5 font-sans font-bold text-slate-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.product_name}</span>
                        {item.status && (
                          <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border uppercase tracking-wider ${
                            item.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 print:bg-emerald-50 print:text-emerald-800'
                              : (item.status === 'pending'
                                ? 'bg-amber-50 text-amber-900 border-amber-400 print:bg-amber-50 print:text-amber-900'
                                : 'bg-rose-50 text-rose-800 border-rose-300 print:bg-rose-50 print:text-rose-800')
                          }`}>
                            {item.status === 'completed'
                              ? (isKhmer ? 'យកភ្លាម' : 'Ready')
                              : (item.status === 'pending'
                                ? (isKhmer ? 'រង់ចាំកែ' : 'Pending')
                                : (isKhmer ? 'បោះបង់' : 'Cancelled'))}
                          </span>
                        )}
                      </div>
                      {item.metal_type_name && (
                        <span className="text-[10px] text-amber-700 block font-normal">{item.metal_type_name}</span>
                      )}
                    </td>
                    <td className="py-2 print:py-1.5 px-1.5 text-center text-slate-500 text-[11px] print:text-[9.5px] whitespace-nowrap">{item.code_sku}</td>
                    <td className="py-2 print:py-1.5 px-1.5 text-center text-slate-800 font-medium whitespace-nowrap">
                      {item.weight_chi ? (
                        <>
                          <span className="font-bold text-amber-950 block">{item.weight_chi.toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}</span>
                          {item.weight_g > 0 && (
                            <span className="text-[10px] print:text-[9px] text-slate-400 font-normal font-sans">({item.weight_g.toFixed(2)}g)</span>
                          )}
                        </>
                      ) : '—'}
                    </td>
                    <td className="py-2 print:py-1.5 px-1.5 text-center text-slate-700 whitespace-nowrap">{item.qty}</td>
                    <td className="py-2 print:py-1.5 px-1.5 text-right text-slate-700 whitespace-nowrap">${item.unit_price.toFixed(2)}</td>
                    <td className="py-2 print:py-1.5 px-1.5 text-right font-bold text-slate-900 whitespace-nowrap">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="pt-3 print:pt-2 border-t border-slate-200 flex justify-end">
            <div className="w-64 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>{t('invoiceModal.subtotal', 'Subtotal:')}</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between ${discount > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                <span>{t('invoiceModal.vipDiscount', isKhmer ? 'បញ្ចុះតម្លៃ (Discount / Promo):' : 'Discount / Promo:')}</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t('invoiceModal.salesTax', 'Sales Tax:')}</span>
                <span>+${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base print:text-sm font-bold text-amber-800 pt-1.5 border-t-2 border-amber-300">
                <span>{t('invoiceModal.grandTotalUsd', 'Grand Total (USD):')}</span>
                <span>${grandTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[11px] print:text-[10px] text-slate-700 font-semibold pt-0.5">
                <span>{t('invoiceModal.grandTotalKhr', 'Grand Total (KHR):')}</span>
                <span className="text-amber-900 font-bold font-mono">
                  {grandTotalKhr.toLocaleString()} ៛
                </span>
              </div>

              {/* Deposit / Remaining Balance Breakdown */}
              {(paymentStatus === 'partial' || balanceDue > 0) && (
                <div className="pt-2 border-t-2 border-dashed border-amber-300 space-y-1 mt-1">
                  <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>{t('invoiceModal.depositTendered', isKhmer ? 'លុយកក់បានបង់ (Deposit Paid):' : 'Deposit Paid:')}</span>
                    <span>
                      {paymentCurrency === 'KHR'
                        ? `៛${Math.round(paidAmount).toLocaleString()}`
                        : `$${paidAmount.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-rose-700">
                    <span>{t('invoiceModal.balanceRemaining', isKhmer ? 'សមតុល្យនៅខ្វះ (Balance Due):' : 'Remaining Balance Due:')}</span>
                    <span>
                      {paymentCurrency === 'KHR'
                        ? `៛${Math.round(balanceDue).toLocaleString()}`
                        : `$${balanceDue.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes / Pickup Memo */}
          {notes && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 print:text-[10px]">
              <strong className="text-amber-900 block mb-0.5">{isKhmer ? 'កំណត់សម្គាល់ / កាលបរិច្ឆេទមកយក:' : 'Deposit & Pickup Notes:'}</strong>
              <span>{notes}</span>
            </div>
          )}

          {/* Invoice Disclaimer Policy Footer */}
          {settings?.invoice_disclaimer && (
            <p className="mt-2 text-[10px] print:text-[8.5px] text-slate-500 italic text-center">
              * {settings.invoice_disclaimer}
            </p>
          )}

          {/* Official Signature Lines (Print Only) */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-center text-[10px]">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <span className="font-bold text-slate-800">{isKhmer ? 'ហត្ថលេខាអតិថិជន (Customer Signature)' : 'Customer Signature'}</span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <span className="font-bold text-slate-800">{isKhmer ? 'ហត្ថលេខាអ្នកលក់ & ត្រាហាង (Atelier Authorized Seal)' : 'Atelier Authorized Seal'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Close Button (no-print) */}
        <div className="no-print p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បោះពុម្ពវិក្កយបត្រ' : t('invoiceModal.printInvoice', 'Print Invoice')}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            {t('invoiceModal.closeNext', 'Close & Next Order')}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

