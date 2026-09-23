import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTableColumns,
  faBagShopping,
  faClockRotateLeft,
  faGem,
  faArrowTrendUp,
  faArrowsRotate,
  faWandMagicSparkles,
  faUsers,
  faTruck,
  faShieldHalved,
  faScaleBalanced,
  faTag,
  faGear,
  faChartPie,
  faBoxesStacked,
  faChevronDown,
  faCartShopping,
  faCircleCheck,
  faRightFromBracket,
  faCrown,
  faLayerGroup
} from '@fortawesome/free-solid-svg-icons';

export const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    products,
    categories,
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

  const isSuppliesTab = activeTab === 'purchases' || activeTab === 'suppliers';
  const [isSuppliesOpen, setIsSuppliesOpen] = useState(true);

  // Auto-expand supplies dropdown if user switches to purchase or supplier tab
  useEffect(() => {
    if (isSuppliesTab) {
      setIsSuppliesOpen(true);
    }
  }, [activeTab]);

  const totalGoldWeight = products.reduce((acc, p) => acc + (Number(p.net_weight) * Number(p.stock_qty)), 0);

  const pendingPurchasesCount = purchases?.filter(p => p.status === 'pending' || p.status === 'ordered').length || 0;
  const suppliersCount = suppliers?.length || 0;

  const mainNavItems = [
    { id: 'dashboard',     label: t('nav.dashboard', 'Dashboard'),            icon: faTableColumns },
    { id: 'pos',           label: t('nav.pos', 'POS Terminal'),                icon: faBagShopping, badge: cart.length > 0 ? `${cart.length}` : null },
    { id: 'sales_history', label: t('nav.salesHistory', 'History Sales'),      icon: faClockRotateLeft, badge: sales?.length > 0 ? `${sales.length}` : null },
    { id: 'products',      label: t('nav.catalog', 'Jewelry Catalog'),         icon: faGem, badge: products.length > 0 ? `${products.length}` : null },
    { id: 'categories',    label: isKhmer ? 'ប្រភេទគ្រឿង' : t('nav.categories', 'Categories'), icon: faLayerGroup, badge: categories?.length > 0 ? `${categories.length}` : null },
    { id: 'goldrates',     label: t('nav.goldRates', 'Daily Metal Fix'),       icon: faArrowTrendUp },
    { id: 'buyback',       label: t('nav.buybacks', 'Scrap Gold Buybacks'),    icon: faArrowsRotate },
    { id: 'gemstones',     label: t('nav.gemstones', 'Gemstones Vault'),       icon: faWandMagicSparkles },
    { id: 'customers',     label: t('nav.customers', 'Customers CRM'),         icon: faUsers },
    { id: 'promotions',    label: t('nav.promotions', 'Promotions'),           icon: faTag },
    { id: 'reports',       label: t('nav.reports', 'Reports & Analytics'),     icon: faChartPie },
  ];

  const suppliesSubItems = [
    {
      id: 'purchases',
      label: t('nav.purchases', 'Purchases & Orders'),
      icon: faCartShopping,
      badge: pendingPurchasesCount > 0 ? `${pendingPurchasesCount} Inbound` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
    },
    {
      id: 'suppliers',
      label: t('nav.suppliers', 'Suppliers Directory'),
      icon: faTruck,
      badge: suppliersCount > 0 ? `${suppliersCount}` : null,
      badgeColor: 'bg-slate-100 text-slate-600'
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen text-slate-700 shadow-xs z-30 select-none">
      {/* Brand Header */}
      <div
        onClick={() => setActiveTab('dashboard')}
        className="p-5 border-b border-slate-200 flex items-center gap-3 bg-white shrink-0 cursor-pointer hover:bg-slate-50/80 transition-all group"
        title="JewelFlow Dashboard"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
          {settings?.store_logo ? (
            <img src={settings.store_logo} alt="Store Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <FontAwesomeIcon icon={faGem} className="w-5 h-5" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-serif truncate">
            {settings?.store_name ? settings.store_name.split(' ')[0] : 'JewelFlow'}
            <span className="text-[10px] uppercase font-sans font-extrabold tracking-widest text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
              ERP
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 truncate">
            {settings?.store_name && settings.store_name.length > 12 ? settings.store_name : 'Atelier & Retail Suite'}
          </p>
        </div>
      </div>

      {/* Navigation Links (Scrollable if screen is short) */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
          {t('nav.operations', 'Store Operations')}
        </div>

        {mainNavItems.map(item => {
          const isActive = activeTab === item.id || (item.id === 'sales_history' && activeTab === 'sales');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isActive
                ? 'bg-amber-50 text-amber-900 border border-amber-300/80 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={item.icon} className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-amber-500 text-white font-bold' : 'bg-slate-100 text-slate-600'
                  }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* ── Supplies Collapsible Dropdown ──────────────────────────────── */}
        <div className="pt-1">
          <button
            onClick={() => {
              setIsSuppliesOpen(prev => !prev);
              if (!isSuppliesOpen && !isSuppliesTab) {
                setActiveTab('purchases');
              }
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isSuppliesTab
              ? 'bg-amber-50/70 text-amber-950 font-semibold border border-amber-200/70'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <div className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={faBoxesStacked}
                className={`w-4 h-4 ${isSuppliesTab ? 'text-amber-600' : 'text-slate-400'}`}
              />
              <span>{t('nav.supplies', 'Supplies')}</span>
            </div>
            <div className="flex items-center gap-2">
              {pendingPurchasesCount > 0 && !isSuppliesOpen && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isSuppliesOpen ? 'rotate-180 text-amber-600' : ''}`}
              />
            </div>
          </button>

          {/* Sub-items */}
          {isSuppliesOpen && (
            <div className="mt-1 ml-4 pl-3 border-l-2 border-amber-200/80 space-y-1 py-0.5 animate-fadeIn">
              {suppliesSubItems.map(sub => {
                const isSubActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveTab(sub.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${isSubActive
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FontAwesomeIcon
                        icon={sub.icon}
                        className={`w-3.5 h-3.5 ${isSubActive ? 'text-white' : 'text-slate-400'}`}
                      />
                      <span className="truncate">{sub.label}</span>
                    </div>
                    {sub.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${isSubActive ? 'bg-white/20 text-white font-bold' : sub.badgeColor
                        }`}>
                        {sub.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="pt-1">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'settings'
              ? 'bg-amber-50 text-amber-900 border border-amber-300/80 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faGear} className={`w-4 h-4 ${activeTab === 'settings' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{t('nav.settings', 'Settings')}</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Gold Stock Widget in Sidebar */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 shrink-0">
        <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
              <FontAwesomeIcon icon={faScaleBalanced} className="w-3.5 h-3.5 text-amber-600" />
              {t('nav.vaultStock', 'Vault Metal Stock')}
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-1.5 py-0.5 rounded">
              {t('nav.audited', 'Audited')}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {(totalGoldWeight / 3.75).toFixed(2)} <span className="text-xs text-amber-700 font-sans font-normal">{t('cambodiaGold.chi', 'Chi')}</span>
            <span className="text-xs text-slate-400 font-normal ml-1.5">({totalGoldWeight.toFixed(1)}g)</span>
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
            <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-emerald-600" />
            {t('nav.backendReady', 'Backend Sync Ready')}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">v2.4 Pro</span>
        </div>

        {/* Current Active Staff & Logout Button */}
        {currentUser && (
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-xs shadow-2xs shrink-0 overflow-hidden">
                {currentUser?.photo ? (
                  <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  (currentUser?.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {currentUser.role_name === 'super_admin' && (
                    <FontAwesomeIcon icon={faCrown} className="text-amber-500 text-[10px]" />
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
              className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-2xs shrink-0"
              title={isKhmer ? 'ចាកចេញ' : 'Sign Out'}
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
