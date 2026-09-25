import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxesStacked,
  faPlus,
  faTruck,
  faTruckFast,
  faCheck,
  faCheckCircle,
  faClock,
  faCircleExclamation,
  faBan,
  faFilter,
  faXmark,
  faSearch,
  faBuilding,
  faPhone,
  faDollarSign,
  faCalendarDays,
  faFileInvoice,
  faPenToSquare,
  faTrashCan,
  faEye,
  faArrowsRotate,
  faBoxesPacking,
  faFileLines,
  faGem,
  faCoins,
  faScaleBalanced,
  faCube,
  faListCheck,
  faCartPlus
} from '@fortawesome/free-solid-svg-icons';

export const PurchasesView = () => {
  const { t, i18n } = useTranslation();
  const {
    purchases,
    suppliers,
    materials,
    getMaterialEffectivePrice,
    addPurchase,
    updatePurchase,
    deletePurchase,
    confirmPurchaseArrival,
    cancelPurchaseOrder,
    exchangeRate,
    searchQuery,
    setSearchQuery,
    confirmDialog,
    showToast
  } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';
  const khrRate = exchangeRate?.rate || 4100;

  // Search & Filter State
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'cancelled'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_no: '',
    total_amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
    items: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // View Details Modal State
  const [viewingPurchase, setViewingPurchase] = useState(null);

  const activeSearch = (searchQuery || '').toLowerCase().trim();

  // Filter purchases
  const filteredPurchases = purchases.filter(p => {
    // Status filter
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // Search filter
    if (activeSearch) {
      const supName = (p.supplier?.company_name || p.supplier?.name || p.supplier_name || '').toLowerCase();
      const invNo = (p.invoice_no || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      const itemNames = Array.isArray(p.items) ? p.items.map(it => it.name || '').join(' ').toLowerCase() : '';
      if (!supName.includes(activeSearch) && !invNo.includes(activeSearch) && !notes.includes(activeSearch) && !itemNames.includes(activeSearch)) {
        return false;
      }
    }
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearch, statusFilter]);

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Stats
  const totalPurchasesCount = purchases.length;
  const pendingPurchases = purchases.filter(p => p.status === 'pending');
  const completedPurchases = purchases.filter(p => p.status === 'completed');
  const totalSpendUsd = purchases
    .filter(p => p.status !== 'cancelled')
    .reduce((acc, p) => acc + (Number(p.total_amount) || 0), 0);

  // Helper to calculate total from items
  const recalculateTotal = (itemsList) => {
    const total = itemsList.reduce((sum, it) => sum + (Number(it.total_cost) || 0), 0);
    return total > 0 ? total.toFixed(2) : '';
  };

  // Open Add Modal
  const openAddModal = (initialMaterialId = null) => {
    setEditingPurchase(null);
    const randNum = Math.floor(10000 + Math.random() * 90000);
    
    let defaultItems = [];
    const targetMat = initialMaterialId && materials.length > 0
      ? materials.find(m => m.id === Number(initialMaterialId))
      : (materials.length > 0 ? materials[0] : null);

    if (targetMat) {
      let unitCost = Number(targetMat.cost_price || (getMaterialEffectivePrice ? getMaterialEffectivePrice(targetMat) : 0) || 0);
      if (unitCost <= 0) {
        if (targetMat.unit === 'chi' || targetMat.unit === 'ជី') unitCost = 320;
        else if (targetMat.unit === 'g' || targetMat.unit === 'gram') unitCost = 85.5;
        else if (targetMat.unit === 'ct') unitCost = 150;
        else unitCost = 25;
      }
      const defaultQty = Number(targetMat.min_stock_level) > 0 ? Number(targetMat.min_stock_level) : (targetMat.unit === 'ct' ? 5 : (targetMat.unit === 'pcs' ? 10 : 5));
      const totalCost = Number((defaultQty * unitCost).toFixed(2));
      defaultItems = [{
        id: Date.now(),
        material_id: String(targetMat.id),
        name: targetMat.name,
        unit: targetMat.unit || 'chi',
        quantity: defaultQty,
        unit_cost: unitCost,
        total_cost: totalCost
      }];
    }

    setFormData({
      supplier_id: suppliers.length > 0 ? String(suppliers[0].id) : '',
      invoice_no: `PUR-${randNum}`,
      total_amount: defaultItems.length > 0 ? recalculateTotal(defaultItems) : '',
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: '',
      items: defaultItems
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (purchase) => {
    setEditingPurchase(purchase);
    const rawItems = Array.isArray(purchase.items) ? purchase.items : [];
    setFormData({
      supplier_id: String(purchase.supplier_id || ''),
      invoice_no: purchase.invoice_no || '',
      total_amount: String(purchase.total_amount || ''),
      purchase_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
      status: purchase.status || 'pending',
      notes: purchase.notes || '',
      items: rawItems.map(it => ({
        id: it.id || (Date.now() + Math.random()),
        material_id: it.material_id ? String(it.material_id) : '',
        name: it.name || '',
        unit: it.unit || 'chi',
        quantity: Number(it.quantity || it.qty || 1),
        unit_cost: Number(it.unit_cost || it.cost_price || 0),
        total_cost: Number(it.total_cost || (Number(it.quantity || it.qty || 1) * Number(it.unit_cost || it.cost_price || 0)))
      }))
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Item management in modal
  const handleAddItemRow = () => {
    const firstMat = materials.length > 0 ? materials[0] : null;
    let uCost = firstMat ? Number(firstMat.cost_price || (getMaterialEffectivePrice ? getMaterialEffectivePrice(firstMat) : 0) || 0) : 0;
    if (firstMat && uCost <= 0) {
      if (firstMat.unit === 'chi' || firstMat.unit === 'ជី') uCost = 320;
      else if (firstMat.unit === 'g' || firstMat.unit === 'gram') uCost = 85.5;
      else if (firstMat.unit === 'ct') uCost = 150;
      else uCost = 25;
    }
    const defaultQty = firstMat ? (firstMat.unit === 'ct' ? 5 : (firstMat.unit === 'pcs' ? 10 : 5)) : 1;
    const newItem = {
      id: Date.now() + Math.random(),
      material_id: firstMat ? String(firstMat.id) : '',
      name: firstMat ? firstMat.name : '',
      unit: firstMat ? (firstMat.unit || 'chi') : 'chi',
      quantity: defaultQty,
      unit_cost: uCost,
      total_cost: Number((defaultQty * uCost).toFixed(2))
    };
    const updatedItems = [...formData.items, newItem];
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      total_amount: recalculateTotal(updatedItems) || prev.total_amount
    }));
  };

  const handleRemoveItemRow = (id) => {
    const updatedItems = formData.items.filter(it => it.id !== id);
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      total_amount: recalculateTotal(updatedItems) || (updatedItems.length === 0 ? '' : prev.total_amount)
    }));
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = formData.items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      
      // If user changed material selection
      if (field === 'material_id') {
        const mat = materials.find(m => String(m.id) === String(value));
        if (mat) {
          let uCost = Number(mat.cost_price || (getMaterialEffectivePrice ? getMaterialEffectivePrice(mat) : 0) || 0);
          if (uCost <= 0) {
            if (mat.unit === 'chi' || mat.unit === 'ជី') uCost = 320;
            else if (mat.unit === 'g' || mat.unit === 'gram') uCost = 85.5;
            else if (mat.unit === 'ct') uCost = 150;
            else uCost = 25;
          }
          updated.name = mat.name;
          updated.unit = mat.unit || 'g';
          updated.unit_cost = uCost;
          updated.total_cost = Number((Number(updated.quantity || 1) * uCost).toFixed(2));
        }
      }
      // If user changed quantity or unit_cost
      if (field === 'quantity' || field === 'unit_cost') {
        const q = field === 'quantity' ? Number(value) : Number(it.quantity || 0);
        const c = field === 'unit_cost' ? Number(value) : Number(it.unit_cost || 0);
        updated.total_cost = Math.round(q * c * 100) / 100;
      }
      return updated;
    });

    const newTotal = recalculateTotal(updatedItems);
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      total_amount: newTotal || prev.total_amount
    }));
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.supplier_id) {
      errs.supplier_id = isKhmer ? 'សូមជ្រើសរើសអ្នកផ្គត់ផ្គង់!' : 'Please select a supplier!';
    }
    if (!formData.invoice_no.trim()) {
      errs.invoice_no = isKhmer ? 'សូមបញ្ចូលលេខវិក្កយបត្របញ្ជាទិញ!' : 'Invoice number is required!';
    }
    if (!formData.total_amount || isNaN(Number(formData.total_amount)) || Number(formData.total_amount) <= 0) {
      errs.total_amount = isKhmer ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រឹមត្រូវ!' : 'Please enter a valid amount!';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      showToast(isKhmer ? 'សូមពិនិត្យព័ត៌មានដែលខ្វះ!' : 'Please complete all required fields!', 'warning');
      return;
    }

    setSaving(true);
    try {
      const cleanItems = formData.items.map(it => ({
        material_id: it.material_id ? Number(it.material_id) : null,
        name: it.name || 'Raw Material Item',
        unit: it.unit || 'g',
        quantity: Number(it.quantity) || 1,
        unit_cost: Number(it.unit_cost) || 0,
        total_cost: Number(it.total_cost) || 0
      }));

      const payload = {
        supplier_id: Number(formData.supplier_id),
        invoice_no: formData.invoice_no.trim(),
        total_amount: Number(formData.total_amount),
        purchase_date: formData.purchase_date,
        status: formData.status,
        notes: formData.notes,
        items: cleanItems
      };

      if (editingPurchase) {
        await updatePurchase(editingPurchase.id, payload);
        showToast(isKhmer ? 'បានកែប្រែការបញ្ជាទិញជោគជ័យ!' : 'Purchase order updated successfully!', 'success');
      } else {
        await addPurchase(payload);
        showToast(isKhmer ? 'បានបង្កើតការបញ្ជាទិញថ្មីជោគជ័យ!' : 'Purchase order created successfully!', 'success');
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save purchase:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save purchase order', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Confirm Arrival Action
  const handleConfirmArrival = async (purchase) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'បញ្ជាក់ការទទួលទំនិញចូលស្តុក?' : 'Confirm Shipment Arrival?',
      text: isKhmer
        ? `តើទំនិញវិក្កយបត្រ "${purchase.invoice_no}" បានមកដល់ និងពិនិត្យត្រឹមត្រូវរួចរាល់ហើយមែនទេ? ស្ថានភាពនឹងត្រូវបានប្តូរទៅជា "បានទទួល / Completed"។`
        : `Has shipment "${purchase.invoice_no}" arrived and passed quality inspection? This will mark the order as Completed / Stocked.`,
      confirmButtonText: isKhmer ? 'បាទ/ចាស, ទទួលចូលស្តុក' : 'Yes, Receive Stock',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: false,
      icon: 'question'
    });

    if (confirmed) {
      await confirmPurchaseArrival(purchase.id);
      showToast(
        isKhmer
          ? `ការបញ្ជាទិញ ${purchase.invoice_no} ត្រូវបានទទួលចូលស្តុកជោគជ័យ!`
          : `Shipment ${purchase.invoice_no} confirmed & received into stock!`,
        'success'
      );
    }
  };

  // Handle Quick Cancel Purchase Order
  const handleCancelOrder = async (purchase) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'បោះបង់ការបញ្ជាទិញ?' : 'Cancel Purchase Order?',
      text: isKhmer
        ? `តើអ្នកពិតជាចង់បោះបង់ការបញ្ជាទិញលេខ "${purchase.invoice_no}" នេះមែនទេ? ស្ថានភាពនឹងប្តូរទៅជា "បានបោះបង់ / Cancelled"។`
        : `Are you sure you want to cancel purchase order "${purchase.invoice_no}"? Order status will change to Cancelled.`,
      confirmButtonText: isKhmer ? 'យល់ព្រមបោះបង់' : 'Yes, Cancel Order',
      cancelButtonText: isKhmer ? 'ត្រឡប់ក្រោយ' : 'Go Back',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      await cancelPurchaseOrder(purchase.id);
      showToast(
        isKhmer
          ? `ការបញ្ជាទិញ ${purchase.invoice_no} ត្រូវបានបោះបង់រួចរាល់!`
          : `Purchase order ${purchase.invoice_no} has been cancelled!`,
        'info'
      );
    }
  };

  // Handle Delete Purchase
  const handleDelete = async (purchase) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបការបញ្ជាទិញ?' : 'Delete Purchase Order?',
      text: isKhmer
        ? `តើអ្នកពិតជាចង់លុបការបញ្ជាទិញលេខ "${purchase.invoice_no}" នេះចេញពីប្រព័ន្ធមែនទេ? (សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ)`
        : `Are you sure you want to permanently delete purchase order "${purchase.invoice_no}"? This action cannot be undone.`,
      confirmButtonText: isKhmer ? 'យល់ព្រមលុប' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      await deletePurchase(purchase.id);
      showToast(isKhmer ? 'បានលុបការបញ្ជាទិញជោគជ័យ' : 'Purchase order deleted successfully', 'success');
    }
  };

  return (
    <div className="space-y-6 w-full select-none">
      
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
            <FontAwesomeIcon icon={faBoxesStacked} className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 font-serif flex items-center gap-2">
              <span>{isKhmer ? 'ការបញ្ជាទិញទំនិញ & នាំចូលស្តុក' : 'Purchase Orders & Inbound Stock'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                {purchases.length} {isKhmer ? 'កញ្ចប់' : 'Orders'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKhmer
                ? 'គ្រប់គ្រងការបញ្ជាទិញមាស & គ្រឿងអលង្ការពីអ្នកផ្គត់ផ្គង់ និងបញ្ជាក់ការទទួលទំនិញចូលស្តុក'
                : 'Manage supplier purchase orders, track inbound shipments, and confirm received inventory'}
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>{isKhmer ? 'បង្កើតការបញ្ជាទិញថ្មី' : 'New Purchase Order'}</span>
        </button>
      </div>

      {/* ── Stats Summary Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Orders Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {isKhmer ? 'ការបញ្ជាទិញសរុប' : 'Total Purchase Orders'}
            </span>
            <p className="text-2xl font-black font-mono text-slate-900 mt-1">
              {totalPurchasesCount}
            </p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {suppliers.length} {isKhmer ? 'ដៃគូផ្គត់ផ្គង់' : 'supply partners'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-base shrink-0">
            <FontAwesomeIcon icon={faFileLines} />
          </div>
        </div>

        {/* Pending Inbound Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-amber-200/90 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
              {isKhmer ? 'ទំនិញកំពុងដឹកជញ្ជូន' : 'Pending Inbound'}
            </span>
            <p className="text-2xl font-black font-mono text-amber-950 mt-1 flex items-center gap-2">
              <span>{pendingPurchases.length}</span>
              {pendingPurchases.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </p>
            <span className="text-[10px] font-semibold text-amber-700 mt-0.5 block">
              {isKhmer ? 'រង់ចាំពិនិត្យទទួលចូលស្តុក' : 'Awaiting arrival & check-in'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-base shrink-0">
            <FontAwesomeIcon icon={faTruck} />
          </div>
        </div>

        {/* Completed Stocked Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {isKhmer ? 'បានទទួលចូលស្តុក' : 'Arrived & Received'}
            </span>
            <p className="text-2xl font-black font-mono text-emerald-700 mt-1">
              {completedPurchases.length}
            </p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {isKhmer ? 'ទំនិញមានក្នុងស្តុកស្រេច' : 'Stocked into vault catalog'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base shrink-0 border border-emerald-200/60">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
        </div>

        {/* Total Spend Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {isKhmer ? 'ទំហំចំណាយបញ្ជាទិញសរុប' : 'Total Purchase Spend'}
            </span>
            <p className="text-xl font-black font-mono text-slate-900 mt-1">
              ${totalSpendUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] font-mono text-amber-800 font-bold mt-0.5 block">
              ≈ {(totalSpendUsd * khrRate).toLocaleString()} ៛ KHR
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-base shrink-0 shadow-xs">
            <FontAwesomeIcon icon={faDollarSign} />
          </div>
        </div>

      </div>

      {/* ── Filters & Search Toolbar ─────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All Orders', count: purchases.length },
            { id: 'pending', label: isKhmer ? 'កំពុងដឹកជញ្ជូន' : 'Pending Inbound', count: pendingPurchases.length },
            { id: 'completed', label: isKhmer ? 'បានទទួលរួច' : 'Completed', count: completedPurchases.length },
            { id: 'cancelled', label: isKhmer ? 'បានបោះបង់' : 'Cancelled', count: purchases.filter(p => p.status === 'cancelled').length },
          ].map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
          <span>{filteredPurchases.length} {isKhmer ? 'ប្រតិបត្តិការទិញ' : 'purchases listed'}</span>
        </div>
      </div>

      {/* ── Purchases Table ──────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">{isKhmer ? 'លេខវិក្កយបត្រ PO' : 'PO / Invoice No'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'អ្នកផ្គត់ផ្គង់' : 'Supplier / Refinery'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'សម្ភារៈ & មុខទំនិញ' : 'Materials & Items'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Purchase Date'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'ទឹកប្រាក់សរុប ($)' : 'Total Amount ($)'}</th>
                <th className="py-3.5 px-4 text-center">{isKhmer ? 'ស្ថានភាពទំនិញ' : 'Shipment Status'}</th>
                <th className="py-3.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <FontAwesomeIcon icon={faBoxesPacking} className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-700 text-sm">
                      {isKhmer ? 'មិនមានការបញ្ជាទិញណាមួយឡើយ' : 'No Purchase Orders Found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isKhmer ? 'សូមចុច "បង្កើតការបញ្ជាទិញថ្មី" ដើម្បីបញ្ចូលទិន្នន័យ' : 'Click "New Purchase Order" to record an inbound purchase'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map(p => {
                  const supplierName = p.supplier?.company_name || p.supplier?.name || p.supplier_name || 'Vendor Partner';
                  const isPending = p.status === 'pending';
                  const isCompleted = p.status === 'completed';
                  const isCancelled = p.status === 'cancelled';
                  const pItems = Array.isArray(p.items) ? p.items : [];

                  return (
                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                      
                      {/* PO Invoice No */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            <FontAwesomeIcon icon={faFileInvoice} className="w-3.5 h-3.5 text-amber-700" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 font-mono text-xs">{p.invoice_no}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: #{p.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faBuilding} className="text-slate-400 w-3.5 h-3.5" />
                          <div>
                            <p className="font-bold text-slate-900">{supplierName}</p>
                            {p.supplier?.phone && (
                              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5" />
                                <span>{p.supplier.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Materials & Items summary */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        {pItems.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {pItems.slice(0, 2).map((it, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-950 text-[10px] font-semibold">
                                <FontAwesomeIcon icon={faCoins} className="w-2 h-2 text-amber-600" />
                                <span>{it.name || 'Material'} ({it.quantity || it.qty}{it.unit || 'g'})</span>
                              </span>
                            ))}
                            {pItems.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                                +{pItems.length - 2} {isKhmer ? 'មុខទៀត' : 'more'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            {p.notes ? p.notes.substring(0, 30) : (isKhmer ? 'ទំនិញទូទៅ' : 'General consignment')}
                          </span>
                        )}
                      </td>

                      {/* Purchase Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400 w-3 h-3" />
                          <span>{p.purchase_date}</span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-mono font-black text-slate-900 text-sm">
                          ${Number(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] font-mono text-amber-800 font-semibold">
                          ≈ {Math.round(Number(p.total_amount) * khrRate).toLocaleString()} ៛ KHR
                        </p>
                      </td>

                      {/* Shipment Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-900 bg-amber-100/80 border border-amber-300 shadow-2xs">
                            <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-amber-600 animate-spin-slow" />
                            <span>{isKhmer ? 'កំពុងដឹកជញ្ជូន' : 'Pending Inbound'}</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-900 bg-emerald-100/80 border border-emerald-300 shadow-2xs">
                            <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-emerald-600" />
                            <span>{isKhmer ? 'បានទទួលចូលស្តុក' : 'Arrived & Received'}</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200">
                            <FontAwesomeIcon icon={faBan} className="w-3 h-3 text-slate-400" />
                            <span>{isKhmer ? 'បានបោះបង់' : 'Cancelled'}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                        
                        {/* Confirm Arrival Button (Key Feature for Pending Orders) */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleConfirmArrival(p)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer active:scale-95 mr-1"
                            title={isKhmer ? 'ចុចដើម្បីបញ្ជាក់ការទទួលទំនិញចូលស្តុក' : 'Confirm arrival & receive into inventory'}
                          >
                            <FontAwesomeIcon icon={faTruckFast} className="w-3.5 h-3.5" />
                            <span>{isKhmer ? 'បញ្ជាក់ការមកដល់' : 'Confirm Arrival'}</span>
                          </button>
                        )}

                        {/* Quick Cancel Order Button (For Pending Orders) */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all cursor-pointer active:scale-95 mr-1"
                            title={isKhmer ? 'បោះបង់ការបញ្ជាទិញនេះ' : 'Cancel this purchase order'}
                          >
                            <FontAwesomeIcon icon={faBan} className="w-3 h-3 text-rose-500" />
                            <span>{isKhmer ? 'បោះបង់' : 'Cancel'}</span>
                          </button>
                        )}

                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setViewingPurchase(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                          title={isKhmer ? 'មើលលម្អិត' : 'View Details'}
                        >
                          <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 transition-colors cursor-pointer"
                          title={isKhmer ? 'កែប្រែ' : 'Edit'}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                          title={isKhmer ? 'លុបចេញពីប្រព័ន្ធ' : 'Delete'}
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                        </button>

                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredPurchases.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ── Add / Edit Purchase Modal ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={faBoxesStacked} className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {editingPurchase
                      ? (isKhmer ? 'កែប្រែការបញ្ជាទិញទំនិញ' : 'Edit Purchase Order')
                      : (isKhmer ? 'បង្កើតការបញ្ជាទិញទំនិញថ្មី' : 'Create New Purchase Order')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'ជ្រើសរើសសម្ភារៈ & វត្ថុធាតុដើមមាស/ត្បូងពីអ្នកផ្គត់ផ្គង់' : 'Select materials & raw bullion procurement items'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title={isKhmer ? 'បិទ' : 'Close'}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form with scrollable body */}
            <form noValidate onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              
              {/* Supplier Select */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {isKhmer ? 'ជ្រើសរើសអ្នកផ្គត់ផ្គង់ (Supplier / Refinery)' : 'Select Supplier / Refinery'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={e => {
                    setFormData(f => ({ ...f, supplier_id: e.target.value }));
                    if (formErrors.supplier_id) setFormErrors(prev => ({ ...prev, supplier_id: null }));
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border focus:bg-white focus:outline-none cursor-pointer transition-all ${
                    formErrors.supplier_id
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                  }`}
                >
                  <option value="">{isKhmer ? '-- សូមជ្រើសរើសអ្នកផ្គត់ផ្គង់ --' : '-- Choose a supplier --'}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.company_name || s.name} ({s.contact_name || s.contact || 'Rep'}) • {s.phone}
                    </option>
                  ))}
                </select>
                {formErrors.supplier_id && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{formErrors.supplier_id}</span>
                  </div>
                )}
              </div>

              {/* Invoice No & Purchase Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'លេខវិក្កយបត្រ (Invoice / PO #)' : 'PO / Invoice No'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.invoice_no}
                    onChange={e => {
                      setFormData(f => ({ ...f, invoice_no: e.target.value }));
                      if (formErrors.invoice_no) setFormErrors(prev => ({ ...prev, invoice_no: null }));
                    }}
                    placeholder="PUR-12345"
                    className={`w-full rounded-xl px-3.5 py-2.5 border font-mono text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                      formErrors.invoice_no
                        ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {formErrors.invoice_no && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{formErrors.invoice_no}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'កាលបរិច្ឆេទបញ្ជាទិញ' : 'Purchase Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={e => setFormData(f => ({ ...f, purchase_date: e.target.value }))}
                    className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 font-mono text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>
              </div>

              {/* ── Materials Line Items Section ──────────────────────────── */}
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCoins} className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-900 text-xs">
                      {isKhmer ? 'មុខសម្ភារៈ & វត្ថុធាតុដើមបញ្ជាទិញ' : 'Purchase Materials & Line Items'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      {formData.items.length} {isKhmer ? 'មុខ' : 'items'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                    <span>{isKhmer ? 'បន្ថែមសម្ភារៈ' : 'Add Material'}</span>
                  </button>
                </div>

                {formData.items.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 bg-white/70 rounded-xl border border-dashed border-amber-200">
                    <p className="text-xs font-medium text-slate-600">
                      {isKhmer ? 'មិនទាន់មានមុខសម្ភារៈនៅឡើយទេ' : 'No material items added yet'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isKhmer ? 'ចុច "បន្ថែមសម្ភារៈ" ដើម្បីជ្រើសរើសមាសដុំ ត្បូង ឬគ្រឿងផ្សំ' : 'Click "Add Material" to choose bullion, gems, or raw findings'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={item.id} className="p-3 bg-white rounded-xl border border-amber-200/90 shadow-2xs grid grid-cols-12 gap-2.5 items-center">
                        {/* Material selector or name */}
                        <div className="col-span-12 sm:col-span-5">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            {isKhmer ? `សម្ភារៈ #${index + 1}` : `Material #${index + 1}`}
                          </label>
                          <select
                            value={item.material_id}
                            onChange={e => handleItemChange(item.id, 'material_id', e.target.value)}
                            className="w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="">{isKhmer ? '-- ជ្រើសរើសសម្ភារៈពីស្តុក --' : '-- Select from catalog --'}</option>
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.code || `MAT-${m.id}`}) • ស្តុក: {m.stock_qty}{m.unit}
                              </option>
                            ))}
                          </select>
                          {!item.material_id && (
                            <input
                              type="text"
                              value={item.name}
                              onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                              placeholder={isKhmer ? 'ឬបញ្ចូលឈ្មោះសម្ភារៈ...' : 'Or type custom item name...'}
                              className="w-full mt-1 rounded-lg px-2 py-1 text-xs border border-slate-200 focus:outline-none focus:border-amber-500 bg-slate-50"
                            />
                          )}
                        </div>

                        {/* Quantity & Unit */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            {isKhmer ? 'ចំនួន' : 'Qty'} ({item.unit || 'g'})
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.quantity}
                            onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                            className="w-full rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 border border-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Unit Cost ($) */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            {isKhmer ? 'តម្លៃដើម ($)' : 'Unit Cost ($)'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.unit_cost}
                            onChange={e => handleItemChange(item.id, 'unit_cost', e.target.value)}
                            className="w-full rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 border border-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Subtotal & Delete */}
                        <div className="col-span-4 sm:col-span-3 flex items-center justify-between gap-1.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              {isKhmer ? 'សរុប ($)' : 'Total ($)'}
                            </label>
                            <span className="font-mono font-black text-amber-900 text-xs block py-1.5">
                              ${Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer mt-4"
                            title={isKhmer ? 'លុបជួរនេះ' : 'Remove row'}
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Amount ($) & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-slate-700 font-bold">
                      {isKhmer ? 'ចំនួនទឹកប្រាក់សរុប ($ USD)' : 'Total Amount ($ USD)'} <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                      {isKhmer ? 'គណនាស្វ័យប្រវត្តិ (Auto)' : 'Auto'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_amount}
                    onChange={e => {
                      setFormData(f => ({ ...f, total_amount: e.target.value }));
                      if (formErrors.total_amount) setFormErrors(prev => ({ ...prev, total_amount: null }));
                    }}
                    placeholder="5000.00"
                    className={`w-full rounded-xl px-3.5 py-2.5 border font-mono text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                      formErrors.total_amount
                        ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {formErrors.total_amount && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{formErrors.total_amount}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'ស្ថានភាពទំនិញ' : 'Shipment Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
                  >
                    <option value="pending">{isKhmer ? 'កំពុងដឹកជញ្ជូន (Pending Inbound)' : 'Pending Inbound'}</option>
                    <option value="completed">{isKhmer ? 'បានទទួលចូលស្តុក (Arrived / Stocked)' : 'Arrived & Received'}</option>
                    <option value="cancelled">{isKhmer ? 'បានបោះបង់ (Cancelled)' : 'Cancelled'}</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {isKhmer ? 'កំណត់ចំណាំ / បញ្ជីមុខទំនិញ (Notes / Manifest Details)' : 'Manifest Notes / Item Details'}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder={isKhmer ? 'ឧ. មាស 24K 500g, គ្រាប់ពេជ្រ 10 គ្រាប់...' : 'e.g. 500g 24K Swiss bullion bars, 10x 1.0ct certified diamonds...'}
                  className="w-full rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 resize-none bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
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
                    ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                    : (editingPurchase ? (isKhmer ? 'កែប្រែការបញ្ជាទិញ' : 'Update Purchase') : (isKhmer ? 'រក្សាទុកការបញ្ជាទិញ' : 'Save Purchase'))}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── View Purchase Details Modal ──────────────────────────────────── */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={faFileInvoice} className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {isKhmer ? 'ព័ត៌មានលម្អិតការបញ្ជាទិញ' : 'Purchase Order Manifest'}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{viewingPurchase.invoice_no}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title={isKhmer ? 'បិទ' : 'Close'}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{isKhmer ? 'អ្នកផ្គត់ផ្គង់:' : 'Supplier:'}</span>
                  <span className="font-bold text-slate-900">
                    {viewingPurchase.supplier?.company_name || viewingPurchase.supplier?.name || viewingPurchase.supplier_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{isKhmer ? 'កាលបរិច្ឆេទ:' : 'Purchase Date:'}</span>
                  <span className="font-mono font-bold text-slate-900">{viewingPurchase.purchase_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{isKhmer ? 'ស្ថានភាព:' : 'Status:'}</span>
                  <span className="font-bold text-amber-800 uppercase text-[10px] bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">{viewingPurchase.status}</span>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
                  <span className="font-bold text-slate-700">{isKhmer ? 'ទឹកប្រាក់សរុប:' : 'Total Amount:'}</span>
                  <span className="font-mono font-black text-amber-900 text-lg">
                    ${Number(viewingPurchase.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              {Array.isArray(viewingPurchase.items) && viewingPurchase.items.length > 0 && (
                <div className="space-y-2">
                  <span className="text-slate-700 font-bold block flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCoins} className="text-amber-600 w-3.5 h-3.5" />
                    <span>{isKhmer ? 'បញ្ជីមុខសម្ភារៈដែលបានទិញ' : 'Purchased Materials Breakdown'}</span>
                  </span>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">{isKhmer ? 'សម្ភារៈ' : 'Material'}</th>
                          <th className="py-2 px-3 text-center">{isKhmer ? 'បរិមាណ' : 'Qty'}</th>
                          <th className="py-2 px-3 text-right">{isKhmer ? 'តម្លៃដើម' : 'Cost'}</th>
                          <th className="py-2 px-3 text-right">{isKhmer ? 'សរុប' : 'Subtotal'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingPurchase.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{it.name || `Item #${idx+1}`}</td>
                            <td className="py-2 px-3 text-center font-mono">{it.quantity || it.qty} {it.unit || 'g'}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">${Number(it.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">${Number(it.total_cost || (Number(it.quantity || it.qty || 1) * Number(it.unit_cost || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {viewingPurchase.notes && (
                <div>
                  <span className="text-slate-700 font-bold block mb-1.5">{isKhmer ? 'កំណត់ចំណាំ:' : 'Notes:'}</span>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    {viewingPurchase.notes}
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewingPurchase(null)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
                >
                  {isKhmer ? 'បិទ' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PurchasesView;
