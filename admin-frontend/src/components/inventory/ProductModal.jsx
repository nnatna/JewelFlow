import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faGem,
  faCloudArrowUp,
  faCamera,
  faImage,
  faTrash,
  faCoins,
  faScaleBalanced,
  faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';

export const ProductModal = ({ isOpen, onClose, initialData = null }) => {
  const { t, i18n } = useTranslation();
  const { categories, metalTypes, goldRates, addProduct, updateProduct, showToast } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  const [formData, setFormData] = useState({
    name: '',
    code_sku: '',
    barcode: '',
    category_id: 1,
    metal_type_id: 1,
    net_weight: 5.0,
    gross_weight: 5.2,
    labor_cost: 150,
    markup_rate: 15,
    stock_qty: 5,
    image: null,
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        code_sku: '',
        barcode: '',
        category_id: categories[0]?.id || 1,
        metal_type_id: metalTypes[0]?.id || 1,
        net_weight: 5.0,
        gross_weight: 5.2,
        labor_cost: 150,
        markup_rate: 15,
        stock_qty: 5,
        image: null,
        description: '',
      });
    }
  }, [initialData, isOpen, categories, metalTypes]);

  if (!isOpen) return null;

  // Live estimated retail calculation
  const metalRateObj = goldRates.find(r => r.metal_type_id === Number(formData.metal_type_id)) || goldRates[0];
  const metalRate = metalRateObj?.rate_per_gram || 85.5;
  const metalVal = (Number(formData.net_weight) || 0) * metalRate;
  const baseCost = metalVal + (Number(formData.labor_cost) || 0);
  const calculatedTag = baseCost * (1 + ((Number(formData.markup_rate) || 0) / 100));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះគ្រឿងអលង្ការ!' : 'Please enter product title!';
    }
    if (!formData.net_weight || Number(formData.net_weight) <= 0) {
      newErrors.net_weight = isKhmer ? 'សូមបញ្ចូលទម្ងន់មាស!' : 'Please enter gold weight!';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(isKhmer ? 'សូមបំពេញព័ត៌មានដែលចាំបាច់!' : 'Please fill required fields!', 'warning');
      return;
    }

    setErrors({});
    if (initialData) {
      updateProduct({ ...initialData, ...formData });
    } else {
      addProduct(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
              <FontAwesomeIcon icon={faGem} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {initialData
                  ? t('productModal.editTitle', 'Edit Jewelry Specifications')
                  : t('productModal.createTitle', 'Register New Jewelry Piece')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'បំពេញព័ត៌មានលម្អិត ខ្នាតទម្ងន់មាស និងរូបភាពគ្រឿងអលង្ការ'
                  : 'Specify precious metal parameters, weights, and product imagery'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
            title={isKhmer ? 'បិទ' : 'Close'}
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Body: 2-Column Responsive Layout ────────────────────── */}
        <form noValidate onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ── Left Column: Form Specifications (7 Columns) ───────────── */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Product Title */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {t('productModal.productTitle', 'Product Title')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                  }}
                  placeholder={t('productModal.titlePlaceholder', 'e.g. Celestial Diamond Solitaire Ring')}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none transition-colors ${
                    errors.name
                      ? 'border border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                      : 'bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white'
                  }`}
                />
                {errors.name && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Category & Metal Karat / Purity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t('productModal.category', 'Category')}
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-amber-500 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t('productModal.metalPurity', 'Metal Karat & Purity')}
                  </label>
                  <select
                    value={formData.metal_type_id}
                    onChange={(e) => setFormData({ ...formData, metal_type_id: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-amber-500 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  >
                    {metalTypes.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t('invoiceModal.sku', 'Code / SKU')}
                  </label>
                  <input
                    type="text"
                    value={formData.code_sku || ''}
                    onChange={(e) => setFormData({ ...formData, code_sku: e.target.value })}
                    placeholder="e.g. JW-RNG-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t('catalog.barcode', 'Barcode / EAN')}
                  </label>
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. 884123456789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Gold Weight (Chi & Grams) & Gross Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-bold text-xs">
                      {t('productModal.goldWeightChi', 'Gold Weight (Chi)')}
                    </label>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      1 ជី = 3.75g
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.00"
                        value={formData.net_weight ? Number(((formData.net_weight || 0) / 3.75).toFixed(3)) : ''}
                        onChange={(e) => {
                          const chiVal = parseFloat(e.target.value);
                          const gVal = isNaN(chiVal) ? 0 : Math.round(chiVal * 3.75 * 1000) / 1000;
                          setFormData({ ...formData, net_weight: gVal, gross_weight: Math.round((gVal + 0.25) * 100) / 100 });
                        }}
                        className="w-full bg-amber-50/60 border border-amber-300 rounded-xl pl-3 pr-8 py-2 text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-xs"
                      />
                      <span className="absolute right-2.5 top-2 text-[11px] font-bold text-amber-800 pointer-events-none">
                        {isKhmer ? 'ជី' : 'Chi'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.net_weight || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, net_weight: parseFloat(e.target.value) || 0 });
                          if (errors.net_weight) setErrors(prev => ({ ...prev, net_weight: null }));
                        }}
                        className={`w-full rounded-xl pl-3 pr-7 py-2 text-xs font-semibold focus:outline-none font-mono ${
                          errors.net_weight
                            ? 'border border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50 text-slate-900'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 focus:border-amber-500 focus:bg-white'
                        }`}
                      />
                      <span className="absolute right-2.5 top-2 text-[11px] font-medium text-slate-400 pointer-events-none">g</span>
                    </div>
                  </div>
                  {errors.net_weight && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{errors.net_weight}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-bold text-xs">
                      {t('productModal.grossWeight', 'Gross Weight')}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formData.gross_weight ? `${((formData.gross_weight || 0) / 3.75).toFixed(2)} ${isKhmer ? 'ជី' : 'Chi'}` : `0.00 ${isKhmer ? 'ជី' : 'Chi'}`}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gross_weight || ''}
                      onChange={(e) => setFormData({ ...formData, gross_weight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-xs"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] font-medium text-slate-400 pointer-events-none">g</span>
                  </div>
                </div>
              </div>

              {/* Labor Charge & Markup Percentage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t('productModal.laborCost', 'Labor / Making Charge ($)')}
                  </label>
                  <input
                    type="number"
                    value={formData.labor_cost}
                    onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t('productModal.markupRate', 'Markup Percentage (%)')}
                  </label>
                  <input
                    type="number"
                    value={formData.markup_rate}
                    onChange={(e) => setFormData({ ...formData, markup_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Inventory Quantity */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {t('productModal.stockQty', 'Inventory Quantity')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_qty}
                  onChange={(e) => setFormData({ ...formData, stock_qty: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              {/* Description & Atelier Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {t('common.description', 'Description & Atelier Notes')}
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Certified handcrafted 24K yellow gold piece with bespoke finishing."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none transition-colors resize-none"
                />
              </div>

            </div>

            {/* ── Right Column: Photo Upload / Preview & Live Valuation Card (5 Columns) ── */}
            <div className="lg:col-span-5 space-y-4 flex flex-col">
              
              {/* Photo Upload & Preview Card */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold text-xs flex items-center gap-2">
                    <FontAwesomeIcon icon={faCamera} className="text-amber-600 w-3.5 h-3.5" />
                    <span>{t('productModal.photo', 'Jewelry Photo')}</span>
                  </label>
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: null })}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer transition-colors"
                    >
                      {isKhmer ? 'លុបរូបភាព' : 'Remove Photo'}
                    </button>
                  )}
                </div>

                {/* Dropzone & Preview Box */}
                <div className="w-full relative group">
                  {formData.image ? (
                    <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner group">
                      <img
                        src={formData.image}
                        alt="Product Preview"
                        className="w-full h-full object-contain p-2"
                      />
                      <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-2xs gap-1.5 text-xs font-semibold">
                        <FontAwesomeIcon icon={faCloudArrowUp} className="w-6 h-6 text-amber-400" />
                        <span>{isKhmer ? 'ចុចដើម្បីប្តូររូបភាព' : 'Click to change photo'}</span>
                        <span className="text-[10px] text-slate-300">PNG, JPG, WEBP</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="w-full h-56 border-2 border-dashed border-amber-300/80 bg-amber-50/40 hover:bg-amber-50/80 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all p-5 text-center group">
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition-transform">
                        <FontAwesomeIcon icon={faCloudArrowUp} className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {isKhmer ? 'ចុចដើម្បីជ្រើសរើសរូបភាព' : 'Upload Jewelry Image'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        PNG, JPG, WEBP (High Resolution)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>

                {/* File selection trigger button */}
                <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-amber-900 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                  <FontAwesomeIcon icon={faImage} className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {formData.image
                      ? (isKhmer ? 'ប្តូររូបភាពថ្មី (Change)' : 'Choose Another Photo')
                      : (isKhmer ? 'ជ្រើសរើសឯកសាររូបភាព' : 'Browse File...')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Dynamic Live Valuation Card */}
              <div className="p-4.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-yellow-50/80 border border-amber-200/90 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faScaleBalanced} className="text-amber-600 w-3 h-3" />
                    <span>{t('productModal.valuationPreview', 'Live Atelier Valuation')}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 font-bold border border-amber-300/60">
                    Live Fix
                  </span>
                </div>

                <div className="text-2xl font-extrabold font-mono text-amber-950">
                  ${calculatedTag.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div className="text-[11px] text-slate-600 font-medium leading-relaxed pt-2 border-t border-amber-200/60 flex flex-col gap-0.5">
                  <span>
                    {formData.net_weight}g @ ${metalRate.toFixed(2)}/g ({metalRateObj?.name || 'Gold'})
                  </span>
                  <span className="text-slate-500">
                    + ${Number(formData.labor_cost).toFixed(2)} labor + {formData.markup_rate}% markup
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* ── Modal Footer Buttons ──────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
            >
              {t('productModal.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              {initialData
                ? t('productModal.saveChanges', 'Save Changes')
                : t('productModal.createPiece', 'Create Jewelry Piece')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ProductModal;
