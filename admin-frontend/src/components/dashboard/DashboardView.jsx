import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { Alert } from '../common/Alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faScaleBalanced,
  faBagShopping,
  faArrowTrendUp,
  faTriangleExclamation,
  faArrowsRotate,
  faWandMagicSparkles,
  faChevronRight,
  faClock
} from '@fortawesome/free-solid-svg-icons';

export const DashboardView = () => {
  const { t, i18n } = useTranslation();
  const isKhmer = (i18n.language || 'km').startsWith('km');
  const {
    sales,
    products,
    goldRates,
    buybacks,
    setActiveTab,
    liveSpot,
  } = useApp();

  // Quick live calculator state
  const [calcWeight, setCalcWeight] = useState(10);
  const [calcMetalId, setCalcMetalId] = useState(1);
  const [calcLabor, setCalcLabor] = useState(120);

  // Live Metal Price Board Pagination (10 per page)
  const [metalPage, setMetalPage] = useState(1);
  const metalPageSize = 10;
  const paginatedGoldRates = goldRates.slice((metalPage - 1) * metalPageSize, metalPage * metalPageSize);

  // Computed metrics
  const totalSalesRevenue = sales.reduce((acc, s) => acc + (parseFloat(s.grand_total_usd ?? s.grand_total) || 0), 0);
  const totalGoldGrams = products.reduce((acc, p) => acc + ((parseFloat(p.net_weight) || 0) * (parseInt(p.stock_qty, 10) || 0)), 0);
  const avgTicket = sales.length > 0 ? (totalSalesRevenue / sales.length) : 0;
  const totalBuybacksAmount = buybacks.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0);

  const lowStockProducts = products.filter(p => p.stock_qty <= 3);
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);

  // Compute quick estimator
  const selectedMetalRate = goldRates.find(r => r.metal_type_id === Number(calcMetalId))?.rate_per_gram || 85.5;
  const estimatedJewelryPrice = ((calcWeight * selectedMetalRate) + Number(calcLabor)) * 1.15; // 15% markup default

  return (
    <div className="space-y-6">
      {/* Low Stock Alert Callout */}
      {showLowStockAlert && lowStockProducts.length > 0 && (
        <Alert
          type="warning"
          variant="luxury"
          title={t('dashboard.lowStockAlert', 'Low Stock Warning')}
          message={isKhmer 
            ? `មានគ្រឿងអលង្ការចំនួន ${lowStockProducts.length} មុខដែលជិតអស់ពីស្តុក (≤ 3 គ្រឿង)។ សូមពិនិត្យដើម្បីបំពេញស្តុកឡើងវិញ។` 
            : `${lowStockProducts.length} jewelry pieces in vault inventory have dropped to critical safety levels (≤ 3 units). Restock is recommended.`}
          dismissible
          onClose={() => setShowLowStockAlert(false)}
          action={
            <button
              onClick={() => setActiveTab('products')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>{t('dashboard.restockAlerts', 'Review Restock Items')}</span>
              <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
            </button>
          }
        />
      )}

      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 via-white to-amber-100/50 p-6 rounded-2xl border border-amber-200 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold mb-2">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5 text-amber-600" />
            {t('dashboard.atelierBadge', 'Jewelry Atelier & Point of Sale')}
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-serif">
            {t('dashboard.welcome', 'Welcome to JewelFlow Atelier')}
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-xl">
            {t('dashboard.welcomeSubtitle', 'Live gold rate re-pricing enabled. Track fine jewelry inventory, bullion weight, customer trade-ins, and high-value sales.')}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4" />
            {t('nav.openPos', 'Open POS Terminal')}
          </button>
          <button
            onClick={() => setActiveTab('buyback')}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-amber-900 border border-amber-300 font-semibold px-4 py-2.5 rounded-xl text-sm shadow-xs cursor-pointer transition-all"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className="w-4 h-4 text-amber-600" />
            {t('nav.buybacks', 'Scrap Gold Buybacks')}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('dashboard.totalRevenue', 'Total Revenue')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faDollarSign} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-900">
            ${totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <FontAwesomeIcon icon={faArrowTrendUp} className="w-3.5 h-3.5" />
            <span>+14.8% {t('dashboard.vsLastWeek', 'vs last week')}</span>
          </div>
        </div>

        {/* Vault Metal Weight */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('dashboard.goldInVault', 'Gold Stock in Vault')}</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faScaleBalanced} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-900">
            {totalGoldGrams.toFixed(1)}g
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>{(totalGoldGrams / 3.75).toFixed(1)} {isKhmer ? 'ជី' : 'Chi'}</span>
          </div>
        </div>

        {/* Average Ticket */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('dashboard.avgTicket', 'Average Ticket')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowTrendUp} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-900">
            ${avgTicket.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {sales.length} {t('dashboard.completedTransactions', 'completed transactions')}
          </div>
        </div>

        {/* Trade-ins / Buybacks */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('dashboard.scrapBuybacks', 'Scrap Buybacks')}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowsRotate} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-900">
            ${totalBuybacksAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {buybacks.length} {t('dashboard.tradeInTickets', 'client trade-in tickets')}
          </div>
        </div>
      </div>

      {/* Main Grid: Live Rate Matrix & Fast Estimator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Metal Board Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faArrowTrendUp} className="w-4 h-4 text-amber-600" />
                  {t('dashboard.metalPriceBoard', 'Live Metal Price Board (per gram)')}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-amber-800">{isKhmer ? 'តាមតម្លៃដើម:' : 'Market Spot:'}</span>
                  <span className="font-mono font-extrabold text-amber-950">
                    ${Number(liveSpot?.spot_price_per_oz ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz
                  </span>
                  <span className="text-[11px] font-mono text-amber-800">
                    (${Number(liveSpot?.price_per_chi ?? (Number(liveSpot?.spot_price_per_oz ?? 0) / 31.1034768 * 3.75)).toFixed(2)}/{isKhmer ? 'ជី' : 'chi'})
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('dashboard.metalBoardDesc', 'Automatically recalculates jewelry prices across the store')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('goldrates')}
              className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              {t('dashboard.manageRates', 'Manage Rates')} <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-600 border-b border-slate-200 bg-slate-50 font-semibold">
                <tr>
                  <th className="py-2.5 px-2">{t('catalog.metalPurity', 'Metal & Purity')}</th>
                  <th className="py-2.5 px-2">{t('dashboard.sellRate', 'Retail Sell Rate')}</th>
                  <th className="py-2.5 px-2">{t('dashboard.buybackRate', 'Store Buyback Rate')}</th>
                  <th className="py-2.5 px-2">{t('dashboard.spread', 'Spread / Margin')}</th>
                  <th className="py-2.5 px-2 text-right">{t('dashboard.flux24h', '24h Flux')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {paginatedGoldRates.map(rate => {
                  const spread = rate.rate_per_gram - rate.buy_rate_per_gram;
                  return (
                    <tr key={rate.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2 font-sans font-semibold text-slate-900">
                        {rate.name}
                      </td>
                      <td className="py-3 px-2 text-amber-700 font-bold">
                        ${rate.rate_per_gram.toFixed(2)}/g
                      </td>
                      <td className="py-3 px-2 text-slate-700">
                        ${rate.buy_rate_per_gram.toFixed(2)}/g
                      </td>
                      <td className="py-3 px-2 text-slate-500">
                        ${spread.toFixed(2)} ({((spread / rate.rate_per_gram) * 100).toFixed(1)}%)
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

          <div className="mt-3">
            <Pagination
              currentPage={metalPage}
              totalItems={goldRates.length}
              pageSize={metalPageSize}
              onPageChange={setMetalPage}
            />
          </div>
        </div>

        {/* Interactive Instant Price Estimator */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-50/60 to-white border border-amber-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-800 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5 text-amber-600" />
                {t('dashboard.estimatorTitle', 'Instant Atelier Estimator')}
              </span>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold">{t('dashboard.realTime', 'Real-time')}</span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              {t('dashboard.estimatorDesc', 'Calculate instant retail pricing based on metal weight and live market fixes.')}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t('dashboard.metalKarat', 'Metal Karat')}</label>
                <select
                  value={calcMetalId}
                  onChange={(e) => setCalcMetalId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-amber-500 focus:outline-none shadow-2xs font-medium"
                >
                  {goldRates.map(r => (
                    <option key={r.id} value={r.metal_type_id}>
                      {r.name} (${r.rate_per_gram.toFixed(2)}/g)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('dashboard.netWeight', 'Net Weight:')} <span className="font-mono text-amber-800 font-bold">{calcWeight} g</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t('dashboard.makingFee', 'Making / Craftsmanship Fee ($)')}</label>
                <input
                  type="number"
                  value={calcLabor}
                  onChange={(e) => setCalcLabor(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-amber-500 focus:outline-none font-mono shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Result Box */}
          <div className="mt-6 pt-4 border-t border-amber-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('dashboard.estimatedTag', 'Estimated Retail Tag:')}</span>
              <span className="text-[11px] text-amber-800 font-semibold">{t('dashboard.includesMarkup', 'Includes 15% Markup')}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700">
              ${estimatedJewelryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {t('dashboard.metalValue', 'Metal Value:')} ${(calcWeight * selectedMetalRate).toFixed(2)} + {t('dashboard.labor', 'Labor:')} ${calcLabor}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Invoices & Low Stock Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-amber-600" />
                {t('dashboard.recentSalesTitle', 'Recent Sales & Invoices')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.recentSalesSubtitle', 'Latest finalized boutique customer sales')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('sales')}
                className="text-xs text-amber-800 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer transition-colors"
              >
                {t('dashboard.viewHistory', 'View History →')}
              </button>
              <button
                onClick={() => setActiveTab('pos')}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                {t('dashboard.openRegister', 'Open Register →')}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {sales.slice(0, 4).map(sale => (
              <div
                key={sale.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-amber-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-800">{sale.invoice_no}</span>
                    <span className="text-slate-500">• {sale.sale_date}</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                      {sale.payment_status}
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium mt-1">
                    {t('salesHistory.customer', 'Customer')}: <span className="text-slate-900 font-bold">{sale.customer_name}</span>
                    <span className="text-slate-500 ml-2">({sale.items.length} {sale.items.length > 1 ? t('salesHistory.items', 'items') : t('salesHistory.itemSingle', 'item')})</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">{sale.payment_method}</span>
                    {sale.currency && (
                      <span className="text-[10px] font-bold px-1 rounded bg-amber-100 text-amber-900">{sale.currency}</span>
                    )}
                  </div>
                  <span className="text-base font-mono font-bold text-slate-900">
                    ${(parseFloat(sale.grand_total_usd ?? sale.grand_total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-amber-600" />
              {t('dashboard.restockAlerts', 'Stock Restock Alerts')}
            </h2>
            <span className="text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">
              {lowStockProducts.length} {t('dashboard.items', 'Items')}
            </span>
          </div>

          <div className="space-y-3">
            {lowStockProducts.map(prod => (
              <div
                key={prod.id}
                onClick={() => setActiveTab('products')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 cursor-pointer hover:border-amber-300 hover:bg-amber-50/40 transition-all select-none group"
                title="View in Jewelry Catalog"
              >
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-900 transition-colors">{prod.name}</h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{prod.code_sku}</span>
                    <span>•</span>
                    <span>{prod.net_weight}g</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-rose-600 font-mono">
                    {prod.stock_qty} {t('dashboard.left', 'left')}
                  </div>
                  <div className="text-[10px] text-slate-400">{t('dashboard.restockNeeded', 'Restock needed')}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveTab('products')}
            className="w-full mt-4 py-2 text-center text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer border border-amber-200"
          >
            {t('dashboard.viewInventory', 'View Full Inventory Table →')}
          </button>
        </div>
      </div>
    </div>
  );
};
