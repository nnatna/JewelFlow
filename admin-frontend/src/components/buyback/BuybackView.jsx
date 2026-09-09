import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Repeat, Scale, FileText } from 'lucide-react';

export const BuybackView = () => {
  const { buybacks, goldRates, processBuyback } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedMetalId, setSelectedMetalId] = useState(goldRates[0]?.metal_type_id || 1);
  const [grossWeight, setGrossWeight] = useState(10);
  const [meltLossPct, setMeltLossPct] = useState(2.0);
  const [appraisalFee, setAppraisalFee] = useState(20);
  const [payoutMethod, setPayoutMethod] = useState('Cash');
  const [notes, setNotes] = useState('Tested via XRF assay spectrometer. Good purity.');
  const [issuedVoucher, setIssuedVoucher] = useState(null);

  const selectedRate = goldRates.find(r => r.metal_type_id === Number(selectedMetalId)) || goldRates[0];
  const buyRate = selectedRate?.buy_rate_per_gram || 80.0;

  // Calculation
  const netWeight = Math.max(0, grossWeight * (1 - meltLossPct / 100));
  const rawValue = netWeight * buyRate;
  const totalPayout = Math.max(0, rawValue - Number(appraisalFee));

  const handleProcess = (e) => {
    e.preventDefault();
    if (!customerName || grossWeight <= 0) return;

    const voucher = processBuyback({
      customer_name: customerName,
      customer_phone: customerPhone,
      metal_name: selectedRate.name,
      gross_weight: parseFloat(grossWeight),
      melt_loss_pct: parseFloat(meltLossPct),
      net_weight: parseFloat(netWeight.toFixed(2)),
      buy_rate_per_gram: parseFloat(buyRate),
      appraisal_fee: parseFloat(appraisalFee),
      total_amount: parseFloat(totalPayout.toFixed(2)),
      payment_method: payoutMethod,
      notes
    });

    setIssuedVoucher(voucher);
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
          <Repeat className="w-6 h-6 text-amber-600" />
          Scrap Gold Buyback & Trade-In Terminal
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Appraise customer estate gold, weigh bullion scrap, and issue cash payouts or store trade-in credit.
        </p>
      </div>

      {/* Main Grid: Calculator Form + Records Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Buyback Appraisal Form (5 cols on lg) */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-serif">
              <Scale className="w-4 h-4 text-amber-600" />
              Precious Metal Appraisal Slip
            </h2>
            <span className="text-[10px] text-amber-900 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Live Buy Fix: ${buyRate.toFixed(2)}/g
            </span>
          </div>

          <form onSubmit={handleProcess} className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Client Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Arthur Pendelton"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Client Phone / Contact</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tested Metal Purity</label>
              <select
                value={selectedMetalId}
                onChange={(e) => setSelectedMetalId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-medium"
              >
                {goldRates.map(r => (
                  <option key={r.id} value={r.metal_type_id}>
                    {r.name} (Buy @ ${r.buy_rate_per_gram.toFixed(2)}/g)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gross Weight (g)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Melt Loss / Dross (%)</label>
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
                <label className="block text-slate-700 font-semibold mb-1">Assay / Melt Fee ($)</label>
                <input
                  type="number"
                  value={appraisalFee}
                  onChange={(e) => setAppraisalFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Settlement Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-medium"
                >
                  <option value="Cash">Instant Cash Payout</option>
                  <option value="Store Credit">Store Credit (Trade-In)</option>
                  <option value="Bank Wire">Bank Wire Transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assay & Purity Notes</label>
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
                <span>Net Pure Gold Weight:</span>
                <span className="font-bold text-slate-800">{netWeight.toFixed(2)} grams</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Base Bullion Value:</span>
                <span>${rawValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-amber-200">
                <span>Net Client Payout:</span>
                <span className="text-amber-700 font-extrabold">${totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/20 active:scale-98 transition-all"
            >
              Issue Buyback Voucher & Disburse Payout
            </button>
          </form>
        </div>

        {/* Past Buyback Transactions Table (7 cols on lg) */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Settled Buyback Vouchers Table
            </h2>
            <span className="text-xs text-slate-500 font-semibold">{buybacks.length} vouchers recorded</span>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Voucher No</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Metal & Wt.</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3 text-right">Net Payout</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {buybacks.map(bb => (
                  <tr key={bb.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-800">
                      {bb.buyback_no}
                      <span className="text-[10px] text-slate-400 block font-normal font-sans">{bb.buyback_date}</span>
                    </td>
                    <td className="p-3 font-sans font-semibold text-slate-900">
                      {bb.customer_name}
                      <span className="text-[10px] text-slate-400 block font-normal">{bb.customer_phone}</span>
                    </td>
                    <td className="p-3 font-sans text-slate-700">
                      <span className="font-semibold block">{bb.metal_name}</span>
                      <span className="text-[11px] text-slate-500">{bb.net_weight}g net</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      ${bb.buy_rate_per_gram}/g
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 text-sm">
                      ${bb.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-[10px] text-amber-700 block font-sans font-semibold">{bb.payment_method}</span>
                    </td>
                    <td className="p-3 text-center font-sans">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {bb.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
