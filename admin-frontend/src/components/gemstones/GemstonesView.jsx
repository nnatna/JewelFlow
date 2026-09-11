import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faShieldHalved, faFilter, faXmark } from '@fortawesome/free-solid-svg-icons';

export const GemstonesView = () => {
  const { t } = useTranslation();
  const { gemstones, searchQuery, setSearchQuery } = useApp();
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const cleanQ = (searchQuery || '').toLowerCase().trim();
  const filteredGemstones = gemstones.filter(g => {
    const matchesSearch = !cleanQ || (
      g.name?.toLowerCase().includes(cleanQ) ||
      g.code?.toLowerCase().includes(cleanQ) ||
      g.clarity?.toLowerCase().includes(cleanQ) ||
      g.cut?.toLowerCase().includes(cleanQ)
    );
    const matchesType = selectedType === 'all' || g.type.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType]);

  const paginatedGemstones = filteredGemstones.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalVaultValue = gemstones.reduce((acc, g) => acc + (g.carat_weight * g.price_per_carat * g.stock_qty), 0);
  const totalCarats = gemstones.reduce((acc, g) => acc + (g.carat_weight * g.stock_qty), 0);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="w-6 h-6 text-amber-600" />
            {t('gemstones.title', 'Gemstones & Certified Diamonds Vault Table')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('gemstones.subtitle', 'Loose precious stones inventory with 4Cs appraisal')} ({gemstones.length} {t('gemstones.registeredVault', 'stones registered in vault')}).
          </p>
        </div>

        {/* Vault Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-right shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t('gemstones.totalValue', 'Total Vault Gems Value')}</span>
            <span className="text-base font-mono font-bold text-amber-700">
              ${totalVaultValue.toLocaleString()}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-right shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t('gemstones.totalCarats', 'Total Carats Held')}</span>
            <span className="text-base font-mono font-bold text-slate-800">
              {totalCarats.toFixed(2)} ct
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {cleanQ ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium">
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
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
              <span>{filteredGemstones.length} {t('gemstones.stonesListed', 'gemstones listed')}</span>
            </div>
          )}
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
              {type === 'all' ? t('gemstones.allTypes', 'All Types') : type}
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
                <th className="p-4 whitespace-nowrap min-w-[220px]">{t('gemstones.gemName', 'Gemstone Variety')}</th>
                <th className="p-4 whitespace-nowrap">{t('catalog.category', 'Category')}</th>
                <th className="p-4 whitespace-nowrap text-center">{t('gemstones.carat', 'Carat Wt.')}</th>
                <th className="p-4 whitespace-nowrap">Cut Shape</th>
                <th className="p-4 whitespace-nowrap">{t('gemstones.clarity', 'Clarity Grade')}</th>
                <th className="p-4 whitespace-nowrap">{t('gemstones.color', 'Color Tone')}</th>
                <th className="p-4 whitespace-nowrap text-right">{t('gemstones.cost', 'Price / Carat')}</th>
                <th className="p-4 whitespace-nowrap text-right">Piece Valuation</th>
                <th className="p-4 whitespace-nowrap text-center">{t('catalog.stock', 'Vault Stock')}</th>
                <th className="p-4 whitespace-nowrap text-center">Certification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedGemstones.map(gem => {
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
                        <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5" />
                        GIA Verified
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (10 per page) */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredGemstones.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
