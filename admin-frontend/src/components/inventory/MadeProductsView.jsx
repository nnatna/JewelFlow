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
  faXmark,
  faCoins,
  faScaleBalanced,
  faUserTie,
  faTruck,
  faCalendarDays
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
    materials,
    getMaterialEffectivePrice,
    setActiveTab
  } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [metalFilter, setMetalFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    product_id: '',
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
    setFormData({
      ...initialForm,
      order_no: `MJ-${Math.floor(1000 + Math.random() * 9000)}`,
      product_id: products[0]?.id || '',
      metal_type_id: metalTypes[0]?.id || '',
      supplier_id: suppliers[0]?.id || '',
      user_id: users[0]?.id || ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id || item.product?.id || '',
      metal_type_id: item.metal_type_id || item.metal_type?.id || item.metalType?.id || '',
      supplier_id: item.supplier_id || item.supplier?.id || '',
      user_id: item.user_id || item.user?.id || '',
      order_no: item.order_no || '',
      quantity: item.quantity || 1,
      metal_weight_used: item.metal_weight_used || '',
      waste_weight: item.waste_weight || '0',
      crafting_cost: item.crafting_cost || '',
      status: item.status || 'pending',
      started_at: item.started_at ? item.started_at.substring(0, 10) : '',
      completed_at: item.completed_at ? item.completed_at.substring(0, 10) : '',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.metal_type_id) {
      showToast(isKhmer ? 'សូមបំពេញព័ត៌មានចាំបាច់!' : 'Please fill required fields!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateMadeProduct(editingItem.id, formData);
        showToast(isKhmer ? 'បានកែប្រែទិន្នន័យដោយជោគជ័យ!' : 'Crafting order updated successfully!', 'success');
      } else {
        await addMadeProduct(formData);
        showToast(isKhmer ? 'បានបង្កើតការបញ្ជាកែច្នៃថ្មីដោយជោគជ័យ!' : 'Crafting order created successfully!', 'success');
      }
      setIsModalOpen(false);
      refreshAllData(true);
    } catch (err) {
      console.error('Error saving made jewelry order:', err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error saving record', 'error');
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
      try {
        await deleteMadeProduct(item.id);
        showToast(isKhmer ? 'បានលុបដោយជោគជ័យ' : 'Order deleted successfully', 'success');
        refreshAllData(true);
      } catch (err) {
        showToast(isKhmer ? 'មិនអាចលុបបានទេ' : 'Failed to delete order', 'error');
      }
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      await updateMadeProductStatus(item.id, newStatus);
      showToast(isKhmer ? 'បានផ្លាស់ប្ដូរស្ថានភាពរួចរាល់' : `Status changed to ${newStatus}`, 'success');
      refreshAllData(true);
    } catch (err) {
      showToast(isKhmer ? 'មិនអាចប្តូរស្ថានភាពបានទេ' : 'Failed to update status', 'error');
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
            {stats.totalMetal.toFixed(1)} <span className="text-xs font-mono font-normal text-slate-500">g</span>
          </p>
          <p className="text-[11px] text-amber-800 font-bold font-mono mt-1">
            ≈ {(stats.totalMetal / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
          </p>
        </div>
      </div>

      {/* ── Filter and Search Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder={isKhmer ? 'ស្វែងរកលេខប័ណ្ណ ឈ្មោះគ្រឿងអលង្ការ SKU ឬជាងទង...' : 'Search by order #, jewelry piece, SKU, or craftsman...'}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
          />
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
                <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'ប្រភេទមាស & ទឹក' : 'Metal & Purity'}</th>
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

                      {/* Metal & Purity */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {metal?.name || 'Fine Metal'}
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
                      <td className="py-3.5 px-4 text-center whitespace-nowrap w-28 min-w-[110px] sticky right-0 bg-white group-hover:bg-amber-50/50 transition-colors shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
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
        const metalUsedGrams = parseFloat(formData.metal_weight_used) || 0;
        const metalUsedChi = (metalUsedGrams / 3.75).toFixed(2);
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
                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
                      >
                        <option value="">{isKhmer ? '-- ជ្រើសរើសគ្រឿងអលង្ការ --' : '-- Select Jewelry Piece --'}</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.code_sku})</option>
                        ))}
                      </select>
                    </div>

                    {/* Metal Type & Supplier */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          {isKhmer ? 'ប្រភេទមាស & ទឹក' : 'Metal & Purity'} <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.metal_type_id}
                          onChange={(e) => setFormData({ ...formData, metal_type_id: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
                        >
                          <option value="">{isKhmer ? '-- ជ្រើសរើសប្រភេទមាស --' : '-- Select Metal Type --'}</option>
                          {metalTypes.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.purity_percentage || 0}%)</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          {isKhmer ? 'អ្នកផ្គត់ផ្គង់' : 'Supplier / Sourcing'}
                        </label>
                        <select
                          value={formData.supplier_id}
                          onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
                        >
                          <option value="">{isKhmer ? '-- គ្មាន (មាសក្នុងហាង) --' : '-- In-House Bullion --'}</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.company_name || s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Gold Weight (Chi & Grams), Waste & Crafting Cost */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-slate-700 font-bold">
                            {isKhmer ? 'ទម្ងន់មាស (ក្រាម)' : 'Metal Used (g)'}
                          </label>
                          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                            1 ជី = 3.75g
                          </span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.metal_weight_used}
                          onChange={(e) => setFormData({ ...formData, metal_weight_used: e.target.value })}
                          className="w-full px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                          placeholder="5.50"
                        />
                        {formData.metal_weight_used && (
                          <span className="text-[10px] text-amber-800 font-mono font-bold mt-1 block">
                            ≈ {((parseFloat(formData.metal_weight_used) || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          {isKhmer ? 'កាកសំណល់ (g)' : 'Waste (g)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.waste_weight}
                          onChange={(e) => setFormData({ ...formData, waste_weight: e.target.value })}
                          className="w-full px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                          placeholder="0.20"
                        />
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
                          placeholder="45.00"
                        />
                      </div>
                    </div>

                    {/* Craftsman & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          {isKhmer ? 'ជាងទងទទួលខុសត្រូវ' : 'Assigned Craftsman'}
                        </label>
                        <select
                          value={formData.user_id}
                          onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
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
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faWandMagicSparkles} className="text-amber-600" />
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

                      <div className="space-y-1.5 max-h-44 overflow-y-auto">
                        {materials.slice(0, 4).map((mat) => {
                          const price = getMaterialEffectivePrice(mat);
                          const isOut = Number(mat.stock_qty) <= 0;
                          const isLow = Number(mat.stock_qty) <= Number(mat.min_stock_level || 0);

                          return (
                            <div key={mat.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200/80 text-xs">
                              <div>
                                <div className="font-bold text-slate-800 text-[11px]">{mat.name}</div>
                                <div className="font-mono text-[10px] text-amber-900 font-medium">
                                  ${price.toFixed(2)}/{mat.unit} {mat.use_metal_rate && '• Live Spot'}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  isOut
                                    ? 'bg-rose-100 text-rose-700'
                                    : isLow
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isOut ? (isKhmer ? 'អស់ស្តុក' : 'Out') : `${mat.stock_qty} ${mat.unit}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

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
    </div>
  );
};

export const MadeJewelryView = MadeProductsView;
export default MadeProductsView;
