import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag, faPlus, faPenToSquare, faTrashCan, faToggleOn, faToggleOff,
  faPercent, faDollarSign, faGem, faUsers, faCalendarDays,
  faCheckCircle, faXmarkCircle, faFilter, faMagnifyingGlass,
  faChevronDown, faCrown, faStar, faMedal, faCircleExclamation,
  faXmark
} from '@fortawesome/free-solid-svg-icons';

// ─── Constants ───────────────────────────────────────────────────────────────

const TIER_OPTIONS_FILTER = [
  { value: '', labelKh: 'កម្រិតទាំងអស់', labelEn: 'All Tiers' },
  { value: 'Standard', labelKh: 'Standard', labelEn: 'Standard' },
  { value: 'Gold', labelKh: 'Gold', labelEn: 'Gold' },
  { value: 'Platinum', labelKh: 'Platinum', labelEn: 'Platinum' },
  { value: 'Diamond VIP', labelKh: 'Diamond VIP', labelEn: 'Diamond VIP' },
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
  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
    {children}
  </label>
);

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-200/50 focus:border-amber-500 focus:bg-white transition-all";
const inputErrCls = "w-full px-3.5 py-2.5 rounded-xl border border-rose-500 bg-rose-50/20 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200/50 focus:border-rose-500 transition-all";
const selectCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-200/50 focus:border-amber-500 focus:bg-white transition-all appearance-none cursor-pointer";

// ─── Main Component ──────────────────────────────────────────────────────────

