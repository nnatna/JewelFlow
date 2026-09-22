import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck,
  faPlus,
  faPhone,
  faEnvelope,
  faLocationDot,
  faShieldHalved,
  faBox,
  faFileLines,
  faFilter,
  faXmark,
  faSearch,
  faPenToSquare,
  faTrashCan,
  faBoxesStacked,
  faBuilding,
  faCircleCheck,
  faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';

export const SuppliersView = () => {
  const { t, i18n } = useTranslation();
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPurchase,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    confirmDialog,
    showToast
  } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  // Search & Pagination State
  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Supplier Modal State
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    specialty: 'Fine Bullion & Refined Alloys'
  });
  const [supplierErrors, setSupplierErrors] = useState({});
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Quick Issue PO Modal State
  const [showPoModal, setShowPoModal] = useState(false);
  const [poTargetSupplier, setPoTargetSupplier] = useState(null);
  const [poForm, setPoForm] = useState({
    invoice_no: '',
    total_amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: ''
  });
  const [poErrors, setPoErrors] = useState({});
  const [savingPo, setSavingPo] = useState(false);

  // Sync global search with local
  useEffect(() => {
    if (searchQuery) setLocalSearch(searchQuery);
  }, [searchQuery]);

  const activeSearch = (localSearch || '').toLowerCase().trim();

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(s => {
    if (!activeSearch) return true;
    const name = (s.company_name || s.name || '').toLowerCase();
    const contact = (s.contact_name || s.contact || '').toLowerCase();
    const phone = (s.phone || '').toLowerCase();
    const specialty = (s.specialty || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    return (
      name.includes(activeSearch) ||
      contact.includes(activeSearch) ||
      phone.includes(activeSearch) ||
      specialty.includes(activeSearch) ||
      email.includes(activeSearch)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [localSearch]);

  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Open Add Supplier Modal
  const openAddSupplierModal = () => {
    setEditingSupplier(null);
    setSupplierForm({
      company_name: '',
      contact_name: '',
      phone: '+855 (0) ',
      email: '',
      address: 'Phnom Penh, Cambodia',
      specialty: 'Fine Bullion & Refined Alloys'
    });
    setSupplierErrors({});
    setShowSupplierModal(true);
  };

  // Open Edit Supplier Modal
  const openEditSupplierModal = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      company_name: supplier.company_name || supplier.name || '',
      contact_name: supplier.contact_name || supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      specialty: supplier.specialty || 'Fine Bullion & Refined Alloys'
    });
    setSupplierErrors({});
    setShowSupplierModal(true);
  };

  // Save Supplier (Add / Edit)
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!supplierForm.company_name.trim()) {
      errs.company_name = isKhmer ? 'សូមបញ្ចូលឈ្មោះក្រុមហ៊ុន / រោងចក្រចម្រាញ់!' : 'Company name is required!';
    }
    if (!supplierForm.contact_name.trim()) {
      errs.contact_name = isKhmer ? 'សូមបញ្ចូលឈ្មោះតំណាង!' : 'Representative name is required!';
    }
    if (!supplierForm.phone.trim()) {
      errs.phone = isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Phone number is required!';
    }

    if (Object.keys(errs).length > 0) {
      setSupplierErrors(errs);
      showToast(isKhmer ? 'សូមបំពេញព័ត៌មានដែលខ្វះ!' : 'Please check required fields!', 'warning');
      return;
    }

    setSavingSupplier(true);
    try {
      const payload = {
        company_name: supplierForm.company_name.trim(),
        contact_name: supplierForm.contact_name.trim(),
        phone: supplierForm.phone.trim(),
        email: supplierForm.email.trim() || `${supplierForm.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@supplier.com`,
        address: supplierForm.address.trim() || 'Phnom Penh, Cambodia',
        specialty: supplierForm.specialty
      };

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);
        showToast(isKhmer ? 'បានកែប្រែអ្នកផ្គត់ផ្គង់ជោគជ័យ!' : 'Supplier updated successfully!', 'success');
      } else {
        await addSupplier(payload);
        showToast(isKhmer ? 'បានបន្ថែមអ្នកផ្គត់ផ្គង់ថ្មីជោគជ័យ!' : 'Supplier created successfully!', 'success');
      }
      setShowSupplierModal(false);
    } catch (err) {
      console.error('Failed to save supplier:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save supplier', 'error');
    } finally {
      setSavingSupplier(false);
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (supplier) => {
    const sName = supplier.company_name || supplier.name;
    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបអ្នកផ្គត់ផ្គង់?' : 'Delete Supplier?',
      text: isKhmer
        ? `តើអ្នកពិតជាចង់លុបអ្នកផ្គត់ផ្គង់ "${sName}" នេះមែនទេ?`
        : `Are you sure you want to delete supplier "${sName}"?`,
      confirmButtonText: isKhmer ? 'លុបចោល' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      await deleteSupplier(supplier.id);
      showToast(isKhmer ? 'បានលុបអ្នកផ្គត់ផ្គង់ជោគជ័យ' : 'Supplier deleted successfully', 'success');
    }
  };

  // Open Quick Issue PO Modal
  const openIssuePoModal = (supplier) => {
    setPoTargetSupplier(supplier);
    const randNum = Math.floor(10000 + Math.random() * 90000);
    setPoForm({
      invoice_no: `PUR-${randNum}`,
      total_amount: '',
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: ''
    });
    setPoErrors({});
    setShowPoModal(true);
  };

  // Save Quick PO
  const handleSavePo = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!poForm.invoice_no.trim()) {
      errs.invoice_no = isKhmer ? 'សូមបញ្ចូលលេខ PO / វិក្កយបត្រ!' : 'PO number is required!';
    }
    if (!poForm.total_amount || isNaN(Number(poForm.total_amount)) || Number(poForm.total_amount) <= 0) {
      errs.total_amount = isKhmer ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រឹមត្រូវ!' : 'Please enter a valid amount!';
    }

    if (Object.keys(errs).length > 0) {
      setPoErrors(errs);
      return;
    }

    setSavingPo(true);
    try {
      await addPurchase({
        supplier_id: poTargetSupplier.id,
        invoice_no: poForm.invoice_no.trim(),
        total_amount: Number(poForm.total_amount),
        purchase_date: poForm.purchase_date,
        status: poForm.status,
        notes: poForm.notes
      });
      setShowPoModal(false);
      showToast(
        isKhmer ? 'បានចេញវិក្កយបត្របញ្ជាទិញជោគជ័យ!' : 'Purchase Order issued successfully!',
        'success'
      );
    } catch (err) {
      console.error('Failed to issue PO:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការចេញ PO' : 'Failed to issue PO', 'error');
    } finally {
      setSavingPo(false);
    }
  };

  return (
    <div className="space-y-6 w-full select-none">
      
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
            <FontAwesomeIcon icon={faTruck} className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 font-serif flex items-center gap-2">
              <span>{isKhmer ? 'បញ្ជីអ្នកផ្គត់ផ្គង់ & រោងចក្រចម្រាញ់មាស' : 'Bullion Refineries & Gemstone Suppliers'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                {suppliers.length} {isKhmer ? 'ដៃគូ' : 'Partners'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKhmer
                ? 'ដៃគូចម្រាញ់មាសសុទ្ធ និងផ្គត់ផ្គង់ត្បូងធម្មជាតិស្របច្បាប់ LBMA & RJC'
                : 'Authorized precious metal refineries and certified gem exchanges'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('purchases')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer"
          >
            <FontAwesomeIcon icon={faBoxesStacked} className="w-3.5 h-3.5 text-amber-600" />
            <span>{isKhmer ? 'មើលការបញ្ជាទិញ (Purchases)' : 'View Purchase Orders'}</span>
          </button>

          <button
            onClick={openAddSupplierModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បន្ថែមអ្នកផ្គត់ផ្គង់ថ្មី' : 'Add New Supplier'}</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ──────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
        
        <div className="relative flex-1 max-w-md">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            value={localSearch}
            onChange={e => {
              setLocalSearch(e.target.value);
              setSearchQuery(e.target.value);
            }}
            placeholder={isKhmer ? 'ស្វែងរកឈ្មោះក្រុមហ៊ុន, អ្នកតំណាង, លេខទូរស័ព្ទ...' : 'Search supplier name, representative, phone...'}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                setSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold">{isKhmer ? 'ដៃគូទាំងអស់មានវិញ្ញាបនបត្រ LBMA & RJC' : '100% Certified LBMA & RJC Partners'}</span>
        </div>

      </div>

      {/* ── Suppliers Table ──────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 min-w-[220px]">{isKhmer ? 'ឈ្មោះក្រុមហ៊ុន / រោងចក្រចម្រាញ់' : 'Refinery / Supplier Name'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'ជំនាញផ្គត់ផ្គង់' : 'Supply Specialty'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'តំណាងផ្លូវការ' : 'Official Representative'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'លេខទូរស័ព្ទ & អ៊ីមែល' : 'Contact Phone & Email'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'អាសយដ្ឋាន' : 'Address'}</th>
                <th className="py-3.5 px-4 text-center">{isKhmer ? 'វិញ្ញាបនបត្រ' : 'Accreditation'}</th>
                <th className="py-3.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <FontAwesomeIcon icon={faTruck} className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-700 text-sm">
                      {isKhmer ? 'មិនមានអ្នកផ្គត់ផ្គង់ណាមួយឡើយ' : 'No Suppliers Found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isKhmer ? 'សូមចុច "បន្ថែមអ្នកផ្គត់ផ្គង់ថ្មី" ដើម្បីបញ្ចូលទិន្នន័យ' : 'Click "Add New Supplier" to register a vendor'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map(sup => {
                  const companyName = sup.company_name || sup.name;
                  const contactPerson = sup.contact_name || sup.contact || 'Vendor Representative';

                  return (
                    <tr key={sup.id} className="hover:bg-amber-50/30 transition-colors">
                      
                      {/* Company Name */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm font-serif block">{companyName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: VEND-{sup.id.toString().padStart(3, '0')}</span>
                          </div>
                        </div>
                      </td>

                      {/* Specialty */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                          {sup.specialty || 'Fine Bullion & Refined Alloys'}
                        </span>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4 text-slate-800 font-bold whitespace-nowrap">
                        {contactPerson}
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div className="font-mono text-slate-800 text-xs flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faPhone} className="w-3 h-3 text-amber-600" />
                          <span>{sup.phone}</span>
                        </div>
                        {sup.email && (
                          <div className="font-mono text-slate-500 text-[11px] flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 text-slate-400" />
                            <span>{sup.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs max-w-xs truncate">
                        <span className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{sup.address || 'Phnom Penh, Cambodia'}</span>
                        </span>
                      </td>

                      {/* Accreditation */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                          <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 text-emerald-600" />
                          <span>LBMA & RJC Certified</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        
                        {/* Issue PO Quick Button */}
                        <button
                          type="button"
                          onClick={() => openIssuePoModal(sup)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-900 border border-amber-200 hover:border-amber-500 font-bold text-xs transition-colors shadow-2xs cursor-pointer mr-1"
                          title={isKhmer ? 'ចេញវិក្កយបត្របញ្ជាទិញ PO ថ្មី' : 'Issue Inbound Purchase Order'}
                        >
                          <FontAwesomeIcon icon={faFileLines} className="w-3.5 h-3.5" />
                          <span>{isKhmer ? 'ចេញ PO' : 'Issue PO'}</span>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openEditSupplierModal(sup)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center"
                          title={isKhmer ? 'កែប្រែ' : 'Edit'}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(sup)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center"
                          title={isKhmer ? 'លុប' : 'Delete'}
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
          totalItems={filteredSuppliers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ── Add / Edit Supplier Modal ────────────────────────────────────── */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={faTruck} className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {editingSupplier
                      ? (isKhmer ? 'កែប្រែព័ត៌មានអ្នកផ្គត់ផ្គង់' : 'Edit Supplier Partner')
                      : (isKhmer ? 'ចុះឈ្មោះអ្នកផ្គត់ផ្គង់ថ្មី' : 'Register New Supplier')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'បញ្ចូលព័ត៌មានដៃគូចម្រាញ់មាស & ផ្គត់ផ្គង់ត្បូង' : 'Refinery partner & bullion contact directory'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSupplierModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title={isKhmer ? 'បិទ' : 'Close'}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form noValidate onSubmit={handleSaveSupplier} className="p-5 sm:p-6 space-y-4 text-xs">
              
              {/* Company Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {isKhmer ? 'ឈ្មោះក្រុមហ៊ុន / រោងចក្រ (Company / Refinery Name)' : 'Refinery / Company Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={supplierForm.company_name}
                  onChange={e => {
                    setSupplierForm(f => ({ ...f, company_name: e.target.value }));
                    if (supplierErrors.company_name) setSupplierErrors(prev => ({ ...prev, company_name: null }));
                  }}
                  placeholder="e.g. Swiss Valcambi Bullion Refinery"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold bg-slate-50 border focus:bg-white focus:outline-none transition-all ${
                    supplierErrors.company_name
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                  }`}
                />
                {supplierErrors.company_name && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{supplierErrors.company_name}</span>
                  </div>
                )}
              </div>

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'ឈ្មោះតំណាង (Representative Name)' : 'Representative Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={supplierForm.contact_name}
                    onChange={e => {
                      setSupplierForm(f => ({ ...f, contact_name: e.target.value }));
                      if (supplierErrors.contact_name) setSupplierErrors(prev => ({ ...prev, contact_name: null }));
                    }}
                    placeholder="e.g. Marc Dubois"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold bg-slate-50 border focus:bg-white focus:outline-none transition-all ${
                      supplierErrors.contact_name
                        ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {supplierErrors.contact_name && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{supplierErrors.contact_name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'លេខទូរស័ព្ទ (Phone Number)' : 'Phone Number'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={e => {
                      setSupplierForm(f => ({ ...f, phone: e.target.value }));
                      if (supplierErrors.phone) setSupplierErrors(prev => ({ ...prev, phone: null }));
                    }}
                    placeholder="+855 (0) 23 888 999"
                    className={`w-full rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-900 font-semibold bg-slate-50 border focus:bg-white focus:outline-none transition-all ${
                      supplierErrors.phone
                        ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {supplierErrors.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{supplierErrors.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Email & Supply Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'អ៊ីមែល (Direct Email)' : 'Direct Email'}
                  </label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={e => setSupplierForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="supply@refinery.com"
                    className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 font-mono text-xs text-slate-900 font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'ជំនាញផ្គត់ផ្គង់ (Specialty)' : 'Supply Specialty'}
                  </label>
                  <select
                    value={supplierForm.specialty}
                    onChange={e => setSupplierForm(f => ({ ...f, specialty: e.target.value }))}
                    className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer"
                  >
                    <option value="Fine Bullion & Refined Alloys">Fine Bullion & Refined Alloys (មាសសុទ្ធ & លោហៈ)</option>
                    <option value="Certified Natural Diamonds">Certified Natural Diamonds (គ្រាប់ពេជ្រធម្មជាតិ)</option>
                    <option value="Natural Colored Gemstones">Natural Colored Gemstones (ត្បូងធម្មជាតិ)</option>
                    <option value="Platinum & Precious Metals">Platinum & Precious Metals (ប្លាទីន & លោហៈធាតុ)</option>
                    <option value="Jewelry Mountings & Findings">Jewelry Mountings & Findings (គ្រោងគ្រឿងអលង្ការ)</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {isKhmer ? 'អាសយដ្ឋាន (Office / Refinery Address)' : 'Office / Refinery Address'}
                </label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={e => setSupplierForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="#88 Preah Norodom Blvd, Phnom Penh"
                  className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingSupplier
                    ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                    : (editingSupplier ? (isKhmer ? 'កែប្រែអ្នកផ្គត់ផ្គង់' : 'Update Supplier') : (isKhmer ? 'រក្សាទុកអ្នកផ្គត់ផ្គង់' : 'Save Supplier'))}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Quick Issue PO Modal ─────────────────────────────────────────── */}
      {showPoModal && poTargetSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto">
            
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={faFileLines} className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {isKhmer ? 'ចេញ PO ទៅកាន់អ្នកផ្គត់ផ្គង់' : 'Issue Inbound Purchase Order'}
                  </h2>
                  <p className="text-xs text-amber-800 font-bold mt-0.5">
                    {poTargetSupplier.company_name || poTargetSupplier.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPoModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title={isKhmer ? 'បិទ' : 'Close'}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <form noValidate onSubmit={handleSavePo} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {isKhmer ? 'លេខ PO / Invoice #' : 'PO / Invoice No'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={poForm.invoice_no}
                  onChange={e => {
                    setPoForm(f => ({ ...f, invoice_no: e.target.value }));
                    if (poErrors.invoice_no) setPoErrors(prev => ({ ...prev, invoice_no: null }));
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-900 font-semibold bg-slate-50 border focus:bg-white focus:outline-none transition-all ${
                    poErrors.invoice_no
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                  }`}
                />
                {poErrors.invoice_no && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{poErrors.invoice_no}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'ទឹកប្រាក់ ($ USD)' : 'Amount ($ USD)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={poForm.total_amount}
                    onChange={e => {
                      setPoForm(f => ({ ...f, total_amount: e.target.value }));
                      if (poErrors.total_amount) setPoErrors(prev => ({ ...prev, total_amount: null }));
                    }}
                    placeholder="5000.00"
                    className={`w-full rounded-xl px-3.5 py-2.5 border font-mono text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                      poErrors.total_amount
                        ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {poErrors.total_amount && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{poErrors.total_amount}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={poForm.purchase_date}
                    onChange={e => setPoForm(f => ({ ...f, purchase_date: e.target.value }))}
                    className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 font-mono text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {isKhmer ? 'កំណត់ចំណាំមុខទំនិញ' : 'Order Notes / Manifest'}
                </label>
                <textarea
                  rows={2}
                  value={poForm.notes}
                  onChange={e => setPoForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder={isKhmer ? 'ឧ. មាសសុទ្ធ 24K 5 គីឡូក្រាម...' : 'e.g. 5kg 24K pure gold bullion...'}
                  className="w-full rounded-xl px-3.5 py-2 text-xs text-slate-900 border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 resize-none bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingPo}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingPo
                    ? (isKhmer ? 'កំពុងចេញ PO...' : 'Issuing PO...')
                    : (isKhmer ? 'ចេញវិក្កយបត្រ PO' : 'Issue Purchase Order')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuppliersView;
