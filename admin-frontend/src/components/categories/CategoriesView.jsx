import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faPlus,
  faPenToSquare,
  faTrashCan,
  faMagnifyingGlass,
  faRotateRight,
  faGem,
  faCircleExclamation,
  faXmark,
  faFilter,
  faCircleCheck,
  faRing,
  faCrown,
  faCircleDot,
  faShieldHalved,
  faCoins,
  faScaleBalanced
} from '@fortawesome/free-solid-svg-icons';

// High-resolution authentic jewelry icons & color styling per category
const CATEGORY_THEMES = [
  {
    key: 'ring',
    labelEn: 'Rings & Bands',
    labelKh: 'ចិញ្ចៀន & កង',
    icon: faRing,
    gradient: 'from-amber-500 to-yellow-400',
    match: ['ring', 'ចិញ្ចៀន', 'solitaire', 'band']
  },
  {
    key: 'necklace',
    labelEn: 'Necklaces & Chains',
    labelKh: 'ខ្សែក & ឆ្នូតរាជវង្ស',
    icon: faCrown,
    gradient: 'from-rose-500 to-amber-400',
    match: ['neck', 'chain', 'ខ្សែក', 'choker']
  },
  {
    key: 'bracelet',
    labelEn: 'Bracelets & Bangles',
    labelKh: 'ខ្សែដៃ & កងដៃ',
    icon: faCircleDot,
    gradient: 'from-emerald-500 to-teal-400',
    match: ['brace', 'bangle', 'ខ្សែដៃ', 'កងដៃ', 'cuff']
  },
  {
    key: 'earring',
    labelEn: 'Earrings & Studs',
    labelKh: 'ក្រវិលពេជ្រ & មាស',
    icon: faGem,
    gradient: 'from-sky-500 to-indigo-400',
    match: ['ear', 'ក្រវិល', 'stud', 'hoop']
  },
  {
    key: 'pendant',
    labelEn: 'Pendants & Medallions',
    labelKh: 'បន្តោង & មេដាយ',
    icon: faShieldHalved,
    gradient: 'from-violet-500 to-purple-400',
    match: ['pend', 'charm', 'បន្តោង', 'medallion']
  },
  {
    key: 'bullion',
    labelEn: 'Fine Bullion & Bars',
    labelKh: 'មាសដុំ & មាសសុទ្ធ',
    icon: faCoins,
    gradient: 'from-amber-600 to-yellow-500',
    match: ['bull', 'bar', 'coin', 'ដុំ', 'mint', 'valcambi']
  },
  {
    key: 'bridal',
    labelEn: 'Bespoke Bridal Sets',
    labelKh: 'ឈុតគ្រឿងការ',
    icon: faGem,
    gradient: 'from-pink-500 to-amber-400',
    match: ['bridal', 'wedding', 'set', 'ឈុត', 'suite']
  },
  {
    key: 'gems',
    labelEn: 'Certified Gemstones',
    labelKh: 'ត្បូងធម្មជាតិ',
    icon: faGem,
    gradient: 'from-cyan-500 to-blue-500',
    match: ['gem', 'diamond', 'sapphire', 'ruby', 'emerald', 'ត្បូង']
  },
  {
    key: 'general',
    labelEn: 'Atelier Collection',
    labelKh: 'គ្រឿងអលង្ការទូទៅ',
    icon: faLayerGroup,
    gradient: 'from-amber-500 via-amber-400 to-yellow-300',
    match: []
  }
];

const resolveCategoryTheme = (name = '', slug = '') => {
  const text = `${name} ${slug}`.toLowerCase();
  for (const theme of CATEGORY_THEMES) {
    if (theme.match.some(m => text.includes(m))) {
      return theme;
    }
  }
  return CATEGORY_THEMES[CATEGORY_THEMES.length - 1];
};

