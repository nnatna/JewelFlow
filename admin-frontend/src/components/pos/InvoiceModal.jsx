import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faCircleCheck, faXmark, faGem, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { useApp } from '../../context/AppContext';

export const InvoiceModal = ({ invoice, onClose }) => {
  const { t, i18n } = useTranslation();
  const { exchangeRate } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  useEffect(() => {
    document.body.classList.add('invoice-modal-open');
    return () => {
      document.body.classList.remove('invoice-modal-open');
    };
  }, []);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="invoice-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto print:p-0 print:m-0 print:bg-transparent print:static print:overflow-visible">
      <div className="invoice-modal-container relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:rounded-none print:shadow-none print:my-0 print:w-full print:max-w-none print:static print:overflow-visible">
        {/* Modal Top Actions (no-print) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-emerald-600" />
            <span>{t('invoiceModal.finalized', 'Sale Finalized & Recorded')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 bg-slate-200/80 px-2 py-1 rounded border border-slate-300 font-semibold">
              A5 Print Ready
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" />
              {t('invoiceModal.printInvoice', 'Print Luxury Invoice')}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate & Invoice Body */}
        <div className="printable-invoice p-8 bg-white text-slate-900 print:p-0 print:border-none print:shadow-none">
          {/* Header */}
          <div className="border-b-2 border-amber-400 pb-5 print:pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs print:rounded-md print:bg-amber-500 print:text-white">
                  <FontAwesomeIcon icon={faGem} className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl print:text-lg font-serif font-bold text-slate-900 tracking-wider">
                  JEWELFLOW ATELIER
                </h1>
              </div>
              <p className="text-xs print:text-[10px] text-amber-800 font-semibold mt-1">Haute Joaillerie & Precious Bullion</p>
              <p className="text-[11px] print:text-[9.5px] text-slate-500">Phnom Penh Atelier Studio • Tel: +855 23 999 888</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300 inline-block print:bg-amber-50 print:text-amber-900 print:border-amber-300">
                {t('invoiceModal.officialTitle', 'Official Tax Invoice & Certificate')}
              </span>
              <div className="text-base print:text-sm font-mono font-bold text-slate-900 mt-1.5">{invoice.invoice_no}</div>
              <div className="text-xs print:text-[10px] text-slate-500">{t('salesHistory.date', 'Date')}: {invoice.sale_date}</div>
            </div>
          </div>

          {/* Client & Cashier Info */}
          <div className="grid grid-cols-2 gap-4 py-4 print:py-2.5 border-b border-amber-200/80 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] print:text-[9px] block font-bold">{t('invoiceModal.billedTo', 'Billed To:')}</span>
              <span className="text-sm print:text-xs font-bold text-slate-900 block mt-0.5">{invoice.customer_name}</span>
              <span className="text-slate-500 block font-mono text-xs print:text-[10px]">{invoice.customer_phone}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] print:text-[9px] block font-bold">{t('invoiceModal.staffJeweler', 'Staff Jeweler:')}</span>
              <span className="text-slate-800 font-semibold block mt-0.5 text-xs">{invoice.user_name}</span>
              <span className="text-slate-500 block text-xs print:text-[10px]">{t('invoiceModal.payment', 'Payment:')} <strong className="text-amber-800 font-bold">{invoice.payment_method}</strong></span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-4 print:py-2">
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
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx} className="py-2 print:py-1">
                    <td className="py-2.5 print:py-1.5 px-1.5 font-sans font-bold text-slate-900">
                      {item.product_name}
                      {item.metal_type_name && (
                        <span className="text-[10px] text-amber-700 block font-normal">{item.metal_type_name}</span>
                      )}
                    </td>
                    <td className="py-2.5 print:py-1.5 px-1.5 text-center text-slate-500 text-[11px] print:text-[9.5px] whitespace-nowrap">{item.code_sku}</td>
                    <td className="py-2.5 print:py-1.5 px-1.5 text-center text-slate-800 font-medium whitespace-nowrap">
                      {item.weight_g ? (
                        <>
                          <span className="font-bold text-amber-950 block">{((parseFloat(item.weight_g) || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}</span>
                          <span className="text-[10px] print:text-[9px] text-slate-400 font-normal font-sans">({parseFloat(item.weight_g).toFixed(2)}g)</span>
                        </>
                      ) : (item.weight_chi ? `${item.weight_chi} ${isKhmer ? 'ជី' : 'Chi'}` : '—')}
                    </td>
                    <td className="py-2.5 print:py-1.5 px-1.5 text-center text-slate-700 whitespace-nowrap">{item.qty || 1}</td>
                    <td className="py-2.5 print:py-1.5 px-1.5 text-right text-slate-700 whitespace-nowrap">${(parseFloat(item.unit_price) || 0).toFixed(2)}</td>
                    <td className="py-2.5 print:py-1.5 px-1.5 text-right font-bold text-slate-900 whitespace-nowrap">${(parseFloat(item.total) || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="pt-3 print:pt-2 border-t border-slate-200 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>{t('invoiceModal.subtotal', 'Subtotal:')}</span>
                <span>${(parseFloat(invoice.total_amount) || 0).toFixed(2)}</span>
              </div>
              {(parseFloat(invoice.discount) || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{t('invoiceModal.vipDiscount', 'VIP Privilege Discount:')}</span>
                  <span>-${(parseFloat(invoice.discount) || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>{t('invoiceModal.salesTax', 'Sales Tax:')}</span>
                <span>+${(parseFloat(invoice.tax) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base print:text-sm font-bold text-amber-800 pt-2 border-t-2 border-amber-300">
                <span>{t('invoiceModal.grandTotal', 'Grand Total:')}</span>
                <span>${(parseFloat(invoice.grand_total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {exchangeRate?.rate && (
                <div className="flex justify-between text-[11px] print:text-[10px] text-slate-600 font-semibold pt-0.5">
                  <span>≈ {t('common.khr', 'KHR')} ({exchangeRate.formatted} ៛/$):</span>
                  <span className="text-amber-900 font-bold">{Math.round((parseFloat(invoice.grand_total) || 0) * exchangeRate.rate).toLocaleString()} ៛</span>
                </div>
              )}
            </div>
          </div>

          {/* Authenticity Certificate Guarantee */}
          <div className="guarantee-box mt-6 print:mt-4 p-4 print:p-3 rounded-xl bg-amber-50/70 border border-amber-300 flex items-start gap-3">
            <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] print:text-[9.5px] text-slate-700 leading-relaxed">
              <strong className="text-amber-900 block mb-0.5">{t('invoiceModal.guaranteeTitle', 'Certificate of Authenticity & Purity Guarantee:')}</strong>
              {t('invoiceModal.guaranteeText', 'We certify that each piece described above has been assayed for purity and conforms to international hallmarking standards. Gemstones are ethically sourced and independently graded.')}
            </div>
          </div>
        </div>

        {/* Bottom Close Button (no-print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            {t('invoiceModal.closeNext', 'Close & Next Order')}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
