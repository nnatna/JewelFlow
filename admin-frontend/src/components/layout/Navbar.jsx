import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Bell,
  Search,
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';

export const Navbar = () => {
  const { goldRates, notifications, removeNotification, setActiveTab, cart } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      {/* Live Gold Rates Marquee Bar */}
      <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-1.5 flex items-center justify-between text-xs overflow-x-auto gap-4">
        <div className="flex items-center gap-2 text-amber-900 font-bold shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
          </span>
          <span className="uppercase tracking-wider text-[11px] flex items-center gap-1 text-amber-900 font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            Live Metal Board
          </span>
        </div>

        <div className="flex items-center gap-5 shrink-0 overflow-x-auto text-[12px]">
          {goldRates.slice(0, 5).map(rate => (
            <div key={rate.id} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-slate-600 font-medium">{rate.name.split(' ')[0]}:</span>
              <span className="font-mono text-slate-900 font-bold">${rate.rate_per_gram.toFixed(2)}/g</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                rate.change_24h >= 0 ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
              }`}>
                {rate.change_24h >= 0 ? `+${rate.change_24h}%` : `${rate.change_24h}%`}
              </span>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-500 shrink-0 hidden md:flex items-center gap-2">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>London Fix: Today</span>
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 max-w-md w-full">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog, SKU, customer or invoice..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/90 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </div>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('pos')}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-3.5 py-2 rounded-xl text-sm shadow-sm shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS Terminal</span>
            {cart.length > 0 && (
              <span className="bg-white text-amber-800 text-xs px-1.5 py-0.2 rounded-full font-bold ml-1">
                {cart.length}
              </span>
            )}
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
                    <span>Store Alerts</span>
                  </div>
                  <span className="text-xs text-slate-400">{notifications.length} updates</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">All alerts cleared</div>
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
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Master Jeweler / Admin</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
