import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ShieldCheck, Search } from 'lucide-react';

export const GemstonesView = () => {
  const { gemstones } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const filteredGemstones = gemstones.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.clarity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.cut.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || g.type.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const totalVaultValue = gemstones.reduce((acc, g) => acc + (g.carat_weight * g.price_per_carat * g.stock_qty), 0);
  const totalCarats = gemstones.reduce((acc, g) => acc + (g.carat_weight * g.stock_qty), 0);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-600" />
            Gemstones & Certified Diamonds Vault Table
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Loose precious stones inventory with 4Cs appraisal (Carat, Cut, Clarity, Color) and laboratory certification.
          </p>
        </div>

        {/* Vault Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-right shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Vault Gems Value</span>
            <span className="text-base font-mono font-bold text-amber-700">
              ${totalVaultValue.toLocaleString()}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-right shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Carats Held</span>
            <span className="text-base font-mono font-bold text-slate-800">
              {totalCarats.toFixed(2)} ct
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, cut, clarity, or stone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'Diamond', 'Sapphire', 'Ruby', 'Emerald'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer capitalize whitespace-nowrap transition-all ${
                selectedType === type
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Gemstones Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-4 whitespace-nowrap">Stone Code</th>
                <th className="p-4 whitespace-nowrap min-w-[220px]">Gemstone Variety</th>
                <th className="p-4 whitespace-nowrap">Mineral Type</th>
                <th className="p-4 whitespace-nowrap text-center">Carat Wt.</th>
                <th className="p-4 whitespace-nowrap">Cut Shape</th>
                <th className="p-4 whitespace-nowrap">Clarity Grade</th>
                <th className="p-4 whitespace-nowrap">Color Tone</th>
                <th className="p-4 whitespace-nowrap text-right">Price / Carat</th>
                <th className="p-4 whitespace-nowrap text-right">Piece Valuation</th>
                <th className="p-4 whitespace-nowrap text-center">Vault Stock</th>
                <th className="p-4 whitespace-nowrap text-center">Certification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredGemstones.map(gem => {
                const totalPieceValuation = gem.carat_weight * gem.price_per_carat;

                return (
                  <tr key={gem.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-amber-800 whitespace-nowrap">
                      {gem.code}
                    </td>
                    <td className="p-4 font-sans font-bold text-slate-900 min-w-[220px]">
                      {gem.name}
                    </td>
                    <td className="p-4 font-sans whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {gem.type}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-800 whitespace-nowrap">
                      {gem.carat_weight} ct
                    </td>
                    <td className="p-4 font-sans text-slate-700 whitespace-nowrap">
                      {gem.cut}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {gem.clarity}
                      </span>
                    </td>
                    <td className="p-4 font-sans text-slate-700 whitespace-nowrap">
                      {gem.color}
                    </td>
                    <td className="p-4 text-right text-slate-600 whitespace-nowrap">
                      ${gem.price_per_carat.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-amber-700 text-sm whitespace-nowrap">
                      ${totalPieceValuation.toLocaleString()}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full font-bold text-[11px] bg-slate-100 text-slate-800">
                        {gem.stock_qty} stones
                      </span>
                    </td>
                    <td className="p-4 text-center font-sans whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        GIA Verified
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
