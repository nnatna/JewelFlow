import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag, faPlus, faPencil, faTrash, faToggleOn, faToggleOff,
  faPercent, faDollarSign, faGem, faUsers, faCalendarDays,
  faCheckCircle, faXmarkCircle, faFilter, faMagnifyingGlass,
  faChevronDown, faCrown, faStar, faMedal, faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';

// ─── Constants ───────────────────────────────────────────────────────────────

const TIER_OPTIONS_FILTER = [
  { value: '', label: 'ទាំងអស់ / All Tiers' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Gold', label: 'Gold' },
  { value: 'Platinum', label: 'Platinum' },
  { value: 'Diamond VIP', label: 'Diamond VIP' },
];

const TIER_OPTIONS_FORM = [
  { value: '', labelKh: 'ទាំងអស់ (គ្មានលក្ខខណ្ឌ)', labelEn: 'All Tiers (No restriction)' },
  { value: 'Standard', labelKh: 'Standard', labelEn: 'Standard' },
  { value: 'Gold', labelKh: 'Gold', labelEn: 'Gold' },
  { value: 'Platinum', labelKh: 'Platinum', labelEn: 'Platinum' },
  { value: 'Diamond VIP', labelKh: 'Diamond VIP', labelEn: 'Diamond VIP' },
];

// Icon per tier — used in JSX badge rendering
const TIER_ICON = {
  'Diamond VIP': { icon: faCrown, color: 'text-violet-600' },
  'Platinum': { icon: faStar, color: 'text-sky-600' },
  'Gold': { icon: faMedal, color: 'text-amber-500' },
  'Standard': { icon: faUsers, color: 'text-slate-400' },
};

const TIER_BADGE = {
  'Diamond VIP': 'bg-violet-100 text-violet-800 border-violet-200',
  'Platinum': 'bg-sky-100 text-sky-800 border-sky-200',
  'Gold': 'bg-amber-100 text-amber-800 border-amber-200',
  'Standard': 'bg-slate-100 text-slate-600 border-slate-200',
};

const DEFAULT_FORM = {
  name: '',
  description: '',
  discount_type: 'percent',
  discount_value: '',
  tier_requirement: '',
  product_id: '',
  min_purchase: '',
  is_active: true,
  start_date: '',
  end_date: '',
};

// ─── Shared Input Components ─────────────────────────────────────────────────

const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
    {children}
  </label>
);

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all";
const inputErrCls = "w-full px-3 py-2 rounded-lg border border-rose-500 bg-rose-50/20 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500 transition-all shadow-xs";
const selectCls = "w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all appearance-none cursor-pointer";

// ─── Main Component ──────────────────────────────────────────────────────────

