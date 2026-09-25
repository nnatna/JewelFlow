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
  faSearch,
  faCube
} from '@fortawesome/free-solid-svg-icons';

export const MaterialsView = () => {
  const { t, i18n } = useTranslation();
  const {
    materials,
    materialCategories,
    metalTypes,
    units,
    goldRates,
    suppliers,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addMaterialCategory,
    updateMaterialCategory,
    deleteMaterialCategory,
    getMaterialEffectivePrice,
    addPurchase,
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
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchasingMaterial, setPurchasingMaterial] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    invoice_no: '',
    quantity: 10,
    unit_cost: 0,
    total_amount: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: ''
  });

  // Material Form State
  const initialForm = {
    name: '',
    code: '',
    material_category_id: '',
    metal_type_id: '',
    supplier_id: '',
    unit: 'chi',
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
    const chiUnit = (units || []).find(u => u.code === 'chi');
    const firstMetal = metalTypes.length > 0 ? metalTypes[0] : null;
    let defaultCost = 320;
    if (firstMetal) {
      const rateObj = goldRates.find(r => Number(r.metal_type_id) === Number(firstMetal.id));
      if (rateObj) {
        defaultCost = rateObj.rate_per_chi ? Number(rateObj.rate_per_chi) : (Number(rateObj.rate_per_gram) * 3.75);
      }
    }

    setFormData({
      ...initialForm,
      code: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      material_category_id: materialCategories[0]?.id || '',
      metal_type_id: firstMetal ? String(firstMetal.id) : '',
      supplier_id: suppliers[0]?.id || '',
      unit: 'chi',
      unit_id: chiUnit?.id || '',
      cost_price: defaultCost ? Number(defaultCost.toFixed(2)) : 320,
      use_metal_rate: true,
      purity: firstMetal?.purity || '99.99%'
    });
    setIsModalOpen(true);
  };

  // Open Edit Material Modal
  const openEditModal = (item) => {
    setEditingMaterial(item);
    let initialCost = Number(item.cost_price || 0);
    if (initialCost <= 0) {
      initialCost = Number((getMaterialEffectivePrice ? getMaterialEffectivePrice(item) : 0) || 0);
      if (initialCost <= 0) {
        if (item.unit === 'chi' || item.unit === 'ជី') initialCost = 320;
        else if (item.unit === 'g' || item.unit === 'gram') initialCost = 85.5;
        else if (item.unit === 'ct') initialCost = 150;
        else initialCost = 25;
      }
    }

    setFormData({
      name: item.name || '',
      code: item.code || '',
      material_category_id: item.material_category_id || item.material_category?.id || item.materialCategory?.id || '',
      metal_type_id: item.metal_type_id || item.metal_type?.id || item.metalType?.id || '',
      supplier_id: item.supplier_id || item.supplier?.id || '',
      unit: item.unit || 'chi',
      stock_qty: item.stock_qty || 0,
      min_stock_level: item.min_stock_level || 0,
      cost_price: initialCost,
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
    const ratePerGram = rateObj ? Number(rateObj.rate_per_gram) : 85.5;
    const ratePerChi = rateObj ? (rateObj.rate_per_chi ? Number(rateObj.rate_per_chi) : ratePerGram * 3.75) : (ratePerGram * 3.75);

    setFormData(prev => {
      const currentUnit = prev.unit || 'chi';
      let effectiveCost = ratePerChi;
      if (currentUnit === 'chi' || currentUnit === 'ជី') effectiveCost = ratePerChi;
      else if (currentUnit === 'damlung' || currentUnit === 'តម្លឹង') effectiveCost = ratePerChi * 10;
      else if (currentUnit === 'hun' || currentUnit === 'ហ៊ុន') effectiveCost = ratePerChi / 10;
      else if (currentUnit === 'g' || currentUnit === 'gram') effectiveCost = ratePerGram;
      else if (currentUnit === 'ct') effectiveCost = 150;
      else effectiveCost = ratePerGram;

      return {
        ...prev,
        metal_type_id: metalId,
        use_metal_rate: true,
        purity: selectedMetal?.purity || prev.purity,
        cost_price: Number(effectiveCost.toFixed(2)),
        unit: currentUnit
      };
    });
  };

  // Handle Unit Change with automatic cost adjustment
  const handleUnitChange = (newUnit) => {
    const selectedU = (units || []).find(u => u.code === newUnit);
    setFormData(prev => {
      let newCost = Number(prev.cost_price) || 0;
      if (prev.metal_type_id) {
        const rateObj = goldRates.find(r => Number(r.metal_type_id) === Number(prev.metal_type_id));
        const ratePerGram = rateObj ? Number(rateObj.rate_per_gram) : 85.5;
        const ratePerChi = rateObj ? (rateObj.rate_per_chi ? Number(rateObj.rate_per_chi) : ratePerGram * 3.75) : 320;
        if (newUnit === 'chi' || newUnit === 'ជី') newCost = ratePerChi;
        else if (newUnit === 'damlung' || newUnit === 'តម្លឹង') newCost = ratePerChi * 10;
        else if (newUnit === 'hun' || newUnit === 'ហ៊ុន') newCost = ratePerChi / 10;
        else if (newUnit === 'g' || newUnit === 'gram') newCost = ratePerGram;
        else if (newUnit === 'ct') newCost = 150;
        else if (newUnit === 'pcs') newCost = 25;
      }
      return {
        ...prev,
        unit: newUnit,
        unit_id: selectedU?.id || prev.unit_id,
        cost_price: newCost > 0 ? Number(newCost.toFixed(2)) : prev.cost_price
      };
    });
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

  // Open Quick Purchase Modal for a Material
  const openPurchaseModal = (item) => {
    setPurchasingMaterial(item);
    let unitCost = Number(item.cost_price || 0);
    if (unitCost <= 0) {
      unitCost = Number((getMaterialEffectivePrice ? getMaterialEffectivePrice(item) : 0) || 0);
    }
    if (unitCost <= 0) {
      if (item.unit === 'chi' || item.unit === 'ជី') unitCost = 320;
      else if (item.unit === 'g' || item.unit === 'gram') unitCost = 85.5;
      else if (item.unit === 'ct') unitCost = 150;
      else unitCost = 25;
    }
    const defaultQty = Number(item.min_stock_level) > 0 ? Number(item.min_stock_level) : (item.unit === 'ct' ? 5 : (item.unit === 'pcs' ? 10 : 5));
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const totalAmt = Number((defaultQty * unitCost).toFixed(2));
    
    setPurchaseForm({
      supplier_id: item.supplier_id || (suppliers[0]?.id ? String(suppliers[0].id) : ''),
      invoice_no: `PUR-${randNum}`,
      quantity: defaultQty,
      unit_cost: unitCost,
      total_amount: totalAmt,
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: `Purchase restock of ${item.name} (${item.code || `MAT-${item.id}`})`
    });
    setIsPurchaseModalOpen(true);
  };

  // Submit Quick Purchase
  const handleQuickPurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseForm.supplier_id) {
      showToast(isKhmer ? 'សូមជ្រើសរើសអ្នកផ្គត់ផ្គង់' : 'Please select a supplier', 'error');
      return;
    }
    if (!purchaseForm.quantity || Number(purchaseForm.quantity) <= 0) {
      showToast(isKhmer ? 'សូមបញ្ចូលបរិមាណត្រឹមត្រូវ' : 'Please enter valid quantity', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemRow = {
        material_id: purchasingMaterial.id,
        name: purchasingMaterial.name,
        unit: purchasingMaterial.unit || 'g',
        quantity: Number(purchaseForm.quantity),
        unit_cost: Number(purchaseForm.unit_cost),
        total_cost: Number(purchaseForm.total_amount)
      };

      await addPurchase({
        supplier_id: Number(purchaseForm.supplier_id),
        invoice_no: purchaseForm.invoice_no,
        total_amount: Number(purchaseForm.total_amount),
        purchase_date: purchaseForm.purchase_date,
        status: purchaseForm.status,
        notes: purchaseForm.notes,
        items: [itemRow]
      });

      showToast(
        isKhmer
          ? `បានបញ្ជាទិញ ${purchasingMaterial.name} ចំនួន ${purchaseForm.quantity}${purchasingMaterial.unit} ជោគជ័យ!`
          : `Restocked ${purchaseForm.quantity}${purchasingMaterial.unit} of ${purchasingMaterial.name}!`,
        'success'
      );
      setIsPurchaseModalOpen(false);
    } catch (err) {
      console.error('Quick purchase error:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការបញ្ជាទិញសម្ភារៈ' : 'Failed to create material purchase order', 'error');
    } finally {
      setIsSubmitting(false);
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

  const totalGoldGrams = useMemo(() => {
    return materials.reduce((acc, m) => {
      if (m.unit === 'g' || m.unit === 'gram' || m.metal_type_id || m.metalType) {
        return acc + Number(m.stock_qty || 0);
      }
      return acc;
    }, 0);
  }, [materials]);

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
              ? 'គ្រប់គ្រងមាសដុំ គ្រាប់មាស ត្បូងពេជ្រ គិតទម្ងន់ជា ជី និងតម្លឹង ដោយភ្ជាប់តម្លៃទីផ្សារមាសជាក់ស្តែង'
              : 'Manage precious metals, bullion, and gems in Chi & Damlung with live market rate synchronization.'}
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
            <p className="text-[11px] text-slate-400 mt-0.5">{materialCategories.length} {isKhmer ? 'ក្រុមប្រភេទ' : 'categories'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <FontAwesomeIcon icon={faBoxesStacked} className="w-5 h-5" />
          </div>
        </div>

        {/* Total Gold & Metals in Chi */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/40 to-white shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                {isKhmer ? 'មាសក្នុងឃ្លាំងសរុប (គិតជា ជី)' : 'Vault Gold Weight (Chi)'}
              </p>
              <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-100/80 px-1 py-0.2 rounded">1ជី = 3.75g</span>
            </div>
            <h3 className="text-2xl font-bold font-mono text-amber-950 mt-1">
              {(totalGoldGrams / 3.75).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-bold text-amber-800 font-sans">{isKhmer ? 'ជី' : 'Chi'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              ≈ {(totalGoldGrams / 37.5).toFixed(1)} {isKhmer ? 'ដំឡឹង' : 'Damlung'} ({totalGoldGrams.toLocaleString()}g)
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs">
            <FontAwesomeIcon icon={faScaleBalanced} className="w-5 h-5" />
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
            <p className="text-[11px] text-slate-400 mt-0.5">{isKhmer ? 'គណនាតាមតម្លៃទីផ្សារ Live' : 'Calculated with live rates'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <FontAwesomeIcon icon={faCoins} className="w-5 h-5" />
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

      {/* Materials Table (Luxury Jewelry Atelier Style) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[220px]">{isKhmer ? 'សម្ភារៈ & វត្ថុធាតុដើម' : 'Material Item'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'កូដទំនិញ & ប្រភព' : 'SKU & Supplier'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'ប្រភេទ' : 'Category'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'កម្រិតទឹក & តម្លៃមាស' : 'Purity & Metal'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ទម្ងន់/ស្តុក (ជី)' : 'Weight (Chi)'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'តម្លៃឯកតា' : 'Unit Cost'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-right">{isKhmer ? 'តម្លៃសរុប' : 'Live Valuation'}</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center w-36 min-w-[130px] sticky right-0 bg-slate-50 shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                  {isKhmer ? 'សកម្មភាព' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
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
                  const isGramOrMetal = mat.unit === 'g' || mat.unit === 'gram' || mat.metal_type_id || mat.metalType;

                  return (
                    <tr
                      key={mat.id}
                      onClick={() => openEditModal(mat)}
                      className="hover:bg-amber-50/50 transition-colors group cursor-pointer"
                      title={isKhmer ? 'ចុចដើម្បីមើល / កែប្រែ' : 'Click to view / edit'}
                    >
                      {/* Material Piece / Name */}
                      <td className="py-3.5 px-4 flex items-center gap-3 min-w-[220px]">
                        <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-amber-700 shadow-xs shrink-0 group-hover:border-amber-300 group-hover:bg-amber-50 transition-colors">
                          <FontAwesomeIcon
                            icon={
                              mat.materialCategory?.slug?.includes('gem') || mat.material_category?.slug?.includes('gem')
                                ? faGem
                                : (mat.unit === 'pcs' ? faBoxesStacked : faCoins)
                            }
                            className="w-5 h-5 text-amber-600"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate group-hover:text-amber-900 transition-colors">
                            {mat.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {mat.notes || (isKhmer ? 'វត្ថុធាតុដើមមានវិញ្ញាបនបត្រស្តង់ដារ' : 'Certified atelier fine casting grade')}
                          </span>
                        </div>
                      </td>

                      {/* SKU & Code */}
                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">{mat.code || `MAT-${mat.id}`}</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[120px]">
                          {mat.supplier?.company_name || mat.supplier?.name || (isKhmer ? 'ឃ្លាំងកណ្តាល' : 'Vault Reserve')}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {mat.materialCategory?.name || mat.material_category?.name || 'General Raw'}
                      </td>

                      {/* Metal & Purity Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          {mat.metalType?.name || mat.metal_type?.name || mat.purity || 'Standard Grade'}
                        </span>
                      </td>

                      {/* Weight in Chi / Stock Quantity */}
                      <td className="py-3.5 px-3 text-center font-mono whitespace-nowrap">
                        {isGramOrMetal ? (
                          <div>
                            <span className="font-bold text-amber-900 block">
                              {((Number(mat.stock_qty || 0)) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({Number(mat.stock_qty).toLocaleString()}g)
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {Number(mat.stock_qty).toLocaleString()} {mat.unit}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Min: {mat.min_stock_level} {mat.unit}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-3 text-center font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-700 block">
                          ${effectivePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/{mat.unit}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                            {isKhmer ? 'អស់ពីស្តុក' : 'Out of Stock'}
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-block">
                            {isKhmer ? 'ស្តុកទាប' : 'Low Stock'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                            {isKhmer ? 'មានស្តុក' : 'In Stock'}
                          </span>
                        )}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-amber-700 whitespace-nowrap">
                        ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Sticky Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap w-36 min-w-[130px] sticky right-0 bg-white group-hover:bg-amber-50/50 transition-colors shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Purchase Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPurchaseModal(mat);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1"
                            title={isKhmer ? 'បញ្ជាទិញចូលស្តុក' : 'Purchase Inbound Stock'}
                          >
                            <FontAwesomeIcon icon={faTruck} className="w-3 h-3" />
                            <span>{isKhmer ? 'ទិញ' : 'Buy'}</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(mat);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 cursor-pointer transition-colors"
                            title={isKhmer ? 'កែប្រែ' : 'Edit'}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMaterial(mat);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 cursor-pointer transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl lg:max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={editingMaterial ? faPenToSquare : faCube} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {editingMaterial
                      ? (isKhmer ? 'កែប្រែព័ត៌មានសម្ភារៈ' : 'Edit Material Record')
                      : (isKhmer ? 'ចុះឈ្មោះសម្ភារៈថ្មី' : 'Register New Raw Material')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer
                      ? 'បញ្ចូលព័ត៌មានលម្អិត និងជ្រើសរើស Metal Type ដើម្បីគណនាតម្លៃទីផ្សារដោយស្វ័យប្រវត្តិ'
                      : 'Enter specifications and link with Metal Type for automated market valuation.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitMaterial} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:px-6 overflow-y-auto space-y-4 flex-1">
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-semibold focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">{isKhmer ? 'ប្រភេទទំនិញ/សម្ភារៈ *' : 'Material Category *'}</label>
                    <select
                      value={formData.material_category_id}
                      onChange={(e) => setFormData({ ...formData, material_category_id: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
                    >
                      <option value="">{isKhmer ? '-- ជ្រើសរើសប្រភេទ --' : '-- Select Category --'}</option>
                      {materialCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Metal Type Dynamic Price Binding */}
                  <div className="space-y-2 sm:col-span-2 p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl">
                    <div className="flex items-center justify-between mb-1">
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
                          className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-semibold text-xs"
                        >
                          <option value="">{isKhmer ? '-- មិនភ្ជាប់ Metal Type --' : '-- No Metal Type Link --'}</option>
                          {metalTypes.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.purity})</option>
                          ))}
                        </select>
                      </div>

                      {formData.metal_type_id && (
                        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-amber-200 text-amber-950 font-mono font-bold text-xs">
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
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700">{isKhmer ? 'បរិមាណក្នុងស្តុក *' : 'Stock Quantity *'}</label>
                      {(formData.unit === 'chi' || formData.unit === 'ជី') ? (
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          ≈ {((Number(formData.stock_qty || 0)) * 3.75).toFixed(2)} g (1 ជី = 3.75g)
                        </span>
                      ) : (formData.unit === 'g' || formData.unit === 'gram') ? (
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          ≈ {((Number(formData.stock_qty || 0)) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'} (1 ជី = 3.75g)
                        </span>
                      ) : null}
                    </div>
                    <div className="flex">
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.stock_qty}
                        onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-l-xl focus:outline-none focus:border-amber-500 font-mono font-bold text-xs bg-white"
                      />
                      <select
                        value={formData.unit}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className="bg-amber-50 border-y border-r border-slate-200 px-3 py-2.5 rounded-r-xl text-amber-950 font-bold focus:outline-none text-xs cursor-pointer"
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
                            <option value="g">{isKhmer ? 'ក្រាម (g)' : 'Grams (g)'}</option>
                            <option value="ct">{isKhmer ? 'ការ៉ាត់ (ct)' : 'Carats (ct)'}</option>
                            <option value="pcs">{isKhmer ? 'ដុំ/គ្រាប់ (pcs)' : 'Pieces (pcs)'}</option>
                            <option value="oz">{isKhmer ? 'អោនស៍ (oz)' : 'Ounces (oz)'}</option>
                          </>
                        )}
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
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono text-xs bg-white font-semibold"
                    />
                  </div>

                  {/* Unit Cost Price (Auto calculated & fully editable) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700">
                        {isKhmer ? 'តម្លៃដើមឯកតា ($USD) *' : 'Unit Cost Price ($USD) *'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          let autoCost = getMaterialEffectivePrice({ ...formData, use_metal_rate: true });
                          if (!autoCost || autoCost <= 0) {
                            if (formData.unit === 'chi' || formData.unit === 'ជី') autoCost = 320;
                            else if (formData.unit === 'damlung' || formData.unit === 'តម្លឹង') autoCost = 3200;
                            else if (formData.unit === 'hun' || formData.unit === 'ហ៊ុន') autoCost = 32;
                            else if (formData.unit === 'g' || formData.unit === 'gram') autoCost = 85.5;
                            else if (formData.unit === 'ct') autoCost = 150;
                            else autoCost = 25;
                          }
                          setFormData(prev => ({ ...prev, cost_price: Number(Number(autoCost).toFixed(2)) }));
                        }}
                        className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        title={isKhmer ? 'ទាញយកតម្លៃស្វ័យប្រវត្តិតាមទីផ្សារ' : 'Auto calculate from live rate'}
                      >
                        <FontAwesomeIcon icon={faBolt} className="w-2.5 h-2.5 text-amber-600" />
                        <span>{isKhmer ? 'គណនាស្វ័យប្រវត្តិ (Auto)' : 'Auto Rate'}</span>
                      </button>
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono font-bold text-xs bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Supplier */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">{isKhmer ? 'អ្នកផ្គត់ផ្គង់ (Supplier)' : 'Preferred Supplier'}</label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-xs"
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
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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

      {/* QUICK INBOUND PURCHASE MODAL */}
      {isPurchaseModalOpen && purchasingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
                  <FontAwesomeIcon icon={faTruck} className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-slate-900">
                    {isKhmer ? 'បញ្ជាទិញសម្ភារៈចូលស្តុក (Inbound PO)' : 'Purchase / Restock Material'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {purchasingMaterial.name} ({purchasingMaterial.code || `MAT-${purchasingMaterial.id}`})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleQuickPurchaseSubmit} className="space-y-3.5 text-xs">
              {/* Supplier */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isKhmer ? 'ជ្រើសរើសអ្នកផ្គត់ផ្គង់ (Supplier / Refinery)' : 'Supplier / Refinery'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={purchaseForm.supplier_id}
                  onChange={e => setPurchaseForm({ ...purchaseForm, supplier_id: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="">{isKhmer ? '-- ជ្រើសរើសអ្នកផ្គត់ផ្គង់ --' : '-- Choose supplier --'}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.company_name || s.name} • {s.phone}</option>
                  ))}
                </select>
              </div>

              {/* Invoice & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isKhmer ? 'លេខ PO / វិក្កយបត្រ' : 'PO / Invoice #'}
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.invoice_no}
                    onChange={e => setPurchaseForm({ ...purchaseForm, invoice_no: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isKhmer ? 'កាលបរិច្ឆេទ' : 'Purchase Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.purchase_date}
                    onChange={e => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">
                      {isKhmer ? 'បរិមាណទិញចូល' : 'Quantity to Buy'} ({purchasingMaterial.unit || 'g'})
                    </label>
                    {(purchasingMaterial.unit === 'g' || purchasingMaterial.unit === 'gram' || purchasingMaterial.metal_type_id) && (
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        ≈ {((Number(purchaseForm.quantity || 0)) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    value={purchaseForm.quantity}
                    onChange={e => {
                      const q = Number(e.target.value);
                      const cost = Number(purchaseForm.unit_cost);
                      setPurchaseForm({
                        ...purchaseForm,
                        quantity: e.target.value,
                        total_amount: (q * cost).toFixed(2)
                      });
                    }}
                    className="w-full rounded-xl px-3.5 py-2 bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isKhmer ? 'តម្លៃដើម ($)' : 'Unit Cost ($)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={purchaseForm.unit_cost}
                    onChange={e => {
                      const cost = Number(e.target.value);
                      const q = Number(purchaseForm.quantity);
                      setPurchaseForm({
                        ...purchaseForm,
                        unit_cost: e.target.value,
                        total_amount: (q * cost).toFixed(2)
                      });
                    }}
                    className="w-full rounded-xl px-3.5 py-2 bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Total Amount and Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">
                      {isKhmer ? 'ទឹកប្រាក់សរុប ($ USD)' : 'Total Amount ($ USD)'}
                    </label>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                      {isKhmer ? 'គណនាស្វ័យប្រវត្តិ (Auto)' : 'Auto'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={purchaseForm.total_amount}
                    onChange={e => {
                      const tot = Number(e.target.value);
                      const q = Number(purchaseForm.quantity);
                      setPurchaseForm({
                        ...purchaseForm,
                        total_amount: e.target.value,
                        unit_cost: q > 0 ? (tot / q).toFixed(2) : purchaseForm.unit_cost
                      });
                    }}
                    className="w-full rounded-xl px-3.5 py-2 bg-slate-50 border border-slate-200 font-mono font-black text-amber-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isKhmer ? 'ស្ថានភាពការបញ្ជាទិញ' : 'Shipment Status'}
                  </label>
                  <select
                    value={purchaseForm.status}
                    onChange={e => setPurchaseForm({ ...purchaseForm, status: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="pending">{isKhmer ? 'កំពុងរង់ចាំ (Ordered & Pending)' : 'Ordered & Pending'}</option>
                    <option value="completed">{isKhmer ? 'បានទទួលចូលស្តុក (Arrived & Received)' : 'Arrived & Received'}</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-white font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? (isKhmer ? 'កំពុងដំណើរការ...' : 'Processing...')
                    : (isKhmer ? 'បញ្ជាក់ការបញ្ជាទិញ' : 'Confirm Purchase')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
