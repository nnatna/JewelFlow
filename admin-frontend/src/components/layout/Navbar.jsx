import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faMagnifyingGlass,
  faWandMagicSparkles,
  faBagShopping,
  faClock,
  faCircleCheck,
  faGlobe,
  faXmark,
  faBoxOpen,
  faReceipt,
  faUsers,
  faArrowRight,
  faCircleInfo,
  faRightFromBracket,
  faCrown,
  faUser,
  faGear,
  faChevronDown,
  faShieldHalved
} from '@fortawesome/free-solid-svg-icons';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const {
    currentUser,
    logout,
    confirmDialog,
    showToast,
    notifications,
    removeNotification,
    setActiveTab,
    setSettingsTab,
    cart,
    liveSpot,
    exchangeRate,
    refreshExchangeRate,
    searchQuery,
    setSearchQuery,
    products,
    sales,
    customers
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchContainerRef = useRef(null);
  const userMenuRef = useRef(null);

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageToggle = () => {
    const nextLng = isKhmer ? 'en' : 'km';
    if (typeof window !== 'undefined') {
      localStorage.setItem('jewelflow_lang_user_choice', nextLng);
      localStorage.setItem('i18nextLng', nextLng);
    }
    i18n.changeLanguage(nextLng);
  };

  const spotOunce = Number(liveSpot?.spot_price_per_oz ?? 0);
  const spotGram = spotOunce > 0 ? (Number(liveSpot?.spot_price_per_gram) || (spotOunce / 31.1034768)) : 0;
  const spotChi = spotOunce > 0 ? (Number(liveSpot?.price_per_chi) || (spotGram * 3.75)) : 0;
  const spotDamlung = spotOunce > 0 ? (Number(liveSpot?.price_per_damlung) || (spotChi * 10)) : 0;
  const changePercent = Number(liveSpot?.change_percent_24h ?? 0);

  // Global search filtering across entities
  const cleanQ = (searchQuery || '').toLowerCase().trim();
  const matchedProducts = cleanQ
    ? products.filter(p =>
        p.name?.toLowerCase().includes(cleanQ) ||
        p.code_sku?.toLowerCase().includes(cleanQ) ||
        p.barcode?.includes(cleanQ)
      ).slice(0, 4)
    : [];

  const matchedSales = cleanQ
    ? sales.filter(s =>
        s.invoice_no?.toLowerCase().includes(cleanQ) ||
        s.customer_name?.toLowerCase().includes(cleanQ) ||
        s.customer_phone?.toLowerCase().includes(cleanQ) ||
        s.payment_ref?.toLowerCase().includes(cleanQ)
      ).slice(0, 4)
    : [];

  const matchedCustomers = cleanQ
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(cleanQ) ||
        c.phone?.includes(cleanQ) ||
        c.email?.toLowerCase().includes(cleanQ)
      ).slice(0, 4)
    : [];

  const totalResultsCount = cleanQ
    ? (products.filter(p => p.name?.toLowerCase().includes(cleanQ) || p.code_sku?.toLowerCase().includes(cleanQ) || p.barcode?.includes(cleanQ)).length +
       sales.filter(s => s.invoice_no?.toLowerCase().includes(cleanQ) || s.customer_name?.toLowerCase().includes(cleanQ) || s.customer_phone?.toLowerCase().includes(cleanQ)).length +
       customers.filter(c => c.name?.toLowerCase().includes(cleanQ) || c.phone?.includes(cleanQ)).length)
    : 0;

  return (
    <header className="no-print shrink-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs select-none">
      {/* Live Gold Rates Marquee Bar - Only Show Market Spot */}
      <div className="bg-amber-50/80 border-b border-amber-200/70 px-4 py-1.5 flex items-center justify-between text-xs overflow-x-auto gap-4">
        {/* Ticker Live Indicator & តាមតម្លៃដើម Benchmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-amber-950 font-bold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-xs flex items-center gap-1.5 text-amber-950 font-bold">
              <FontAwesomeIcon icon={faGlobe} className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{isKhmer ? 'តាមតម្លៃដើម (Market Spot):' : 'Live Market Spot:'}</span>
            </span>
          </div>

          {/* 🌟 តាមតម្លៃដើម (Market Spot) Units */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 border border-amber-400/80 text-amber-950 font-bold text-xs whitespace-nowrap shadow-2xs">
            <span className="font-mono text-amber-950 font-black text-xs">
              ${spotOunce.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz
            </span>
            <span className="font-mono text-[11px] text-amber-800 bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded font-bold">
              ${spotGram.toFixed(2)}/g
            </span>
            <span className="font-mono text-[11px] text-amber-800 bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded font-bold">
              ${spotChi.toFixed(2)}/{isKhmer ? 'ជី' : 'chi'}
            </span>
            <span className="font-mono text-[11px] text-amber-800 bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded font-bold hidden sm:inline-block">
              ${spotDamlung.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{isKhmer ? 'តម្លឹង' : 'damlung'}
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/90 border border-emerald-300/70 px-1.5 py-0.5 rounded font-bold font-mono">
              {changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Footnote / Conversion Equivalence */}
        <div className="text-[11px] text-slate-600 shrink-0 hidden lg:flex items-center gap-1.5 font-medium">
          <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-amber-700" />
          <span>{t('nav.marketTickerFootnote', '1 Chi = 3.75g | 1 Damlung = 37.5g')}</span>
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Global Search Input with Cross-System Dropdown */}
        <div ref={searchContainerRef} className="relative max-w-md w-full">
          <div className="relative w-full">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchOpen(false);
              }}
              placeholder={t('nav.searchPlaceholder', 'Search catalog, SKU, customer or invoice...')}
              className="w-full pl-9 pr-8 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                title={isKhmer ? 'សម្អាតការស្វែងរក' : 'Clear search'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200/80 transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Global Search Results Dropdown Flyout */}
          {isSearchOpen && cleanQ && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-h-[80vh] flex flex-col">
              {/* Dropdown Header */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {isKhmer ? 'លទ្ធផលស្វែងរកទូទាំងប្រព័ន្ធ' : 'Global Search Results'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                  {totalResultsCount} {isKhmer ? 'លទ្ធផល' : 'matches'}
                </span>
              </div>

              <div className="overflow-y-auto p-2 space-y-3 divide-y divide-slate-100">
                {totalResultsCount === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <p className="font-medium text-slate-600">
                      {isKhmer ? `មិនមានទិន្នន័យត្រូវនឹង "${searchQuery}" ឡើយ` : `No matching records found for "${searchQuery}"`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isKhmer ? 'សូមសាកល្បងបញ្ចូលឈ្មោះទំនិញ, លេខកូដ SKU, ឬលេខទូរស័ព្ទ' : 'Try searching by SKU, jewelry name, customer phone, or invoice #'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Products Match */}
                    {matchedProducts.length > 0 && (
                      <div className="pt-2 first:pt-0">
                        <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 text-amber-700">
                            <FontAwesomeIcon icon={faBoxOpen} className="w-3.5 h-3.5" />
                            {isKhmer ? 'ទំនិញក្នុងកាតាឡុក' : 'Jewelry Products'}
                          </span>
                          <button
                            onClick={() => {
                              setActiveTab('products');
                              setIsSearchOpen(false);
                            }}
                            className="text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 normal-case cursor-pointer"
                          >
                            <span>{isKhmer ? 'មើលទាំងអស់' : 'View all'}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          {matchedProducts.map(p => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setActiveTab('products');
                                setIsSearchOpen(false);
                              }}
                              className="px-3 py-2 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-200 flex items-center justify-between text-xs cursor-pointer transition-colors"
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  SKU: <span className="text-amber-700 font-medium">{p.code_sku}</span> • {p.weight_grams}g
                                </p>
                              </div>
                              <span className="font-mono font-bold text-amber-800 shrink-0">
                                ${(p.fixed_price || (p.weight_grams * 85) || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sales & Invoices Match */}
                    {matchedSales.length > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 text-emerald-700">
                            <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5" />
                            {isKhmer ? 'វិក្កយបត្រ & ការលក់' : 'Sales & Invoices'}
                          </span>
                          <button
                            onClick={() => {
                              setActiveTab('sales_history');
                              setIsSearchOpen(false);
                            }}
                            className="text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 normal-case cursor-pointer"
                          >
                            <span>{isKhmer ? 'មើលទាំងអស់' : 'View all'}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          {matchedSales.map(s => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setActiveTab('sales_history');
                                setIsSearchOpen(false);
                              }}
                              className="px-3 py-2 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 flex items-center justify-between text-xs cursor-pointer transition-colors"
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold text-slate-800 font-mono text-emerald-800">{s.invoice_no}</p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {s.customer_name || 'Walk-in'} • {s.sale_date || 'Recent'}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-slate-800 shrink-0">
                                ${(Number(s.final_total_usd || s.total_amount || 0)).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customers Match */}
                    {matchedCustomers.length > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 text-blue-700">
                            <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5" />
                            {isKhmer ? 'អតិថិជន' : 'Customers'}
                          </span>
                          <button
                            onClick={() => {
                              setActiveTab('customers');
                              setIsSearchOpen(false);
                            }}
                            className="text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 normal-case cursor-pointer"
                          >
                            <span>{isKhmer ? 'មើលទាំងអស់' : 'View all'}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          {matchedCustomers.map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setActiveTab('customers');
                                setIsSearchOpen(false);
                              }}
                              className="px-3 py-2 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200 flex items-center justify-between text-xs cursor-pointer transition-colors"
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold text-slate-800 truncate">{c.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{c.phone || c.email || 'No contact'}</p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                                {c.tier || 'VIP'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Dropdown Footer Tip */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCircleInfo} className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{isKhmer ? 'តម្រងនេះត្រូវបានអនុវត្តលើទំព័របច្ចុប្បន្នដោយស្វ័យប្រវត្តិ' : 'Filters the active page view automatically'}</span>
                </span>
                <span>ESC to close</span>
              </div>
            </div>
          )}
        </div>

        {/* Center Exchange Rate Badge (Live USD to KHR API) */}
        <div
          onClick={refreshExchangeRate}
          title={isKhmer ? 'ចុចដើម្បីផ្ទុកអត្រាប្តូរប្រាក់ឡើងវិញ' : 'Click to refresh live exchange rate'}
          className="hidden xl:flex items-center gap-2 text-xs text-amber-950 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300/90 px-3.5 py-1.5 rounded-xl font-medium cursor-pointer hover:border-amber-400 hover:shadow-xs active:scale-98 transition-all select-none"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold font-mono tracking-tight text-amber-900">
            {isKhmer
              ? `អត្រាប្តូរប្រាក់: ១ USD = ${Number(exchangeRate?.rate || 4045).toLocaleString('en-US')} ៛ KHR`
              : `Live FX: 1 USD = ${Number(exchangeRate?.rate || 4045).toLocaleString('en-US')} KHR`}
          </span>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-3">
          {/* POS Terminal Action Button */}
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4" />
            <span>{t('nav.openPos', 'Open POS Terminal')}</span>
            {cart.length > 0 && (
              <span className="bg-white text-amber-800 text-xs px-1.5 py-0.2 rounded-full font-bold ml-1">
                {cart.length}
              </span>
            )}
          </button>

          {/* Interactive Language Switcher (EN / KM) */}
          <button
            onClick={handleLanguageToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isKhmer
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
            title={isKhmer ? 'Switch to English' : 'Switch to Khmer'}
          >
            <FontAwesomeIcon icon={faGlobe} className="w-3.5 h-3.5 text-amber-600" />
            <span>{isKhmer ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN'}</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 text-amber-500" />
                    <span>{t('nav.storeAlerts', 'Store Alerts')}</span>
                  </div>
                  <span className="text-xs text-slate-400">{notifications.length} {t('nav.updates', 'updates')}</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">{t('nav.allAlertsCleared', 'All alerts cleared')}</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2">
                          <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-slate-800 leading-snug font-medium">{n.text}</p>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeNotification(n.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown Menu */}
          <div ref={userMenuRef} className="relative pl-2 border-l border-slate-200">
            {/* Clickable Profile Trigger (Show Only Photo Profile) */}
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center p-0.5 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-amber-300 active:scale-95 group relative"
              title={currentUser?.name || 'User Profile'}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-xs shadow-xs shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-amber-400/60 transition-all font-serif">
                {currentUser?.photo ? (
                  <img
                    src={currentUser.photo}
                    alt={currentUser.name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(currentUser?.name || 'User')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                )}
              </div>
            </button>

            {/* Dropdown Menu Modal / Popover */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                
                {/* User Info Header in Dropdown */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-sm shadow-xs shrink-0 overflow-hidden ring-2 ring-amber-100 font-serif">
                      {currentUser?.photo ? (
                        <img
                          src={currentUser.photo}
                          alt={currentUser.name || 'Profile'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {(currentUser?.name || 'User')
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1 font-serif">
                        <span>{currentUser?.name || 'Administrator'}</span>
                        {currentUser?.role_name === 'super_admin' && (
                          <FontAwesomeIcon icon={faCrown} className="text-amber-500 text-[10px]" />
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                        {currentUser?.email || 'user@jewelflow.com'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {isKhmer ? 'តួនាទី' : 'Role'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {currentUser?.role_display || (isKhmer ? 'បុគ្គលិក' : 'Staff')}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-0.5 text-xs">
                  {/* Profile / Account Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (setSettingsTab) setSettingsTab('profile');
                      setActiveTab('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-left font-medium"
                  >
                    <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isKhmer ? 'គណនីផ្ទាល់ខ្លួន (Profile)' : 'User Profile'}</span>
                  </button>

                  {/* System Settings Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (setSettingsTab) setSettingsTab('general');
                      setActiveTab('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-left font-medium"
                  >
                    <FontAwesomeIcon icon={faGear} className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isKhmer ? 'ការកំណត់ប្រព័ន្ធ (Settings)' : 'System Settings'}</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-1" />

                  {/* Logout Option */}
                  <button
                    type="button"
                    onClick={async () => {
                      setShowUserMenu(false);
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer text-left font-bold"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isKhmer ? 'ចាកចេញ (Sign Out)' : 'Sign Out / Logout'}</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