export const PromotionsView = () => {
  const { t, i18n } = useTranslation();
  const { promotions, products, tiers, addPromotion, editPromotion, removePromotion, confirmDialog, showToast } = useApp();
  const isKhmer = (i18n.language || '').startsWith('km');
  const tierOptions = (tiers || []).filter(tier => tier.is_active).map(tier => ({ value: tier.name, label: tier.name, labelEn: tier.name, labelKh: tier.name }));

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('');

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return (promotions || []).filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      const matchTier = !filterTier || p.tier_requirement === filterTier;
      return matchSearch && matchTier;
    });
  }, [promotions, search, filterTier]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openNew = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (promo) => {
    setForm({
      name: promo.name || '',
      description: promo.description || '',
      discount_type: promo.discount_type || 'percent',
      discount_value: promo.discount_value ?? '',
      tier_requirement: promo.tier_requirement || '',
      product_id: promo.product_id ?? '',
      min_purchase: promo.min_purchase ?? '',
      is_active: promo.is_active !== false,
      start_date: promo.start_date ? String(promo.start_date).slice(0, 10) : '',
      end_date: promo.end_date ? String(promo.end_date).slice(0, 10) : '',
    });
    setEditingId(promo.id);
    setErrors({});
    setShowModal(true);
  };

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  // ── Save with visual inline error alerts ──────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះប្រម៉ូសិន!' : 'Please enter a promotion name!';
    }
    if (form.discount_value === '' || isNaN(parseFloat(form.discount_value)) || parseFloat(form.discount_value) < 0) {
      newErrors.discount_value = isKhmer ? 'សូមបញ្ចូលចំនួនបញ្ចុះតម្លៃ!' : 'Please enter a valid discount value!';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(
        isKhmer ? 'សូមពិនិត្យមើលប្រអប់បញ្ចូលដែលខ្វះព័ត៌មាន!' : 'Please fill in required fields!',
        'warning'
      );
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      discount_value: parseFloat(form.discount_value) || 0,
      min_purchase: parseFloat(form.min_purchase) || 0,
      tier_requirement: form.tier_requirement || null,
      product_id: form.product_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    try {
      if (editingId) {
        await editPromotion({ id: editingId, ...payload });
      } else {
        await addPromotion(payload);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (promo) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបប្រម៉ូសិន?' : 'Delete Promotion?',
      text: isKhmer
        ? `តើអ្នកប្រាកដថាចង់លុប "${promo.name}" មែនទេ?`
        : `Are you sure you want to delete "${promo.name}"?`,
      confirmButtonText: isKhmer ? 'លុបចោល' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      icon: 'warning',
    });
    if (confirmed) await removePromotion(promo.id);
  };

  const handleToggleActive = async (promo) => {
    await editPromotion({ ...promo, is_active: !promo.is_active });
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: promotions.length,
    active: promotions.filter(p => p.is_active).length,
    inactive: promotions.filter(p => !p.is_active).length,
    tiers: [...new Set(promotions.map(p => p.tier_requirement).filter(Boolean))].length,
  }), [promotions]);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <FontAwesomeIcon icon={faTag} className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {isKhmer ? 'ការគ្រប់គ្រងប្រម៉ូសិន' : 'Promotions & Discounts'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKhmer
                ? 'គ្រប់គ្រងការបញ្ចុះតម្លៃតាម VIP Tier និងផលិតផល'
                : 'Tier-based & product-specific discount rules'}
            </p>
          </div>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          {isKhmer ? 'បន្ថែមប្រម៉ូសិន' : 'New Promotion'}
        </button>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: isKhmer ? 'សរុបទាំងអស់' : 'Total', value: stats.total, valueColor: 'text-slate-800', accent: 'border-l-slate-400' },
          { label: isKhmer ? 'កំពុងដំណើរការ' : 'Active', value: stats.active, valueColor: 'text-emerald-600', accent: 'border-l-emerald-400' },
          { label: isKhmer ? 'បញ្ឈប់ (OFF)' : 'Inactive', value: stats.inactive, valueColor: 'text-slate-400', accent: 'border-l-slate-300' },
          { label: isKhmer ? 'VIP Tier ផ្សេងៗ' : 'Tier Types', value: stats.tiers, valueColor: 'text-violet-600', accent: 'border-l-violet-400' },
        ].map(s => (
          <div key={s.label} className={`bg-white border border-slate-200 border-l-4 ${s.accent} rounded-xl px-4 py-3 shadow-xs`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`text-2xl font-extrabold font-mono mt-1 ${s.valueColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isKhmer ? 'ស្វែងរកឈ្មោះ ឬ ពិពណ៌នា...' : 'Search by name or description…'}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Tier filter */}
        <div className="relative">
          <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3 pointer-events-none" />
          <select
            value={filterTier}
            onChange={e => setFilterTier(e.target.value)}
            className="pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 appearance-none cursor-pointer transition-all"
          >
            {[TIER_OPTIONS_FILTER[0], ...tierOptions].map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
        </div>

        <span className="text-xs text-slate-400 ml-auto font-medium">
          {filtered.length} {isKhmer ? 'ប្រម៉ូសិន' : 'result(s)'}
        </span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <FontAwesomeIcon icon={faTag} className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm font-medium">
              {isKhmer ? 'មិនមានប្រម៉ូសិនទេ' : 'No promotions found'}
            </p>
            <button
              onClick={openNew}
              className="text-xs text-rose-500 hover:underline cursor-pointer font-medium"
            >
              {isKhmer ? '+ បន្ថែមប្រម៉ូសិនថ្មី' : '+ Add your first promotion'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  {[
                    { label: isKhmer ? 'ឈ្មោះ / ពិពណ៌នា' : 'Name / Description', w: 'w-52' },
                    { label: isKhmer ? 'ការបញ្ចុះ' : 'Discount', w: 'w-28' },
                    { label: isKhmer ? 'VIP Tier' : 'VIP Tier', w: 'w-32' },
                    { label: isKhmer ? 'ផលិតផល' : 'Product', w: 'w-36' },
                    { label: isKhmer ? 'ទំហំអប្បបរមា' : 'Min. Total', w: 'w-24' },
                    { label: isKhmer ? 'ថ្ងៃផ្សាយ' : 'Date Range', w: 'w-32' },
                    { label: isKhmer ? 'ស្ថានភាព' : 'Status', w: 'w-24' },
                    { label: '', w: 'w-20' },
                  ].map((h, i) => (
                    <th key={i} className={`${h.w} px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(promo => {
                  const tierBadge = TIER_BADGE[promo.tier_requirement] || TIER_BADGE['Standard'];
                  const tierIconData = TIER_ICON[promo.tier_requirement] || TIER_ICON['Standard'];
                  const prod = products.find(p => String(p.id) === String(promo.product_id));

                  return (
                    <tr key={promo.id} className="group hover:bg-amber-50/50 transition-colors duration-100">

                      {/* Name */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 truncate max-w-[200px]">{promo.name}</p>
                        {promo.description && (
                          <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{promo.description}</p>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                          <FontAwesomeIcon
                            icon={promo.discount_type === 'percent' ? faPercent : faDollarSign}
                            className="w-2.5 h-2.5"
                          />
                          {parseFloat(promo.discount_value)}{promo.discount_type === 'percent' ? '%' : ' $'}
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3">
                        {promo.tier_requirement ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${tierBadge}`}>
                            <FontAwesomeIcon
                              icon={tierIconData.icon}
                              className={`w-2.5 h-2.5 ${tierIconData.color}`}
                            />
                            {promo.tier_requirement}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {isKhmer ? 'គ្មានលក្ខខណ្ឌ' : 'Any tier'}
                          </span>
                        )}
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        {prod ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                            <FontAwesomeIcon icon={faGem} className="w-2.5 h-2.5 text-amber-500" />
                            <span className="truncate max-w-[100px]">{prod.name}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {isKhmer ? 'គ្រប់ផលិតផល' : 'All products'}
                          </span>
                        )}
                      </td>

                      {/* Min Purchase */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {parseFloat(promo.min_purchase) > 0
                          ? `$${parseFloat(promo.min_purchase).toLocaleString()}`
                          : <span className="text-slate-300 italic">{isKhmer ? 'គ្មាន' : '—'}</span>}
                      </td>

                      {/* Date Range */}
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {promo.start_date || promo.end_date ? (
                          <div className="flex flex-col gap-0.5">
                            {promo.start_date && <span className="text-slate-600">▶ {String(promo.start_date).slice(0, 10)}</span>}
                            {promo.end_date && <span className="text-rose-500">■ {String(promo.end_date).slice(0, 10)}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">{isKhmer ? 'គ្មានកំណត់' : 'No limit'}</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(promo)}
                          title={promo.is_active
                            ? (isKhmer ? 'ចុចដើម្បីបញ្ឈប់' : 'Click to deactivate')
                            : (isKhmer ? 'ចុចដើម្បីដំណើរការ' : 'Click to activate')}
                          className="cursor-pointer"
                        >
                          {promo.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100 transition-colors">
                              <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                              {isKhmer ? 'សកម្ម' : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold hover:bg-slate-200 transition-colors">
                              <FontAwesomeIcon icon={faXmarkCircle} className="w-3 h-3" />
                              {isKhmer ? 'OFF' : 'OFF'}
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => openEdit(promo)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title={isKhmer ? 'កែសម្រួល' : 'Edit'}
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={isKhmer ? 'លុប' : 'Delete'}
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Dialog Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto z-10 border border-slate-200/80">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow shadow-amber-500/30">
                  <FontAwesomeIcon icon={faTag} className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    {editingId
                      ? (isKhmer ? 'កែប្រម៉ូសិន' : 'Edit Promotion')
                      : (isKhmer ? 'ប្រម៉ូសិនថ្មី' : 'New Promotion')}
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    {isKhmer ? 'បំពេញព័ត៌មានខាងក្រោម' : 'Fill in the details below'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} className="p-5 space-y-4">

              {/* Row: Name (full width) */}
              <div>
                <FieldLabel>{isKhmer ? 'ឈ្មោះប្រម៉ូសិន' : 'Promotion Name'}</FieldLabel>
                <input
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder={isKhmer ? 'ឧ. ការបញ្ចុះតម្លៃ Diamond VIP' : 'e.g. Diamond VIP Summer Discount'}
                  className={errors.name ? inputErrCls : inputCls}
                />
                {errors.name && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Row: Description (full width) */}
              <div>
                <FieldLabel>{isKhmer ? 'ពិពណ៌នា (ស្រេចចិត្ត)' : 'Description (optional)'}</FieldLabel>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder={isKhmer ? 'ព័ត៌មានបន្ថែម...' : 'Additional details…'}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Row: Discount Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>{isKhmer ? 'ប្រភេទបញ្ចុះ' : 'Discount Type'}</FieldLabel>
                  <div className="relative">
                    <select
                      value={form.discount_type}
                      onChange={e => setField('discount_type', e.target.value)}
                      className={selectCls}
                    >
                      <option value="percent">{isKhmer ? 'ភាគរយ (%)' : 'Percentage (%)'}</option>
                      <option value="fixed">{isKhmer ? 'ចំនួនថេរ ($)' : 'Fixed Amount ($)'}</option>
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <FieldLabel>
                    {isKhmer ? 'ចំនួន' : 'Amount'}&nbsp;
                    <span className="text-rose-400 normal-case font-bold tracking-normal">
                      {form.discount_type === 'percent' ? '(%)' : '($)'}
                    </span>
                  </FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                      {form.discount_type === 'percent' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discount_value}
                      onChange={e => setField('discount_value', e.target.value)}
                      placeholder="0"
                      className={`${errors.discount_value ? inputErrCls : inputCls} pl-7`}
                    />
                  </div>
                  {errors.discount_value && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{errors.discount_value}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row: VIP Tier + Product */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>
                    <FontAwesomeIcon icon={faUsers} className="w-2.5 h-2.5 mr-1" />
                    {isKhmer ? 'VIP Tier ដែលទទួល' : 'VIP Tier Requirement'}
                  </FieldLabel>
                  <div className="relative">
                    <select
                      value={form.tier_requirement}
                      onChange={e => setField('tier_requirement', e.target.value)}
                      className={selectCls}
                    >
                      {[TIER_OPTIONS_FORM[0], ...tierOptions].map(o => (
                        <option key={o.value} value={o.value}>
                          {isKhmer ? o.labelKh : o.labelEn}
                        </option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <FieldLabel>
                    <FontAwesomeIcon icon={faGem} className="w-2.5 h-2.5 mr-1" />
                    {isKhmer ? 'ផលិតផល' : 'Specific Product'}
                  </FieldLabel>
                  <div className="relative">
                    <select
                      value={form.product_id}
                      onChange={e => setField('product_id', e.target.value)}
                      className={selectCls}
                    >
                      <option value="">{isKhmer ? 'គ្រប់ផលិតផល' : 'All Products'}</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row: Min Purchase (full width) */}
              <div>
                <FieldLabel>
                  {isKhmer ? 'ទំហំទិញអប្បបរមា' : 'Minimum Cart Total'}&nbsp;
                  <span className="normal-case text-slate-400 font-normal tracking-normal">(USD)</span>
                </FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_purchase}
                    onChange={e => setField('min_purchase', e.target.value)}
                    placeholder={isKhmer ? '0 (គ្មានអប្បបរមា)' : '0 (no minimum)'}
                    className={`${inputCls} pl-7`}
                  />
                </div>
              </div>

              {/* Row: Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>
                    <FontAwesomeIcon icon={faCalendarDays} className="w-2.5 h-2.5 mr-1" />
                    {isKhmer ? 'ថ្ងៃចាប់ផ្ដើម' : 'Start Date'}
                  </FieldLabel>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setField('start_date', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel>
                    <FontAwesomeIcon icon={faCalendarDays} className="w-2.5 h-2.5 mr-1" />
                    {isKhmer ? 'ថ្ងៃបញ្ចប់' : 'End Date'}
                  </FieldLabel>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setField('end_date', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Active Toggle Row */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700 leading-tight">
                    {isKhmer ? 'ដំណើរការប្រម៉ូសិននេះ' : 'Activate this promotion'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isKhmer
                      ? 'ប្រម៉ូសិនសកម្មនឹងអនុវត្តដោយស្វ័យប្រវត្តិ'
                      : 'Will auto-apply at POS checkout'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setField('is_active', !form.is_active)}
                  className="cursor-pointer transition-transform hover:scale-110 active:scale-95 ml-4 shrink-0"
                >
                  <FontAwesomeIcon
                    icon={form.is_active ? faToggleOn : faToggleOff}
                    className={`w-9 h-9 transition-colors duration-200 ${form.is_active ? 'text-emerald-500' : 'text-slate-300'}`}
                  />
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold shadow-md shadow-amber-500/20 hover:brightness-110 hover:shadow-amber-500/35 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {saving
                    ? (isKhmer ? 'កំពុងរក្សា...' : 'Saving…')
                    : editingId
                      ? (isKhmer ? 'រក្សាទុកការប្រែប្រួល' : 'Save Changes')
                      : (isKhmer ? 'បង្កើតប្រម៉ូសិន' : 'Create Promotion')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PromotionsView;
