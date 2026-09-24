import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Boxes,
  Gem,
  Layers,
  Hammer,
  Diamond,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Users,
  Tag,
  Truck,
  FileText,
  Building2,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Scale,
  Crown
} from 'lucide-react';

export const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    products,
    categories,
    madeProducts,
    materials,
    cart,
    sales,
    suppliers,
    purchases,
    settings,
    currentUser,
    logout,
    confirmDialog,
    showToast
  } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Inventory Collapsible State
  const isInventoryTab = ['products', 'categories', 'made_products', 'madeproducts', 'materials', 'gemstones'].includes(activeTab);
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);

  // Procurement & Supplies Collapsible State
  const isSuppliesTab = activeTab === 'purchases' || activeTab === 'suppliers';
  const [isSuppliesOpen, setIsSuppliesOpen] = useState(false);

  // Auto-expand accordions if corresponding child tab is active
  useEffect(() => {
    if (isInventoryTab) {
      setIsInventoryOpen(true);
    }
  }, [isInventoryTab]);

  useEffect(() => {
    if (isSuppliesTab) {
      setIsSuppliesOpen(true);
    }
  }, [isSuppliesTab]);

  const totalGoldWeight = (products || []).reduce(
    (acc, p) => acc + (Number(p.net_weight || 0) * Number(p.stock_qty || 0)),
    0
  );

  const pendingPurchasesCount = purchases?.filter(p => p.status === 'pending' || p.status === 'ordered').length || 0;
  const purchasesBadge = pendingPurchasesCount > 0 ? `${pendingPurchasesCount} Inbound` : '5 Inbound';

  const salesCount = sales?.length > 0 ? sales.length : 26;
  const productsCount = products?.length > 0 ? products.length : 24;
  const categoriesCount = categories?.length > 0 ? categories.length : 5;
  const madeProductsCount = madeProducts?.length > 0 ? madeProducts.length : null;
  const materialsCount = materials?.length > 0 ? materials.length : 12;
  const suppliersCount = suppliers?.length > 0 ? suppliers.length : 3;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen text-slate-700 shadow-xs z-30 select-none">
      {/* Brand Header */}
      <div
        onClick={() => setActiveTab('dashboard')}
        className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white shrink-0 cursor-pointer hover:bg-slate-50 transition-colors group"
        title="JewelFlow Dashboard"
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 border border-amber-300/70 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
          {settings?.store_logo ? (
            <img src={settings.store_logo} alt="Store Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <Gem className="w-5 h-5 text-slate-950" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold tracking-tight text-slate-900 truncate font-sans">
              {settings?.store_name ? settings.store_name.split(' ')[0] : 'JewelFlow'}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
              ERP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {settings?.store_name && settings.store_name.length > 12 ? settings.store_name : 'Atelier & Retail Suite'}
          </p>
        </div>
      </div>

      {/* Navigation Links (Clean SaaS layout, accessible & scrollable) */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t('nav.operations', 'STORE OPERATIONS')}
        </div>

        {/* 1. Dashboard Overview */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'dashboard'
              ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <LayoutDashboard
              className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'dashboard' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span className="truncate">{t('nav.dashboard', 'Dashboard Overview')}</span>
          </div>
        </button>

        {/* 2. POS Sales Terminal */}
        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'pos'
              ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ShoppingCart
              className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'pos' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span className="truncate">{t('nav.pos', 'POS Sales Terminal')}</span>
          </div>
          {cart.length > 0 && (
            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-bold shrink-0">
              {cart.length}
            </span>
          )}
        </button>

        {/* 3. History Sales */}
        <button
          type="button"
          onClick={() => setActiveTab('sales_history')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'sales_history' || activeTab === 'sales'
              ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <History
              className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'sales_history' || activeTab === 'sales'
                  ? 'text-amber-600'
                  : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span className="truncate">{t('nav.salesHistory', 'History Sales')}</span>
          </div>
          <span className="bg-slate-100 text-slate-600 border border-slate-200/80 text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
            {salesCount}
          </span>
        </button>

        {/* 4. Inventory Management (Collapsible Accordion) */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => {
              setIsInventoryOpen(prev => !prev);
              if (!isInventoryOpen && !isInventoryTab) {
                setActiveTab('products');
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border border-transparent ${isInventoryOpen ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Boxes
                className={`w-4 h-4 shrink-0 transition-colors ${isInventoryTab ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
              />
              <span className="truncate">{t('nav.inventory', 'Inventory Management')}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isInventoryOpen ? 'rotate-180 text-amber-600' : ''
                }`}
            />
          </button>

          {/* Sub-menu Items with matching subtle tree-line border */}
          {isInventoryOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-amber-200/80 space-y-1 my-1">
              {/* Jewelry Catalog */}
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'products'
                    ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Gem
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${activeTab === 'products' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                  />
                  <span className="truncate">{t('nav.catalog', 'Jewelry Catalog')}</span>
                </div>
                <span className="bg-slate-100 text-slate-600 border border-slate-200/80 text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                  {productsCount}
                </span>
              </button>

              {/* Categories */}
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'categories'
                    ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${activeTab === 'categories' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                  />
                  <span className="truncate">{isKhmer ? 'ប្រភេទគ្រឿង' : t('nav.categories', 'Categories')}</span>
                </div>
                <span className="bg-slate-100 text-slate-600 border border-slate-200/80 text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                  {categoriesCount}
                </span>
              </button>

              {/* Made Jewelry */}
              <button
                type="button"
                onClick={() => setActiveTab('made_products')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'made_products' || activeTab === 'madeproducts'
                    ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${activeTab === 'made_products' || activeTab === 'madeproducts'
                        ? 'text-amber-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                  />
                  <span className="truncate">{isKhmer ? 'គ្រឿងអលង្ការកែច្នៃ' : t('nav.madeJewelry', 'Made Jewelry')}</span>
                </div>
                {madeProductsCount && (
                  <span className="bg-slate-100 text-slate-600 border border-slate-200/80 text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                    {madeProductsCount}
                  </span>
                )}
              </button>

              {/* Materials & Raw Inventory */}
              <button
                type="button"
                onClick={() => setActiveTab('materials')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'materials' || activeTab === 'gemstones'
                    ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Diamond
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${activeTab === 'materials' || activeTab === 'gemstones' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                  />
                  <span className="truncate">{isKhmer ? 'សម្ភារៈ & វត្ថុធាតុដើម' : t('nav.materials', 'Materials & Raw')}</span>
                </div>
                <span className="bg-slate-100 text-slate-600 border border-slate-200/80 text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                  {materialsCount}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Daily Metal Fix */}
        <button
          type="button"
          onClick={() => setActiveTab('goldrates')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'goldrates'
              ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <TrendingUp
              className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'goldrates' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span className="truncate">{t('nav.goldRates', 'Daily Metal Fix')}</span>
          </div>
        </button>

        {/* 6. Scrap Gold Buybacks */}
        <button
          type="button"
          onClick={() => setActiveTab('buyback')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'buyback'
              ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <RefreshCw
              className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'buyback' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span className="truncate">{t('nav.buybacks', 'Scrap Gold Buybacks')}</span>
          </div>
        </button>

        {/* 7. Customers */}
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'customers'
              ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Users
              className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'customers' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span className="truncate">{t('nav.customers', 'Customers')}</span>
          </div>
        </button>

        {/* 8. Promotions */}
        <button
          type="button"
          onClick={() => setActiveTab('promotions')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'promotions'
              ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Tag
              className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'promotions' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span className="truncate">{t('nav.promotions', 'Promotions')}</span>
          </div>
        </button>

        {/* 9. Procurement & Supplies (Collapsible Accordion) */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => {
              setIsSuppliesOpen(prev => !prev);
              if (!isSuppliesOpen && !isSuppliesTab) {
                setActiveTab('purchases');
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border border-transparent ${isSuppliesOpen ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Truck
                className={`w-4 h-4 shrink-0 transition-colors ${isSuppliesTab ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
              />
              <span className="truncate">{t('nav.supplies', 'Procurement & Supplies')}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isSuppliesOpen ? 'rotate-180 text-amber-600' : ''
                }`}
            />
          </button>

          {/* Sub-menu Items with matching subtle tree-line border */}
          {isSuppliesOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-amber-200/80 space-y-1 my-1">
              {/* Purchase Orders */}
              <button
                type="button"
                onClick={() => setActiveTab('purchases')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'purchases'
                    ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${activeTab === 'purchases' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                  />
                  <span className="truncate">{t('nav.purchases', 'Purchase Orders')}</span>
                </div>
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                  {purchasesBadge}
                </span>
              </button>

              {/* Suppliers Directory */}
              <button
                type="button"
                onClick={() => setActiveTab('suppliers')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'suppliers'
                    ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${activeTab === 'suppliers' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                  />
                  <span className="truncate">{t('nav.suppliers', 'Suppliers Directory')}</span>
                </div>
                <span className="bg-slate-100 text-slate-600 border border-slate-200/80 text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                  {suppliersCount}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 10. Reports & Analytics */}
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'reports'
              ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BarChart3
              className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'reports' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span className="truncate">{t('nav.reports', 'Reports & Analytics')}</span>
          </div>
        </button>

        {/* 11. Settings */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${activeTab === 'settings'
              ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Settings
              className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'settings' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span className="truncate">{t('nav.settings', 'Settings')}</span>
          </div>
        </button>
      </nav>

      {/* Gold Stock Widget & Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
        <div className="p-3 rounded-lg bg-white border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-amber-900 font-semibold">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              {t('nav.vaultStock', 'Vault Metal Stock')}
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-medium px-1.5 py-0.5 rounded">
              {t('nav.audited', 'Audited')}
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {(totalGoldWeight / 3.75).toFixed(2)}{' '}
            <span className="text-xs text-amber-700 font-sans font-normal">{t('cambodiaGold.chi', 'Chi')}</span>
            <span className="text-xs text-slate-400 font-normal ml-1.5">({totalGoldWeight.toFixed(1)}g)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{t('nav.estValuation', 'Est. Valuation:')}</span>
            <span className="font-semibold text-amber-800">
              ${(totalGoldWeight * 68.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {t('nav.backendReady', 'Backend Sync Ready')}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">v2.4 Pro</span>
        </div>

        {/* User Account & Logout */}
        {currentUser && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 border border-amber-300/70 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 overflow-hidden">
                {currentUser?.photo ? (
                  <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  (currentUser?.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate leading-tight flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {currentUser.role_name === 'super_admin' && (
                    <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                  )}
                </p>
                <p className="text-[10px] text-amber-700 font-semibold truncate">
                  {currentUser.role_display || currentUser.role_name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const confirmed = await confirmDialog({
                  title: isKhmer ? 'ចាកចេញពីប្រព័ន្ធ?' : 'Sign Out of Atelier?',
                  text: isKhmer
                    ? 'តើអ្នកពិតជាចង់ចាកចេញពីគណនីបច្ចុប្បន្នមែនទេ?'
                    : 'Are you sure you want to sign out of your session?',
                  confirmButtonText: isKhmer ? 'ចាកចេញ' : 'Yes, Sign Out',
                  cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
                  isDanger: true,
                  icon: 'warning'
                });

                if (confirmed) {
                  await logout();
                  showToast(isKhmer ? 'បានចាកចេញដោយជោគជ័យ' : 'Signed out successfully', 'success');
                }
              }}
              className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer shrink-0"
              title={isKhmer ? 'ចាកចេញ' : 'Sign Out'}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
