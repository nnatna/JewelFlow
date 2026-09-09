import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Gem,
  TrendingUp,
  Repeat,
  Sparkles,
  Users,
  Truck,
  ShieldCheck,
  Scale
} from 'lucide-react';

export const Sidebar = () => {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, products, cart } = useApp();

  const totalGoldWeight = products.reduce((acc, p) => acc + (Number(p.net_weight) * Number(p.stock_qty)), 0);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'pos', label: t('nav.pos', 'POS Terminal'), icon: ShoppingBag, badge: cart.length > 0 ? `${cart.length} in cart` : null },
    { id: 'products', label: t('nav.catalog', 'Jewelry Catalog'), icon: Gem, badge: `${products.length}` },
    { id: 'goldrates', label: t('nav.goldRates', 'Daily Metal Fix'), icon: TrendingUp },
    { id: 'buyback', label: t('nav.buybacks', 'Scrap Gold Buybacks'), icon: Repeat },
    { id: 'gemstones', label: t('nav.gemstones', 'Gemstones Vault'), icon: Sparkles },
    { id: 'customers', label: t('nav.customers', 'Clientèle CRM'), icon: Users },
    { id: 'suppliers', label: t('nav.suppliers', 'Suppliers Directory'), icon: Truck },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen text-slate-700 shadow-xs z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3 bg-white shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 shrink-0">
          <Gem className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-serif">
            JewelFlow
            <span className="text-[10px] uppercase font-sans font-extrabold tracking-widest text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
              ERP
            </span>
          </h1>
          <p className="text-[11px] text-slate-500">Atelier & Retail Suite</p>
        </div>
      </div>

      {/* Navigation Links (Scrollable if screen is short) */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
          {t('nav.operations', 'Store Operations')}
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-50 text-amber-900 border border-amber-300/80 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-amber-500 text-white font-bold' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Gold Stock Widget in Sidebar */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 shrink-0">
        <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              {t('nav.vaultStock', 'Vault Metal Stock')}
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-1.5 py-0.5 rounded">
              {t('nav.audited', 'Audited')}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {totalGoldWeight.toFixed(2)} <span className="text-xs text-amber-700 font-sans font-normal">grams</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{t('nav.estValuation', 'Est. Valuation:')}</span>
            <span className="font-semibold text-amber-800">
              ${(totalGoldWeight * 68.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {t('nav.backendReady', 'Backend Sync Ready')}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">v2.4 Pro</span>
        </div>
      </div>
    </aside>
  );
};
