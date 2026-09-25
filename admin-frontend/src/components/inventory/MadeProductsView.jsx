import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faPlus,
  faMagnifyingGlass,
  faFilter,
  faRotateRight,
  faPenToSquare,
  faTrashCan,
  faGem,
  faClock,
  faCheckCircle,
  faCircleExclamation,
  faTriangleExclamation,
  faXmark,
  faCoins,
  faScaleBalanced,
  faUserTie,
  faTruck,
  faCalendarDays,
  faLock,
  faCartPlus,
  faBoxesStacked,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';

const fallbackImg = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80';

export const MadeProductsView = () => {
  const { t, i18n } = useTranslation();
  const {
    madeProducts,
    products,
    metalTypes,
    suppliers,
    users,
    addMadeProduct,
    updateMadeProduct,
    updateMadeProductStatus,
    deleteMadeProduct,
    confirmDialog,
    showToast,
    refreshAllData,
    currentUser,
    materials,
    getMaterialEffectivePrice,
    addPurchase,
    quickRestockMaterial,
    setActiveTab,
    searchQuery
  } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Auto-detect best suited craftsman (Master Goldsmith / Jeweler / Logged-in Staff)
  const getDefaultCraftsman = () => {
    return (
      users.find(u => 
        (u.name + ' ' + (u.role_display || u.role_name || u.role?.name || '')).toLowerCase().includes('goldsmith') ||
        (u.name + ' ' + (u.role_display || u.role_name || u.role?.name || '')).toLowerCase().includes('craft') ||
        (u.name + ' ' + (u.role_display || u.role_name || u.role?.name || '')).toLowerCase().includes('master')
      ) ||
      users.find(u => u.id === currentUser?.id) ||
      users[0] ||
      null
    );
  };

  // Search & Filter State
  const [statusFilter, setStatusFilter] = useState('all');
  const [metalFilter, setMetalFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Purchase Material Modal State (for ordering raw stock from suppliers)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchasingMaterial, setPurchasingMaterial] = useState(null);
  const [shortageModalData, setShortageModalData] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    invoice_no: '',
    quantity: 10,
    unit_cost: 0,
    total_amount: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    notes: ''
  });

  // Open Quick Purchase Modal from Crafting Screen
  const openPurchaseMaterialModal = (material, suggestedQty = 0) => {
    if (!material) return;
    setPurchasingMaterial(material);
    const unitCost = Number(material.cost_price || getMaterialEffectivePrice(material) || 0);
    const qty = suggestedQty > 0 ? suggestedQty : (material.unit === 'ct' ? 5 : (material.unit === 'pcs' ? 10 : 50));
    const randNum = Math.floor(10000 + Math.random() * 90000);

    setPurchaseForm({
      supplier_id: material.supplier_id || (suppliers[0]?.id ? String(suppliers[0].id) : ''),
      invoice_no: `PUR-${randNum}`,
      quantity: qty,
      unit_cost: unitCost,
      total_amount: (qty * unitCost).toFixed(2),
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'completed', // Immediately stock into vault catalog
      notes: `Restock of ${material.name} for Crafting Order ${formData.order_no || ''}`
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
          ? `បានបញ្ជាទិញ ${purchasingMaterial.name} ចំនួន ${purchaseForm.quantity}${purchasingMaterial.unit || 'g'} ពីអ្នកផ្គត់ផ្គង់ជោគជ័យ! ស្តុកត្រូវបានបញ្ចូល។`
          : `Restocked ${purchaseForm.quantity}${purchasingMaterial.unit || 'g'} of ${purchasingMaterial.name} from supplier!`,
        'success'
      );
      setIsPurchaseModalOpen(false);
      refreshAllData(true);
    } catch (err) {
      console.error('Quick purchase error in MadeProductsView:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការបញ្ជាទិញសម្ភារៈ' : 'Failed to create material purchase order', 'error');
    }
  };

  // Form State
  const initialForm = {
    product_id: '',
    material_id: '',
    metal_type_id: '',
    supplier_id: '',
    user_id: '',
    order_no: '',
    quantity: 1,
    metal_weight_used: '',
    waste_weight: '0',
    crafting_cost: '',
    status: 'pending',
    started_at: '',
    completed_at: '',
    notes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const openAddModal = () => {
    setEditingItem(null);
    const autoCraftsman = getDefaultCraftsman();
    const defaultProd = products[0];
    const defaultMat = materials[0];
    const defaultWeightG = defaultProd ? (defaultProd.net_weight || defaultProd.gross_weight || 0) : 0;
    const defaultWeightChi = defaultWeightG > 0 ? (defaultWeightG / 3.75).toFixed(2) : '';

    setFormData({
      ...initialForm,
      order_no: `MJ-${Math.floor(1000 + Math.random() * 9000)}`,
      product_id: defaultProd?.id ? String(defaultProd.id) : '',
      material_id: defaultMat?.id ? String(defaultMat.id) : '',
      metal_type_id: defaultMat?.metal_type_id ? String(defaultMat.metal_type_id) : (metalTypes[0]?.id ? String(metalTypes[0].id) : ''),
      supplier_id: '',
      user_id: autoCraftsman?.id || currentUser?.id || '',
      metal_weight_used: defaultWeightChi,
      waste_weight: '0',
      crafting_cost: '',
      status: 'pending',
      started_at: '',
      completed_at: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    const weightG = parseFloat(item.metal_weight_used) || 0;
    const wasteG = parseFloat(item.waste_weight) || 0;
    let matId = item.material_id || item.material?.id || '';
    if (!matId && (item.metal_type_id || item.metal_type?.id)) {
      const matched = materials.find(m => String(m.metal_type_id) === String(item.metal_type_id || item.metal_type?.id));
      if (matched) matId = String(matched.id);
    }

    setFormData({
      product_id: item.product_id || item.product?.id || '',
      material_id: matId,
      metal_type_id: item.metal_type_id || item.metal_type?.id || item.metalType?.id || '',
      supplier_id: item.supplier_id || item.supplier?.id || '',
      user_id: item.user_id || item.user?.id || '',
      order_no: item.order_no || '',
      quantity: item.quantity || 1,
      metal_weight_used: weightG > 0 ? (weightG / 3.75).toFixed(2) : '',
      waste_weight: wasteG > 0 ? (wasteG / 3.75).toFixed(3) : '0',
      crafting_cost: item.crafting_cost || '',
      status: item.status || 'pending',
      started_at: item.started_at ? item.started_at.substring(0, 10) : '',
      completed_at: item.completed_at ? item.completed_at.substring(0, 10) : '',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  // Helper: Find matching raw material
  const findMatchingMaterial = (materialId, metalTypeId, productId) => {
    if (materialId) {
      const mat = materials.find(m => Number(m.id) === Number(materialId));
      if (mat) return mat;
    }
    if (productId) {
      const prod = products.find(p => p.id === Number(productId));
      if (prod && prod.material_id) {
        const mat = materials.find(m => Number(m.id) === Number(prod.material_id));
        if (mat) return mat;
      }
    }
    if (metalTypeId) {
      const mat = materials.find(m => 
        (m.metal_type_id && String(m.metal_type_id) === String(metalTypeId)) ||
        (m.metal_type?.id && String(m.metal_type.id) === String(metalTypeId))
      );
      if (mat) return mat;
    }
    return materials[0] || null;
  };

  const checkMaterialStockGuard = (materialId, metalTypeId, productId, metalWeightUsed, wasteWeight, quantity, targetStatus, isWeightInGrams = false, orderItem = null) => {
    if (targetStatus !== 'in_progress' && targetStatus !== 'completed') {
      return true;
    }

    const mat = findMatchingMaterial(materialId, metalTypeId, productId);
    const stock = mat ? Number(mat.stock_qty || 0) : 0;
    const metalGrams = isWeightInGrams ? (parseFloat(metalWeightUsed) || 0) : ((parseFloat(metalWeightUsed) || 0) * 3.75);
    const wasteGrams = isWeightInGrams ? (parseFloat(wasteWeight) || 0) : ((parseFloat(wasteWeight) || 0) * 3.75);
    const weightNeeded = (metalGrams + wasteGrams) * (parseInt(quantity, 10) || 1);
    const required = weightNeeded > 0 ? weightNeeded : 1;

    if (!mat || stock <= 0 || stock < required) {
      const deficit = Math.max(0, required - stock);
      const prod = products.find(p => p.id === Number(productId));
      const metal = metalTypes.find(m => m.id === Number(metalTypeId));

      setShortageModalData({
        orderItem,
        material: mat,
        product: prod,
        metal: metal,
        targetStatus,
        currentStock: stock,
        requiredStock: required,
        deficit: deficit > 0 ? deficit : required,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.metal_type_id) {
      showToast(isKhmer ? 'សូមបំពេញព័ត៌មានចាំបាច់!' : 'Please fill required fields!', 'error');
      return;
    }

    const canProceed = await checkMaterialStockGuard(
      formData.material_id,
      formData.metal_type_id,
      formData.product_id,
      formData.metal_weight_used,
      formData.waste_weight,
      formData.quantity,
      formData.status,
      false,
      editingItem
    );

    if (!canProceed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const metalGrams = formData.metal_weight_used !== '' ? ((parseFloat(formData.metal_weight_used) || 0) * 3.75) : 0;
      const wasteGrams = formData.waste_weight !== '' ? ((parseFloat(formData.waste_weight) || 0) * 3.75) : 0;

      const payload = {
        product_id: Number(formData.product_id),
        material_id: formData.material_id ? Number(formData.material_id) : null,
        metal_type_id: Number(formData.metal_type_id || (materials.find(m => String(m.id) === String(formData.material_id))?.metal_type_id) || metalTypes[0]?.id),
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        user_id: formData.user_id ? Number(formData.user_id) : null,
        order_no: formData.order_no ? formData.order_no.trim() : null,
        quantity: Math.max(1, parseInt(formData.quantity, 10) || 1),
        metal_weight_used: metalGrams,
        waste_weight: wasteGrams,
        crafting_cost: formData.crafting_cost !== '' ? parseFloat(formData.crafting_cost) : 0,
        status: formData.status || 'pending',
        started_at: formData.started_at ? formData.started_at : null,
        completed_at: formData.completed_at ? formData.completed_at : null,
        notes: formData.notes ? formData.notes.trim() : null
      };

      if (editingItem) {
        await updateMadeProduct(editingItem.id, payload);
        showToast(isKhmer ? 'បានកែប្រែទិន្នន័យដោយជោគជ័យ!' : 'Crafting order updated successfully!', 'success');
      } else {
        await addMadeProduct(payload);
        showToast(isKhmer ? 'បានបង្កើតការបញ្ជាកែច្នៃថ្មីដោយជោគជ័យ!' : 'Crafting order created successfully!', 'success');
      }
      setIsModalOpen(false);
      refreshAllData(true);
    } catch (err) {
      console.error('Error saving made jewelry order:', err);
      const data = err?.response?.data;
      if (data?.error_type === 'material_stock_empty') {
        const mat = materials.find(m => Number(m.id) === Number(data.material_id)) || materials[0];
        const curStock = data.current_stock ?? (mat?.stock_qty || 0);
        const reqStock = data.required_stock ?? 5;
        setShortageModalData({
          orderItem: editingItem,
          material: mat,
          product: products.find(p => p.id === Number(formData.product_id)),
          targetStatus: formData.status,
          currentStock: curStock,
          requiredStock: reqStock,
          deficit: Math.max(0, reqStock - curStock) || 10,
        });
      }
      const errMsg = err?.response?.data?.message || (isKhmer ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error saving record');
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបការបញ្ជាកែច្នៃគ្រឿងអលង្ការ?' : 'Delete Crafting Order?',
      text: isKhmer
        ? `តើអ្នកប្រាកដថាចង់លុបប័ណ្ណបញ្ជា #${item.order_no || item.id} នេះមែនទេ?`
        : `Are you sure you want to delete order #${item.order_no || item.id}?`,
      confirmButtonText: isKhmer ? 'លុប' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      await deleteMadeProduct(item);
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    const canProceed = checkMaterialStockGuard(
      item.material_id || item.material?.id,
      item.metal_type_id || item.metal_type?.id,
      item.product_id || item.product?.id,
      item.metal_weight_used,
      item.waste_weight,
      item.quantity,
      newStatus,
      true,
      item
    );

    if (!canProceed) {
      return;
    }

    try {
      await updateMadeProductStatus(item.id, newStatus);
      showToast(isKhmer ? 'បានផ្លាស់ប្ដូរស្ថានភាពរួចរាល់' : `Status changed to ${newStatus}`, 'success');
      refreshAllData(true);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.error_type === 'material_stock_empty') {
        const mat = materials.find(m => Number(m.id) === Number(data.material_id)) || item.material || materials[0];
        const curStock = data.current_stock ?? (mat?.stock_qty || 0);
        const reqStock = data.required_stock ?? 5;
        setShortageModalData({
          orderItem: item,
          material: mat,
          product: item.product,
          targetStatus: newStatus,
          currentStock: curStock,
          requiredStock: reqStock,
          deficit: Math.max(0, reqStock - curStock) || 10,
        });
      }
      const errMsg = err?.response?.data?.message || (isKhmer ? 'មិនអាចប្តូរស្ថានភាពបានទេ' : 'Failed to update status');
      showToast(errMsg, 'error');
    }
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    return (madeProducts || []).filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const orderNo = (item.order_no || '').toLowerCase();
      const prodName = (item.product?.name || '').toLowerCase();
      const prodSku = (item.product?.code_sku || '').toLowerCase();
      const craftsman = (item.user?.name || '').toLowerCase();

      const matchQuery = !q || orderNo.includes(q) || prodName.includes(q) || prodSku.includes(q) || craftsman.includes(q);
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchMetal = metalFilter === 'all' || String(item.metal_type_id || item.metal_type?.id) === String(metalFilter);

      return matchQuery && matchStatus && matchMetal;
    });
  }, [madeProducts, searchQuery, statusFilter, metalFilter]);

  // Statistics
  const stats = useMemo(() => {
    const list = madeProducts || [];
    const total = list.length;
    const inProgress = list.filter(p => p.status === 'in_progress').length;
    const completed = list.filter(p => p.status === 'completed').length;
    const totalCost = list.reduce((sum, p) => sum + (parseFloat(p.crafting_cost) || 0), 0);
    const totalMetal = list.reduce((sum, p) => sum + (parseFloat(p.metal_weight_used) || 0), 0);

    return { total, inProgress, completed, totalCost, totalMetal };
  }, [madeProducts]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── Header with Luxury Jewelry Aesthetics ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs tracking-wider uppercase mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 font-bold text-[11px]">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3 text-amber-600" />
              <span>{isKhmer ? 'សិប្បកម្ម & ការកែច្នៃគ្រឿងអលង្ការ' : 'Atelier Crafting & Production'}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif tracking-tight">
            {isKhmer ? 'គ្រឿងអលង្ការកែច្នៃ & សិប្បកម្មមាស' : 'Made Jewelry & Atelier Crafting'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isKhmer
              ? 'គ្រប់គ្រងការបញ្ជាកែច្នៃគ្រឿងអលង្ការ ការប្រើប្រាស់ទម្ងន់មាស ថ្លៃឈ្នួល និងជាងទងទទួលខុសត្រូវ'
              : 'Track bespoke jewelry crafting orders, gold metal consumption, jeweler assignments & labor expenses'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => refreshAllData(false)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title={isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh Data'}
          >
            <FontAwesomeIcon icon={faRotateRight} className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 hover:shadow-amber-500/30"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បង្កើតការកែច្នៃថ្មី' : 'New Crafting Order'}</span>
          </button>
        </div>
      </div>

      {/* ── Statistics Cards (Luxury Jewelry Atelier Style) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1.5">
            <span>{isKhmer ? 'ការបញ្ជាកែច្នៃសរុប' : 'Total Crafting Orders'}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <FontAwesomeIcon icon={faGem} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">{isKhmer ? 'គ្រប់ប័ណ្ណការងារកែច្នៃ' : 'All lifetime crafting orders'}</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-1.5">
            <span>{isKhmer ? 'កំពុងកែច្នៃ' : 'In Progress'}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
              <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 animate-spin" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-blue-900">{stats.inProgress}</p>
          <p className="text-[11px] text-blue-600 mt-1">{isKhmer ? 'នៅរោងជាងសិប្បកម្ម' : 'Active at jewelry workbench'}</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1.5">
            <span>{isKhmer ? 'រួចរាល់' : 'Completed'}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-emerald-900">{stats.completed}</p>
          <p className="text-[11px] text-emerald-600 mt-1">{isKhmer ? 'បញ្ចូលស្តុកលក់រួចរាល់' : 'Finished & ready for sale'}</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1.5">
            <span>{isKhmer ? 'មាសប្រើប្រាស់សរុប' : 'Total Metal Consumed'}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
              <FontAwesomeIcon icon={faScaleBalanced} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-amber-950">
            {(stats.totalMetal / 3.75).toFixed(2)} <span className="text-xs font-mono font-bold text-amber-800">{isKhmer ? 'ជី' : 'Chi'}</span>
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">
            {stats.totalMetal.toFixed(2)}g (1 ជី = 3.75g)
          </p>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
          <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
          <span>{filteredItems.length} {isKhmer ? 'បញ្ជាកែច្នៃគ្រឿងអលង្ការ' : 'orders listed'}</span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="text-slate-400 w-3 h-3" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">{isKhmer ? 'គ្រប់ស្ថានភាពទាំងអស់' : 'All Statuses'}</option>
              <option value="pending">{isKhmer ? 'រង់ចាំ' : 'Pending'}</option>
              <option value="in_progress">{isKhmer ? 'កំពុងកែច្នៃ' : 'In Progress'}</option>
              <option value="completed">{isKhmer ? 'រួចរាល់' : 'Completed'}</option>
              <option value="cancelled">{isKhmer ? 'បានបោះបង់' : 'Cancelled'}</option>
            </select>
          </div>

          <select
            value={metalFilter}
            onChange={(e) => { setMetalFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">{isKhmer ? 'គ្រប់កម្រិតទឹកមាស' : 'All Metal Types'}</option>
            {metalTypes.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Orders Table (Matching Jewelry Catalog Aesthetics) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[220px]">{isKhmer ? 'គ្រឿងអលង្ការកែច្នៃ' : 'Crafted Jewelry Piece'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'លេខប័ណ្ណ & កាលបរិច្ឆេទ' : 'Order No & Date'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'វត្ថុធាតុដើមមាស' : 'Raw Material'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ទម្ងន់មាស (ជី)' : 'Gold Weight (Chi)'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'ជាងទងទទួលខុសត្រូវ' : 'Craftsman / Jeweler'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ថ្លៃឈ្នួលជាង' : 'Labor Fee'}</th>
                <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center w-28 min-w-[110px] sticky right-0 bg-slate-50 shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                  {isKhmer ? 'សកម្មភាព' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                      <FontAwesomeIcon icon={faGem} className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{isKhmer ? 'រកមិនឃើញការបញ្ជាកែច្នៃគ្រឿងអលង្ការឡើយ' : 'No Made Jewelry orders found'}</p>
                    <p className="text-xs text-slate-400 mt-1">{isKhmer ? 'សូមចុច "បង្កើតការកែច្នៃថ្មី" ដើម្បីបញ្ចូលប័ណ្ណការងារ' : 'Click "New Crafting Order" to create an atelier order'}</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const metal = metalTypes.find(m => m.id === item.metal_type_id) || item.metal_type || item.metalType;
                  const weightGrams = parseFloat(item.metal_weight_used) || 0;
                  const weightChi = (weightGrams / 3.75).toFixed(2);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className="hover:bg-amber-50/50 transition-colors group cursor-pointer"
                      title={isKhmer ? 'ចុចដើម្បីមើល / កែប្រែ' : 'Click to view / edit'}
                    >
                      {/* Jewelry Piece */}
                      <td className="py-3.5 px-4 flex items-center gap-3 min-w-[220px]">
                        <img
                          src={item.product?.image || fallbackImg}
                          alt={item.product?.name || 'Jewelry'}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackImg;
                          }}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0 bg-slate-100 group-hover:border-amber-300 transition-colors"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate group-hover:text-amber-900 transition-colors">
                            {item.product?.name || (isKhmer ? 'គ្រឿងអលង្ការកែច្នៃតាមកម្ម៉ង់' : 'Custom Crafted Jewelry')}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono block truncate">
                            SKU: {item.product?.code_sku || 'N/A'} • {isKhmer ? 'ចំនួន' : 'Qty'}: {item.quantity || 1}
                          </span>
                        </div>
                      </td>

                      {/* Order No & Date */}
                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{item.order_no || `MJ-${item.id}`}</span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>

                      {/* Raw Material (Materials) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
                          {item.material?.name || metal?.name || 'Raw Material'}
                        </span>
                      </td>

                      {/* Weight in Chi & Grams */}
                      <td className="py-3.5 px-3 text-center font-mono whitespace-nowrap">
                        <span className="font-bold text-amber-900 block">{weightChi} {isKhmer ? 'ជី' : 'Chi'}</span>
                        <span className="text-[10px] text-slate-400 block">({weightGrams.toFixed(2)}g)</span>
                      </td>

                      {/* Craftsman & Supplier */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <FontAwesomeIcon icon={faUserTie} className="text-amber-600 w-3 h-3 shrink-0" />
                          <span className="truncate">{item.user?.name || (isKhmer ? 'ជាងទងផ្ទៃក្នុង' : 'In-House Jeweler')}</span>
                        </div>
                        {item.supplier && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <FontAwesomeIcon icon={faTruck} className="w-2.5 h-2.5 text-slate-400" />
                            <span className="truncate">{item.supplier.company_name || item.supplier.name}</span>
                          </div>
                        )}
                      </td>

                      {/* Crafting Labor Cost */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                        ${parseFloat(item.crafting_cost || 0).toFixed(2)}
                      </td>

                      {/* Status with Quick Selector */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={item.status || 'pending'}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all ${
                            (item.status || 'pending') === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/70'
                              : item.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100/70'
                              : item.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/70'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/70'
                          }`}
                        >
                          <option value="pending">{isKhmer ? 'រង់ចាំ' : 'Pending'}</option>
                          <option value="in_progress">{isKhmer ? 'កំពុងកែច្នៃ' : 'In Progress'}</option>
                          <option value="completed">{isKhmer ? 'រួចរាល់' : 'Completed'}</option>
                          <option value="cancelled">{isKhmer ? 'បានបោះបង់' : 'Cancelled'}</option>
                        </select>
                      </td>

                      {/* Sticky Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap w-20 min-w-[80px] sticky right-0 bg-white group-hover:bg-amber-50/50 transition-colors shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(item);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 cursor-pointer transition-colors"
                            title={isKhmer ? 'កែប្រែ' : 'Edit'}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
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
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal (Luxury 2-Column Atelier Layout with Pinned Header & Footer) ── */}
      {isModalOpen && (() => {
        const selectedProd = products.find(p => p.id === Number(formData.product_id)) || products[0];
        const selectedMtl = metalTypes.find(m => m.id === Number(formData.metal_type_id)) || metalTypes[0];
        const metalUsedChi = parseFloat(formData.metal_weight_used) || 0;
        const metalUsedGrams = metalUsedChi * 3.75;
        const laborCostNum = parseFloat(formData.crafting_cost) || 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
              
              {/* ── Fixed Modal Header ──────────────────────────────────────── */}
              <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                    <FontAwesomeIcon icon={faGem} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {editingItem
                        ? (isKhmer ? 'កែប្រែប័ណ្ណកែច្នៃគ្រឿងអលង្ការ' : 'Edit Made Jewelry Order')
                        : (isKhmer ? 'បង្កើតការបញ្ជាកែច្នៃគ្រឿងអលង្ការថ្មី' : 'New Made Jewelry Order')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isKhmer ? 'បំពេញព័ត៌មានគ្រឿងអលង្ការ ទម្ងន់មាស និងជាងទងទទួលបន្ទុក' : 'Specify precious metal parameters, weights, and jeweler assignment'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                  title={isKhmer ? 'បិទ' : 'Close'}
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>

              {/* ── Modal Body: 2-Column Studio Grid Layout ────────────────── */}
              <form id="made-jewelry-form" noValidate onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* ── Left Column: Crafting Specifications (7 Columns) ────── */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* Order Number & Quantity */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          {isKhmer ? 'លេខប័ណ្ណបញ្ជា' : 'Order Number'} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.order_no}
                          onChange={(e) => setFormData({ ...formData, order_no: e.target.value })}
                          className="w-full px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                          placeholder="MJ-1001"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          {isKhmer ? 'ចំនួន' : 'Quantity'} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                          className="w-full px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Target Product */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">
                        {isKhmer ? 'គ្រឿងអលង្ការគោលដៅ' : 'Target Jewelry Piece'} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.product_id}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const selected = products.find(p => p.id === Number(pId));
                          const newWeightG = selected ? (selected.net_weight || selected.gross_weight || 0) : 0;
                          const newWeightChi = newWeightG > 0 ? (newWeightG / 3.75).toFixed(2) : '';

                          setFormData(prev => ({
                            ...prev,
                            product_id: pId,
                            metal_weight_used: newWeightChi
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
                      >
                        <option value="">{isKhmer ? '-- ជ្រើសរើសគ្រឿងអលង្ការ --' : '-- Select Jewelry Piece --'}</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.code_sku})</option>
                        ))}
                      </select>
                    </div>

                    {/* Raw Material (Materials) */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">
                        {isKhmer ? 'វត្ថុធាតុដើមមាស (Materials)' : 'Raw Material'} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.material_id}
                        onChange={(e) => {
                          const selectedMatId = e.target.value;
                          const selectedMat = materials.find(m => String(m.id) === String(selectedMatId));
                          setFormData(prev => ({
                            ...prev,
                            material_id: selectedMatId,
                            metal_type_id: selectedMat?.metal_type_id ? String(selectedMat.metal_type_id) : prev.metal_type_id
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
                      >
                        <option value="">{isKhmer ? '-- ជ្រើសរើសវត្ថុធាតុដើម (Materials) --' : '-- Select Raw Material --'}</option>
                        {materials.map(mat => {
                          const stockChi = ((mat.stock_qty || 0) / 3.75).toFixed(2);
                          return (
                            <option key={mat.id} value={mat.id}>
                              {mat.name} — [{isKhmer ? 'ស្តុក' : 'Stock'}: {stockChi} {isKhmer ? 'ជី' : 'Chi'}]
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Gold Weight (Chi), Waste (Chi) & Labor Cost */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-slate-700 font-bold">
                            {isKhmer ? 'ទម្ងន់មាស (ជី)' : 'Metal Used (Chi)'} <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                            1 ជី = 3.75g
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.metal_weight_used}
                            onChange={(e) => setFormData({ ...formData, metal_weight_used: e.target.value })}
                            className="w-full px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all pr-10"
                            placeholder="1.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-800 pointer-events-none">
                            {isKhmer ? 'ជី' : 'Chi'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-medium mt-1 block">
                          ≈ {((parseFloat(formData.metal_weight_used) || 0) * 3.75).toFixed(2)} g
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-slate-700 font-bold">
                            {isKhmer ? 'កាកសំណល់ (ជី)' : 'Waste (Chi)'}
                          </label>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={formData.waste_weight}
                            onChange={(e) => setFormData({ ...formData, waste_weight: e.target.value })}
                            className="w-full px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all pr-10"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-800 pointer-events-none">
                            {isKhmer ? 'ជី' : 'Chi'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-medium mt-1 block">
                          ≈ {((parseFloat(formData.waste_weight) || 0) * 3.75).toFixed(2)} g
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          {isKhmer ? 'ថ្លៃឈ្នួលជាង ($)' : 'Labor Cost ($)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.crafting_cost}
                          onChange={(e) => setFormData({ ...formData, crafting_cost: e.target.value })}
                          className="w-full px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Craftsman & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-slate-700 font-bold">
                            {isKhmer ? 'ជាងទងទទួលខុសត្រូវ' : 'Assigned Craftsman'}
                          </label>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <FontAwesomeIcon icon={faLock} className="w-2.5 h-2.5 text-slate-400" />
                            <span>{isKhmer ? 'ស្វ័យប្រវត្តិ' : 'Auto Locked'}</span>
                          </span>
                        </div>
                        <select
                          disabled
                          value={formData.user_id}
                          className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed select-none opacity-90 transition-all"
                        >
                          <option value="">{isKhmer ? '-- ជាងទងទូទៅ --' : '-- General Atelier Staff --'}</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role_display || u.role_name || 'Staff'})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          {isKhmer ? 'ស្ថានភាពកែច្នៃ' : 'Crafting Status'} <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
                        >
                          <option value="pending">{isKhmer ? 'រង់ចាំ' : 'Pending'}</option>
                          <option value="in_progress">{isKhmer ? 'កំពុងកែច្នៃ' : 'In Progress'}</option>
                          <option value="completed">{isKhmer ? 'រួចរាល់' : 'Completed'}</option>
                          <option value="cancelled">{isKhmer ? 'បានបោះបង់' : 'Cancelled'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">
                        {isKhmer ? 'កំណត់ចំណាំផ្សេងៗ' : 'Crafting Notes & Instructions'}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all resize-none"
                        placeholder={isKhmer ? 'ឧ. ដាំត្បូងកណ្ដាល ២គ្រាប់, ឆ្លាក់អក្សរ...' : 'E.g. Double prong setting, customized engraving...'}
                      />
                    </div>

                  </div>

                  {/* ── Right Column: Live Jewelry Summary & Material Vault (5 Columns) ── */}
                  <div className="lg:col-span-5 space-y-4 flex flex-col">
                    
                    {/* Selected Jewelry Piece Live Summary Card */}
                    <div className="bg-gradient-to-br from-amber-50/70 via-slate-50 to-white border border-amber-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <FontAwesomeIcon icon={faGem} className="text-amber-600 w-3.5 h-3.5" />
                        <span>{isKhmer ? 'ទិន្នន័យគ្រឿងអលង្ការគោលដៅ' : 'Target Piece Overview'}</span>
                      </div>

                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-amber-200/50 shadow-2xs">
                        <img
                          src={selectedProd?.image || fallbackImg}
                          alt={selectedProd?.name || 'Jewelry'}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackImg;
                          }}
                          className="w-14 h-14 rounded-lg object-cover border border-amber-200 shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{selectedProd?.name || 'Custom Jewelry Item'}</p>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">{selectedProd?.code_sku || 'N/A'}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {selectedMtl?.name || 'Gold'}
                          </span>
                        </div>
                      </div>

                      {/* Live Weight & Labor Breakdown */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                          <span className="text-[10px] text-slate-400 block">{isKhmer ? 'ទម្ងន់មាសសរុប' : 'Crafting Weight'}</span>
                          <span className="font-bold font-mono text-amber-900 text-sm block mt-0.5">
                            {metalUsedChi} {isKhmer ? 'ជី' : 'Chi'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({metalUsedGrams.toFixed(2)}g)</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                          <span className="text-[10px] text-slate-400 block">{isKhmer ? 'ថ្លៃឈ្នួលជាង' : 'Making Labor'}</span>
                          <span className="font-bold font-mono text-slate-900 text-sm block mt-0.5">
                            ${laborCostNum.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold">{isKhmer ? 'ជាងទទួលបន្ទុក' : 'Craftsman'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Materials & Sourcing Availability Checker */}
                    {(() => {
                      const matchingMaterial = materials.find(m => 
                        (m.metal_type_id && String(m.metal_type_id) === String(formData.metal_type_id)) ||
                        (m.metal_type?.id && String(m.metal_type.id) === String(formData.metal_type_id)) ||
                        (selectedMtl?.name && m.name?.toLowerCase().includes(selectedMtl.name.toLowerCase()))
                      );
                      const requiredGrams = (parseFloat(formData.metal_weight_used) || 0) * 3.75;
                      const currentStock = matchingMaterial ? Number(matchingMaterial.stock_qty || 0) : 0;
                      const isShortage = matchingMaterial && (currentStock < requiredGrams || currentStock <= 0);
                      const deficit = isShortage ? Math.max(0, requiredGrams - currentStock) : 0;

                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faBoxesStacked} className="text-amber-600" />
                              <span>{isKhmer ? 'ពិនិត្យស្តុកសម្ភារៈចាំបាច់' : 'Material Vault Sourcing'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsModalOpen(false);
                                setActiveTab('materials');
                              }}
                              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                            >
                              {isKhmer ? 'មើលឃ្លាំង ➔' : 'Open Vault ➔'}
                            </button>
                          </div>

                          {/* Material Deficit Alert with Direct Supplier Purchase Action */}
                          {matchingMaterial && isShortage && (
                            <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-xl space-y-2 animate-fadeIn">
                              <div className="flex items-start gap-2 text-rose-800">
                                <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <div className="text-[11px] leading-tight">
                                  <p className="font-bold">
                                    {isKhmer ? 'ខ្វះខាតសម្ភារៈសម្រាប់កែច្នៃ!' : 'Insufficient Material in Stock!'}
                                  </p>
                                  <p className="text-slate-600 mt-0.5">
                                    {matchingMaterial.name}: {isKhmer ? 'ត្រូវការ' : 'Needed'} <b>{requiredGrams}g</b>, {isKhmer ? 'មានក្នុងស្តុក' : 'In stock'} <b>{currentStock}g</b> ({isKhmer ? 'ខ្វះ' : 'Deficit'} <b className="text-rose-600">-{deficit.toFixed(2)}g</b>)
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => openPurchaseMaterialModal(matchingMaterial, Math.max(Math.ceil(deficit > 0 ? deficit : 20), 10))}
                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                              >
                                <FontAwesomeIcon icon={faCartPlus} className="w-3 h-3" />
                                <span>{isKhmer ? 'បញ្ជាទិញសម្ភារៈពីអ្នកផ្គត់ផ្គង់ (PO)' : 'Purchase Materials from Supplier'}</span>
                              </button>
                            </div>
                          )}

                          {/* Quick Material Items List with Direct Purchase Buttons */}
                          <div className="space-y-1.5 max-h-44 overflow-y-auto">
                            {materials.slice(0, 5).map((mat) => {
                              const price = getMaterialEffectivePrice(mat);
                              const isOut = Number(mat.stock_qty) <= 0;
                              const isLow = Number(mat.stock_qty) <= Number(mat.min_stock_level || 0);

                              return (
                                <div key={mat.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200/80 text-xs hover:border-amber-200 transition-colors">
                                  <div>
                                    <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                      <span>{mat.name}</span>
                                      {mat.id === matchingMaterial?.id && (
                                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-bold">
                                          {isKhmer ? 'មាសគោលដៅ' : 'Target'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-mono text-[10px] text-amber-900 font-medium">
                                      ${price.toFixed(2)}/{mat.unit} {mat.use_metal_rate && '• Live Spot'}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                      isOut
                                        ? 'bg-rose-100 text-rose-700'
                                        : isLow
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {isOut ? (isKhmer ? 'អស់' : '0') : `${mat.stock_qty}${mat.unit}`}
                                    </span>

                                    {/* Direct Purchase Button */}
                                    <button
                                      type="button"
                                      onClick={() => openPurchaseMaterialModal(mat, 20)}
                                      className="p-1 px-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold transition-colors cursor-pointer"
                                      title={isKhmer ? 'ទិញសម្ភារៈនេះពីអ្នកផ្គត់ផ្គង់' : 'Purchase this material from supplier'}
                                    >
                                      <FontAwesomeIcon icon={faTruck} className="w-2.5 h-2.5 text-amber-600 mr-1" />
                                      <span>{isKhmer ? 'ទិញ' : 'Buy'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                  </div>

                </div>
              </form>

              {/* ── Fixed Modal Footer ──────────────────────────────────────── */}
              <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200/80 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  form="made-jewelry-form"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                    : (editingItem ? (isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Update Order') : (isKhmer ? 'បង្កើតប័ណ្ណកែច្នៃ' : 'Create Order'))}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ── MATERIAL SHORTAGE ALERT MODAL ── */}
      {shortageModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-auto animate-scaleUp">
            
            {/* Standard Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {isKhmer ? 'ស្តុកសម្ភារៈមិនគ្រប់គ្រាន់' : 'Raw Material Stock Unavailable'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'ការជូនដំណឹងស្តុកសម្ភារៈកែច្នៃ' : 'Atelier Material Stock Alert'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShortageModalData(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title={isKhmer ? 'បិទ' : 'Close'}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              
              {/* Status Lock Warning Banner */}
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-rose-900 mb-0.5">
                    {isKhmer
                      ? `មិនអាចកំណត់ស្ថានភាពទៅ "${shortageModalData.targetStatus === 'in_progress' ? 'កំពុងកែច្នៃ (In Progress)' : 'រួចរាល់ (Completed)'}" បានទេ!`
                      : `Cannot set crafting status to "${shortageModalData.targetStatus === 'in_progress' ? 'In Progress' : 'Completed'}"!`}
                  </p>
                  <p className="text-rose-700">
                    {isKhmer
                      ? 'សម្ភារៈចាំបាច់ក្នុងឃ្លាំងមិនមានស្តុកគ្រប់គ្រាន់សម្រាប់ការកែច្នៃឡើយ។ សូមបញ្ជាទិញពីអ្នកផ្គត់ផ្គង់ (PO) ជាមុនសិន។'
                      : 'The required material has 0 or insufficient stock in the vault. Please purchase materials to proceed.'}
                  </p>
                </div>
              </div>

              {/* Material & Deficit Spec Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCoins} className="text-slate-500 w-3 h-3" />
                    <span>{isKhmer ? 'សម្ភារៈចាំបាច់សម្រាប់ការកែច្នៃ' : 'Required Raw Material'}</span>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold border border-rose-200">
                    {shortageModalData.currentStock <= 0
                      ? (isKhmer ? 'អស់ស្តុក (Stock: 0)' : 'Stock: 0')
                      : `${(shortageModalData.currentStock / 3.75).toFixed(2)} ជី (${shortageModalData.currentStock}g)`}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{shortageModalData.material?.name || 'Material'}</span>
                    <span className="text-xs font-mono text-slate-400">{shortageModalData.material?.code || 'MAT-RAW'}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center font-mono">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">{isKhmer ? 'ស្តុកបច្ចុប្បន្ន' : 'In Vault'}</span>
                      <span className="font-bold text-rose-600 text-xs block mt-0.5">
                        {(shortageModalData.currentStock / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">({shortageModalData.currentStock}g)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">{isKhmer ? 'តម្រូវការកែច្នៃ' : 'Required'}</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {(shortageModalData.requiredStock / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">({shortageModalData.requiredStock.toFixed(2)}g)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                      <span className="text-[10px] text-rose-500 block">{isKhmer ? 'ខ្វះខាត' : 'Deficit'}</span>
                      <span className="font-bold text-rose-700 text-xs block mt-0.5">
                        -{(shortageModalData.deficit / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                      </span>
                      <span className="text-[10px] text-rose-500 block font-mono">(-{shortageModalData.deficit.toFixed(2)}g)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShortageModalData(null)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>

                {/* Instant Vault Restock Button */}
                <button
                  type="button"
                  onClick={async () => {
                    if (!shortageModalData?.material?.id) return;
                    const mat = shortageModalData.material;
                    const def = shortageModalData.deficit || 10;
                    const restockQty = Math.max(Math.ceil(def + 10), 20);
                    const targetItem = shortageModalData.orderItem;
                    const targetStatus = shortageModalData.targetStatus || 'in_progress';

                    try {
                      await quickRestockMaterial(mat.id, restockQty, `Quick vault top-up for crafting order #${targetItem?.order_no || targetItem?.id || ''}`);
                      showToast(
                        isKhmer
                          ? `បានបញ្ចូលស្តុក ${restockQty}g (${(restockQty / 3.75).toFixed(2)} ជី) នៃ ${mat.name} ជោគជ័យ!`
                          : `Restocked ${restockQty}g (${(restockQty / 3.75).toFixed(2)} Chi) of ${mat.name} into vault!`,
                        'success'
                      );

                      if (targetItem && targetItem.id) {
                        try {
                          await updateMadeProductStatus(targetItem.id, targetStatus);
                          showToast(
                            isKhmer
                              ? `ប័ណ្ណការងារ #${targetItem.order_no || targetItem.id} ត្រូវបានកំណត់ជា "${targetStatus === 'in_progress' ? 'កំពុងកែច្នៃ' : 'រួចរាល់'}" ជោគជ័យ!`
                              : `Order #${targetItem.order_no || targetItem.id} set to ${targetStatus === 'in_progress' ? 'In Progress' : 'Completed'}!`,
                            'success'
                          );
                        } catch (statusErr) {
                          console.error('Auto status change after restock failed:', statusErr);
                        }
                      }

                      setShortageModalData(null);
                      refreshAllData(true);
                    } catch (e) {
                      console.error('Instant restock error:', e);
                      showToast(isKhmer ? 'បរាជ័យក្នុងការបញ្ចូលស្តុក' : 'Failed to restock material', 'error');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faRotateRight} className="w-3.5 h-3.5" />
                  <span>
                    {isKhmer
                      ? `⚡ បញ្ចូលស្តុកភ្លាមៗ (+${Math.max(Math.ceil((shortageModalData.deficit || 10) + 10), 20)}g) & ចាប់ផ្ដើម`
                      : `⚡ Quick Restock (+${Math.max(Math.ceil((shortageModalData.deficit || 10) + 10), 20)}g) & Proceed`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const mat = shortageModalData.material;
                    const def = shortageModalData.deficit;
                    setShortageModalData(null);
                    if (mat) {
                      openPurchaseMaterialModal(mat, Math.max(Math.ceil(def > 0 ? def : 20), 10));
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faCartPlus} className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'បង្កើតប័ណ្ណទិញពីអ្នកផ្គត់ផ្គង់ (PO)' : 'Purchase (PO)'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── QUICK INBOUND PURCHASE MODAL FOR CRAFTING ─────────────────── */}
      {isPurchaseModalOpen && purchasingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <FontAwesomeIcon icon={faTruck} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {isKhmer ? 'បញ្ជាទិញសម្ភារៈពីអ្នកផ្គត់ផ្គង់ (Inbound PO)' : 'Purchase Materials from Supplier'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {purchasingMaterial.name} • <span className="font-mono">{purchasingMaterial.code || `MAT-${purchasingMaterial.id}`}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleQuickPurchaseSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
              
              {/* Supplier Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {isKhmer ? 'ជ្រើសរើសអ្នកផ្គត់ផ្គង់ (Supplier / Refinery)' : 'Supplier / Refinery'} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={purchaseForm.supplier_id}
                  onChange={e => setPurchaseForm({ ...purchaseForm, supplier_id: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
                >
                  <option value="">{isKhmer ? '-- ជ្រើសរើសអ្នកផ្គត់ផ្គង់ --' : '-- Choose supplier --'}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.company_name || s.name} {s.phone && `• ${s.phone}`}</option>
                  ))}
                </select>
              </div>

              {/* Invoice & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'លេខ PO / វិក្កយបត្រ' : 'PO / Invoice #'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.invoice_no}
                    onChange={e => setPurchaseForm({ ...purchaseForm, invoice_no: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'កាលបរិច្ឆេទបញ្ជាទិញ' : 'Purchase Date'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.purchase_date}
                    onChange={e => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>
              </div>

              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'បរិមាណទិញចូល' : 'Quantity to Buy'} ({purchasingMaterial.unit || 'g'}) <span className="text-rose-500">*</span>
                  </label>
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
                    className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'តម្លៃឯកតា ($ / Unit)' : 'Unit Cost ($)'} <span className="text-rose-500">*</span>
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
                    className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>
              </div>

              {/* Dynamic Live Valuation Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faScaleBalanced} className="text-slate-500 w-3 h-3" />
                    <span>{isKhmer ? 'ទឹកប្រាក់បញ្ជាទិញសរុប' : 'Total Purchase Amount'}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                    USD
                  </span>
                </div>

                <div className="text-2xl font-extrabold font-mono text-slate-900">
                  ${Number(purchaseForm.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div className="text-xs text-slate-500 font-medium pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span>{purchaseForm.quantity || 0} {purchasingMaterial.unit || 'g'} @ ${Number(purchaseForm.unit_cost || 0).toFixed(2)}/{purchasingMaterial.unit || 'g'}</span>
                  <span className="text-emerald-600 font-semibold">{isKhmer ? 'បញ្ចូលស្តុកស្វ័យប្រវត្តិ' : 'Auto Restock Vault'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  {isKhmer ? 'បញ្ជាក់ការបញ្ជាទិញ & បញ្ចូលស្តុក' : 'Confirm Purchase & Restock'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export const MadeJewelryView = MadeProductsView;
export default MadeProductsView;
