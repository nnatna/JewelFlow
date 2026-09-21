import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faTriangleExclamation,
  faCircleExclamation,
  faCircleInfo,
  faGem,
  faXmark
} from '@fortawesome/free-solid-svg-icons';

/**
 * Reusable Alert Component for JewelFlow Atelier
 * Supports variants: 'standard', 'filled', 'luxury', 'bordered'
 * Types: 'success', 'warning', 'error', 'info', 'gold'
 */
export const Alert = ({
  type = 'info',
  variant = 'standard',
  title,
  message,
  children,
  icon,
  dismissible = false,
  onClose,
  action,
  className = '',
}) => {
  const content = message || children;

  // Icon mapping
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return faCircleCheck;
      case 'warning':
        return faTriangleExclamation;
      case 'error':
        return faCircleExclamation;
      case 'gold':
        return faGem;
      case 'info':
      default:
        return faCircleInfo;
    }
  };

  const activeIcon = icon || getDefaultIcon();

  // Color schemes tailored to JewelFlow luxury aesthetic
  const getStyles = () => {
    if (variant === 'filled') {
      switch (type) {
        case 'success':
          return {
            container: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 border border-emerald-500',
            iconBadge: 'bg-white/20 text-white',
            titleText: 'text-white',
            bodyText: 'text-emerald-50',
            closeBtn: 'text-white/70 hover:text-white hover:bg-white/10'
          };
        case 'warning':
          return {
            container: 'bg-amber-600 text-white shadow-md shadow-amber-600/20 border border-amber-500',
            iconBadge: 'bg-white/20 text-white',
            titleText: 'text-white',
            bodyText: 'text-amber-50',
            closeBtn: 'text-white/70 hover:text-white hover:bg-white/10'
          };
        case 'error':
          return {
            container: 'bg-rose-600 text-white shadow-md shadow-rose-600/20 border border-rose-500',
            iconBadge: 'bg-white/20 text-white',
            titleText: 'text-white',
            bodyText: 'text-rose-50',
            closeBtn: 'text-white/70 hover:text-white hover:bg-white/10'
          };
        case 'gold':
          return {
            container: 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white shadow-md shadow-amber-600/25 border border-amber-400',
            iconBadge: 'bg-white/25 text-white',
            titleText: 'text-white font-serif tracking-wide',
            bodyText: 'text-amber-50',
            closeBtn: 'text-white/70 hover:text-white hover:bg-white/10'
          };
        case 'info':
        default:
          return {
            container: 'bg-sky-600 text-white shadow-md shadow-sky-600/20 border border-sky-500',
            iconBadge: 'bg-white/20 text-white',
            titleText: 'text-white',
            bodyText: 'text-sky-50',
            closeBtn: 'text-white/70 hover:text-white hover:bg-white/10'
          };
      }
    }

    if (variant === 'luxury') {
      return {
        container: 'bg-gradient-to-r from-amber-50/95 via-yellow-50/90 to-amber-50/95 border border-amber-300 text-amber-950 shadow-sm shadow-amber-500/10 backdrop-blur-sm',
        iconBadge: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xs',
        titleText: 'text-amber-950 font-bold font-serif',
        bodyText: 'text-amber-900',
        closeBtn: 'text-amber-700 hover:text-amber-950 hover:bg-amber-200/50'
      };
    }

    // Default 'standard' variant (soft tint with distinct border)
    switch (type) {
      case 'success':
        return {
          container: 'bg-emerald-50/90 border border-emerald-200 text-emerald-950 shadow-xs backdrop-blur-sm',
          iconBadge: 'bg-emerald-100 text-emerald-700 border border-emerald-300/60',
          titleText: 'text-emerald-950 font-bold',
          bodyText: 'text-emerald-800',
          closeBtn: 'text-emerald-600 hover:text-emerald-950 hover:bg-emerald-100'
        };
      case 'warning':
        return {
          container: 'bg-amber-50/90 border border-amber-200 text-amber-950 shadow-xs backdrop-blur-sm',
          iconBadge: 'bg-amber-100 text-amber-700 border border-amber-300/60',
          titleText: 'text-amber-950 font-bold',
          bodyText: 'text-amber-800',
          closeBtn: 'text-amber-600 hover:text-amber-950 hover:bg-amber-100'
        };
      case 'error':
        return {
          container: 'bg-rose-50/90 border border-rose-200 text-rose-950 shadow-xs backdrop-blur-sm',
          iconBadge: 'bg-rose-100 text-rose-700 border border-rose-300/60',
          titleText: 'text-rose-950 font-bold',
          bodyText: 'text-rose-800',
          closeBtn: 'text-rose-600 hover:text-rose-950 hover:bg-rose-100'
        };
      case 'gold':
        return {
          container: 'bg-amber-50/90 border border-amber-300 text-amber-950 shadow-xs backdrop-blur-sm',
          iconBadge: 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold',
          titleText: 'text-amber-950 font-bold font-serif',
          bodyText: 'text-amber-900',
          closeBtn: 'text-amber-700 hover:text-amber-950 hover:bg-amber-200/50'
        };
      case 'info':
      default:
        return {
          container: 'bg-sky-50/90 border border-sky-200 text-sky-950 shadow-xs backdrop-blur-sm',
          iconBadge: 'bg-sky-100 text-sky-700 border border-sky-300/60',
          titleText: 'text-sky-950 font-bold',
          bodyText: 'text-sky-800',
          closeBtn: 'text-sky-600 hover:text-sky-950 hover:bg-sky-100'
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${styles.container} ${className}`}
    >
      {/* Icon Badge */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${styles.iconBadge}`}>
        <FontAwesomeIcon icon={activeIcon} className="w-4 h-4" />
      </div>

      {/* Alert Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <h4 className={`text-sm leading-snug mb-0.5 ${styles.titleText}`}>
            {title}
          </h4>
        )}
        <div className={`text-xs sm:text-[13px] leading-relaxed font-medium ${styles.bodyText}`}>
          {content}
        </div>
        {action && (
          <div className="mt-2.5">
            {action}
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${styles.closeBtn}`}
        >
          <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
