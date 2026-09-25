import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faMoneyBillWave,
  faBuildingColumns,
  faQrcode,
  faCreditCard,
  faXmark,
  faUser,
  faWandMagicSparkles,
  faClock,
  faCheckCircle,
  faBan,
  faHandHoldingDollar
} from '@fortawesome/free-solid-svg-icons';

export const CancelRefundModal = ({ sale, madeProducts = [], exchangeRate, onClose, onConfirm }) => {
  const { t, i18n } = useTranslation();
  const isKhmer = (i18n.language || 'km').startsWith('km');

  const fxRate = Number(exchangeRate?.rate) || 4100;
  const grandTotalUsd = parseFloat(sale?.grand_total_usd ?? sale?.grand_total) || 0;
  const pStatus = (sale?.payment_status || '').toLowerCase();

  // Determine actual amount customer paid
  let paidAmountUsd = parseFloat(sale?.paid_amount);
  if (isNaN(paidAmountUsd)) {
    paidAmountUsd = (sale?.payments || [])
      .filter(p => (p.status || '').toLowerCase() === 'paid')
      .reduce((sum, p) => sum + (p.currency === 'KHR' ? (parseFloat(p.amount) || 0) / fxRate : (parseFloat(p.amount) || 0)), 0);
  }
  if (pStatus === 'paid' && (isNaN(paidAmountUsd) || paidAmountUsd <= 0)) {
    paidAmountUsd = grandTotalUsd;
  }

  // 1. Find all Made Jewelry crafting orders linked to this invoice
  const cleanInvNo = String(sale?.invoice_no || '').replace(/[^a-zA-Z0-9]/g, '');
  const linkedMadeOrders = madeProducts.filter(mp => {
    const orderNo = String(mp.order_no || '').replace(/[^a-zA-Z0-9]/g, '');
    const mpNotes = String(mp.notes || '');
    return (
      (cleanInvNo && (orderNo.includes(cleanInvNo) || mpNotes.includes(sale?.invoice_no))) ||
      (sale?.items || []).some(it => Number(it.product_id) === Number(mp.product_id) && mpNotes.includes(sale?.invoice_no))
    );
  });

  // Check highest status among linked crafting orders or sale items
  let isCraftingCompleted = linkedMadeOrders.some(mp => mp.status === 'completed');
  let isCraftingInProgress = linkedMadeOrders.some(mp => mp.status === 'in_progress');
  let isCraftingPending = linkedMadeOrders.some(mp => mp.status === 'pending');

  let craftingStage = 'none'; // 'none', 'pending', 'in_progress', 'completed'
  if (isCraftingCompleted) {
    craftingStage = 'completed';
  } else if (isCraftingInProgress) {
    craftingStage = 'in_progress';
  } else if (isCraftingPending || linkedMadeOrders.length > 0 || (sale?.items || []).some(it => it.status === 'pending')) {
    craftingStage = 'pending';
  }

  // Calculate total labor fee / crafting charge
  let totalLaborFee = 0;
  if (linkedMadeOrders.length > 0) {
    totalLaborFee = linkedMadeOrders.reduce((sum, mp) => {
      const cost = parseFloat(mp.crafting_cost) || 0;
      const qty = parseInt(mp.quantity, 10) || 1;
      return sum + (cost * qty);
    }, 0);
  } else {
    totalLaborFee = (sale?.items || []).reduce((sum, it) => {
      const labor = parseFloat(it.labor_fee) || 0;
      const qty = parseInt(it.qty || it.quantity, 10) || 1;
      return sum + (labor * qty);
    }, 0);
  }

  // Rule:
  // - If crafting status is 'pending' (not started): labor fee is 0 (FREE cancel, refund 100%).
  // - If crafting is 'in_progress' or 'completed': deduct the labor fee from refund.
  const hasStartedCrafting = craftingStage === 'in_progress' || craftingStage === 'completed';
  const deductedLaborFee = hasStartedCrafting ? totalLaborFee : 0;
  const netRefundUsd = Math.max(0, Math.round((paidAmountUsd - deductedLaborFee) * 100) / 100);
  const netRefundKhr = Math.round(netRefundUsd * fxRate);

  // Form states
  const [refundMethod, setRefundMethod] = useState('Cash');
  const [refundReason, setRefundReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm({
        refundAmount: netRefundUsd,
        refundAmountKhr: netRefundKhr,
        laborFeeDeducted: deductedLaborFee,
        craftingStage,
        refundMethod,
        refundReason,
        linkedOrders: linkedMadeOrders
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:px-6 bg-rose-50/80 border-b border-rose-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-md shadow-rose-500/20 shrink-0">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isKhmer ? 'បញ្ជាក់ការបោះបង់ & ដកប្រាក់សង' : 'Cancel Sale & Process Refund'}
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                {isKhmer ? 'វិក្កយបត្រ #' : 'Invoice #'}<strong className="font-mono">{sale?.invoice_no}</strong> • {sale?.customer_name || 'Walk-in Guest'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 text-xs">
            
            {/* Crafting Pipeline Status Banner */}
            <div className="p-3.5 rounded-2xl border bg-slate-50 border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="text-amber-600 w-3.5 h-3.5" />
                  {isKhmer ? 'ស្ថានភាពកែច្នៃ (Made Jewelry):' : 'Pre-Order Crafting Status:'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] border ${
                    craftingStage === 'completed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : craftingStage === 'in_progress'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : craftingStage === 'pending'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {craftingStage === 'completed'
                    ? (isKhmer ? 'រួចរាល់ (Completed)' : 'Completed')
                    : craftingStage === 'in_progress'
                    ? (isKhmer ? 'កំពុងកែច្នៃ (In Progress)' : 'In Progress')
                    : craftingStage === 'pending'
                    ? (isKhmer ? 'រង់ចាំ (Pending - មិនទាន់ដំណើរការ)' : 'Pending (Not Started)')
                    : (isKhmer ? 'គ្មានកុម្ម៉ង់កែច្នៃ' : 'Standard Inventory Piece')}
                </span>
              </div>

              {/* Status Explanation */}
              <div className="p-2.5 rounded-xl text-[11px] leading-relaxed border bg-white">
                {craftingStage === 'pending' ? (
                  <p className="text-emerald-700 font-medium">
                    {isKhmer
                      ? '✅ ស្ថានភាពនៅ "Pending (រង់ចាំ)": ជាងទងមិនទាន់បានចាប់ផ្តើមដំណើរការកែច្នៃឡើយ ដូច្នេះមិនគិតថ្លៃឈ្នួលជាង (Labor Fee = $0.00) សងប្រាក់ជូនអតិថិជនវិញ 100% ពេញ។'
                      : '✅ Crafting is "Pending": Atelier work has not started. No labor fee is charged ($0.00). Customer receives 100% full refund.'}
                  </p>
                ) : hasStartedCrafting ? (
                  <p className="text-rose-700 font-medium">
                    {isKhmer
                      ? `⚠️ ស្ថានភាព "${craftingStage === 'completed' ? 'រួចរាល់ (Completed)' : 'កំពុងកែច្នៃ (In Progress)'}": ជាងទងបានដំណើរការកែច្នៃរួចរាល់/កំពុងធ្វើ ដូច្នេះប្រព័ន្ធកាត់ទុកថ្លៃឈ្នួលជាង (-$${deductedLaborFee.toFixed(2)}) ពីចំនួនប្រាក់ត្រូវសង។`
                      : `⚠️ Crafting is "${craftingStage}": Jeweler work is underway or completed. Crafting labor fee (-$${deductedLaborFee.toFixed(2)}) is deducted from the refund.`}
                  </p>
                ) : (
                  <p className="text-slate-600 font-medium">
                    {isKhmer
                      ? 'ទំនិញស្តុកធម្មតា៖ សងប្រាក់ដែលបានបង់ជូនអតិថិជនវិញពេញចំនួន។'
                      : 'Standard item: Full refund of customer paid amount.'}
                  </p>
                )}
              </div>
            </div>

            {/* Financial Refund Breakdown Ledger */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 via-slate-50 to-amber-50/50 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="text-center pb-2.5 border-b border-slate-200/80">
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">
                  {isKhmer ? 'ចំនួនប្រាក់ជាក់ស្តែងត្រូវដកសងអតិថិជន' : 'Net Refund Amount to Customer'}
                </span>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-mono font-black text-rose-600 block tracking-tight">
                    ${netRefundUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-slate-600 block mt-0.5">
                    ≈ ៛{netRefundKhr.toLocaleString()} KHR
                  </span>
                </div>
              </div>

              {/* 3-Column Summary Cards */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 font-sans font-semibold mb-0.5">
                    {isKhmer ? 'ប្រាក់បានបង់' : 'Paid Amount'}
                  </span>
                  <span className="font-extrabold text-slate-900 text-[13px]">${paidAmountUsd.toFixed(2)}</span>
                </div>

                <div className={`p-2 rounded-xl border shadow-2xs flex flex-col justify-center ${
                  deductedLaborFee > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-600 font-sans font-semibold mb-0.5">
                    {isKhmer ? 'កាត់ថ្លៃឈ្នួល' : 'Labor Fee'}
                  </span>
                  <span className={`font-extrabold text-[13px] ${deductedLaborFee > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                    {deductedLaborFee > 0 ? `-$${deductedLaborFee.toFixed(2)}` : '$0.00'}
                  </span>
                </div>

                <div className="bg-rose-50 p-2 rounded-xl border border-rose-200 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] text-rose-700 font-sans font-semibold mb-0.5">
                    {isKhmer ? 'ប្រាក់ត្រូវសង' : 'Refund Due'}
                  </span>
                  <span className="font-extrabold text-rose-700 text-[13px]">${netRefundUsd.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Refund Payment Method Selector */}
            {netRefundUsd > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faHandHoldingDollar} className="text-rose-600" />
                  {isKhmer ? 'វិធីសាស្ត្រដកប្រាក់សង:' : 'Refund Method:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Cash', label: isKhmer ? 'សាច់ប្រាក់' : 'Cash', icon: faMoneyBillWave },
                    { id: 'KHQR', label: isKhmer ? 'KHQR' : 'KHQR', icon: faQrcode },
                    { id: 'Card', label: isKhmer ? 'កាតធនាគារ' : 'Card', icon: faCreditCard },
                    { id: 'Bank Transfer', label: isKhmer ? 'ផ្ទេរធនាគារ' : 'Bank Transfer', icon: faBuildingColumns },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setRefundMethod(m.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer font-bold text-xs transition-all ${
                        refundMethod === m.id
                          ? 'border-rose-500 bg-rose-50 text-rose-950 shadow-2xs ring-1 ring-rose-400'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <FontAwesomeIcon icon={m.icon} className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Refund Reason / Memo */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                {isKhmer ? 'មូលហេតុនៃការបោះបង់ (ចំណាំ):' : 'Cancellation Reason / Memo:'}
              </label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder={isKhmer ? 'ឧ. អតិថិជនស្នើសុំប្តូរម៉ូត, មិនត្រូវការទំនិញ...' : 'E.g. Customer changed mind, incorrect specs...'}
                className="w-full px-3.5 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200/50 transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              {isKhmer ? 'ត្រឡប់ក្រោយ (រក្សាទុក)' : 'Keep Sale'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faBan} className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? (isKhmer ? 'កំពុងដំណើរការ...' : 'Processing...')
                  : (isKhmer ? `បញ្ជាក់ការបោះបង់ & សងប្រាក់ $${netRefundUsd.toFixed(2)}` : `Confirm Cancel & Refund $${netRefundUsd.toFixed(2)}`)}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
