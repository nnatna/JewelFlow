import React from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCrown,
  faXmark,
  faCircleExclamation,
  faGem,
  faAward
} from '@fortawesome/free-solid-svg-icons';

export const TIER_COLORS = [
  {
    id: 'slate',
    label: 'Standard / Bronze',
    shortLabel: 'Bronze Standard',
    badge: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-xs',
    icon: faAward,
    colorName: 'Slate & Bronze'
  },
  {
    id: 'amber',
    label: 'Royal Gold VIP',
    shortLabel: 'Royal Gold',
    badge: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 border-amber-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-sm shadow-amber-500/25',
    icon: faCrown,
    colorName: '24K Royal Gold'
  },
  {
    id: 'sky',
    label: 'Diamond & Platinum',
    shortLabel: 'Diamond / Platinum',
    badge: 'bg-gradient-to-r from-sky-50 to-cyan-100 text-sky-950 border-sky-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-sky-400 via-cyan-400 to-blue-500 text-slate-950 shadow-sm shadow-sky-500/25',
    icon: faGem,
    colorName: 'Diamond Sparkle'
  },
  {
    id: 'violet',
    label: 'Royal Amethyst VIP',
    shortLabel: 'Amethyst VIP',
    badge: 'bg-gradient-to-r from-violet-50 to-purple-100 text-violet-950 border-violet-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 text-white shadow-sm shadow-purple-500/25',
    icon: faCrown,
    colorName: 'Imperial Amethyst'
  },
  {
    id: 'rose',
    label: 'Burmese Ruby',
    shortLabel: 'Burmese Ruby',
    badge: 'bg-gradient-to-r from-rose-50 to-pink-100 text-rose-950 border-rose-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 text-white shadow-sm shadow-rose-500/25',
    icon: faGem,
    colorName: 'Pigeon Blood Ruby'
  },
  {
    id: 'emerald',
    label: 'Imperial Jade / Emerald',
    shortLabel: 'Imperial Jade',
    badge: 'bg-gradient-to-r from-emerald-50 to-teal-100 text-emerald-950 border-emerald-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25',
    icon: faGem,
    colorName: 'Imperial Emerald'
  },
];

export const TierModal = ({
  isOpen,
  onClose,
  onSubmit,
  tierForm,
  setTierForm,
  tierErrors,
  setTierErrors,
  editingTierId,
  savingTier,
  isKhmer
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
              <FontAwesomeIcon icon={faCrown} className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {editingTierId
                  ? (isKhmer ? 'កែប្រែ VIP Tier' : 'Edit VIP Tier')
                  : (isKhmer ? 'បន្ថែម VIP Tier ថ្មី' : 'Create New VIP Tier')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer ? 'កំណត់លក្ខខណ្ឌចំណាយ និងការបញ្ចុះតម្លៃ' : 'Define spending criteria and tier rewards'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form noValidate onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tier Name Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {isKhmer ? 'ឈ្មោះកម្រិត *' : 'Tier Name *'}
            </label>
            <input
              type="text"
              value={tierForm.name}
              onChange={e => {
                setTierForm(f => ({ ...f, name: e.target.value }));
                if (tierErrors.name) setTierErrors(prev => ({ ...prev, name: null }));
              }}
              placeholder="e.g. Sapphire VIP"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                tierErrors.name ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
              }`}
            />
            {tierErrors.name && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{tierErrors.name}</span>
              </div>
            )}
          </div>

          {/* Min Spending & Discount Rate Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {isKhmer ? 'ចំណាយអប្បបរមា ($) *' : 'Min Spend ($) *'}
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={tierForm.min_spending}
                onChange={e => {
                  setTierForm(f => ({ ...f, min_spending: e.target.value }));
                  if (tierErrors.min_spending) setTierErrors(prev => ({ ...prev, min_spending: null }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                  tierErrors.min_spending ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                }`}
              />
              {tierErrors.min_spending && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{tierErrors.min_spending}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {isKhmer ? 'បញ្ចុះតម្លៃ (%) *' : 'Discount (%) *'}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={tierForm.discount_rate}
                onChange={e => {
                  setTierForm(f => ({ ...f, discount_rate: e.target.value }));
                  if (tierErrors.discount_rate) setTierErrors(prev => ({ ...prev, discount_rate: null }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                  tierErrors.discount_rate ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                }`}
              />
              {tierErrors.discount_rate && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{tierErrors.discount_rate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Jewel Theme Color Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {isKhmer ? 'ជ្រើសរើសពណ៌ត្បូង / Theme' : 'Jewel Theme & Color'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIER_COLORS.map(c => {
                const isSelected = tierForm.badge_color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTierForm(f => ({ ...f, badge_color: c.id }))}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all text-left ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/30 text-slate-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${c.iconBg}`}>
                      <FontAwesomeIcon icon={c.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[11px] leading-tight">{c.shortLabel || c.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.colorName}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {isKhmer ? 'ពិពណ៌នា' : 'Description'}
            </label>
            <textarea
              rows={2}
              value={tierForm.description}
              onChange={e => setTierForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50 resize-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={savingTier}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {savingTier ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុក Tier' : 'Save VIP Tier')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default TierModal;
