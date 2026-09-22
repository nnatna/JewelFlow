import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPrint,
  faCircleCheck,
  faXmark,
  faScaleBalanced,
  faArrowsRotate
} from '@fortawesome/free-solid-svg-icons';
import { useApp } from '../../context/AppContext';

export const BuybackVoucherModal = ({ voucher, onClose }) => {
  const { t, i18n } = useTranslation();
  const { exchangeRate } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  useEffect(() => {
    document.body.classList.add('invoice-modal-open');
    return () => {
      document.body.classList.remove('invoice-modal-open');
    };
  }, []);

  if (!voucher) return null;

  const voucherNo = voucher.buyback_no || `BB-${voucher.id || 'NEW'}`;
  const voucherDate = voucher.buyback_date || (voucher.created_at ? voucher.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
  const customerName = voucher.customer_name || 'Walk-in Customer';
  const customerPhone = voucher.customer_phone || 'N/A';
  const metalName = voucher.metal_name || '24K Fine Gold';
  const grossWeight = parseFloat(voucher.gross_weight) || 0;
  const netWeight = parseFloat(voucher.net_weight) || grossWeight;
  const netWeightChi = (netWeight / 3.75).toFixed(2);
  const buyRatePerGram = parseFloat(voucher.buy_rate_per_gram) || 0;
  const buyRatePerChi = (buyRatePerGram * 3.75).toFixed(2);
  const meltLossPct = parseFloat(voucher.melt_loss_pct) || 0;
  const appraisalFee = parseFloat(voucher.appraisal_fee) || 0;
  const totalAmountUsd = parseFloat(voucher.total_amount) || 0;
  const currentFxRate = Number(exchangeRate?.rate) || 4100;
  const totalAmountKhr = Math.round(totalAmountUsd * currentFxRate);
  const paymentMethod = voucher.payment_method || 'Instant Cash Payout';
  const notes = voucher.notes || 'Tested via XRF spectrometer assay.';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:m-0 print:bg-transparent print:static print:overflow-visible animate-fadeIn">
      <div className="invoice-modal-container relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 print:border-none print:rounded-none print:shadow-none print:my-0 print:w-full print:max-w-none print:static print:overflow-visible">
        
        {/* Modal Top Actions (no-print) */}
        <div className="no-print p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-800 font-bold text-xs sm:text-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faArrowsRotate} className="w-4 h-4 text-amber-600" />
            </div>
            <span>{isKhmer ? 'ប័ណ្ណទិញចូលមាសចាស់ (Scrap Buyback Voucher)' : 'Precious Metal Buyback Voucher'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'បោះពុម្ពប័ណ្ណ' : 'Print Voucher'}</span>
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

        {/* Printable Voucher Body */}
        <div className="printable-invoice p-6 sm:p-8 bg-white text-slate-900 print:p-0 print:border-none print:shadow-none">
          {/* Header */}
          <div className="border-b-2 border-amber-400 pb-4 print:pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <FontAwesomeIcon icon={faScaleBalanced} className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl print:text-lg font-serif font-bold text-slate-900 tracking-wider">
                  JEWELFLOW ATELIER
                </h1>
              </div>
              <p className="text-xs print:text-[10px] text-amber-800 font-semibold mt-1">Precious Metal Assay & Scrap Buyback</p>
              <p className="text-[11px] print:text-[9.5px] text-slate-500">Phnom Penh Atelier Studio • Tel: +855 23 999 888</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300 inline-block">
                {isKhmer ? 'ប័ណ្ណទិញចូលមាស (BUYBACK VOUCHER)' : 'OFFICIAL BUYBACK VOUCHER'}
              </span>
              <div className="text-base print:text-sm font-mono font-bold text-slate-900 mt-1.5">{voucherNo}</div>
              <div className="text-xs print:text-[10px] text-slate-500">{t('salesHistory.date', 'Date')}: {voucherDate}</div>
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4 py-3.5 print:py-2.5 border-b border-amber-200/80 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] print:text-[9px] block font-bold">{isKhmer ? 'អតិថិជនលក់ចូល:' : 'Customer Name:'}</span>
              <span className="text-sm print:text-xs font-bold text-slate-900 block mt-0.5">{customerName}</span>
              <span className="text-slate-500 block font-mono text-xs print:text-[10px]">{customerPhone}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] print:text-[9px] block font-bold">{isKhmer ? 'វិធីទូទាត់ប្រាក់:' : 'Payout Method:'}</span>
              <span className="text-slate-800 font-semibold block mt-0.5 text-xs">{paymentMethod}</span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] uppercase">
                {isKhmer ? '✓ បានអនុម័ត & ទូទាត់រួច' : '✓ Approved & Paid'}
              </span>
            </div>
          </div>

          {/* Appraisal Details Breakdown */}
          <div className="py-4 print:py-3 space-y-3">
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs">
              <h3 className="font-bold text-amber-950 uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faScaleBalanced} className="text-amber-700" />
                {isKhmer ? 'ព័ត៌មានលម្អិតនៃការវាយតម្លៃលោហធាតុ:' : 'Assay & Metal Assessment:'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{isKhmer ? 'ប្រភេទមាស / គុណភាព' : 'Tested Purity'}</span>
                  <span className="font-bold text-slate-900 text-xs">{metalName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{isKhmer ? 'ទម្ងន់ដុល (Gross Weight)' : 'Gross Weight'}</span>
                  <span className="font-bold text-slate-900 text-xs">{grossWeight}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{isKhmer ? 'កំហាតរលាយ (Melt Loss)' : 'Melt / Loss %'}</span>
                  <span className="font-bold text-slate-900 text-xs">{meltLossPct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{isKhmer ? 'ទម្ងន់សុទ្ធជាជី (Net Chi)' : 'Net Weight (Chi)'}</span>
                  <span className="font-bold text-amber-950 text-xs">{netWeightChi} {isKhmer ? 'ជី' : 'Chi'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{isKhmer ? 'ទម្ងន់សុទ្ធជាក្រាម (Net g)' : 'Net Weight (Grams)'}</span>
                  <span className="font-bold text-slate-900 text-xs">{netWeight}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{isKhmer ? 'តម្លៃទិញចូល (Buy Rate)' : 'Buyback Rate'}</span>
                  <span className="font-bold text-emerald-800 text-xs">${buyRatePerGram}/g (${buyRatePerChi}/{isKhmer ? 'ជី' : 'chi'})</span>
                </div>
              </div>
            </div>

            {/* Total Payout Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-white to-amber-100/50 border border-amber-300 font-mono flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-900 font-sans font-bold uppercase tracking-wider block">
                  {isKhmer ? 'ទឹកប្រាក់សរុបត្រូវបើកជូន (Net Cash Payout):' : 'Total Net Cash Payout:'}
                </span>
                {appraisalFee > 0 && (
                  <span className="text-[10px] text-slate-400 font-sans">
                    ({isKhmer ? 'ដកថ្លៃសេវាពិសោធន៍' : 'Less assay fee'}: -${appraisalFee.toFixed(2)})
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-2xl print:text-xl font-bold font-mono text-amber-900 block">
                  ${totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
                <span className="text-xs print:text-[10px] font-bold text-slate-600 block mt-0.5">
                  ≈ ៛{totalAmountKhr.toLocaleString()} KHR
                </span>
              </div>
            </div>

            {notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] print:text-[9.5px] text-slate-600">
                <strong className="text-slate-800">{isKhmer ? 'កំណត់សម្គាល់ការពិសោធន៍:' : 'Assay Notes:'}</strong> {notes}
              </div>
            )}

            {/* Signature Block for Official Printouts */}
            <div className="pt-6 print:pt-4 grid grid-cols-2 gap-8 text-center text-xs print:text-[10px]">
              <div>
                <div className="border-b border-slate-300 h-10 mb-1"></div>
                <span className="text-slate-500 font-medium">{isKhmer ? 'ហត្ថលេខាអតិថិជន (Customer)' : 'Customer Signature'}</span>
              </div>
              <div>
                <div className="border-b border-slate-300 h-10 mb-1"></div>
                <span className="text-slate-500 font-medium">{isKhmer ? 'ហត្ថលេខាអ្នកវាយតម្លៃ (Appraiser)' : 'Atelier Appraiser'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
