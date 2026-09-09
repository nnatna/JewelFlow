import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import {
  TrendingUp,
  RefreshCw,
  Scale,
  ShieldCheck,
  Edit3,
  Calculator,
  Coins,
  Globe2,
  CheckCircle2,
  Copy,
  Search
} from 'lucide-react';

export const GoldRatesView = () => {
  const { t } = useTranslation();
  const {
    goldRates,
    updateGoldRate,
    cambodianGold,
    CAMBODIAN_STANDARDS,
    convertGramsToChi,
    convertGramsToDamlung,
    addNotification
  } = useApp();

  const [selectedRateId, setSelectedRateId] = useState(goldRates[0]?.metal_type_id || 1);
  const [newSellRate, setNewSellRate] = useState('');
  const [newBuyRate, setNewBuyRate] = useState('');

  // Metal Rates Table Search & Pagination (10 per page)
  const [metalSearch, setMetalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter rates
  const filteredRates = goldRates.filter(r =>
    r.name.toLowerCase().includes(metalSearch.toLowerCase()) ||
    r.rate_per_gram?.toString().includes(metalSearch)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [metalSearch]);

  const paginatedRates = filteredRates.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Cambodian Gold Calculator State
  const [calcWeight, setCalcWeight] = useState(1);
  const [calcUnit, setCalcUnit] = useState('chi'); // 'chi', 'damlung', 'g', 'hun', 'oz_t'
  const [calcPurity, setCalcPurity] = useState('24k');
  const [currencyMode, setCurrencyMode] = useState('USD'); // 'USD' | 'KHR'
  const [copied, setCopied] = useState(false);

  const currentRate = goldRates.find(r => r.metal_type_id === Number(selectedRateId)) || goldRates[0] || {
    name: '24K Gold',
    rate_per_gram: 83.0,
    buy_rate_per_gram: 78.0
  };

  // Base 24k benchmark rate per gram (defaulting to 83.00 if rates not yet loaded)
  const base24kGramRate = goldRates[0]?.rate_per_gram || 83.0;

  // Purity factors
  const purityMultipliers = {
    '24k': 1.0,
    '22k': 22 / 24,
    '21k': 21 / 24,
    '18k': 0.75,
    '14k': 14 / 24,
    '10k': 10 / 24,
  };

  // Weight multipliers to grams
  const unitToGrams = {
    'chi': 3.75,
    'damlung': 37.5,
    'g': 1.0,
    'hun': 0.375,
    'oz_t': 31.1034768
  };

  // Calculator calculations
  const weightInGrams = (parseFloat(calcWeight) || 0) * (unitToGrams[calcUnit] || 1.0);
  const purityFactor = purityMultipliers[calcPurity] || 1.0;
  const calculatedGramPriceUSD = base24kGramRate * purityFactor;
  const totalValueUSD = weightInGrams * calculatedGramPriceUSD;
  const khrRate = 4100;
  const totalValueKHR = Math.round(totalValueUSD * khrRate);

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!newSellRate || !newBuyRate) return;
    updateGoldRate(Number(selectedRateId), parseFloat(newSellRate), parseFloat(newBuyRate));
    setNewSellRate('');
    setNewBuyRate('');
  };

  const handleCopyQuote = () => {
    const text = `JewelFlow Quote: ${calcWeight} ${calcUnit.toUpperCase()} (${calcPurity.toUpperCase()}) = $${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD (${totalValueKHR.toLocaleString()} KHR)`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    addNotification('Cambodian gold valuation copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            {t('cambodiaGold.title', 'Daily Metal Fix & Cambodian Gold Board')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('nav.cambodianFix', 'Real-time bullion benchmarks with Cambodian measurements: Gram, Chi (ជី), and Damlung (តម្លឹង).')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Live Spot Engine Connected
          </span>
        </div>
      </div>

      {/* 🇰🇭 Cambodian Gold Standards & Formulas Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Troy Ounce Benchmark */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>{t('cambodiaGold.troyOunce', 'Troy Ounce (អោនស៍)')}</span>
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900">
            ${(base24kGramRate * 31.1035).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {t('cambodiaGold.troyOunceDesc', '1 oz t = 31.1035 grams')}
          </div>
          <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-2 font-medium">
            International LBMA Fix
          </div>
        </div>

        {/* 1 Gram */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>1 {t('cambodiaGold.gram', 'Gram (ក្រាម)')}</span>
            <Scale className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-mono font-bold text-amber-700">
            ${base24kGramRate.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {Math.round(base24kGramRate * khrRate).toLocaleString()} ៛ KHR
          </div>
          <div className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded mt-2 font-mono">
            {t('cambodiaGold.pricePerGram', 'Formula')}: Spot / 31.1035
          </div>
        </div>

        {/* 1 Chi (ជី) */}
        <div className="bg-gradient-to-br from-amber-50/80 to-white border border-amber-300 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
            <span>1 {t('cambodiaGold.chi', 'Chi (ជី)')} • 3.75g</span>
            <Coins className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-mono font-bold text-amber-800">
            ${(base24kGramRate * 3.75).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-mono">
            {Math.round(base24kGramRate * 3.75 * khrRate).toLocaleString()} ៛ KHR
          </div>
          <div className="text-[10px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded mt-2 font-mono font-bold">
            {t('cambodiaGold.pricePerChi', 'Formula')}: Price/g × 3.75
          </div>
        </div>

        {/* 1 Damlung (តម្លឹង) */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-100 uppercase tracking-wider mb-1">
            <span>1 {t('cambodiaGold.damlung', 'Damlung (តម្លឹង)')} • 10 ជី</span>
            <Scale className="w-3.5 h-3.5 text-amber-100" />
          </div>
          <div className="text-xl font-mono font-bold text-white">
            ${(base24kGramRate * 37.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-100 mt-1 font-mono">
            {Math.round(base24kGramRate * 37.5 * khrRate).toLocaleString()} ៛ KHR
          </div>
          <div className="text-[10px] text-amber-950 bg-white/90 px-2 py-0.5 rounded mt-2 font-mono font-bold">
            {t('cambodiaGold.pricePerDamlung', 'Formula')}: Price/Chi × 10
          </div>
        </div>
      </div>

      {/* Main Grid: Rates Table + Interactive Cambodian Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rates Table */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  Active Multi-Purity Metal Fix Board
                </h2>
                <p className="text-xs text-slate-500">
                  Priced per Gram, Chi (ជី), Damlung (តម្លឹង), and Troy Ounce ({filteredRates.length} total metals).
                </p>
              </div>

              {/* Search Metal */}
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter metal or rate..."
                  value={metalSearch}
                  onChange={(e) => setMetalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-3">Metal & Purity</th>
                    <th className="py-3 px-3">Per Gram (ក្រាម)</th>
                    <th className="py-3 px-3">Per Chi (ជី 3.75g)</th>
                    <th className="py-3 px-3">Per Damlung (តម្លឹង 37.5g)</th>
                    <th className="py-3 px-3">Troy Oz (31.10g)</th>
                    <th className="py-3 px-3 text-right">Buyback / g</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {paginatedRates.map(rate => {
                    const gramRate = rate.rate_per_gram;
                    const chiRate = gramRate * 3.75;
                    const damlungRate = chiRate * 10;
                    const troyOzRate = gramRate * 31.1035;

                    return (
                      <tr key={rate.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-sans font-bold text-slate-900">
                          {rate.name}
                        </td>
                        <td className="py-3 px-3 text-amber-700 font-bold">
                          ${gramRate.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-amber-900 font-bold bg-amber-50/40">
                          ${chiRate.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-slate-900 font-bold">
                          ${damlungRate.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          ${troyOzRate.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-medium">
                          ${rate.buy_rate_per_gram.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedRates.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 font-sans text-xs">
                        No metal types matching &quot;{metalSearch}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Metal Table Pagination (10 per page) */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredRates.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* 🇰🇭 Interactive Cambodian Gold Valuation Calculator */}
        <div className="rounded-2xl bg-gradient-to-b from-amber-50/70 to-white border border-amber-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-serif text-base font-bold text-slate-900">
                <Calculator className="w-4 h-4 text-amber-600" />
                Cambodian Gold Calculator
              </div>
              <span className="text-[10px] font-bold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded">
                ខ្នាតមាសខ្មែរ
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Instantly value gold weight in Chi (ជី), Damlung (តម្លឹង), or Grams with live rates.
            </p>

            <div className="space-y-3 text-xs">
              {/* Weight & Unit Input */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Weight Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:border-amber-500 focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit (ខ្នាត)</label>
                  <select
                    value={calcUnit}
                    onChange={(e) => setCalcUnit(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 font-semibold focus:border-amber-500 focus:outline-none shadow-2xs"
                  >
                    <option value="chi">Chi (ជី) • 3.75g</option>
                    <option value="damlung">Damlung (តម្លឹង) • 37.5g</option>
                    <option value="g">Gram (ក្រាម) • 1g</option>
                    <option value="hun">Hun (ហ៊ុន) • 0.375g</option>
                    <option value="oz_t">Troy Oz • 31.10g</option>
                  </select>
                </div>
              </div>

              {/* Purity Selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gold Purity (ទឹកមាស)</label>
                <select
                  value={calcPurity}
                  onChange={(e) => setCalcPurity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:border-amber-500 focus:outline-none shadow-2xs"
                >
                  <option value="24k">24K Pure Bullion (មាសសុទ្ធ 99.9%)</option>
                  <option value="22k">22K Fine Gold (91.6%)</option>
                  <option value="21k">21K Arabic Gold (87.5%)</option>
                  <option value="18k">18K Italian Fine Jewelry (75.0%)</option>
                  <option value="14k">14K Commercial Gold (58.3%)</option>
                  <option value="10k">10K Standard Gold (41.7%)</option>
                </select>
              </div>

              {/* Weight Breakdown Chips */}
              <div className="bg-white/80 border border-amber-200/80 rounded-xl p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Net Grams:</span>
                  <span className="font-bold text-slate-900">{weightInGrams.toFixed(3)} g</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>In Chi (ជី):</span>
                  <span className="font-bold text-amber-800">{convertGramsToChi(weightInGrams).toFixed(2)} ជី</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>In Damlung (តម្លឹង):</span>
                  <span className="font-bold text-slate-900">{convertGramsToDamlung(weightInGrams).toFixed(3)} តម្លឹង</span>
                </div>
              </div>

              {/* Valuation Result Box */}
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-[11px] font-medium text-amber-100 uppercase tracking-wider mb-0.5">
                  Calculated Metal Valuation
                </div>
                <div className="text-2xl font-mono font-bold">
                  ${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs font-sans font-normal text-amber-200 ml-1">USD</span>
                </div>
                <div className="text-sm font-mono font-bold text-amber-200 mt-0.5">
                  {totalValueKHR.toLocaleString()} ៛ KHR
                </div>
              </div>

              {/* Copy Quote Button */}
              <button
                type="button"
                onClick={handleCopyQuote}
                className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs active:scale-98"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Quotation Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Cambodian Quotation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Rate Adjustment Quick Form */}
          <div className="mt-4 pt-3 border-t border-amber-200">
            <details className="group cursor-pointer">
              <summary className="text-xs font-bold text-slate-700 flex items-center justify-between select-none">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  Override Daily Benchmark Rate
                </span>
                <span className="text-[10px] text-amber-700 group-open:rotate-180 transition-transform">▼</span>
              </summary>

              <form onSubmit={handleUpdate} className="space-y-3 mt-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-0.5">Target Metal</label>
                  <select
                    value={selectedRateId}
                    onChange={(e) => setSelectedRateId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium"
                  >
                    {goldRates.map(r => (
                      <option key={r.id} value={r.metal_type_id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-0.5">Sell Rate ($/g)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder={currentRate.rate_per_gram?.toString()}
                      value={newSellRate}
                      onChange={(e) => setNewSellRate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-0.5">Buy Rate ($/g)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder={currentRate.buy_rate_per_gram?.toString()}
                      value={newBuyRate}
                      onChange={(e) => setNewBuyRate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold rounded-lg cursor-pointer transition-all shadow-2xs active:scale-98"
                >
                  Save Benchmark
                </button>
              </form>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