export const PromotionsView = () => {
  const { t, i18n } = useTranslation();
  const { promotions, products, tiers, addPromotion, editPromotion, removePromotion, confirmDialog, showToast, searchQuery } = useApp();
  const isKhmer = (i18n.language || '').startsWith('km');
  const tierOptions = (tiers || []).filter(tier => tier.is_active).map(tier => ({ value: tier.name, label: tier.name, labelEn: tier.name, labelKh: tier.name }));

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [filterTier, setFilterTier] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return (promotions || []).filter(p => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      const matchTier = !filterTier || p.tier_requirement === filterTier;
      return matchSearch && matchTier;
    });
  }, [promotions, searchQuery, filterTier]);

  // ── Paginated slice ────────────────────────────────────────────────────────
  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

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
      isDanger: true,
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
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
          <span>{filtered.length} {isKhmer ? 'ប្រម៉ូសិន' : 'promotions listed'}</span>
        </div>

        {/* Tier filter */}
        <div className="relative">
          <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3 pointer-events-none" />
          <select
            value={filterTier}
            onChange={e => {
              setFilterTier(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 appearance-none cursor-pointer transition-all font-medium"
          >
            <option value="">{isKhmer ? 'កម្រិតទាំងអស់' : 'All Tiers'}</option>
            {tierOptions.map(o => (
              <option key={o.value} value={o.value}>
                {isKhmer ? (o.labelKh || o.label) : (o.labelEn || o.label)}
              </option>
            ))}
          </select>
          <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
        </div>

        <span className="text-xs text-slate-400 ml-auto font-medium">
          {filtered.length} {isKhmer ? 'ប្រម៉ូសិន' : 'result(s)'}
        </span>
      </div>

      {/* ── Table (Following Jewelry Table Aesthetic & Icons) ────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden w-full">
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
              className="text-xs text-amber-600 hover:text-amber-700 hover:underline cursor-pointer font-semibold"
            >
              {isKhmer ? '+ បន្ថែមប្រម៉ូសិនដំបូងរបស់អ្នក' : '+ Add your first promotion'}
            </button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[240px]">{isKhmer ? 'កម្មវិធីប្រម៉ូសិន' : 'Promotion Campaign'}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'ការបញ្ចុះតម្លៃ' : 'Discount Rate'}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'VIP Tier' : 'VIP Tier'}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'ផលិតផលជាក់លាក់' : 'Target Product'}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ទំហំទិញអប្បបរមា' : 'Min Cart Total'}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Validity Range'}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center w-28 min-w-[110px] sticky right-0 bg-slate-50 shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                    {isKhmer ? 'សកម្មភាព' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPromotions.map(promo => {
                  const tierBadge = TIER_BADGE[promo.tier_requirement] || TIER_BADGE['Standard'];
                  const tierIconData = TIER_ICON[promo.tier_requirement] || TIER_ICON['Standard'];
                  const prod = products.find(p => String(p.id) === String(promo.product_id));

                  return (
                    <tr key={promo.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* Campaign Piece */}
                      <td className="py-3.5 px-4 flex items-center gap-3 min-w-[240px]">
                        {prod?.image ? (
                          <img
                            src={prod.image}
                            alt={promo.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
                            <FontAwesomeIcon icon={faTag} className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{promo.name}</span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {promo.description || (isKhmer ? 'ប្រម៉ូសិនពិសេស' : 'Special promotion rule')}
                          </span>
                        </div>
                      </td>

                      {/* Discount Rate */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs">
                          <FontAwesomeIcon
                            icon={promo.discount_type === 'percent' ? faPercent : faDollarSign}
                            className="w-2.5 h-2.5 text-amber-600"
                          />
                          <span>{parseFloat(promo.discount_value)}{promo.discount_type === 'percent' ? '%' : ' USD'}</span>
                        </span>
                      </td>

                      {/* VIP Tier */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {promo.tier_requirement ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5 ${tierBadge}`}>
                            <FontAwesomeIcon
                              icon={tierIconData.icon}
                              className={`w-3 h-3 ${tierIconData.color}`}
                            />
                            <span>{promo.tier_requirement}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faUsers} className="w-2.5 h-2.5 text-slate-400" />
                            <span>{isKhmer ? 'កម្រិតទាំងអស់' : 'All Tiers'}</span>
                          </span>
                        )}
                      </td>

                      {/* Target Product */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {prod ? (
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faGem} className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate max-w-[140px] font-medium text-slate-800">{prod.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            {isKhmer ? 'គ្រប់ផលិតផល' : 'All Products'}
                          </span>
                        )}
                      </td>

                      {/* Min Purchase */}
                      <td className="py-3.5 px-3 text-center font-mono whitespace-nowrap">
                        {parseFloat(promo.min_purchase) > 0 ? (
                          <span className="font-bold text-slate-800 block">
                            ${parseFloat(promo.min_purchase).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">
                            {isKhmer ? 'គ្មាន' : '—'}
                          </span>
                        )}
                      </td>

                      {/* Validity Range */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {promo.start_date || promo.end_date ? (
                          <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                            {promo.start_date && (
                              <span className="text-slate-600 flex items-center gap-1">
                                <FontAwesomeIcon icon={faCalendarDays} className="w-2.5 h-2.5 text-slate-400" />
                                <span>{String(promo.start_date).slice(0, 10)}</span>
                              </span>
                            )}
                            {promo.end_date && (
                              <span className="text-amber-700 flex items-center gap-1">
                                <FontAwesomeIcon icon={faCalendarDays} className="w-2.5 h-2.5 text-amber-500" />
                                <span>{String(promo.end_date).slice(0, 10)}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">{isKhmer ? 'គ្មានកំណត់' : 'Ongoing'}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(promo)}
                          className="cursor-pointer group/btn"
                          title={promo.is_active
                            ? (isKhmer ? 'ចុចដើម្បីបញ្ឈប់' : 'Click to deactivate')
                            : (isKhmer ? 'ចុចដើម្បីដំណើរការ' : 'Click to activate')}
                        >
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 transition-all ${
                            promo.is_active
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 group-hover/btn:bg-emerald-200/80'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover/btn:bg-slate-200/80'
                          }`}>
                            <FontAwesomeIcon icon={promo.is_active ? faCheckCircle : faXmarkCircle} className="w-3 h-3" />
                            <span>{promo.is_active ? (isKhmer ? 'សកម្ម' : 'Active') : (isKhmer ? 'OFF' : 'OFF')}</span>
                          </span>
                        </button>
                      </td>

                      {/* Actions (Exact Jewelry table action buttons styling) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap w-28 min-w-[110px] sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(promo)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer transition-colors"
                            title={isKhmer ? 'កែសម្រួល' : 'Edit'}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 cursor-pointer transition-colors"
                            title={isKhmer ? 'លុប' : 'Delete'}
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
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

        {/* Table Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          {/* Dialog Panel */}
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto">

            {/* Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={faTag} className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {editingId
                      ? (isKhmer ? 'កែប្រែប្រម៉ូសិន' : 'Edit Promotion')
                      : (isKhmer ? 'បង្កើតប្រម៉ូសិនថ្មី' : 'Create New Promotion')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'កំណត់លក្ខខណ្ឌ និងភាគរយបញ្ចុះតម្លៃ' : 'Define discount rules and target criteria'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Form Body */}
            <form noValidate onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Row: Name (full width) */}
              <div>
                <FieldLabel>{isKhmer ? 'ឈ្មោះប្រម៉ូសិន *' : 'Promotion Name *'}</FieldLabel>
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
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <FieldLabel>
                    {isKhmer ? 'ចំនួន *' : 'Amount *'}&nbsp;
                    <span className="text-amber-600 normal-case font-bold tracking-normal">
                      {form.discount_type === 'percent' ? '(%)' : '($)'}
                    </span>
                  </FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                      {form.discount_type === 'percent' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step={form.discount_type === 'percent' ? '0.1' : '0.01'}
                      value={form.discount_value}
                      onChange={e => setField('discount_value', e.target.value)}
                      placeholder={form.discount_type === 'percent' ? 'e.g. 10' : 'e.g. 50'}
                      className={`${errors.discount_value ? inputErrCls : inputCls} pl-8`}
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
                    <FontAwesomeIcon icon={faUsers} className="w-2.5 h-2.5 mr-1 text-amber-500" />
                    {isKhmer ? 'VIP Tier ដែលទទួល' : 'VIP Tier Requirement'}
                  </FieldLabel>
                  <div className="relative">
                    <select
                      value={form.tier_requirement}
                      onChange={e => setField('tier_requirement', e.target.value)}
                      className={selectCls}
                    >
                      <option value="">{isKhmer ? 'ទាំងអស់ (គ្មានលក្ខខណ្ឌ)' : 'All Tiers (No restriction)'}</option>
                      {tierOptions.map(o => (
                        <option key={o.value} value={o.value}>
                          {isKhmer ? (o.labelKh || o.label) : (o.labelEn || o.label)}
                        </option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <FieldLabel>
                    <FontAwesomeIcon icon={faGem} className="w-2.5 h-2.5 mr-1 text-amber-500" />
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
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
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
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_purchase}
                    onChange={e => setField('min_purchase', e.target.value)}
                    placeholder={isKhmer ? '0 (គ្មានអប្បបរមា)' : '0 (no minimum)'}
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </div>

              {/* Row: Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>
                    <FontAwesomeIcon icon={faCalendarDays} className="w-2.5 h-2.5 mr-1 text-amber-500" />
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
                    <FontAwesomeIcon icon={faCalendarDays} className="w-2.5 h-2.5 mr-1 text-amber-500" />
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
                  <p className="text-xs font-bold text-slate-800 leading-tight">
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
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95 ml-4 shrink-0"
                >
                  <FontAwesomeIcon
                    icon={form.is_active ? faToggleOn : faToggleOff}
                    className={`w-9 h-9 transition-colors duration-200 ${form.is_active ? 'text-amber-500' : 'text-slate-300'}`}
                  />
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving
                    ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving…')
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
