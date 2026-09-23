import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { BuybackVoucherModal } from './BuybackVoucherModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faScaleBalanced, faFileLines, faFilter, faXmark, faPrint, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

export const BuybackView = () => {
  const { t, i18n } = useTranslation();
  const { buybacks = [], goldRates = [], processBuyback, searchQuery, setSearchQuery, showToast } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedMetalId, setSelectedMetalId] = useState(goldRates[0]?.metal_type_id || 1);
  const [grossWeight, setGrossWeight] = useState(10);
  const [meltLossPct, setMeltLossPct] = useState(2.0);
  const [appraisalFee, setAppraisalFee] = useState(20);
  const [payoutMethod, setPayoutMethod] = useState('Cash');
  const [notes, setNotes] = useState('Tested via XRF assay spectrometer. Good purity.');
  const [issuedVoucher, setIssuedVoucher] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});
  const pageSize = 10;

  useEffect(() => {
    if (goldRates && goldRates.length > 0 && !goldRates.some(r => r.metal_type_id === Number(selectedMetalId))) {
      setSelectedMetalId(goldRates[0].metal_type_id);
    }
  }, [goldRates, selectedMetalId]);

  const defaultRate = { id: 1, metal_type_id: 1, name: '24K Yellow Gold', buy_rate_per_gram: 80.0 };
  const selectedRate = (goldRates && goldRates.length > 0)
    ? (goldRates.find(r => r.metal_type_id === Number(selectedMetalId)) || goldRates[0] || defaultRate)
    : defaultRate;
  const buyRate = Number(selectedRate?.buy_rate_per_gram || 80.0);

  // Calculation
  const netWeight = Math.max(0, (Number(grossWeight) || 0) * (1 - (Number(meltLossPct) || 0) / 100));
  const rawValue = netWeight * buyRate;
  const totalPayout = Math.max(0, rawValue - (Number(appraisalFee) || 0));

  const cleanQ = (searchQuery || '').toLowerCase().trim();
  const safeBuybacks = Array.isArray(buybacks) ? buybacks : [];
  const filteredBuybacks = safeBuybacks.filter(b =>
    !cleanQ || (
      b.customer_name?.toLowerCase().includes(cleanQ) ||
      b.customer_phone?.includes(cleanQ) ||
      b.metal_name?.toLowerCase().includes(cleanQ) ||
      b.buyback_no?.toLowerCase().includes(cleanQ) ||
      b.notes?.toLowerCase().includes(cleanQ)
    )
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedBuybacks = filteredBuybacks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleProcess = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!customerName || !customerName.trim()) {
      newErrors.customerName = isKhmer ? 'សូមបញ្ចូលឈ្មោះអតិថិជន' : 'Please enter customer name';
    }
    if (!grossWeight || parseFloat(grossWeight) <= 0) {
      newErrors.grossWeight = isKhmer ? 'សូមបញ្ចូលទម្ងន់ត្រឹមត្រូវ' : 'Please enter valid scrap weight';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      const voucher = await processBuyback({
        customer_name: customerName.trim(),
        customer_phone: customerPhone || 'N/A',
        metal_type_id: Number(selectedMetalId) || (selectedRate?.metal_type_id || 1),
        metal_name: selectedRate?.name || '24K Gold',
        gross_weight: parseFloat(grossWeight) || 0,
        melt_loss_pct: parseFloat(meltLossPct) || 0,
        net_weight: parseFloat(netWeight.toFixed(2)),
        buy_rate_per_gram: parseFloat(buyRate),
        appraisal_fee: parseFloat(appraisalFee) || 0,
        total_amount: parseFloat(totalPayout.toFixed(2)),
        payment_method: payoutMethod,
        notes
      });

      if (voucher) {
        setIssuedVoucher(voucher);
        if (showToast) {
          showToast(isKhmer ? 'បានបង្កើតប័ណ្ណទិញចូលដោយជោគជ័យ' : 'Buyback voucher created successfully', 'success');
        }
      }
      setCustomerName('');
      setCustomerPhone('');
      setErrors({});
    } catch (err) {
      console.error('Process buyback error:', err);
      if (showToast) {
        showToast(isKhmer ? 'មានបញ្ហាក្នុងការបង្កើតប័ណ្ណទិញចូល!' : 'Failed to process buyback.', 'error');
      }
    }
  };

  const ratesList = (goldRates && goldRates.length > 0) ? goldRates : [defaultRate];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faArrowsRotate} className="w-6 h-6 text-amber-600" />
          {t('buybacks.title', 'Scrap Gold Buyback & Trade-In Terminal')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('buybacks.subtitle', 'Appraise customer estate gold, weigh bullion scrap, and issue cash payouts or store trade-in credit')} ({safeBuybacks.length} {t('buybacks.vouchersOnRecord', 'vouchers on record')}).
        </p>
      </div>

      {/* Main Grid: Calculator Form + Records Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Buyback Appraisal Form (5 cols on lg) */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-slate-100 border-b">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-serif">
              <FontAwesomeIcon icon={faScaleBalanced} className="w-4 h-4 text-amber-600" />
              {t('buybacks.appraisalSlip', 'Precious Metal Appraisal Slip')}
            </h2>
            <span className="text-[10px] text-amber-900 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {t('buybacks.liveBuyFix', 'Live Buy Fix:')} ${buyRate.toFixed(2)}/g (${(buyRate * 3.75).toFixed(2)}/{isKhmer ? 'ជី' : 'chi'})
            </span>
          </div>

          <form noValidate onSubmit={handleProcess} className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">{t('buybacks.clientName', 'Customer Full Name')} <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Arthur Pendelton"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) setErrors(prev => ({ ...prev, customerName: null }));
                }}
                className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 focus:outline-none transition-colors ${
                  errors.customerName ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 focus:bg-white'
                }`}
              />
              {errors.customerName && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{errors.customerName}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">{t('buybacks.clientPhone', 'Customer Phone / Contact')}</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">{t('buybacks.metalAssessment', 'Tested Metal Purity')}</label>
              <select
                value={selectedMetalId}
                onChange={(e) => setSelectedMetalId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-medium"
              >
                {ratesList.map(r => {
                  const rateVal = Number(r.buy_rate_per_gram || 0);
                  return (
                    <option key={r.id || r.metal_type_id} value={r.metal_type_id}>
                      {r.name} (Buy @ ${rateVal.toFixed(2)}/g • ${(rateVal * 3.75).toFixed(2)}/{isKhmer ? 'ជី' : 'chi'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t('buybacks.grossWeight', 'Gross Scrap Weight (g)')} <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={grossWeight}
                  onChange={(e) => {
                    setGrossWeight(parseFloat(e.target.value) || 0);
                    if (errors.grossWeight) setErrors(prev => ({ ...prev, grossWeight: null }));
                  }}
                  className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none transition-colors ${
                    errors.grossWeight ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 focus:bg-white'
                  }`}
                />
                {errors.grossWeight && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{errors.grossWeight}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t('buybacks.meltLoss', 'Melt Loss / Impurity (%)')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={meltLossPct}
                  onChange={(e) => setMeltLossPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t('buybacks.assayFee', 'Assay / Melt Fee ($)')}</label>
                <input
                  type="number"
                  value={appraisalFee}
                  onChange={(e) => setAppraisalFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t('buybacks.payoutMethod', 'Payout Tender Method')}</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-medium"
                >
                  <option value="Cash">{t('pos.cash', 'Instant Cash Payout')}</option>
                  <option value="Store Credit">Store Credit (Trade-In)</option>
                  <option value="Bank Wire">Bank Wire Transfer</option>
                  <option value="KHQR">{t('pos.khqr', 'KHQR')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">{t('buybacks.notes', 'Assay & Purity Notes')}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Calculated Payout Summary */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1 font-mono">
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>{t('buybacks.netScrap', 'Net Gold Weight')}:</span>
                <span className="font-bold text-amber-950">{((netWeight || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'} ({(netWeight || 0).toFixed(2)}g)</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Base Bullion Value:</span>
                <span>${(rawValue || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-amber-200">
                <span>{t('buybacks.payout', 'Cash Payout')}:</span>
                <span className="text-amber-700 font-extrabold">${(totalPayout || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/20 active:scale-98 transition-all"
            >
              {t('buybacks.processBtn', 'Process Buyback & Print Voucher')}
            </button>
          </form>
        </div>

        {/* Past Buyback Transactions Table (7 cols on lg) */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faFileLines} className="w-4 h-4 text-amber-600" />
              {t('buybacks.recentVouchers', 'Settled Buyback Vouchers Table')}
            </h2>
            {cleanQ ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium text-xs">
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
            ) : (
              <span className="text-xs text-slate-500 font-semibold">{safeBuybacks.length} {t('buybacks.vouchersOnRecord', 'vouchers recorded')}</span>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Voucher No</th>
                  <th className="p-3">{t('buybacks.customer', 'Customer')}</th>
                  <th className="p-3">{t('buybacks.metalType', 'Metal')} & {t('buybacks.chiWeight', 'Wt.')}</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3 text-right">{t('buybacks.payout', 'Net Payout')}</th>
                  <th className="p-3 text-center">{t('common.status', 'Status')}</th>
                  <th className="p-3 text-center">{t('salesHistory.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {paginatedBuybacks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-sans">
                      {isKhmer ? 'មិនមានទិន្នន័យទិញមាសចាស់ចូលទេ' : 'No scrap buyback records found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedBuybacks.map(bb => (
                    <tr key={bb.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-amber-800">
                        {bb.buyback_no || `BB-${bb.id}`}
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">{bb.buyback_date}</span>
                      </td>
                      <td className="p-3 font-sans font-semibold text-slate-900">
                        {bb.customer_name || 'Walk-in Customer'}
                        <span className="text-[10px] text-slate-400 block font-normal">{bb.customer_phone || ''}</span>
                      </td>
                      <td className="p-3 font-sans text-slate-700">
                        <span className="font-semibold block">{bb.metal_name || 'Gold'}</span>
                        <span className="text-[11px] text-amber-950 font-bold block">{((Number(bb.net_weight) || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({Number(bb.net_weight || 0).toFixed(2)}g)</span>
                      </td>
                      <td className="p-3 text-slate-600">
                        ${Number(bb.buy_rate_per_gram || 0).toFixed(2)}/g
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 text-sm">
                        ${Number(bb.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[10px] text-amber-700 block font-sans font-semibold">{bb.payment_method || 'Cash'}</span>
                      </td>
                      <td className="p-3 text-center font-sans">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {bb.status || 'Approved'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-sans">
                        <button
                          onClick={() => setIssuedVoucher(bb)}
                          className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-all shadow-2xs"
                          title={isKhmer ? 'មើលប័ណ្ណទិញចូល / បោះពុម្ព' : 'View / Print Voucher'}
                        >
                          <FontAwesomeIcon icon={faPrint} className="w-3 h-3 text-amber-600" />
                          <span className="hidden sm:inline">{isKhmer ? 'ប័ណ្ណ' : 'Voucher'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls (10 per page) */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredBuybacks.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Luxury Buyback Voucher Modal */}
      {issuedVoucher && (
        <BuybackVoucherModal
          voucher={issuedVoucher}
          onClose={() => setIssuedVoucher(null)}
        />
      )}
    </div>
  );
};
