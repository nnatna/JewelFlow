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
  faHammer,
  faCalendarDays
} from '@fortawesome/free-solid-svg-icons';

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
      order_no: `MP-${Math.floor(1000 + Math.random() * 9000)}`,
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
      showToast(isKhmer ? 'សូមបំពេញព័ត៌មានចាំបាច់' : 'Please fill required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateMadeProduct(editingItem.id, formData);
        showToast(isKhmer ? 'បានកែប្រែទិន្នន័យដោយជោគជ័យ' : 'Crafting order updated successfully', 'success');
      } else {
        await addMadeProduct(formData);
        showToast(isKhmer ? 'បានបង្កើតការបញ្ជាកែច្នៃថ្មីដោយជោគជ័យ' : 'Crafting order created successfully', 'success');
      }
      setIsModalOpen(false);
      refreshAllData(true);
    } catch (err) {
      console.error('Error saving made product:', err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error saving record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបការបញ្ជាកែច្នៃ?' : 'Delete Crafting Order?',
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300/80"><FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" /> {isKhmer ? 'រួចរាល់' : 'Completed'}</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300/80"><FontAwesomeIcon icon={faClock} className="w-3 h-3 animate-spin" /> {isKhmer ? 'កំពុងកែច្នៃ' : 'In Progress'}</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300/80"><FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" /> {isKhmer ? 'បានបោះបង់' : 'Cancelled'}</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300/80"><FontAwesomeIcon icon={faClock} className="w-3 h-3" /> {isKhmer ? 'រង់ចាំ' : 'Pending'}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs tracking-wider uppercase mb-1">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 text-amber-600" />
            <span>{isKhmer ? 'សារពើភ័ណ្ឌ & ផលិតកម្ម' : 'Inventory & Production'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">
            {isKhmer ? 'ផលិតផលកែច្នៃ & សិប្បកម្មមាស' : 'Made Products & Custom Crafting'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isKhmer
              ? 'គ្រប់គ្រងការបញ្ជាកែច្នៃគ្រឿងអលង្ការ ការប្រើប្រាស់ទម្ងន់មាស និងថ្លៃឈ្នួលជាង'
              : 'Track atelier crafting orders, gold metal consumption, craftsman assignments & labor expenses'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshAllData(false)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title={isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh Data'}
          >
            <FontAwesomeIcon icon={faRotateRight} className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            <span>{isKhmer ? 'បង្កើតការកែច្នៃថ្មី' : 'New Crafting Order'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>{isKhmer ? 'ការបញ្ជាកែច្នៃសរុប' : 'Total Orders'}</span>
            <FontAwesomeIcon icon={faHammer} className="text-amber-500 w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">{isKhmer ? 'គ្រប់ប័ណ្ណការងារ' : 'All lifetime orders'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 text-xs font-medium mb-1">
            <span>{isKhmer ? 'កំពុងកែច្នៃ' : 'In Progress'}</span>
            <FontAwesomeIcon icon={faClock} className="text-blue-500 w-4 h-4 animate-spin" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.inProgress}</p>
          <p className="text-xs text-blue-500 mt-1">{isKhmer ? 'នៅរោងជាងសិប្បកម្ម' : 'Active at workbench'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-medium mb-1">
            <span>{isKhmer ? 'រួចរាល់' : 'Completed'}</span>
            <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">{stats.completed}</p>
          <p className="text-xs text-emerald-500 mt-1">{isKhmer ? 'បញ្ចូលស្តុកលក់រួចរាល់' : 'Ready in catalog stock'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium mb-1">
            <span>{isKhmer ? 'មាសប្រើសរុប' : 'Total Metal Used'}</span>
            <FontAwesomeIcon icon={faScaleBalanced} className="text-amber-600 w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-900">
            {stats.totalMetal.toFixed(1)} <span className="text-xs font-normal">g</span>
          </p>
          <p className="text-xs text-amber-700 mt-1">
            ≈ {(stats.totalMetal / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder={isKhmer ? 'ស្វែងរកលេខប័ណ្ណ ឈ្មោះគ្រឿង SKU ឬជាងទង...' : 'Search by order #, jewelry piece, SKU, or craftsman...'}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="text-slate-400 w-3.5 h-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-amber-400"
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
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-amber-400"
          >
            <option value="all">{isKhmer ? 'គ្រប់ប្រភេទមាសទាំងអស់' : 'All Metal Types'}</option>
            {metalTypes.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">{isKhmer ? 'លេខប័ណ្ណ / ថ្ងៃបញ្ជា' : 'Order No & Date'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'គ្រឿងអលង្ការគោលដៅ' : 'Target Jewelry Piece'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'ប្រភេទមាស / កម្រិត' : 'Metal & Purity'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'ទម្ងន់មាស & កាកសំណល់' : 'Gold Weight & Waste'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'ជាងទង / អ្នកផ្គត់ផ្គង់' : 'Craftsman / Supplier'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'ថ្លៃឈ្នួលជាង' : 'Crafting Cost'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm">{isKhmer ? 'រកមិនឃើញការបញ្ជាកែច្នៃណាមួយឡើយ' : 'No crafting orders found'}</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Order No & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{item.order_no || `MP-${item.id}`}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3" />
                        <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>

                    {/* Target Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 font-bold overflow-hidden">
                          {item.product?.image ? (
                            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <FontAwesomeIcon icon={faGem} className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{item.product?.name || 'Custom Crafted Piece'}</p>
                          <p className="text-xs text-slate-400 font-mono">SKU: {item.product?.code_sku || 'N/A'} • Qty: {item.quantity || 1}</p>
                        </div>
                      </div>
                    </td>

                    {/* Metal Type */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                        <FontAwesomeIcon icon={faCoins} className="w-3 h-3 text-amber-500" />
                        {item.metal_type?.name || item.metalType?.name || 'Gold'}
                      </span>
                    </td>

                    {/* Gold Weight */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-slate-900 font-bold">
                        {parseFloat(item.metal_weight_used || 0).toFixed(2)}g
                        <span className="text-xs text-amber-700 font-sans font-normal ml-1">
                          ({((parseFloat(item.metal_weight_used) || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'})
                        </span>
                      </div>
                      {parseFloat(item.waste_weight) > 0 && (
                        <div className="text-[11px] text-slate-400">
                          Waste: {parseFloat(item.waste_weight).toFixed(2)}g
                        </div>
                      )}
                    </td>

                    {/* Craftsman & Supplier */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-slate-800 font-medium flex items-center gap-1">
                        <FontAwesomeIcon icon={faUserTie} className="text-slate-400 w-3 h-3" />
                        <span>{item.user?.name || (isKhmer ? 'ជាងទងផ្ទៃក្នុង' : 'In-House Jeweler')}</span>
                      </div>
                      {item.supplier && (
                        <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                          <FontAwesomeIcon icon={faTruck} className="w-3 h-3" />
                          <span className="truncate">{item.supplier.company_name}</span>
                        </div>
                      )}
                    </td>

                    {/* Crafting Cost */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${parseFloat(item.crafting_cost || 0).toFixed(2)}
                    </td>

                    {/* Status with quick change dropdown */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        <select
                          value={item.status || 'pending'}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title={isKhmer ? 'កែប្រែ' : 'Edit'}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={isKhmer ? 'លុប' : 'Delete'}
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <FontAwesomeIcon icon={editingItem ? faPenToSquare : faPlus} className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-serif text-lg">
                    {editingItem
                      ? (isKhmer ? 'កែប្រែប័ណ្ណកែច្នៃ' : 'Edit Crafting Order')
                      : (isKhmer ? 'បង្កើតការបញ្ជាកែច្នៃថ្មី' : 'New Crafting Order')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isKhmer ? 'បំពេញព័ត៌មានគ្រឿងអលង្ការ ទម្ងន់មាស និងជាងទង' : 'Enter crafting specifications, metal weights, and jeweler assignment'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKhmer ? 'លេខប័ណ្ណបញ្ជា *' : 'Order Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.order_no}
                    onChange={(e) => setFormData({ ...formData, order_no: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="MP-1001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKhmer ? 'ចំនួន (Quantity) *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Target Product */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKhmer ? 'គ្រឿងអលង្ការគោលដៅ (Product) *' : 'Target Product *'}
                </label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">{isKhmer ? '-- ជ្រើសរើសគ្រឿងអលង្ការ --' : '-- Select Product --'}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code_sku})</option>
                  ))}
                </select>
              </div>

              {/* Metal Type & Supplier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKhmer ? 'ប្រភេទមាស (Metal Type) *' : 'Metal Purity *'}
                  </label>
                  <select
                    required
                    value={formData.metal_type_id}
                    onChange={(e) => setFormData({ ...formData, metal_type_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">{isKhmer ? '-- ជ្រើសរើសប្រភេទមាស --' : '-- Select Metal Type --'}</option>
                    {metalTypes.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.purity_percentage || 0}%)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKhmer ? 'អ្នកផ្គត់ផ្គង់ (Supplier)' : 'Supplier'}
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">{isKhmer ? '-- គ្មាន (មាសក្នុងហាង) --' : '-- In-House Bullion --'}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.company_name || s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weights & Crafting Cost */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKhmer ? 'មាសប្រើ (g)' : 'Metal Used (g)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.metal_weight_used}
                    onChange={(e) => setFormData({ ...formData, metal_weight_used: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="5.50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKhmer ? 'កាកសំណល់ (g)' : 'Waste (g)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.waste_weight}
                    onChange={(e) => setFormData({ ...formData, waste_weight: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="0.20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKhmer ? 'ថ្លៃឈ្នួលជាង ($)' : 'Labor Cost ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.crafting_cost}
                    onChange={(e) => setFormData({ ...formData, crafting_cost: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="45.00"
                  />
                </div>
              </div>

              {/* Materials & Sourcing Availability Checker */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faGem} className="text-amber-600" />
                    <span>{isKhmer ? 'ពិនិត្យស្តុកសម្ភារៈចាំបាច់ (Materials Stock Check)' : 'Required Materials & Vault Availability'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setActiveTab('materials');
                    }}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                  >
                    {isKhmer ? 'មើលឃ្លាំងសម្ភារៈ ➔' : 'Open Materials Vault ➔'}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {materials.slice(0, 5).map((mat) => {
                    const price = getMaterialEffectivePrice(mat);
                    const isOut = Number(mat.stock_qty) <= 0;
                    const isLow = Number(mat.stock_qty) <= Number(mat.min_stock_level || 0);

                    return (
                      <div key={mat.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200/60 text-xs">
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
                            {isOut ? (isKhmer ? 'អស់ស្តុក (0)' : 'Out (0)') : `${mat.stock_qty} ${mat.unit}`}
                          </span>

                          {isOut && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsModalOpen(false);
                                setActiveTab('purchases');
                              }}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer"
                              title={isKhmer ? 'បញ្ជាទិញពី Supplier' : 'Order from Supplier'}
                            >
                              {isKhmer ? 'ទិញពី Supplier' : 'PO Supplier'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Craftsman & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKhmer ? 'ជាងទងទទួលខុសត្រូវ' : 'Assigned Craftsman'}
                  </label>
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">{isKhmer ? '-- ជាងទងទូទៅ --' : '-- General Atelier Staff --'}</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role_display || u.role_name || 'Staff'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKhmer ? 'ស្ថានភាពកែច្នៃ *' : 'Crafting Status *'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="pending">{isKhmer ? 'រង់ចាំ (Pending)' : 'Pending'}</option>
                    <option value="in_progress">{isKhmer ? 'កំពុងកែច្នៃ (In Progress)' : 'In Progress'}</option>
                    <option value="completed">{isKhmer ? 'រួចរាល់ (Completed)' : 'Completed'}</option>
                    <option value="cancelled">{isKhmer ? 'បានបោះបង់ (Cancelled)' : 'Cancelled'}</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKhmer ? 'កំណត់ចំណាំផ្សេងៗ' : 'Crafting Notes & Instructions'}
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder={isKhmer ? 'ឧ. ដាំត្បូងកណ្ដាល ២គ្រាប់, ឆ្លាក់អក្សរ...' : 'E.g. Double prong setting, customized engraving...'}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                    : (editingItem ? (isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Update Order') : (isKhmer ? 'បង្កើតប័ណ្ណកែច្នៃ' : 'Create Order'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MadeProductsView;
