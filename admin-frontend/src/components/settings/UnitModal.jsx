import React from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faScaleBalanced,
  faXmark,
  faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';

export const UnitModal = ({
  isOpen,
  onClose,
  onSubmit,
  unitForm,
  setUnitForm,
  unitErrors,
  setUnitErrors,
  editingUnitId,
  savingUnit,
  isKhmer
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
              <FontAwesomeIcon icon={faScaleBalanced} className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {editingUnitId
                  ? (isKhmer ? 'កែប្រែខ្នាតទម្ងន់/រង្វាស់' : 'Edit Measurement Unit')
                  : (isKhmer ? 'បន្ថែមខ្នាតទម្ងន់/រង្វាស់ថ្មី' : 'Add Measurement Unit')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer ? 'កំណត់ឈ្មោះ កូដ ប្រភេទ និងអត្រាបំប្លែងទៅជាក្រាម' : 'Configure unit code, label, type and gram conversion factor'}
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
          {/* Unit Name EN and Khmer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap truncate">
                {isKhmer ? 'ឈ្មោះខ្នាត (English) *' : 'Unit Name (English) *'}
              </label>
              <input
                type="text"
                value={unitForm.name}
                onChange={e => {
                  setUnitForm(f => ({ ...f, name: e.target.value }));
                  if (unitErrors.name) setUnitErrors(prev => ({ ...prev, name: null }));
                }}
                placeholder="e.g. Baht, Chi, Ounce"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                  unitErrors.name ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                }`}
              />
              {unitErrors.name && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{unitErrors.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap truncate">
                {isKhmer ? 'ឈ្មោះខ្នាត (Khmer)' : 'Unit Name (Khmer)'}
              </label>
              <input
                type="text"
                value={unitForm.name_kh}
                onChange={e => setUnitForm(f => ({ ...f, name_kh: e.target.value }))}
                placeholder={isKhmer ? 'e.g. ជី, តម្លឹង, ក្រាម, បាត' : 'e.g. Chi, Damlung, Gram, Baht'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50 text-xs text-slate-900 font-semibold focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Code & Symbol Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap truncate">
                {isKhmer ? 'កូដខ្នាត *' : 'Unit Code *'}
              </label>
              <input
                type="text"
                value={unitForm.code}
                onChange={e => {
                  setUnitForm(f => ({ ...f, code: e.target.value }));
                  if (unitErrors.code) setUnitErrors(prev => ({ ...prev, code: null }));
                }}
                placeholder="e.g. baht, chi, oz, ct"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-mono font-bold focus:outline-none transition-all ${
                  unitErrors.code ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                }`}
              />
              {unitErrors.code && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{unitErrors.code}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap truncate">
                {isKhmer ? 'និមិត្តសញ្ញា' : 'Symbol / Abbr'}
              </label>
              <input
                type="text"
                value={unitForm.symbol}
                onChange={e => setUnitForm(f => ({ ...f, symbol: e.target.value }))}
                placeholder={isKhmer ? 'e.g. ជី, ฿, oz, ct' : 'e.g. g, chi, ฿, oz, ct'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50 text-xs text-slate-900 font-semibold focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Type and Conversion Factor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap truncate">
                {isKhmer ? 'ប្រភេទខ្នាត' : 'Unit Type'}
              </label>
              <select
                value={unitForm.type}
                onChange={e => setUnitForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-200/50 cursor-pointer"
              >
                <option value="weight">{isKhmer ? 'ទម្ងន់ (Weight / Grams conversion)' : 'Weight (Grams Conversion)'}</option>
                <option value="count">{isKhmer ? 'ចំនួនរាប់ (Count / Pieces)' : 'Count (Pieces / Items)'}</option>
                <option value="gemstone">{isKhmer ? 'ត្បូង / ការ៉ាត់ (Gemstone / Carat)' : 'Gemstone / Carat'}</option>
                <option value="volume">{isKhmer ? 'មាឌ / រាវ (Volume / Liquid)' : 'Volume / Liquid'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap truncate">
                {isKhmer ? 'អត្រាបំប្លែងទៅជាក្រាម (g) *' : 'Conversion to Grams (g) *'}
              </label>
              <input
                type="number"
                min="0.000001"
                step="0.000001"
                value={unitForm.conversion_factor}
                onChange={e => {
                  setUnitForm(f => ({ ...f, conversion_factor: e.target.value }));
                  if (unitErrors.conversion_factor) setUnitErrors(prev => ({ ...prev, conversion_factor: null }));
                }}
                placeholder="1.000000"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-mono font-bold focus:outline-none transition-all ${
                  unitErrors.conversion_factor ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                }`}
              />
              {unitErrors.conversion_factor && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{unitErrors.conversion_factor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Live Conversion Preview helper */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-2xl flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faScaleBalanced} className="text-amber-700 w-3.5 h-3.5" />
              <span>{isKhmer ? 'ទម្រង់បំប្លែងស្វ័យប្រវត្តិ:' : 'Live Conversion Rule:'}</span>
            </span>
            <span className="font-mono font-extrabold text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300/80 shadow-2xs">
              1 {unitForm.code || 'unit'} = {Number(unitForm.conversion_factor) || 0} g
            </span>
          </div>

          {/* Sort Order & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {isKhmer ? 'លំដាប់បង្ហាញ' : 'Sort Order'}
              </label>
              <input
                type="number"
                min="0"
                value={unitForm.sort_order}
                onChange={e => setUnitForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={unitForm.is_active}
                  onChange={e => setUnitForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  {isKhmer ? 'បើកដំណើរការ' : 'Active Status'}
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {isKhmer ? 'ពិពណ៌នា / ចំណាំ' : 'Description / Notes'}
            </label>
            <textarea
              rows={2}
              value={unitForm.description}
              onChange={e => setUnitForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional details or context..."
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
              disabled={savingUnit}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {savingUnit ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកខ្នាត' : 'Save Unit')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default UnitModal;