export const CategoriesView = () => {
  const { t, i18n } = useTranslation();
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
    confirmDialog,
    showToast
  } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterType, setSelectedFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilterType, sortBy]);

  // Filtered & Sorted Categories
  const filteredCategories = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    let list = (categories || []).filter(cat => {
      const matchesSearch = !q || (
        (cat.name || '').toLowerCase().includes(q) ||
        (cat.slug || '').toLowerCase().includes(q) ||
        (cat.description || '').toLowerCase().includes(q)
      );

      const theme = resolveCategoryTheme(cat.name, cat.slug);
      const matchesType = selectedFilterType === 'all' || theme.key === selectedFilterType;

      return matchesSearch && matchesType;
    });

    list.sort((a, b) => {
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'products_desc') {
        const aCount = a.products_count ?? products.filter(p => p.category_id === a.id).length;
        const bCount = b.products_count ?? products.filter(p => p.category_id === b.id).length;
        return bCount - aCount;
      }
      if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
      return 0;
    });

    return list;
  }, [categories, products, searchTerm, selectedFilterType, sortBy]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = categories.length;
    const linkedProducts = products.filter(p => p.category_id).length;
    const totalValuation = products.reduce((acc, p) => {
      const pQty = Number(p.stock_qty) || 0;
      const price = Number(p.calculatedPrice || p.price || 0);
      return acc + (pQty * price);
    }, 0);
    const totalGoldGrams = products.reduce((acc, p) => acc + (Number(p.net_weight || 0) * Number(p.stock_qty || 0)), 0);
    const totalChi = (totalGoldGrams / 3.75).toFixed(1);

    return {
      totalCount,
      linkedProducts,
      totalValuation,
      totalChi,
      totalGoldGrams: totalGoldGrams.toFixed(1)
    };
  }, [categories, products]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះប្រភេទគ្រឿងអលង្ការ' : 'Category name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug?.trim() || formData.name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: formData.description?.trim() || null
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        showToast(isKhmer ? 'បានកែប្រែប្រភេទដោយជោគជ័យ' : 'Category updated successfully', 'success');
      } else {
        await addCategory(payload);
        showToast(isKhmer ? 'បានបង្កើតប្រភេទថ្មីដោយជោគជ័យ' : 'Category created successfully', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save category error:', err);
      const serverMsg = err.response?.data?.message || err.message;
      if (serverMsg?.toLowerCase().includes('name')) {
        setFormErrors({ name: isKhmer ? 'ឈ្មោះប្រភេទនេះមានរួចហើយ' : 'Category name is already taken' });
      } else {
        showToast(serverMsg || 'Failed to save category', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (category) => {
    const assignedCount = category.products_count ?? products.filter(p => p.category_id === category.id).length;

    const confirmed = await confirmDialog({
      title: isKhmer ? 'តើអ្នកពិតជាចង់លុបប្រភេទនេះមែនទេ?' : 'Delete Category Collection?',
      html: `
        <div class="text-center">
          <p class="text-sm text-slate-600 mb-3">
            ${isKhmer ? 'តើអ្នកចង់លុបប្រភេទនេះចេញពីប្រព័ន្ធមែនទេ?' : 'Are you sure you want to remove this category from the atelier taxonomy?'}
          </p>
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block text-left text-xs text-slate-800">
            <span class="font-bold text-slate-900 block font-serif">${category.name}</span>
            <span class="font-mono text-slate-500">Slug: ${category.slug || 'N/A'} • ${assignedCount} linked SKUs</span>
          </div>
          ${assignedCount > 0 ? `
            <p class="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-3 border border-amber-200 font-medium">
              ${isKhmer ? `ចំណាំ៖ មាន ${assignedCount} មុខទំនិញត្រូវបានចាត់ថ្នាក់ក្រោមប្រភេទនេះ!` : `Note: ${assignedCount} jewelry item(s) are categorized under this collection.`}
            </p>
          ` : ''}
          <p class="text-xs text-rose-500 mt-3 font-medium">
            ${isKhmer ? 'សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ!' : 'This action cannot be undone.'}
          </p>
        </div>
      `,
      confirmButtonText: isKhmer ? 'យល់ព្រមលុប' : 'Yes, Delete It',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      try {
        await deleteCategory(category.id);
        showToast(isKhmer ? 'បានលុបប្រភេទដោយជោគជ័យ' : 'Category deleted successfully', 'success');
      } catch (err) {
        console.error('Delete category error:', err);
        showToast(err.response?.data?.message || 'Failed to delete category', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* ── Top Header Controls (Following Jewel Catalog Table Standard) ────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2.5">
            <FontAwesomeIcon icon={faLayerGroup} className="w-6 h-6 text-amber-600" />
            <span>{isKhmer ? 'តារាងគ្រប់គ្រងប្រភេទគ្រឿងអលង្ការ & ការប្រមូលផ្តុំ' : 'Jewelry Categories & Collections Table'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKhmer
              ? 'រៀបចំចំណាត់ថ្នាក់គ្រឿងអលង្ការ ការប្រមូលផ្តុំ និងស្លាកបង្ហាញក្នុងប្រព័ន្ធ POS'
              : 'Full taxonomy ledger for fine jewelry collections, bullion, gemstones and atelier showcase'} ({categories.length} {isKhmer ? 'ប្រភេទបានចុះបញ្ជី' : 'registered collections'}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={refreshCategories}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
            title={isKhmer ? 'ទាញទិន្នន័យឡើងវិញ' : 'Refresh'}
          >
            <FontAwesomeIcon icon={faRotateRight} className="w-3.5 h-3.5" />
          </button>

          {/* Add Category Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold text-xs py-2.5 px-4.5 rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បន្ថែមប្រភេទថ្មី' : 'Add Category'}</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Overview Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isKhmer ? 'ប្រភេទសរុប' : 'Total Categories'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-1">
            {metrics.totalCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isKhmer ? 'ក្រុមចំណាត់ថ្នាក់គ្រឿងអលង្ការ' : 'Active jewelry taxonomies'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isKhmer ? 'ទំនិញក្នុងកាតាឡុក' : 'Catalog Items'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faGem} />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-1">
            {metrics.linkedProducts} <span className="text-xs font-sans font-normal text-slate-400">{isKhmer ? 'មុខ' : 'SKUs'}</span>
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
            <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" />
            <span>{isKhmer ? 'ភ្ជាប់ក្នុងបញ្ជីស្តុក' : 'Linked in vault catalog'}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isKhmer ? 'ទម្ងន់មាសសរុប (ជី)' : 'Total Gold Stock'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faScaleBalanced} />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-amber-900 mt-1">
            {metrics.totalChi} <span className="text-xs font-sans font-normal text-amber-700">{isKhmer ? 'ជី' : 'Chi'}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ≈ {metrics.totalGoldGrams}g {isKhmer ? 'ទម្ងន់មាសសុទ្ធ' : 'fine bullion weight'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isKhmer ? 'តម្លៃលក់រាយសរុប' : 'Vault Retail Value'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faCoins} />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-amber-600 mt-1">
            ${metrics.totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isKhmer ? 'ផ្អែកលើតម្លៃទីផ្សារបច្ចុប្បន្ន' : 'Live priced inventory'}
          </p>
        </div>
      </div>

      {/* ── Filter Toolbar (Matching Jewel Catalog Filter Bar) ──────────────── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs w-full">
        {/* Left Side: Search input & filter tag */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-xs">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isKhmer ? 'ស្វែងរកឈ្មោះប្រភេទ ឬ Slug...' : 'Search category name or slug...'}
              className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200/50 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              </button>
            )}
          </div>

          {searchTerm && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
              <FontAwesomeIcon icon={faFilter} className="w-3 h-3 text-amber-600" />
              <span>"{searchTerm}"</span>
            </div>
          )}
        </div>

        {/* Right Side: Collection Type Chips & Sort */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer whitespace-nowrap transition-all ${
                selectedFilterType === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isKhmer ? 'ទាំងអស់' : 'All Collections'}
            </button>
            {CATEGORY_THEMES.slice(0, 5).map(theme => (
              <button
                key={theme.key}
                onClick={() => setSelectedFilterType(theme.key)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedFilterType === theme.key
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FontAwesomeIcon icon={theme.icon} className="w-3 h-3" />
                <span>{isKhmer ? theme.labelKh : theme.labelEn.split('&')[0]}</span>
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer shrink-0"
          >
            <option value="name_asc">{isKhmer ? 'ឈ្មោះ A → Z' : 'Name A → Z'}</option>
            <option value="products_desc">{isKhmer ? 'ទំនិញច្រើនជាងគេ' : 'Most Items'}</option>
            <option value="newest">{isKhmer ? 'ថ្មីបំផុត' : 'Newest'}</option>
          </select>
        </div>
      </div>

      {/* ── Table Content ──────────────────────────────────────────────────── */}
      {filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl shadow-xs">
            <FontAwesomeIcon icon={faLayerGroup} />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            {isKhmer ? 'រកមិនឃើញប្រភេទគ្រឿងអលង្ការ' : 'No Categories Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? (isKhmer ? `គ្មានលទ្ធផលដែលត្រូវនឹង "${searchTerm}" ឡើយ។` : `No category matches your search term "${searchTerm}".`)
              : (isKhmer ? 'មិនទាន់មានប្រភេទគ្រឿងត្រូវបានបង្កើតនៅឡើយទេ។ ចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើត។' : 'No categories created yet. Click below to add your first one.')}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition-all mt-2"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បន្ថែមប្រភេទដំបូង' : 'Add First Category'}</span>
          </button>
        </div>
      ) : (
        /* ── High-Density Luxury Table View (Matching ProductList Table) ───── */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">{isKhmer ? 'ឈ្មោះប្រភេទ' : 'Category Name'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'កូដ Slug' : 'Slug Code'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ការពិពណ៌នា' : 'Description'}</th>
                  <th className="py-3.5 px-4 text-center">{isKhmer ? 'ចំនួនទំនិញ' : 'Catalog Items'}</th>
                  <th className="py-3.5 px-4 text-right">{isKhmer ? 'ទម្ងន់មាស (ជី)' : 'Gold Stock (Chi)'}</th>
                  <th className="py-3.5 px-4 text-right">{isKhmer ? 'តម្លៃស្តុកសរុប' : 'Stock Valuation'}</th>
                  <th className="py-3.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCategories.map(cat => {
                  const theme = resolveCategoryTheme(cat.name, cat.slug);
                  const catProducts = products.filter(p => p.category_id === cat.id);
                  const assignedCount = cat.products_count ?? catProducts.length;
                  const catValuation = catProducts.reduce((sum, p) => sum + (Number(p.stock_qty || 0) * Number(p.calculatedPrice || p.price || 0)), 0);
                  const catGrams = catProducts.reduce((sum, p) => sum + (Number(p.net_weight || 0) * Number(p.stock_qty || 0)), 0);
                  const catChi = (catGrams / 3.75).toFixed(2);

                  return (
                    <tr
                      key={cat.id}
                      onClick={() => handleOpenEdit(cat)}
                      className="hover:bg-amber-50/50 transition-colors cursor-pointer group"
                      title={isKhmer ? 'ចុចដើម្បីកែប្រែ' : 'Click to view / edit'}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${theme.gradient} flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                            <FontAwesomeIcon icon={theme.icon} className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 font-serif text-sm leading-tight group-hover:text-amber-900 transition-colors">{cat.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #{cat.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {cat.slug || `cat-${cat.id}`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {cat.description || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          {assignedCount} {isKhmer ? 'មុខ' : 'SKUs'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        {catChi} <span className="text-[10.5px] font-normal text-amber-700">{isKhmer ? 'ជី' : 'Chi'}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                        ${catValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(cat);
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center active:scale-95"
                            title={isKhmer ? 'កែប្រែ' : 'Edit'}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(cat);
                            }}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center active:scale-95"
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
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {filteredCategories.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCategories.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ── Add / Edit Category Modal (JewelFlow Luxury Style) ──────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={editingCategory ? faPenToSquare : faLayerGroup} className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {editingCategory
                      ? (isKhmer ? 'កែប្រែប្រភេទគ្រឿងអលង្ការ' : 'Edit Jewelry Category')
                      : (isKhmer ? 'បង្កើតប្រភេទគ្រឿងថ្មី' : 'Create New Category')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'បញ្ចូលព័ត៌មានឈ្មោះប្រភេទ និងកូដសម្គាល់' : 'Define category taxonomy and catalog tags'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Modal Form */}
            <form noValidate onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Category Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {isKhmer ? 'ឈ្មោះប្រភេទគ្រឿង (Category Name) *' : 'Category Name *'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData(f => ({
                      ...f,
                      name: newName,
                      slug: f.slug && !editingCategory ? newName.toLowerCase().replace(/\s+/g, '-') : f.slug
                    }));
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Diamond Engagement Rings"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                    formErrors.name
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                      : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                  }`}
                />
                {formErrors.name && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{formErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Slug Code */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {isKhmer ? 'កូដសម្គាល់ (Slug / Code Identifier)' : 'Slug / Code Identifier'}
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="e.g. diamond-engagement-rings"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50 transition-all"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">
                  {isKhmer ? 'កូដនេះត្រូវបានប្រើក្នុង URL និងការច្រោះទំនិញក្នុងប្រព័ន្ធ POS' : 'Used for internal filtering and POS system tags'}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {isKhmer ? 'ការពិពណ៌នា (Description)' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder={isKhmer ? 'ព័ត៌មានលម្អិតបន្ថែមពីប្រភេទគ្រឿង...' : 'Provide details on this jewelry collection...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50 resize-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                    ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                    : editingCategory
                      ? (isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')
                      : (isKhmer ? 'រក្សាទុកប្រភេទ' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesView;
