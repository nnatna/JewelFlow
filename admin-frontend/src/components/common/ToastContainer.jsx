import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faTriangleExclamation,
  faCircleExclamation,
  faCircleInfo,
  faGem,
  faXmark,
  faTrashCan
} from '@fortawesome/free-solid-svg-icons';

const ToastItem = ({ alert, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const duration = alert.duration || 4500;
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (duration <= 0 || isPaused) return;

    const interval = 50;
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= interval) {
          clearInterval(timer);
          onDismiss(alert.id);
          return 0;
        }
        return prev - interval;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, duration, alert.id, onDismiss]);

  const progressPercent = duration > 0 ? (remaining / duration) * 100 : 0;

  const getVariantStyles = () => {
    switch (alert.type) {
      case 'success':
        return {
          card: 'bg-white/95 border-emerald-300/80 text-slate-900 shadow-lg shadow-emerald-500/10',
          badge: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
          icon: faCircleCheck,
          accentLine: 'bg-emerald-500',
          title: 'text-emerald-950',
          closeHover: 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-700'
        };
      case 'warning':
        return {
          card: 'bg-white/95 border-amber-300/80 text-slate-900 shadow-lg shadow-amber-500/10',
          badge: 'bg-amber-100 text-amber-700 border border-amber-300',
          icon: faTriangleExclamation,
          accentLine: 'bg-amber-500',
          title: 'text-amber-950',
          closeHover: 'hover:bg-amber-50 text-slate-400 hover:text-amber-700'
        };
      case 'error':
        return {
          card: 'bg-white/95 border-rose-300/80 text-slate-900 shadow-lg shadow-rose-500/10',
          badge: 'bg-rose-100 text-rose-700 border border-rose-300',
          icon: faCircleExclamation,
          accentLine: 'bg-rose-500',
          title: 'text-rose-950',
          closeHover: 'hover:bg-rose-50 text-slate-400 hover:text-rose-700'
        };
      case 'gold':
        return {
          card: 'bg-gradient-to-r from-white via-amber-50/60 to-white border-amber-300 text-slate-900 shadow-xl shadow-amber-500/15',
          badge: 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-xs',
          icon: faGem,
          accentLine: 'bg-gradient-to-r from-amber-500 to-yellow-400',
          title: 'text-amber-950 font-serif',
          closeHover: 'hover:bg-amber-100/60 text-amber-600 hover:text-amber-900'
        };
      case 'info':
      default:
        return {
          card: 'bg-white/95 border-sky-300/80 text-slate-900 shadow-lg shadow-sky-500/10',
          badge: 'bg-sky-100 text-sky-700 border border-sky-300',
          icon: faCircleInfo,
          accentLine: 'bg-sky-500',
          title: 'text-sky-950',
          closeHover: 'hover:bg-sky-50 text-slate-400 hover:text-sky-700'
        };
    }
  };

  const v = getVariantStyles();

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-84 sm:w-96 rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-300 transform translate-y-0 opacity-100 select-none ${v.card}`}
      style={{
        animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Icon or Image Badge */}
        {alert.image ? (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-amber-300 shadow-xs shrink-0 bg-slate-100">
            <img
              src={alert.image}
              alt="Item thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${v.badge}`}>
            <FontAwesomeIcon icon={alert.icon || v.icon} className="w-4 h-4" />
          </div>
        )}

        {/* Text Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {alert.title && (
            <h5 className={`text-xs font-bold leading-tight mb-0.5 ${v.title}`}>
              {alert.title}
            </h5>
          )}
          <p className="text-xs text-slate-700 leading-snug font-medium break-words">
            {alert.message || alert.text}
          </p>
          {alert.action && (
            <div className="mt-2">
              {alert.action}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(alert.id)}
          aria-label="Dismiss"
          className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${v.closeHover}`}
        >
          <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress countdown bar */}
      {duration > 0 && (
        <div className="w-full h-1 bg-slate-100/80">
          <div
            className={`h-full transition-all duration-75 ease-linear ${v.accentLine}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastContainer = () => {
  const { alerts, dismissAlert, clearAlerts } = useApp();

  if (!alerts || alerts.length === 0) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2.5 max-h-[calc(100vh-2rem)] overflow-y-auto pointer-events-none p-2"
    >
      {/* Clear all pill when > 1 alerts */}
      {alerts.length > 1 && (
        <button
          onClick={clearAlerts}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 bg-white/90 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-full text-[11px] font-semibold shadow-sm transition-all cursor-pointer backdrop-blur-xs mb-0.5"
        >
          <FontAwesomeIcon icon={faTrashCan} className="w-3 h-3 text-slate-400" />
          <span>Clear All ({alerts.length})</span>
        </button>
      )}

      {/* Toast items */}
      <div className="flex flex-col gap-2.5 pointer-events-auto">
        {alerts.map(alert => (
          <ToastItem
            key={alert.id}
            alert={alert}
            onDismiss={dismissAlert}
          />
        ))}
      </div>
    </aside>
  );
};

export default ToastContainer;
