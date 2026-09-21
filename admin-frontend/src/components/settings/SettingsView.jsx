import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear, faGlobe, faCalculator, faTriangleExclamation, faCrown,
  faPlus, faPencil, faTrash, faCheck, faCheckCircle, faCircleExclamation,
  faBoxesStacked, faSliders, faFloppyDisk, faPalette, faPercent, faDollarSign
} from '@fortawesome/free-solid-svg-icons';

const TIER_COLORS = [
  { id: 'slate',  label: 'Slate',  badge: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500' },
  { id: 'amber',  label: 'Gold',   badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  { id: 'sky',    label: 'Silver', badge: 'bg-sky-100 text-sky-800 border-sky-300',       dot: 'bg-sky-500' },
  { id: 'violet', label: 'VIP',    badge: 'bg-violet-100 text-violet-800 border-violet-300', dot: 'bg-violet-500' },
  { id: 'rose',   label: 'Ruby',   badge: 'bg-rose-100 text-rose-800 border-rose-300',     dot: 'bg-rose-500' },
  { id: 'emerald', label: 'Jade',  badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
];

export const SettingsView = () => {
  const { t, i18n } = useTranslation();
  const {
    settings,
    saveSettings,
    tiers,
    addTier,
    editTier,
    removeTier,
    products,
    confirmDialog,
    showToast
  } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Local settings state for instant editing before save
  const [lang, setLang] = useState(i18n.language || 'km');
  const [calcTier, setCalcTier] = useState(settings?.calculator_tier || 'Gold');
  const [alertLowStock, setAlertLowStock] = useState(settings?.alert_low_stock !== 'false');
  const [lowStockThreshold, setLowStockThreshold] = useState(settings?.low_stock_threshold || 5);
  const [savingSettings, setSavingSettings] = useState(false);

  // Tier Modal State
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);
  const [tierForm, setTierForm] = useState({
    name: '',
    min_spending: 0,
    discount_rate: 0,
    badge_color: 'amber',
    description: '',
    is_active: true
  });
  const [tierErrors, setTierErrors] = useState({});
  const [savingTier, setSavingTier] = useState(false);

  // Filter low stock items for preview
  const lowStockItems = products.filter(p => Number(p.stock_qty) <= Number(lowStockThreshold));

  // Language Change Handler
  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    i18n.changeLanguage(newLang);
  };

  // Save General System Settings
  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveSettings({
        language: lang,
        calculator_tier: calcTier,
        alert_low_stock: alertLowStock ? 'true' : 'false',
        low_stock_threshold: String(lowStockThreshold)
      });
      showToast(
        isKhmer ? 'ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!' : 'Settings saved successfully!',
        'success'
      );
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Tier Modal Helper
  const openNewTierModal = () => {
    setEditingTierId(null);
    setTierForm({
      name: '',
      min_spending: 0,
      discount_rate: 0,
      badge_color: 'amber',
      description: '',
      is_active: true
    });
    setTierErrors({});
    setShowTierModal(true);
  };

  const openEditTierModal = (tier) => {
    setEditingTierId(tier.id);
    setTierForm({
      name: tier.name || '',
      min_spending: tier.min_spending ?? 0,
      discount_rate: tier.discount_rate ?? 0,
      badge_color: tier.badge_color || 'amber',
      description: tier.description || '',
      is_active: tier.is_active !== false
    });
    setTierErrors({});
    setShowTierModal(true);
  };

  // Save Tier Form
  const handleSaveTier = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!tierForm.name.trim()) {
      errs.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះកម្រិត (Tier Name)!' : 'Please enter tier name!';
    }
    if (tierForm.min_spending === '' || isNaN(Number(tierForm.min_spending))) {
      errs.min_spending = isKhmer ? 'សូមបញ្ចូលទំហំចំណាយអប្បបរមា!' : 'Minimum spending is required!';
    }
    if (tierForm.discount_rate === '' || isNaN(Number(tierForm.discount_rate))) {
      errs.discount_rate = isKhmer ? 'សូមបញ្ចូលភាគរយបញ្ចុះតម្លៃ!' : 'Discount rate is required!';
    }

    if (Object.keys(errs).length > 0) {
      setTierErrors(errs);
      showToast(
        isKhmer ? 'សូមបំពេញព័ត៌មានដែលខ្វះ!' : 'Please check required tier fields!',
        'warning'
      );
      return;
    }

    setSavingTier(true);
    const payload = {
      ...tierForm,
      min_spending: Number(tierForm.min_spending) || 0,
      discount_rate: Number(tierForm.discount_rate) || 0
    };

    try {
      if (editingTierId) {
        await editTier({ id: editingTierId, ...payload });
      } else {
        await addTier(payload);
      }
      setShowTierModal(false);
    } catch (err) {
      console.error('Failed to save tier:', err);
    } finally {
      setSavingTier(false);
    }
  };

  // Delete Tier
  const handleDeleteTier = async (tier) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបកម្រិត VIP Tier?' : 'Delete Tier?',
      text: isKhmer
        ? `តើអ្នកពិតជាចង់លុបកម្រិត "${tier.name}" នេះមែនទេ?`
        : `Are you sure you want to delete tier "${tier.name}"?`,
      confirmButtonText: isKhmer ? 'លុបចោល' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      icon: 'warning'
    });

    if (confirmed) {
      await removeTier(tier.id);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <FontAwesomeIcon icon={faGear} className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-serif">
              {isKhmer ? 'ការកំណត់ប្រព័ន្ធ & គ្រប់គ្រង VIP Tiers' : 'System Settings & Tier Management'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKhmer
                ? 'កំណត់ភាសា ប្រម៉ូសិនគណនា កម្រិតស្តុក និងគ្រប់គ្រងកម្រិត VIP សមាជិក'
                : 'Configure language, calculator default tier, inventory alerts & VIP tiers'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveGeneralSettings}
          disabled={savingSettings}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
          <span>{savingSettings ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកំណត់' : 'Save System Settings')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column: System Preferences ──────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Language Preference Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
              <FontAwesomeIcon icon={faGlobe} className="w-4 h-4 text-amber-500" />
              <span>{isKhmer ? 'កំណត់ភាសាប្រព័ន្ធ (System Language)' : 'Language Setting'}</span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="text-xs text-slate-500 font-medium block">
                {isKhmer ? 'ជ្រើសរើសភាសាប្រើប្រាស់ក្នុងកម្មវិធី:' : 'Select preferred application language:'}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('km')}
                  className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    lang.startsWith('km')
                      ? 'border-amber-500 bg-amber-50/60 text-amber-900 shadow-xs ring-2 ring-amber-400/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg leading-none">🇰🇭</span>
                  <span>ភាសាខ្មែរ (KM)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    lang.startsWith('en')
                      ? 'border-amber-500 bg-amber-50/60 text-amber-900 shadow-xs ring-2 ring-amber-400/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg leading-none">🇺🇸</span>
                  <span>English (EN)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calculator Tier Setting */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
              <FontAwesomeIcon icon={faCalculator} className="w-4 h-4 text-amber-500" />
              <span>{isKhmer ? 'កំណត់ VIP Tier សម្រាប់ Calculator' : 'Calculator Tier Setting'}</span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="text-xs text-slate-500 font-medium block">
                {isKhmer ? 'កម្រិត VIP Tier ដើមដែលត្រូវគណនាបញ្ចុះតម្លៃ:' : 'Default VIP Tier applied in POS Calculator:'}
              </label>

              <select
                value={calcTier}
                onChange={e => setCalcTier(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 cursor-pointer"
              >
                {(tiers || []).map(t => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.discount_rate}% Discount)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                {isKhmer
                  ? 'VIP Tier នេះនឹងត្រូវប្រើប្រាស់ជា Standard ពេលគណនាលើ POS'
                  : 'Selected tier will be pre-filled during quick price calculations.'}
              </p>
            </div>
          </div>

          {/* Low Stock Alert Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-rose-500" />
              <span>{isKhmer ? 'ការជូនដំណឹងស្តុកទាប (Low Stock Alert)' : 'Low Stock Alert Setting'}</span>
            </div>

            {/* Toggle Enable */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isKhmer ? 'បើកការជូនដំណឹងស្តុកទាប' : 'Enable Low Stock Alert'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isKhmer ? 'បង្ហាញ Banner ពេលទំនិញជិតអស់' : 'Display notifications when stock is low'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAlertLowStock(!alertLowStock)}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  alertLowStock ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Threshold Input */}
            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">
                {isKhmer ? 'កម្រិតបរិមាណស្តុកទាប (Threshold):' : 'Low Stock Threshold Quantity:'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs font-bold text-slate-400 shrink-0">
                  {isKhmer ? 'គ្រឿង' : 'items'}
                </span>
              </div>
            </div>

            {/* Live Preview List */}
            {alertLowStock && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>{isKhmer ? 'ទំនិញស្តុកទាបបច្ចុប្បន្ន:' : 'Currently Low Stock:'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px]">
                    {lowStockItems.length} {isKhmer ? 'មុខ' : 'items'}
                  </span>
                </div>

                {lowStockItems.length === 0 ? (
                  <p className="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center font-medium">
                    ✓ {isKhmer ? 'ទំនិញទាំងអស់មានស្តុកគ្រប់គ្រាន់' : 'All products have adequate stock'}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50/50 border border-rose-100">
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">{item.name}</span>
                        <span className="font-bold text-rose-600 bg-white px-2 py-0.5 rounded border border-rose-200">
                          {item.stock_qty} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Manage VIP Tiers (mange Tier) ─────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <FontAwesomeIcon icon={faCrown} className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {isKhmer ? 'គ្រប់គ្រង VIP Tiers (Manage Tiers)' : 'VIP Tier Management'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isKhmer ? 'កំណត់កម្រិត VIP បញ្ចុះតម្លៃ និងលក្ខខណ្ឌចំណាយសរុប' : 'Define discount privileges and total spending requirements'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openNewTierModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'បន្ថែម Tier ថ្មី' : 'Add New Tier'}</span>
              </button>
            </div>

            {/* Tiers List Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3.5 rounded-l-xl">{isKhmer ? 'ឈ្មោះកម្រិត (Tier)' : 'Tier Name'}</th>
                    <th className="py-3 px-3.5">{isKhmer ? 'ចំណាយអប្បបរមា ($)' : 'Min Spend ($)'}</th>
                    <th className="py-3 px-3.5">{isKhmer ? 'បញ្ចុះតម្លៃ (%)' : 'Discount Rate'}</th>
                    <th className="py-3 px-3.5">{isKhmer ? 'ពណ៌ Badge' : 'Theme Color'}</th>
                    <th className="py-3 px-3.5">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="py-3 px-3.5 text-right rounded-r-xl">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(tiers || []).map(t => {
                    const theme = TIER_COLORS.find(c => c.id === t.badge_color) || TIER_COLORS[1];
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                            <span>{t.name}</span>
                          </div>
                          {t.description && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{t.description}</p>
                          )}
                        </td>

                        <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                          ${Number(t.min_spending).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {t.discount_rate}% {isKhmer ? 'បញ្ចុះ' : 'OFF'}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${theme.badge}`}>
                            {theme.label}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          {t.is_active !== false ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                              {isKhmer ? 'ដំណើរការ' : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              {isKhmer ? 'បិទ' : 'Inactive'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => openEditTierModal(t)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 transition-all cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTier(t)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-all cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Tier Modal ───────────────────────────────────────── */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <FontAwesomeIcon icon={faCrown} className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingTierId
                    ? (isKhmer ? 'កែប្រែ VIP Tier' : 'Edit VIP Tier')
                    : (isKhmer ? 'បន្ថែម VIP Tier ថ្មី' : 'Create New VIP Tier')}
                </h3>
              </div>

              <button
                onClick={() => setShowTierModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="p-5 space-y-4">
              {/* Tier Name Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {isKhmer ? 'ឈ្មោះកម្រិត (Tier Name)' : 'Tier Name'}
                </label>
                <input
                  type="text"
                  value={tierForm.name}
                  onChange={e => {
                    setTierForm(f => ({ ...f, name: e.target.value }));
                    if (tierErrors.name) setTierErrors(prev => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Sapphire VIP"
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 focus:outline-none ${
                    tierErrors.name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-amber-500'
                  }`}
                />
                {tierErrors.name && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{tierErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Min Spending & Discount Rate Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    {isKhmer ? 'ចំណាយអប្បបរមា ($)' : 'Min Spend ($)'}
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
                    className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 focus:outline-none ${
                      tierErrors.min_spending ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-amber-500'
                    }`}
                  />
                  {tierErrors.min_spending && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{tierErrors.min_spending}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    {isKhmer ? 'បញ្ចុះតម្លៃ (%)' : 'Discount (%)'}
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
                    className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 focus:outline-none ${
                      tierErrors.discount_rate ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-amber-500'
                    }`}
                  />
                  {tierErrors.discount_rate && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{tierErrors.discount_rate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Color Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  {isKhmer ? 'ជ្រើសរើសពណ៌ Badge' : 'Badge Color Theme'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIER_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTierForm(f => ({ ...f, badge_color: c.id }))}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        tierForm.badge_color === c.id
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20 text-slate-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {isKhmer ? 'ពិពណ៌នា' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={tierForm.description}
                  onChange={e => setTierForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTierModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingTier}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingTier ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុក Tier' : 'Save Tier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
