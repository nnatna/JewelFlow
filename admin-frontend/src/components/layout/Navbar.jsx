import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Bell,
  Search,
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Globe2,
  X
} from 'lucide-react';

// Format metal names nicely for both Khmer and English tickers
const formatTickerMetalName = (rawName, lang) => {
  if (!rawName) return 'Gold 24K';
  // Strip trailing random IDs e.g. "Gold 24K 5832" -> "Gold 24K"
  const clean = rawName.replace(/\s+\d+$/, '').trim();
  const isKhmer = (lang || 'km').startsWith('km');

  if (isKhmer) {
    if (/24K/i.test(clean)) return 'មាស ២៤K';
    if (/22K/i.test(clean)) return 'មាស ២២K';
    if (/18K.*White|White.*18K/i.test(clean)) return 'មាសស ១៨K';
    if (/18K.*Rose|Rose.*18K/i.test(clean)) return 'មាសកុលាប ១៨K';
    if (/18K/i.test(clean)) return 'មាស ១៨K';
    if (/14K/i.test(clean)) return 'មាស ១៤K';
    if (/Platinum/i.test(clean)) return 'ផ្លាទីន 950';
    if (/Silver/i.test(clean)) return 'ប្រាក់ 925';
    return clean;
  }

  // English formatting
  if (/24K/i.test(clean)) return '24K Gold';
  if (/22K/i.test(clean)) return '22K Gold';
  if (/18K.*White|White.*18K/i.test(clean)) return '18K White';
  if (/18K.*Rose|Rose.*18K/i.test(clean)) return '18K Rose';
  if (/18K/i.test(clean)) return '18K Gold';
  if (/14K/i.test(clean)) return '14K Gold';
  if (/Platinum/i.test(clean)) return 'Platinum 950';
  if (/Silver/i.test(clean)) return 'Silver 925';
  return clean;
};

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { goldRates, notifications, removeNotification, setActiveTab, cart } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const isKhmer = (i18n.language || 'km').startsWith('km');

  const handleLanguageToggle = () => {
    const nextLng = isKhmer ? 'en' : 'km';
    if (typeof window !== 'undefined') {
      localStorage.setItem('jewelflow_lang_user_choice', nextLng);
      localStorage.setItem('i18nextLng', nextLng);
    }
    i18n.changeLanguage(nextLng);
  };

  return (
    <header className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs select-none">
      {/* Live Gold Rates Marquee Bar */}
      <div className="bg-amber-50/80 border-b border-amber-200/70 px-4 py-1.5 flex items-center justify-between text-xs overflow-x-auto gap-4">
        {/* Ticker Live Indicator */}
        <div className="flex items-center gap-2 text-amber-950 font-bold shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
          </span>
          <span className="text-xs flex items-center gap-1.5 text-amber-950 font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{t('nav.cambodianFix', 'Spot & Cambodian Fix (ខ្នាតជី)')}</span>
          </span>
        </div>

        {/* Polished Ticker Pills */}
        <div className="flex items-center gap-2.5 shrink-0 overflow-x-auto text-[12px]">
          {goldRates.slice(0, 5).map(rate => {
            const chiRate = rate.rate_per_gram * 3.75;
            const displayName = formatTickerMetalName(rate.name, i18n.language);
            return (
              <div
                key={rate.id}
                className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-white/90 border border-amber-200/90 shadow-2xs whitespace-nowrap"
              >
                <span className="text-slate-800 font-bold text-xs">{displayName}:</span>
                <span className="font-mono text-slate-900 font-extrabold text-xs">${rate.rate_per_gram.toFixed(2)}/g</span>
                <span className="font-mono text-amber-900 font-bold text-[11px] bg-amber-100/90 border border-amber-300/80 px-1.5 py-0.2 rounded">
                  ${chiRate.toFixed(2)}/{isKhmer ? 'ជី' : 'chi'}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    rate.change_24h >= 0
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border border-rose-200'
                  }`}
                >
                  {rate.change_24h >= 0 ? `+${rate.change_24h}%` : `${rate.change_24h}%`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footnote / Conversion Equivalence */}
        <div className="text-[11px] text-slate-600 shrink-0 hidden lg:flex items-center gap-1.5 font-medium">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>{t('nav.marketTickerFootnote', '1 Chi = 3.75g | 1 Damlung = 37.5g')}</span>
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex items-center gap-3 max-w-md w-full">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('nav.searchPlaceholder', 'Search catalog, SKU, customer or invoice...')}
              className="w-full pl-9 pr-4 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </div>
        </div>

        {/* Center Exchange Rate Badge (Balances top bar whitespace) */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-slate-600 bg-amber-50/60 border border-amber-200/80 px-3 py-1.5 rounded-xl font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{t('nav.cambodiaExchange', 'Live Rate: 1 USD = 4,100 KHR')}</span>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-3">
          {/* POS Terminal Action Button */}
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
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
            title={isKhmer ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ (Switch to Khmer)'}
          >
            <Globe2 className="w-3.5 h-3.5 text-amber-600" />
            <span>{isKhmer ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN'}</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
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
                    <Sparkles className="w-4 h-4 text-amber-500" />
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-slate-800 leading-snug font-medium">{n.text}</p>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeNotification(n.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              AC
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-none">Alexander Cross</div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                {t('nav.adminRole', 'Master Jeweler / Admin')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
