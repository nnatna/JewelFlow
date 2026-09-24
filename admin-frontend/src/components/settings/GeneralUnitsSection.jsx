import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { UnitModal } from './UnitModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlobe,
  faCalculator,
  faReceipt,
  faScaleBalanced,
  faPlus,
  faFloppyDisk,
  faCheckCircle,
  faPenToSquare,
  faTrashCan
} from '@fortawesome/free-solid-svg-icons';

export const GeneralUnitsSection = () => {
  const { i18n } = useTranslation();
  const {
    settings,
    saveSettings,
    tiers,
    units,
    addUnit,
    editUnit,
    removeUnit,
    taxRate,
    setTaxRate,
    showToast,
    confirmDialog
  } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  // Local state
  const [calcTier, setCalcTier] = useState(settings?.calculator_tier || 'Gold');
  const [posTaxRate, setPosTaxRate] = useState(settings?.tax_rate !== undefined ? Number(settings.tax_rate) : (taxRate ?? 7.5));
  const [taxEnabled, setTaxEnabled] = useState(settings?.tax_enabled !== 'false');
  const [taxMode, setTaxMode] = useState(settings?.tax_mode || 'exclusive');
  const [savingSettings, setSavingSettings] = useState(false);

  // Unit Modal state
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [unitForm, setUnitForm] = useState({
    name: '',
    name_kh: '',
    code: '',
    symbol: '',
    conversion_factor: 1.0,
    base_unit: 'g',
    type: 'weight',
    sort_order: 0,
    is_active: true,
    description: ''
  });
  const [unitErrors, setUnitErrors] = useState({});
  const [savingUnit, setSavingUnit] = useState(false);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('jewelflow_lang', lang);
    showToast(lang === 'km' ? 'បានប្តូរភាសាទៅជាភាសាខ្មែរ' : 'Language switched to English', 'success');
  };

  const handleSaveGeneralSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = {
        calculator_tier: calcTier,
        tax_rate: Number(posTaxRate) || 0,
        tax_enabled: String(taxEnabled),
        tax_mode: taxMode,
      };

      await saveSettings(payload);
      if (setTaxRate) setTaxRate(Number(posTaxRate) || 0);
      showToast(isKhmer ? 'ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!' : 'Settings saved successfully!', 'success');
    } catch {
      showToast(isKhmer ? 'បរាជ័យក្នុងការរក្សាទុកការកំណត់' : 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const openNewUnitModal = () => {
    setEditingUnitId(null);
    setUnitForm({
      name: '',
      name_kh: '',
      code: '',
      symbol: '',
      conversion_factor: 1.0,
      base_unit: 'g',
      type: 'weight',
      sort_order: (units?.length || 0) + 1,
      is_active: true,
      description: ''
    });
    setUnitErrors({});
    setShowUnitModal(true);
  };

  const openEditUnitModal = (unit) => {
    setEditingUnitId(unit.id);
    setUnitForm({
      name: unit.name || '',
      name_kh: unit.name_kh || '',
      code: unit.code || '',
      symbol: unit.symbol || '',
      conversion_factor: Number(unit.conversion_factor) || 1.0,
      base_unit: unit.base_unit || 'g',
      type: unit.type || 'weight',
      sort_order: unit.sort_order || 0,
      is_active: unit.is_active !== false,
      description: unit.description || ''
    });
    setUnitErrors({});
    setShowUnitModal(true);
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!unitForm.name.trim()) errs.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះខ្នាត!' : 'Unit name is required!';
    if (!unitForm.code.trim()) errs.code = isKhmer ? 'សូមបញ្ចូលកូដខ្នាត!' : 'Unit code is required!';
    if (!unitForm.conversion_factor || Number(unitForm.conversion_factor) <= 0) {
      errs.conversion_factor = isKhmer ? 'សូមបញ្ចូលអត្រាបំប្លែងទៅជាក្រាម (> 0)!' : 'Valid conversion factor (>0) is required!';
    }

    if (Object.keys(errs).length > 0) {
      setUnitErrors(errs);
      showToast(isKhmer ? 'សូមពិនិត្យព័ត៌មានដែលខ្វះ!' : 'Please check required fields!', 'warning');
      return;
    }

    setSavingUnit(true);
    try {
      const payload = {
        name: unitForm.name.trim(),
        name_kh: unitForm.name_kh.trim() || null,
        code: unitForm.code.trim().toLowerCase(),
        symbol: unitForm.symbol.trim() || null,
        conversion_factor: Number(unitForm.conversion_factor),
        base_unit: unitForm.base_unit || 'g',
        type: unitForm.type || 'weight',
        sort_order: Number(unitForm.sort_order) || 0,
        is_active: unitForm.is_active,
        description: unitForm.description.trim() || null,
      };

      if (editingUnitId) {
        await editUnit(editingUnitId, payload);
      } else {
        await addUnit(payload);
      }
      setShowUnitModal(false);
      showToast(isKhmer ? 'រក្សាទុកខ្នាតបានជោគជ័យ' : 'Unit saved successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការរក្សាទុកខ្នាត' : 'Failed to save unit');
      showToast(msg, 'error');
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteUnit = async (unit) => {
    if (unit.code === 'g') {
      showToast(isKhmer ? 'មិនអាចលុបខ្នាតគោល (Gram / ក្រាម) បានទេ' : 'Cannot delete base metric unit (Gram)', 'warning');
      return;
    }

    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបខ្នាតរង្វាស់?' : 'Delete Measurement Unit?',
      text: isKhmer
        ? `តើអ្នកពិតជាចង់លុបខ្នាត "${unit.name_kh || unit.name}" (${unit.code}) នេះមែនទេ?`
        : `Are you sure you want to delete "${unit.name}" (${unit.code}) unit?`,
      confirmButtonText: isKhmer ? 'លុបចោល' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
    });

    if (confirmed) {
      try {
        await removeUnit(unit.id);
        showToast(isKhmer ? 'លុបខ្នាតបានជោគជ័យ' : 'Unit deleted successfully', 'success');
      } catch (err) {
        const msg = err.response?.data?.message || (isKhmer ? 'មិនអាចលុបខ្នាតនេះបានទេ' : 'Failed to delete unit');
        showToast(msg, 'error');
      }
    }
  };

  return (
    <div className="space-y-5 select-none animate-fadeIn">
      {/* ── Language Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <FontAwesomeIcon icon={faGlobe} className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{isKhmer ? 'កំណត់ភាសាប្រព័ន្ធ' : 'Application Language'}</h2>
            <p className="text-xs text-slate-400 font-normal">{isKhmer ? 'ជ្រើសរើសភាសាសម្រាប់កម្មវិធី JewelFlow ទាំងមូល' : 'Select UI display language across all modules'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() => handleLanguageChange('km')}
            className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              currentLang === 'km'
                ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-sm ring-2 ring-amber-400/20 font-bold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl leading-none">🇰🇭</span>
            <div>
              <p className="text-xs font-bold text-slate-900">{isKhmer ? 'ភាសាខ្មែរ' : 'Khmer'}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isKhmer ? 'ទម្រង់ភាសាជាតិ និងខ្នាតមាសកម្ពុជា' : 'National Khmer language & units'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              currentLang === 'en'
                ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-sm ring-2 ring-amber-400/20 font-bold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl leading-none">🇺🇸</span>
            <div>
              <p className="text-xs font-bold text-slate-900">English (US)</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isKhmer ? 'ទម្រង់ភាសាអង់គ្លេសពាណិជ្ជកម្មអន្តរជាតិ' : 'International English business format'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Calculator Default Tier Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <FontAwesomeIcon icon={faCalculator} className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{isKhmer ? 'កម្រិត VIP ដើមសម្រាប់ម៉ាស៊ីនគណនា' : 'Default POS Calculator Tier'}</h2>
            <p className="text-xs text-slate-400 font-normal">{isKhmer ? 'កំណត់កម្រិតបញ្ចុះតម្លៃដើមពេលគណនាតម្លៃលើផ្ទាំង POS' : 'Default discount tier applied in price estimation tool'}</p>
          </div>
        </div>

        <div className="max-w-md space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            {isKhmer ? 'ជ្រើសរើស VIP Tier ដើម:' : 'Select Default Tier:'}
          </label>
          <select
            value={calcTier}
            onChange={e => setCalcTier(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 cursor-pointer"
          >
            {(tiers || []).map(t => (
              <option key={t.id} value={t.name}>
                {t.name} ({t.discount_rate}% {isKhmer ? 'បញ្ចុះ' : 'Discount'})
              </option>
            ))}
          </select>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={handleSaveGeneralSettings}
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
            <span>{savingSettings ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកំណត់ទូទៅ' : 'Save General Settings')}</span>
          </button>
        </div>
      </div>

      {/* ── Sales Tax & VAT Configuration Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold shrink-0">
              <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight font-serif">
                  {isKhmer ? 'ការកំណត់ពន្ធដារលើការលក់' : 'Sales Tax & VAT Configuration'}
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  taxEnabled
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}>
                  {taxEnabled ? `${posTaxRate}% ${isKhmer ? 'បើកដំណើរការ' : 'Active'}` : (isKhmer ? 'បិទពន្ធ (0%)' : 'Tax Disabled (0%)')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'កំណត់ភាគរយពន្ធលក់ចេញ (Sales Tax) ឬអាករលើតម្លៃបន្ថែម (VAT) សម្រាប់គណនាក្នុង POS និងវិក្កយបត្រ'
                  : 'Configure default sales tax, VAT percentages, and price calculation modes applied at checkout'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
            <span className="text-xs font-bold text-slate-700">
              {isKhmer ? 'បើកដំណើរការគិតពន្ធ:' : 'Enable Tax Calculation:'}
            </span>
            <button
              type="button"
              onClick={() => setTaxEnabled(!taxEnabled)}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                taxEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
              }`}
              title={taxEnabled ? 'Tax Enabled' : 'Tax Disabled'}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Tax Rate Percentage Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              {isKhmer ? 'អត្រាពន្ធលំនាំដើម (%):' : 'Default Tax / VAT Rate (%):'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={posTaxRate}
                onChange={e => setPosTaxRate(parseFloat(e.target.value) || 0)}
                disabled={!taxEnabled}
                placeholder="7.5"
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-colors disabled:opacity-50"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400 font-mono">
                %
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">
                {isKhmer ? 'ជម្រើសលឿន:' : 'Quick Select:'}
              </span>
              {[0, 5, 7.5, 10].map(val => (
                <button
                  key={val}
                  type="button"
                  disabled={!taxEnabled}
                  onClick={() => setPosTaxRate(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer disabled:opacity-40 ${
                    Number(posTaxRate) === val
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Tax Mode Option (Exclusive vs Inclusive) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              {isKhmer ? 'របៀបគណនាពន្ធលើទំនិញ:' : 'Tax Application Mode:'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!taxEnabled}
                onClick={() => setTaxMode('exclusive')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50 ${
                  taxMode === 'exclusive'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400/20 shadow-2xs font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <p className="text-xs font-bold text-slate-900">
                  {isKhmer ? 'គិតពន្ធបន្ថែម' : 'Tax Exclusive'}
                </p>
                <p className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                  {isKhmer ? 'បូកពន្ធបន្ថែមលើតម្លៃទំនិញពេល Checkout' : 'Tax is added on top of total price at POS'}
                </p>
              </button>

              <button
                type="button"
                disabled={!taxEnabled}
                onClick={() => setTaxMode('inclusive')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50 ${
                  taxMode === 'inclusive'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400/20 shadow-2xs font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <p className="text-xs font-bold text-slate-900">
                  {isKhmer ? 'រាប់បញ្ចូលពន្ធ' : 'Tax Inclusive'}
                </p>
                <p className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                  {isKhmer ? 'តម្លៃទំនិញបានរួមបញ្ចូលពន្ធរួចជាស្រេច' : 'Prices already include tax/VAT'}
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Example Live Preview Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600 font-medium">
            <FontAwesomeIcon icon={faCalculator} className="text-amber-600 w-3.5 h-3.5 shrink-0" />
            <span>
              {isKhmer
                ? `ឧទាហរណ៍៖ ទិញ $1,000 → ពន្ធ ${taxEnabled ? posTaxRate : 0}% = $${((1000 * (taxEnabled ? posTaxRate : 0)) / 100).toFixed(2)} → សរុបបង់ $${(1000 + (taxEnabled ? (1000 * posTaxRate) / 100 : 0)).toFixed(2)}`
                : `Example: Order Subtotal $1,000 → Tax (${taxEnabled ? posTaxRate : 0}%) = $${((1000 * (taxEnabled ? posTaxRate : 0)) / 100).toFixed(2)} → Grand Total $${(1000 + (taxEnabled ? (1000 * posTaxRate) / 100 : 0)).toFixed(2)}`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveGeneralSettings}
            disabled={savingSettings}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
            <span>{savingSettings ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកំណត់ពន្ធ' : 'Save Tax Settings')}</span>
          </button>
        </div>
      </div>

      {/* ── Measurement Units Management Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-bold shrink-0">
              <FontAwesomeIcon icon={faScaleBalanced} className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight font-serif">
                  {isKhmer ? 'ខ្នាតទម្ងន់ & ឯកតារង្វាស់សម្ភារៈ' : 'Measurement & Weight Units'}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {units?.length || 0} {isKhmer ? 'ខ្នាត' : 'Units'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'គ្រប់គ្រងខ្នាតមាសខ្មែរ (ជី, តម្លឹង, ហ៊ុន, ក្រាម) ខ្នាតត្បូង (ការ៉ាត់) និងអត្រាបំប្លែងទៅជាក្រាម'
                  : 'Manage gold standards, carats, and gram conversions'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openNewUnitModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បន្ថែមខ្នាតថ្មី' : 'Add Custom Unit'}</span>
          </button>
        </div>

        {/* Quick Conversion Matrix Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">{isKhmer ? '១ ជី' : '1 Chi'}</span>
              <span className="text-[9px] font-mono font-bold bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded">{isKhmer ? 'មាសខ្មែរ' : 'Gold Std'}</span>
            </div>
            <p className="text-base font-extrabold font-mono text-slate-900 mt-1.5">
              3.7500 <span className="text-xs font-bold text-slate-500 font-sans">g</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{isKhmer ? '១០ ហ៊ុន' : '10 Hun'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">{isKhmer ? '១ ដំឡឹង' : '1 Damlung'}</span>
              <span className="text-[9px] font-mono font-bold bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded">{isKhmer ? 'មាសដុំ' : 'Bullion'}</span>
            </div>
            <p className="text-base font-extrabold font-mono text-slate-900 mt-1.5">
              37.5000 <span className="text-xs font-bold text-slate-500 font-sans">g</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{isKhmer ? '១០ ជី' : '10 Chi'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">{isKhmer ? '១ ហ៊ុន' : '1 Hun'}</span>
              <span className="text-[9px] font-mono font-bold bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded">0.1 Chi</span>
            </div>
            <p className="text-base font-extrabold font-mono text-slate-900 mt-1.5">
              0.3750 <span className="text-xs font-bold text-slate-500 font-sans">g</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{isKhmer ? '០.១ ជី' : '0.1 Chi'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50/50 border border-sky-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-sky-900 tracking-wider">1 Troy Oz</span>
              <span className="text-[9px] font-mono font-bold bg-sky-200/80 text-sky-950 px-1.5 py-0.5 rounded">Global FX</span>
            </div>
            <p className="text-base font-extrabold font-mono text-slate-900 mt-1.5">
              31.1035 <span className="text-xs font-bold text-slate-500 font-sans">g</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{isKhmer ? '៨.២៩៤ ជី' : '8.294 Chi'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 shadow-2xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-emerald-900 tracking-wider">1 Carat (ct)</span>
              <span className="text-[9px] font-mono font-bold bg-emerald-200/80 text-emerald-950 px-1.5 py-0.5 rounded">{isKhmer ? 'ត្បូង' : 'Gemstone'}</span>
            </div>
            <p className="text-base font-extrabold font-mono text-slate-900 mt-1.5">
              0.2000 <span className="text-xs font-bold text-slate-500 font-sans">g</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{isKhmer ? '២០០ មីលីក្រាម' : '200 mg'}</p>
          </div>
        </div>

        {/* Units List Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 uppercase tracking-wider font-bold">
                <th className="py-3 px-3.5">{isKhmer ? 'ឈ្មោះខ្នាត' : 'Unit Name'}</th>
                <th className="py-3 px-3.5">{isKhmer ? 'កូដ / និមិត្តសញ្ញា' : 'Code / Symbol'}</th>
                <th className="py-3 px-3.5">{isKhmer ? 'ប្រភេទខ្នាត' : 'Unit Type'}</th>
                <th className="py-3 px-3.5">{isKhmer ? 'អត្រាបំប្លែងទៅជាក្រាម (g)' : 'Grams Conversion Factor (g)'}</th>
                <th className="py-3 px-3.5">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3 px-3.5 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium bg-white">
              {(units || []).length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    <FontAwesomeIcon icon={faScaleBalanced} className="w-8 h-8 mb-2 text-slate-300" />
                    <p className="font-semibold">{isKhmer ? 'មិនមានទិន្នន័យខ្នាតនៅឡើយទេ' : 'No measurement units found'}</p>
                  </td>
                </tr>
              ) : (
                (units || []).map(u => {
                  const isBase = u.code === 'g';
                  const factorNum = Number(u.conversion_factor) || 1.0;
                  return (
                    <tr key={u.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3.5 px-3.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 text-xs font-serif">{isKhmer ? (u.name_kh || u.name) : u.name}</p>
                            {isKhmer && u.name_kh && u.name && (
                              <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                {u.name}
                              </span>
                            )}
                          </div>
                          {u.description && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{u.description}</p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-xs border border-slate-200 shadow-2xs">
                            {u.code}
                          </span>
                          {isKhmer && u.symbol && u.symbol !== u.code && (
                            <span className="text-xs text-slate-500 font-serif">
                              ({u.symbol})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border shadow-2xs ${
                          u.type === 'weight'
                            ? 'bg-amber-50 text-amber-900 border-amber-200/90'
                            : u.type === 'count'
                            ? 'bg-sky-50 text-sky-900 border-sky-200/90'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200/90'
                        }`}>
                          {u.type === 'weight' ? (isKhmer ? 'ទម្ងន់' : 'Weight') : u.type === 'count' ? (isKhmer ? 'ចំនួនរាប់' : 'Count') : (u.type || 'Custom')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5">
                        {isBase ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100/80 text-emerald-950 text-[10px] font-bold border border-emerald-300/80 shadow-2xs">
                            <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-emerald-600" />
                            <span>{isKhmer ? 'ខ្នាតគោល (1.000000 g)' : 'Base Unit (1.000000 g)'}</span>
                          </span>
                        ) : (
                          <div className="font-mono text-xs text-slate-900">
                            <span className="font-bold text-amber-900">1 {u.code}</span> = <span className="font-bold text-slate-900">{factorNum.toFixed(6).replace(/\.?0+$/, '')}</span> <span className="text-slate-500 font-sans">g</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5">
                        {u.is_active !== false ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                            <FontAwesomeIcon icon={faCheckCircle} className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{isKhmer ? 'ដំណើរការ' : 'Active'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                            <span>{isKhmer ? 'បិទ' : 'Inactive'}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEditUnitModal(u)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs"
                          title={isKhmer ? 'កែប្រែ' : 'Edit'}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                        </button>
                        {!isBase && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(u)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs"
                            title={isKhmer ? 'លុប' : 'Delete'}
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Measurement Unit Modal ── */}
      <UnitModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSubmit={handleSaveUnit}
        unitForm={unitForm}
        setUnitForm={setUnitForm}
        unitErrors={unitErrors}
        setUnitErrors={setUnitErrors}
        editingUnitId={editingUnitId}
        savingUnit={savingUnit}
        isKhmer={isKhmer}
      />
    </div>
  );
};

export default GeneralUnitsSection;
