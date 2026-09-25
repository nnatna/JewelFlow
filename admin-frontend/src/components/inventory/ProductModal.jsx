import React, { useState, useEffect, useMemo } from 'react';
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
  faCircleExclamation,
  faLock,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

export const ProductModal = ({ isOpen, onClose, initialData = null }) => {
  const { t, i18n } = useTranslation();
  const { categories, metalTypes, goldRates, materials, units, getMaterialEffectivePrice, addProduct, updateProduct, showToast } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');
  const [selectedUnitCode, setSelectedUnitCode] = useState('chi');

  // Filter precious metals / casting materials from materials catalog
  const metalMaterials = useMemo(() => {
    if (!materials || materials.length === 0) return [];
    // Prioritize precious metals, bullion, casting grain, or general materials
    const metalsOnly = materials.filter(m => m.metal_type_id || m.metal_type || (m.unit === 'g' || m.unit === 'chi' || m.unit === 'damlung'));
    return metalsOnly.length > 0 ? metalsOnly : materials;
  }, [materials]);

  const [formData, setFormData] = useState({
    name: '',
    code_sku: '',
    barcode: '',
    category_id: 1,
    metal_type_id: 1,
    material_id: '',
    unit_id: '',
    net_weight: 5.0,
    gross_weight: 5.2,
    labor_cost: 150,
    markup_rate: 15,
    stock_qty: 5,
    image: null,
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setErrors({});
    if (initialData) {
      // Find matching material if exists
      const matchedMat = materials.find(m => 
        (initialData.material_id && m.id === initialData.material_id) ||
        (m.metal_type_id && m.metal_type_id === initialData.metal_type_id)
      );
      const currentUnitCode = initialData.unitRelation?.code || initialData.unit || 'chi';
      setSelectedUnitCode(currentUnitCode);
      setFormData({
        ...initialData,
        material_id: matchedMat?.id || initialData.material_id || '',
        unit_id: initialData.unit_id || (units || []).find(u => u.code === currentUnitCode)?.id || '',
        description: initialData.description || '',
      });
    } else {
      const defaultMat = metalMaterials[0] || materials[0] || null;
      const chiUnit = (units || []).find(u => u.code === 'chi');
      setSelectedUnitCode('chi');
      setFormData({
        name: '',
        code_sku: '',
        barcode: '',
        category_id: categories[0]?.id || 1,
        metal_type_id: defaultMat?.metal_type_id || metalTypes[0]?.id || 1,
        material_id: defaultMat?.id || '',
        unit_id: chiUnit?.id || '',
        net_weight: 5.0,
        gross_weight: 5.2,
        labor_cost: 150,
        markup_rate: 15,
        stock_qty: 0,
        image: null,
        description: '',
      });
    }
  }, [initialData, isOpen, categories, metalTypes, materials, metalMaterials, units]);

  if (!isOpen) return null;

  // Selected Material & Live estimated retail calculation
  const selectedMaterial = materials.find(m => 
    (formData.material_id && Number(m.id) === Number(formData.material_id)) ||
    (m.metal_type_id && Number(m.metal_type_id) === Number(formData.metal_type_id))
  ) || null;

  const activeUnit = (units || []).find(u => u.code === selectedUnitCode) || {
    code: 'chi',
    name: 'Chi',
    name_kh: 'ជី',
    symbol: 'ជី',
    conversion_factor: 3.75
  };
  const factor = Number(activeUnit.conversion_factor) || 3.75;
  const unitLabel = isKhmer ? (activeUnit.name_kh || activeUnit.name) : activeUnit.name;

  const metalRateObj = goldRates.find(r => r.metal_type_id === Number(formData.metal_type_id)) || goldRates[0];
  const livePriceFromMat = selectedMaterial ? (getMaterialEffectivePrice ? getMaterialEffectivePrice(selectedMaterial) : selectedMaterial.cost_price) : 0;
  const metalRate = livePriceFromMat > 0 ? livePriceFromMat : (metalRateObj?.rate_per_gram || 85.5);
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

  const handleSubmit = async (e) => {
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
    setIsSubmitting(true);
    try {
      const selectedMat = materials.find(m => 
        (formData.material_id && Number(m.id) === Number(formData.material_id)) ||
        (m.metal_type_id && Number(m.metal_type_id) === Number(formData.metal_type_id))
      ) || materials[0] || null;

      const selectedUnitObj = (units || []).find(u => u.code === selectedUnitCode);

      const payload = {
        name: formData.name.trim(),
        description: formData.description || '',
        category_id: Number(formData.category_id || categories[0]?.id || 1),
        material_id: selectedMat?.id ? Number(selectedMat.id) : (formData.material_id ? Number(formData.material_id) : 1),
        metal_type_id: selectedMat?.metal_type_id ? Number(selectedMat.metal_type_id) : Number(formData.metal_type_id || 1),
        unit_id: selectedUnitObj?.id || formData.unit_id || null,
        net_weight: parseFloat(formData.net_weight) || 0,
        gross_weight: parseFloat(formData.gross_weight || formData.net_weight) || 0,
        labor_cost: parseFloat(formData.labor_cost) || 0,
        markup_rate: parseFloat(formData.markup_rate) || 0,
        stock_qty: formData.stock_qty === '' || formData.stock_qty == null ? 0 : parseInt(formData.stock_qty, 10),
        status: formData.status || 'active',
        image: formData.image || null,
        code_sku: formData.code_sku || undefined,
        barcode: formData.barcode || undefined
      };

      if (initialData) {
        await updateProduct({ ...initialData, ...payload });
      } else {
        await addProduct(payload);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save jewelry:', err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការរក្សាទុកគ្រឿងអលង្ការ' : 'Failed to save jewelry piece', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-bold">
                      {t('productModal.metalPurity', 'Metal Karat & Purity')}
                    </label>
                    {selectedMaterial && (
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                        Number(selectedMaterial.stock_qty || 0) <= 0
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : Number(selectedMaterial.stock_qty || 0) <= (selectedMaterial.min_stock_level || 5)
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}>
                        {isKhmer ? 'ស្តុកក្នុងឃ្លាំង:' : 'Vault:'} {Number(selectedMaterial.stock_qty || 0).toLocaleString()} {selectedMaterial.unit || 'g'}
                      </span>
                    )}
                  </div>
                  <select
                    value={formData.material_id ? `mat-${formData.material_id}` : `metal-${formData.metal_type_id}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('mat-')) {
                        const matId = Number(val.replace('mat-', ''));
                        const selectedMat = materials.find(m => Number(m.id) === matId);
                        if (selectedMat) {
                          setFormData(prev => ({
                            ...prev,
                            material_id: selectedMat.id,
                            metal_type_id: selectedMat.metal_type_id || prev.metal_type_id || 1
                          }));
                        }
                      } else if (val.startsWith('metal-')) {
                        const typeId = Number(val.replace('metal-', ''));
                        const matchedMat = materials.find(m => Number(m.metal_type_id) === typeId);
                        setFormData(prev => ({
                          ...prev,
                          material_id: matchedMat ? matchedMat.id : '',
                          metal_type_id: typeId
                        }));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-amber-500 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  >
                    {metalMaterials.length > 0 ? (
                      metalMaterials.map(m => (
                        <option key={`mat-${m.id}`} value={`mat-${m.id}`}>
                          {m.name} {m.purity ? `(${m.purity}%)` : ''} - {isKhmer ? 'ស្តុក:' : 'Stock:'} {Number(m.stock_qty || 0)} {m.unit || 'g'}
                        </option>
                      ))
                    ) : (
                      metalTypes.map(m => (
                        <option key={`metal-${m.id}`} value={`metal-${m.id}`}>{m.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Unit Selection Header & Weight Inputs */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs">
                      <FontAwesomeIcon icon={faScaleBalanced} className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      {isKhmer ? 'ទម្ងន់ និងខ្នាតគិត (Weight & Measurement Unit)' : 'Weight & Measurement Unit'}
                    </span>
                  </div>
                  
                  {/* Choose Unit Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                      {isKhmer ? 'ខ្នាតគិត:' : 'Unit:'}
                    </span>
                    <select
                      value={selectedUnitCode}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        const newUnitObj = (units || []).find(u => u.code === newCode);
                        setSelectedUnitCode(newCode);
                        setFormData(prev => ({
                          ...prev,
                          unit_id: newUnitObj?.id || prev.unit_id
                        }));
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-100/70 border border-amber-300/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer shadow-xs"
                    >
                      {(units && units.length > 0) ? (
                        units.map(u => (
                          <option key={u.id || u.code} value={u.code}>
                            {isKhmer ? `${u.name_kh || u.name} (${u.code})` : `${u.name} (${u.code})`}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="chi">{isKhmer ? 'ជី (chi)' : 'Chi (chi)'}</option>
                          <option value="damlung">{isKhmer ? 'តម្លឹង (damlung)' : 'Damlung (damlung)'}</option>
                          <option value="hun">{isKhmer ? 'ហ៊ុន (hun)' : 'Hun (hun)'}</option>
                          <option value="g">{isKhmer ? 'ក្រាម (g)' : 'Gram (g)'}</option>
                          <option value="ct">{isKhmer ? 'ការ៉ាត់ (ct)' : 'Carat (ct)'}</option>
                          <option value="oz">{isKhmer ? 'អោនស៍ (oz)' : 'Ounce (oz)'}</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Net Weight & Gross Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-slate-700 font-bold text-xs">
                        {isKhmer ? `ទម្ងន់មាសសុទ្ធ (Net Weight)` : `Net Gold Weight`}
                      </label>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        1 {unitLabel} = {factor}g
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.00"
                        value={formData.net_weight ? Number(((formData.net_weight || 0) / factor).toFixed(3)) : ''}
                        onChange={(e) => {
                          const unitVal = parseFloat(e.target.value);
                          const gVal = isNaN(unitVal) ? 0 : Math.round(unitVal * factor * 1000) / 1000;
                          const currentGrossG = formData.gross_weight || 0;
                          const newGrossG = currentGrossG > gVal ? currentGrossG : gVal;
                          setFormData({ ...formData, net_weight: gVal, gross_weight: newGrossG });
                          if (errors.net_weight) setErrors(prev => ({ ...prev, net_weight: null }));
                        }}
                        className={`w-full bg-white border rounded-xl pl-3.5 pr-16 py-2.5 text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-xs ${
                          errors.net_weight
                            ? 'border-rose-500 ring-2 ring-rose-200/50 bg-rose-50/20'
                            : 'border-slate-200'
                        }`}
                      />
                      <span className="absolute right-2.5 top-2 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 pointer-events-none">
                        {unitLabel}
                      </span>
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
                        {isKhmer ? `ទម្ងន់សរុប (Gross Weight)` : `Gross Weight`}
                      </label>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        1 {unitLabel} = {factor}g
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.00"
                        value={formData.gross_weight ? Number(((formData.gross_weight || 0) / factor).toFixed(3)) : ''}
                        onChange={(e) => {
                          const unitVal = parseFloat(e.target.value);
                          const gVal = isNaN(unitVal) ? 0 : Math.round(unitVal * factor * 1000) / 1000;
                          setFormData({ ...formData, gross_weight: gVal });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-16 py-2.5 text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-xs"
                      />
                      <span className="absolute right-2.5 top-2 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 pointer-events-none">
                        {unitLabel}
                      </span>
                    </div>
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
                    {formData.net_weight}g @ ${metalRate.toFixed(2)}/g ({selectedMaterial ? selectedMaterial.name : (metalRateObj?.name || 'Gold')})
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
              disabled={isSubmitting}
              className={`px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
              <span>
                {isSubmitting
                  ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                  : (initialData
                      ? t('productModal.saveChanges', 'Save Changes')
                      : t('productModal.createPiece', 'Create Jewelry Piece'))}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ProductModal;
