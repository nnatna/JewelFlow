import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxesStacked,
  faPlus,
  faFilter,
  faRotateRight,
  faPenToSquare,
  faTrashCan,
  faGem,
  faCoins,
  faScaleBalanced,
  faTruck,
  faCircleCheck,
  faCircleExclamation,
  faTriangleExclamation,
  faXmark,
  faLayerGroup,
  faTags,
  faBolt,
  faArrowUpRightFromSquare,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

export const MaterialsView = () => {
  const { t, i18n } = useTranslation();
  const {
    materials,
    materialCategories,
    metalTypes,
    goldRates,
    suppliers,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addMaterialCategory,
    updateMaterialCategory,
    deleteMaterialCategory,
    getMaterialEffectivePrice,
    searchQuery,
    setSearchQuery,
    confirmDialog,
    showToast,
    refreshAllData,
    setActiveTab
  } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Search & Filter State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMetalType, setSelectedMetalType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Material Form State
  const initialForm = {
    name: '',
    code: '',
    material_category_id: '',
    metal_type_id: '',
    supplier_id: '',
    unit: 'g',
    stock_qty: 0,
    min_stock_level: 10,
    cost_price: 0,
    use_metal_rate: false,
    purity: '',
    status: 'in_stock',
    notes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', description: '' });

  // Open Add Material Modal
  const openAddModal = () => {
    setEditingMaterial(null);
    setFormData({
      ...initialForm,
      code: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      material_category_id: materialCategories[0]?.id || '',
      supplier_id: suppliers[0]?.id || ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Material Modal
  const openEditModal = (item) => {
    setEditingMaterial(item);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      material_category_id: item.material_category_id || item.material_category?.id || item.materialCategory?.id || '',
      metal_type_id: item.metal_type_id || item.metal_type?.id || item.metalType?.id || '',
      supplier_id: item.supplier_id || item.supplier?.id || '',
      unit: item.unit || 'g',
      stock_qty: item.stock_qty || 0,
      min_stock_level: item.min_stock_level || 0,
      cost_price: item.cost_price || 0,
      use_metal_rate: Boolean(item.use_metal_rate),
      purity: item.purity || '',
      status: item.status || 'in_stock',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  // Handle Metal Type Change in Form (Pulls price from metal_types & gold_rates)
  const handleMetalTypeChange = (metalId) => {
    if (!metalId) {
      setFormData(prev => ({
        ...prev,
        metal_type_id: '',
        use_metal_rate: false
      }));
      return;
    }

    const selectedMetal = metalTypes.find(m => Number(m.id) === Number(metalId));
    const rateObj = goldRates.find(r => Number(r.metal_type_id) === Number(metalId));
    const ratePerGram = rateObj ? Number(rateObj.rate_per_gram) : 0;

    setFormData(prev => ({
      ...prev,
      metal_type_id: metalId,
      use_metal_rate: true,
      purity: selectedMetal?.purity || prev.purity,
      cost_price: ratePerGram > 0 ? ratePerGram : prev.cost_price,
      unit: prev.unit || 'g'
    }));
  };

  // Submit Material Form
  const handleSubmitMaterial = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast(isKhmer ? 'សូមបញ្ចូលឈ្មោះសម្ភារៈ' : 'Please enter material name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        stock_qty: parseFloat(formData.stock_qty) || 0,
        min_stock_level: parseFloat(formData.min_stock_level) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        material_category_id: formData.material_category_id || null,
        metal_type_id: formData.metal_type_id || null,
        supplier_id: formData.supplier_id || null,
        use_metal_rate: Boolean(formData.use_metal_rate)
      };

      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, payload);
        showToast(isKhmer ? 'បានកែប្រែទិន្នន័យសម្ភារៈជោគជ័យ' : 'Material updated successfully', 'success');
      } else {
        await addMaterial(payload);
        showToast(isKhmer ? 'បានបន្ថែមសម្ភារៈថ្មីជោគជ័យ' : 'Material added successfully', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error saving material', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (item) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'តើអ្នកប្រាកដជាចង់លុបសម្ភារៈនេះមែនទេ?' : 'Delete Material?',
      text: isKhmer
        ? `សម្ភារៈ "${item.name}" នឹងត្រូវលុបចេញពីប្រព័ន្ធ។`
        : `Material "${item.name}" will be removed from inventory.`,
      confirmButtonText: isKhmer ? 'យល់ព្រមលុប' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      try {
        await deleteMaterial(item.id);
        showToast(isKhmer ? 'បានលុបសម្ភារៈដោយជោគជ័យ' : 'Material deleted successfully', 'success');
      } catch (err) {
        showToast(isKhmer ? 'មិនអាចលុបសម្ភារៈបានទេ' : 'Failed to delete material', 'error');
      }
    }
  };

  // Submit Category Form
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      if (editingCategory) {
        await updateMaterialCategory(editingCategory.id, categoryForm);
        showToast(isKhmer ? 'បានកែប្រែប្រភេទទំនិញ/សម្ភារៈជោគជ័យ' : 'Category updated', 'success');
      } else {
        await addMaterialCategory(categoryForm);
        showToast(isKhmer ? 'បានបន្ថែមប្រភេទទំនិញ/សម្ភារៈថ្មី' : 'Category added', 'success');
      }
      setCategoryForm({ name: '', code: '', description: '' });
      setEditingCategory(null);
    } catch (err) {
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Failed to save category', 'error');
    }
  };

  // Filter materials
  const cleanQ = (searchQuery || '').toLowerCase().trim();
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = !cleanQ || (
        m.name?.toLowerCase().includes(cleanQ) ||
        m.code?.toLowerCase().includes(cleanQ) ||
        m.purity?.toLowerCase().includes(cleanQ) ||
        m.material_category?.name?.toLowerCase().includes(cleanQ)
      );
      const matchCat = selectedCategory === 'all' || String(m.material_category_id || m.materialCategory?.id) === String(selectedCategory);
      const matchMetal = selectedMetalType === 'all' || String(m.metal_type_id || m.metalType?.id) === String(selectedMetalType);
      
      let matchStatus = true;
      if (statusFilter === 'in_stock') matchStatus = Number(m.stock_qty) > Number(m.min_stock_level || 0);
      else if (statusFilter === 'low_stock') matchStatus = Number(m.stock_qty) > 0 && Number(m.stock_qty) <= Number(m.min_stock_level || 0);
      else if (statusFilter === 'out_of_stock') matchStatus = Number(m.stock_qty) <= 0;

      return matchSearch && matchCat && matchMetal && matchStatus;
    });
  }, [materials, cleanQ, selectedCategory, selectedMetalType, statusFilter]);

  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, currentPage]);

  // Inventory Totals
  const totalValue = useMemo(() => {
    return materials.reduce((acc, m) => {
      const price = getMaterialEffectivePrice(m);
      return acc + (price * Number(m.stock_qty || 0));
    }, 0);
  }, [materials, getMaterialEffectivePrice]);

  const lowStockCount = useMemo(() => {
    return materials.filter(m => Number(m.stock_qty) <= Number(m.min_stock_level || 0)).length;
  }, [materials]);

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header & Metric Cards */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <FontAwesomeIcon icon={faBoxesStacked} className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
              {isKhmer ? 'ឃ្លាំងសម្ភារៈ & វត្ថុធាតុដើម' : 'Materials & Raw Inventory'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isKhmer
              ? 'គ្រប់គ្រងមាសដុំ ត្បូងពេជ្រ គ្រោងចិញ្ចៀន និងទឹកផ្សា ដោយភ្ជាប់តម្លៃផ្ទាល់ពី Metal Types & Gold Rates'
              : 'Manage precious metals, loose gemstones, settings & alloys with dynamic Metal Type price synchronization.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => refreshAllData(false)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <FontAwesomeIcon icon={faRotateRight} className="w-3.5 h-3.5 text-slate-500" />
            <span>{isKhmer ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <FontAwesomeIcon icon={faTags} className="w-3.5 h-3.5 text-amber-600" />
            <span>{isKhmer ? 'ប្រភេទទំនិញ/សម្ភារៈ' : 'Material Categories'} ({materialCategories.length})</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>{isKhmer ? '+ បន្ថែមសម្ភារៈថ្មី' : '+ Add Material'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {isKhmer ? 'សម្ភារៈសរុប' : 'Total Materials'}
            </p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {materials.length} <span className="text-xs font-sans font-normal text-slate-500">{isKhmer ? 'មុខ' : 'items'}</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <FontAwesomeIcon icon={faBoxesStacked} className="w-5 h-5" />
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {isKhmer ? 'តម្លៃសម្ភារៈក្នុងស្តុកសរុប' : 'Total Inventory Value'}
            </p>
            <h3 className="text-2xl font-bold font-mono text-amber-700 mt-1">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <FontAwesomeIcon icon={faCoins} className="w-5 h-5" />
          </div>
        </div>

        {/* Categories Count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {isKhmer ? 'ប្រភេទទំនិញ/សម្ភារៈ' : 'Material Categories'}
            </p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {materialCategories.length} <span className="text-xs font-sans font-normal text-slate-500">{isKhmer ? 'ក្រុម' : 'types'}</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <FontAwesomeIcon icon={faTags} className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {isKhmer ? 'សម្ភារៈជិតអស់/អស់ស្តុក' : 'Low / Depleted Stock'}
            </p>
            <h3 className={`text-2xl font-bold font-mono mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {lowStockCount} <span className="text-xs font-sans font-normal text-slate-500">{isKhmer ? 'មុខ' : 'alerts'}</span>
            </h3>
          </div>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            lowStockCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <FontAwesomeIcon icon={lowStockCount > 0 ? faTriangleExclamation : faCircleCheck} className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Active Search Badge */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            {cleanQ ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium text-xs">
                <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
                <span>{isKhmer ? 'ស្វែងរក:' : 'Search:'} <strong className="font-bold font-mono text-amber-950">"{cleanQ}"</strong></span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 text-slate-400 hover:text-amber-700 p-0.5 rounded transition-colors cursor-pointer"
                  title="Clear"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
                <span>{filteredMaterials.length} {isKhmer ? 'មុខទំនិញត្រូវបានបង្ហាញ' : 'materials listed'}</span>
              </div>
            )}
          </div>

          {/* Quick Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isKhmer ? 'គ្រប់ប្រភេទសម្ភារៈ' : 'All Categories'}
            </button>
            {materialCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                  String(selectedCategory) === String(cat.id)
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">{isKhmer ? 'ស្ថានភាពស្តុក:' : 'Stock Status:'}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">{isKhmer ? 'ទាំងអស់' : 'All Status'}</option>
              <option value="in_stock">{isKhmer ? 'មានស្តុកគ្រប់គ្រាន់' : 'In Stock'}</option>
              <option value="low_stock">{isKhmer ? 'ស្តុកទាប / ជិតអស់' : 'Low Stock'}</option>
              <option value="out_of_stock">{isKhmer ? 'អស់ពីស្តុក' : 'Out of Stock'}</option>
            </select>
          </div>

          {/* Metal Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">{isKhmer ? 'ភ្ជាប់តម្លៃមាស:' : 'Metal Type:'}</span>
            <select
              value={selectedMetalType}
              onChange={(e) => setSelectedMetalType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">{isKhmer ? 'ទាំងអស់' : 'All Metal Types'}</option>
              {metalTypes.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{isKhmer ? 'លេខកូដ / សម្ភារៈ' : 'Code / Material Name'}</th>
                <th className="py-3 px-4">{isKhmer ? 'ប្រភេទទំនិញ/សម្ភារៈ' : 'Category'}</th>
                <th className="py-3 px-4">{isKhmer ? 'កម្រិតសុទ្ធ / Metal Type' : 'Purity & Metal Rate'}</th>
                <th className="py-3 px-4 text-right">{isKhmer ? 'បរិមាណស្តុក' : 'Stock Quantity'}</th>
                <th className="py-3 px-4 text-right">{isKhmer ? 'តម្លៃឯកតា (Live Rate)' : 'Unit Cost (Live)'}</th>
                <th className="py-3 px-4 text-right">{isKhmer ? 'តម្លៃសរុប' : 'Total Value'}</th>
                <th className="py-3 px-4 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <FontAwesomeIcon icon={faBoxesStacked} className="w-8 h-8 mb-2 text-slate-300 block mx-auto" />
                    <span>{isKhmer ? 'មិនមានទិន្នន័យសម្ភារៈស្របតាមការស្វែងរកទេ' : 'No materials found matching criteria.'}</span>
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((mat) => {
                  const effectivePrice = getMaterialEffectivePrice(mat);
                  const lineTotal = effectivePrice * Number(mat.stock_qty || 0);
                  const isLow = Number(mat.stock_qty) <= Number(mat.min_stock_level || 0);
                  const isOut = Number(mat.stock_qty) <= 0;

                  return (
                    <tr key={mat.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{mat.name}</div>
                        <div className="font-mono text-[11px] text-amber-800 flex items-center gap-1.5 mt-0.5">
                          <span>{mat.code || `MAT-${mat.id}`}</span>
                          {mat.notes && (
                            <span className="text-slate-400 font-sans text-[10px] truncate max-w-[200px]" title={mat.notes}>
                              • {mat.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          <FontAwesomeIcon icon={faTags} className="w-2.5 h-2.5 text-slate-400" />
                          {mat.materialCategory?.name || mat.material_category?.name || 'General Raw'}
                        </span>
                      </td>

                      {/* Metal Type & Rate Source */}
                      <td className="py-3.5 px-4">
                        {mat.metalType || mat.metal_type ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-950 font-bold text-[11px]">
                              <FontAwesomeIcon icon={faBolt} className="w-2.5 h-2.5 text-amber-600" />
                              {mat.metalType?.name || mat.metal_type?.name}
                            </span>
                            {mat.use_metal_rate && (
                              <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {isKhmer ? 'តម្លៃភ្ជាប់តាមទីផ្សារមាស' : 'Live Metal Spot Linked'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-medium text-[11px]">{mat.purity || 'Standard Grade'}</span>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {Number(mat.stock_qty).toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">{mat.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isKhmer ? 'កម្រិតទាប:' : 'Min:'} {mat.min_stock_level} {mat.unit}
                        </div>
                      </td>

                      {/* Effective Unit Cost */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-amber-900 text-sm">
                          ${effectivePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">/{mat.unit}</div>
                      </td>

                      {/* Line Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                        ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="w-2.5 h-2.5" />
                            {isKhmer ? 'អស់ពីស្តុក' : 'Out of Stock'}
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="w-2.5 h-2.5" />
                            {isKhmer ? 'ស្តុកទាប' : 'Low Stock'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FontAwesomeIcon icon={faCircleCheck} className="w-2.5 h-2.5" />
                            {isKhmer ? 'មានស្តុក' : 'In Stock'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(mat)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title={isKhmer ? 'កែប្រែ' : 'Edit'}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(mat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={isKhmer ? 'លុប' : 'Delete'}
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredMaterials.length > pageSize && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {isKhmer ? 'បង្ហាញ' : 'Showing'} {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredMaterials.length)} {isKhmer ? 'នៃ' : 'of'} {filteredMaterials.length}
            </span>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredMaterials.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* CREATE / EDIT MATERIAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <FontAwesomeIcon icon={editingMaterial ? faPenToSquare : faPlus} className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-900">
                    {editingMaterial
                      ? (isKhmer ? 'កែប្រែព័ត៌មានសម្ភារៈ' : 'Edit Material Record')
                      : (isKhmer ? 'ចុះឈ្មោះសម្ភារៈថ្មី' : 'Register New Raw Material')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isKhmer
                      ? 'បញ្ចូលព័ត៌មានលម្អិត និងជ្រើសរើស Metal Type ដើម្បីគណនាតម្លៃទីផ្សារដោយស្វ័យប្រវត្តិ'
                      : 'Enter specifications and link with Metal Type for automated market valuation.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitMaterial} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">
                    {isKhmer ? 'ឈ្មោះសម្ភារៈ / វត្ថុធាតុដើម *' : 'Material Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isKhmer ? 'ឧ. មាសសុទ្ធ 24K (99.99%) ឬ ត្បូងពេជ្រ 1.0ct' : 'e.g. 24K Pure Gold Casting Shot'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  />
                </div>

                {/* SKU / Code */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{isKhmer ? 'លេខកូដសម្ភារៈ (SKU)' : 'Material Code / SKU'}</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="MAT-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{isKhmer ? 'ប្រភេទទំនិញ/សម្ភារៈ *' : 'Material Category *'}</label>
                  <select
                    value={formData.material_category_id}
                    onChange={(e) => setFormData({ ...formData, material_category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  >
                    <option value="">{isKhmer ? '-- ជ្រើសរើសប្រភេទ --' : '-- Select Category --'}</option>
                    {materialCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Metal Type Dynamic Price Binding */}
                <div className="space-y-1 sm:col-span-2 p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-amber-950 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isKhmer ? 'ភ្ជាប់តម្លៃតាម Metal Type & Gold Rates' : 'Link with Metal Type & Live Market Rates'}</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-amber-900 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_metal_rate}
                        onChange={(e) => setFormData({ ...formData, use_metal_rate: e.target.checked })}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>{isKhmer ? 'យកតម្លៃផ្ទាល់ពីទីផ្សារមាស' : 'Auto Sync Price'}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <select
                        value={formData.metal_type_id}
                        onChange={(e) => handleMetalTypeChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-semibold"
                      >
                        <option value="">{isKhmer ? '-- មិនភ្ជាប់ Metal Type --' : '-- No Metal Type Link --'}</option>
                        {metalTypes.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.purity})</option>
                        ))}
                      </select>
                    </div>

                    {formData.metal_type_id && (
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-amber-950 font-mono font-bold text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{isKhmer ? 'តម្លៃបច្ចុប្បន្ន:' : 'Live Rate:'}</span>
                        <span className="text-amber-800 font-extrabold">
                          ${getMaterialEffectivePrice({ ...formData, metal_type_id: formData.metal_type_id, use_metal_rate: true })} / {formData.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{isKhmer ? 'បរិមាណក្នុងស្តុក *' : 'Stock Quantity *'}</label>
                  <div className="flex">
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.stock_qty}
                      onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono font-bold"
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="bg-slate-100 border-y border-r border-slate-200 px-3 py-2 rounded-r-lg text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="g">ក្រាម (g)</option>
                      <option value="chi">ជី (chi)</option>
                      <option value="ct">ការ៉ាត់ (ct)</option>
                      <option value="pcs">ដុំ/គ្រាប់ (pcs)</option>
                      <option value="oz">អោនស៍ (oz)</option>
                    </select>
                  </div>
                </div>

                {/* Min Stock Level */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{isKhmer ? 'កម្រិតស្តុកទាបបំផុត (Min Stock)' : 'Min Alert Threshold'}</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Manual Cost Price (If not using live rate) */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    {isKhmer ? 'តម្លៃដើមឯកតា ($USD) *' : 'Unit Cost Price ($USD) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    disabled={formData.use_metal_rate && Boolean(formData.metal_type_id)}
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg font-mono font-bold ${
                      formData.use_metal_rate && formData.metal_type_id
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                    }`}
                  />
                </div>

                {/* Supplier */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{isKhmer ? 'អ្នកផ្គត់ផ្គង់ (Supplier)' : 'Preferred Supplier'}</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  >
                    <option value="">{isKhmer ? '-- មិនបញ្ជាក់ --' : '-- None --'}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.company_name || s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">{isKhmer ? 'កំណត់ចំណាំបន្ថែម' : 'Notes & Specifications'}</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={isKhmer ? 'ព័ត៌មានលម្អិតអំពីស្តង់ដារ ឬប្រភពដើម...' : 'Details regarding purity, certification, or origin...'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-xs"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                    : editingMaterial
                      ? (isKhmer ? 'កែប្រែទិន្នន័យ' : 'Save Changes')
                      : (isKhmer ? 'ចុះឈ្មោះសម្ភារៈ' : 'Register Material')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE MATERIAL CATEGORIES MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <FontAwesomeIcon icon={faTags} className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-900">
                    {isKhmer ? 'គ្រប់គ្រងប្រភេទទំនិញ/សម្ភារៈ' : 'Material Categories Management'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isKhmer ? 'បែងចែកក្រុមសម្រាប់មាសដុំ ត្បូងពេជ្រ គ្រឿងបង្គុំ និងទឹកផ្សា' : 'Classify raw metals, gemstones, mountings and alloys.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            {/* Add / Edit Category Form */}
            <form onSubmit={handleSubmitCategory} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="font-bold text-slate-800">
                {editingCategory ? (isKhmer ? 'កែប្រែប្រភេទទំនិញ/សម្ភារៈ' : 'Edit Category') : (isKhmer ? '+ បន្ថែមប្រភេទទំនិញ/សម្ភារៈថ្មី' : '+ Add New Category')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder={isKhmer ? 'ឈ្មោះប្រភេទ (ឧ. ត្បូងពេជ្រ)' : 'Category Name'}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                  placeholder="Code (e.g. CAT-GEMS)"
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: '', code: '', description: '' });
                    }}
                    className="px-3 py-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    {isKhmer ? 'បោះបង់' : 'Cancel'}
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingCategory ? (isKhmer ? 'រក្សាទុក' : 'Update') : (isKhmer ? 'បន្ថែម' : 'Add')}
                </button>
              </div>
            </form>

            {/* Category List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {materialCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{cat.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 ml-2">({cat.code || cat.slug})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryForm({ name: cat.name, code: cat.code || '', description: cat.description || '' });
                      }}
                      className="p-1 text-slate-400 hover:text-amber-700 rounded cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMaterialCategory(cat.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
