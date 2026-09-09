import React from 'react';
import { Printer, CheckCircle, X, Gem, ShieldCheck } from 'lucide-react';

export const InvoiceModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Top Actions (no-print) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Sale Finalized & Recorded</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Luxury Invoice
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate & Invoice Body */}
        <div className="printable-invoice p-8 bg-white text-slate-900">
          {/* Header */}
          <div className="border-b border-amber-300 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Gem className="w-4 h-4" />
                </div>
                <h1 className="text-xl font-serif font-bold text-slate-900 tracking-wider">
                  JEWELFLOW ATELIER
                </h1>
              </div>
              <p className="text-xs text-amber-800 font-semibold mt-1">Haute Joaillerie & Precious Bullion</p>
              <p className="text-[11px] text-slate-500">880 Fifth Avenue, New York • Tel: +1 (212) 555-4890</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200">
                Official Tax Invoice & Certificate
              </span>
              <div className="text-base font-mono font-bold text-slate-900 mt-1.5">{invoice.invoice_no}</div>
              <div className="text-xs text-slate-500">Date: {invoice.sale_date}</div>
            </div>
          </div>

          {/* Client & Cashier Info */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-bold">Billed To:</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">{invoice.customer_name}</span>
              <span className="text-slate-500 block font-mono">{invoice.customer_phone}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-bold">Staff Jeweler:</span>
              <span className="text-slate-800 font-semibold block mt-0.5">{invoice.user_name}</span>
              <span className="text-slate-500 block">Payment: <strong className="text-amber-800 font-bold">{invoice.payment_method}</strong></span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold">
                <tr>
                  <th className="py-2">Item & Description</th>
                  <th className="py-2 text-center">SKU</th>
                  <th className="py-2 text-center">Net Wt.</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2.5 font-sans font-bold text-slate-900">
                      {item.product_name}
                    </td>
                    <td className="py-2.5 text-center text-slate-500 text-[11px]">{item.code_sku}</td>
                    <td className="py-2.5 text-center text-slate-700">{item.weight_g}g</td>
                    <td className="py-2.5 text-center text-slate-700">{item.qty}</td>
                    <td className="py-2.5 text-right text-slate-700">${item.unit_price.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>${invoice.total_amount.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>VIP Privilege Discount:</span>
                  <span>-${invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Sales Tax:</span>
                <span>+${invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-amber-800 pt-2 border-t border-amber-200">
                <span>Grand Total:</span>
                <span>${invoice.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Authenticity Certificate Guarantee */}
          <div className="mt-8 p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-700 leading-relaxed">
              <strong className="text-amber-900 block mb-0.5">Certificate of Authenticity & Purity Guarantee:</strong>
              We certify that each piece described above has been assayed for purity and conforms to international hallmarking standards. Gemstones are ethically sourced and independently graded.
            </div>
          </div>
        </div>

        {/* Bottom Close Button (no-print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Close & Next Order
          </button>
        </div>
      </div>
    </div>
  );
};
