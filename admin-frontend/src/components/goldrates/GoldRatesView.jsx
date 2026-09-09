import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TrendingUp, RefreshCw, Scale, ShieldCheck, Edit3 } from 'lucide-react';

export const GoldRatesView = () => {
  const { goldRates, updateGoldRate } = useApp();

  const [selectedRateId, setSelectedRateId] = useState(goldRates[0]?.metal_type_id || 1);
  const [newSellRate, setNewSellRate] = useState('');
  const [newBuyRate, setNewBuyRate] = useState('');

  const currentRate = goldRates.find(r => r.metal_type_id === Number(selectedRateId)) || goldRates[0];

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!newSellRate || !newBuyRate) return;
    updateGoldRate(Number(selectedRateId), parseFloat(newSellRate), parseFloat(newBuyRate));
    setNewSellRate('');
    setNewBuyRate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-amber-600" />
          Daily Metal Fix & Exchange Rates Board
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time benchmark rates for retail jewelry sales and scrap gold buybacks.
        </p>
      </div>

      {/* Main Grid: Rates Table + Quick Rate Modifier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rates Table */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              Active Metal Rates Board
            </h2>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Pricing Engine Connected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-2">Metal & Purity</th>
                  <th className="py-3 px-2">Selling Rate / g</th>
                  <th className="py-3 px-2">Buyback Rate / g</th>
                  <th className="py-3 px-2">Troy Oz Rate</th>
                  <th className="py-3 px-2 text-right">24h Flux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {goldRates.map(rate => {
                  const troyOzRate = rate.rate_per_gram * 31.1035;
                  return (
                    <tr key={rate.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2 font-sans font-bold text-slate-900">
                        {rate.name}
                      </td>
                      <td className="py-3 px-2 text-amber-700 font-bold">
                        ${rate.rate_per_gram.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-slate-700">
                        ${rate.buy_rate_per_gram.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-slate-500">
                        ${troyOzRate.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-semibold ${
                          rate.change_24h >= 0 ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                        }`}>
                          {rate.change_24h >= 0 ? '+' : ''}{rate.change_24h}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Rate Card */}
        <div className="rounded-2xl bg-gradient-to-b from-amber-50/60 to-white border border-amber-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-serif text-base font-bold text-slate-900 mb-2">
              <Edit3 className="w-4 h-4 text-amber-600" />
              Adjust Metal Market Fix
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Updating the rate immediately recalculates all retail and POS prices across the atelier.
            </p>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Metal Purity</label>
                <select
                  value={selectedRateId}
                  onChange={(e) => {
                    setSelectedRateId(e.target.value);
                    const sel = goldRates.find(r => r.metal_type_id === Number(e.target.value));
                    if (sel) {
                      setNewSellRate(sel.rate_per_gram);
                      setNewBuyRate(sel.buy_rate_per_gram);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none shadow-2xs font-medium"
                >
                  {goldRates.map(r => (
                    <option key={r.id} value={r.metal_type_id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  New Retail Sell Rate ($ / gram)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={currentRate.rate_per_gram.toString()}
                  value={newSellRate}
                  onChange={(e) => setNewSellRate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-amber-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  New Store Buyback Rate ($ / gram)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={currentRate.buy_rate_per_gram.toString()}
                  value={newBuyRate}
                  onChange={(e) => setNewBuyRate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-amber-500 focus:outline-none shadow-2xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold rounded-lg cursor-pointer transition-all shadow-sm active:scale-98"
              >
                Apply New Rate Globally
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-200 text-[11px] text-slate-500 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
            <span>Effective date timestamped to today&apos;s trade log.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
