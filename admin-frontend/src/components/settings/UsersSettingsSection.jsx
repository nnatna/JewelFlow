import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserPlus,
  faUserShield,
  faKey,
  faLock,
  faEnvelope,
  faPhone,
  faCheck,
  faCheckCircle,
  faXmark,
  faPenToSquare,
  faTrashCan,
  faToggleOn,
  faToggleOff,
  faShieldHalved,
  faSearch,
  faBuilding,
  faCrown,
  faCircleExclamation,
  faEye,
  faUserGear,
  faShield,
  faGem,
  faSliders,
  faArrowsRotate
} from '@fortawesome/free-solid-svg-icons';

export const UsersSettingsSection = () => {
  const { t, i18n } = useTranslation();
  const {
    users,
    roles,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    confirmDialog,
    showToast,
    currentUser,
    hasPermission,
    hasRole
  } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  const canManageUsers = hasPermission('manage_users') || hasRole(['super_admin', 'admin', 'manager']);
  const canDeleteUsers = hasPermission('manage_users') || hasRole(['super_admin', 'admin']);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination & Scroll View Mode State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10, 25, 50, or 1000 for all

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role_id: '',
    role_name: 'cashier',
    password: '',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Role visual badges configuration (Jewel Luxury Theme)
  const roleStyles = {
    super_admin: {
      bg: 'bg-gradient-to-r from-amber-50 via-rose-50 to-amber-100 text-amber-950 border-amber-300 shadow-2xs font-bold',
      gradient: 'from-amber-500 via-rose-500 to-yellow-500',
      label: isKhmer ? 'អភិបាលជាន់ខ្ពស់ (SuperAdmin)' : 'Super Administrator',
      icon: faCrown,
      badgeText: 'SuperAdmin'
    },
    admin: {
      bg: 'bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-900 border-amber-300 shadow-2xs font-bold',
      gradient: 'from-amber-500 to-yellow-400',
      label: isKhmer ? 'មេហាង / រដ្ឋបាល (Admin)' : 'Store Administrator',
      icon: faUserShield,
      badgeText: 'Admin'
    },
    manager: {
      bg: 'bg-gradient-to-r from-sky-50 to-cyan-100 text-sky-950 border-sky-300 shadow-2xs font-bold',
      gradient: 'from-sky-500 to-blue-500',
      label: isKhmer ? 'ប្រធានសាខា (Manager)' : 'Store Manager',
      icon: faBuilding,
      badgeText: 'Manager'
    },
    cashier: {
      bg: 'bg-gradient-to-r from-emerald-50 to-teal-100 text-emerald-950 border-emerald-300 shadow-2xs font-bold',
      gradient: 'from-emerald-500 to-teal-500',
      label: isKhmer ? 'អ្នកគិតប្រាក់ (Cashier)' : 'POS Cashier',
      icon: faUsers,
      badgeText: 'Cashier'
    },
    goldsmith: {
      bg: 'bg-gradient-to-r from-purple-50 to-violet-100 text-purple-950 border-purple-300 shadow-2xs font-bold',
      gradient: 'from-purple-500 to-violet-600',
      label: isKhmer ? 'ជាងមាសជំនាញ (Goldsmith)' : 'Master Goldsmith',
      icon: faUserGear,
      badgeText: 'Goldsmith'
    },
    accountant: {
      bg: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 border-slate-300 shadow-2xs font-bold',
      gradient: 'from-slate-600 to-slate-800',
      label: isKhmer ? 'គណនេយ្យករ (Accountant)' : 'Senior Accountant',
      icon: faShieldHalved,
      badgeText: 'Accountant'
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return (users || []).filter(u => {
      if (roleFilter !== 'all') {
        const uRole = (u.role_name || u.role?.name || '').toLowerCase();
        if (uRole !== roleFilter.toLowerCase()) return false;
      }
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const role = (u.role_name || u.role?.name || '').toLowerCase();
        if (!name.includes(term) && !email.includes(term) && !phone.includes(term) && !role.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    if (pageSize >= 1000) return filteredUsers;
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Reset page when filter changes
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (val) => {
    setRoleFilter(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // Open Create User Modal
  const openCreateModal = () => {
    setEditingUser(null);
    const defaultRole = roles.find(r => r.name === 'cashier') || roles[0];

    setFormData({
      name: '',
      email: '',
      phone: '',
      role_id: defaultRole?.id || '',
      role_name: defaultRole?.name || 'cashier',
      password: '',
      status: 'active'
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open Edit User Modal
  const openEditModal = (user) => {
    setEditingUser(user);
    const userRole = roles.find(r => r.id === user.role_id || r.name === user.role_name) || roles[0];

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role_id: userRole?.id || user.role_id || '',
      role_name: userRole?.name || user.role_name || 'cashier',
      password: '',
      status: user.status || 'active'
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះបុគ្គលិក' : 'Full name is required';
    }
    if (!formData.email.trim()) {
      errors.email = isKhmer ? 'សូមបញ្ចូលអ៊ីមែល' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = isKhmer ? 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ' : 'Invalid email format';
    }
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      errors.password = isKhmer ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ' : 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast(isKhmer ? 'សូមពិនិត្យព័ត៌មានដែលខ្វះ!' : 'Please correct the form errors', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role_id: formData.role_id,
        role_name: formData.role_name,
        status: formData.status
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUser) {
        await updateUser({ id: editingUser.id, ...payload });
        showToast(isKhmer ? 'បានកែប្រែព័ត៌មានបុគ្គលិកជោគជ័យ' : 'Staff member updated successfully', 'success');
      } else {
        await addUser(payload);
        showToast(isKhmer ? 'បានបង្កើតគណនីបុគ្គលិកថ្មីជោគជ័យ' : 'Staff member created successfully', 'success');
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving user:', err);
      const msg = err.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការរក្សាទុកគណនី' : 'Failed to save staff account');
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatus(user.id);
      showToast(
        isKhmer
          ? `បានប្តូរស្ថានភាពរបស់ ${user.name} ជោគជ័យ`
          : `Status updated for ${user.name}`,
        'success'
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការប្តូរស្ថានភាព' : 'Failed to update status', 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    if (!canDeleteUsers) {
      showToast(isKhmer ? 'អ្នកមិនមានសិទ្ធិលុបគណនីបុគ្គលិកទេ!' : 'You do not have permission to delete staff accounts!', 'error');
      return;
    }

    const isSuper = user.role_name === 'super_admin' || user.email === 'superadmin@jewelflow.com';
    if (isSuper) {
      showToast(isKhmer ? 'មិនអាចលុបគណនី SuperAdmin បានទេ!' : 'SuperAdmin account cannot be deleted!', 'warning');
      return;
    }

    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបគណនីបុគ្គលិក?' : 'Delete Staff Account?',
      text: isKhmer
        ? `តើអ្នកពិតជាចង់លុបគណនី "${user.name}" (${user.email}) មែនទេ?`
        : `Are you sure you want to delete staff account "${user.name}" (${user.email})?`,
      confirmButtonText: isKhmer ? 'លុបចោល' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      try {
        await deleteUser(user.id);
        showToast(isKhmer ? 'បានលុបគណនីបុគ្គលិកជោគជ័យ' : 'Staff account deleted successfully', 'success');
      } catch (err) {
        console.error('Failed to delete user:', err);
        const msg = err.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការលុបគណនី' : 'Failed to delete user');
        showToast(msg, 'error');
      }
    }
  };

  // Stats calculation
  const totalStaff = (users || []).length;
  const activeStaff = (users || []).filter(u => u.status === 'active').length;
  const superAdminsCount = (users || []).filter(u => u.role_name === 'super_admin' || u.role_name === 'admin').length;
  const cashiersCount = (users || []).filter(u => u.role_name === 'cashier').length;

  return (
    <div className="space-y-5 animate-fadeIn select-none">

      {/* ── Top Header & KPI Summary Cards ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  {isKhmer ? 'គ្រប់គ្រងបុគ្គលិក & តួនាទី' : 'Staff Accounts & Roles'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-2xs">
                  {totalStaff} {isKhmer ? 'នាក់' : 'Users'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'គ្រប់គ្រងគណនីបុគ្គលិក ចាត់តាំងតួនាទី (SuperAdmin, Admin, Manager, Cashier, Goldsmith, Accountant)'
                  : 'Manage staff profiles and assign atelier role privileges'}
              </p>
            </div>
          </div>

          {canManageUsers && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <FontAwesomeIcon icon={faUserPlus} className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'បន្ថែមបុគ្គលិកថ្មី' : 'Add New Staff'}</span>
            </button>
          )}
        </div>

        {/* 4 Mini KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isKhmer ? 'សរុបបុគ្គលិក' : 'Total Staff'}
              </p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{totalStaff}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                {isKhmer ? 'សកម្ម (Active)' : 'Active Members'}
              </p>
              <p className="text-xl font-bold font-mono text-emerald-900 mt-0.5">{activeStaff}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                {isKhmer ? 'អ្នកគ្រប់គ្រង' : 'SuperAdmin / Admins'}
              </p>
              <p className="text-xl font-bold font-mono text-amber-950 mt-0.5">{superAdminsCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faCrown} className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                {isKhmer ? 'បេឡាករ (POS)' : 'Cashiers'}
              </p>
              <p className="text-xl font-bold font-mono text-sky-950 mt-0.5">{cashiersCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-sky-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        
        {/* Search Bar Input */}
        <div className="relative flex-1">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
          />
          <input
            type="text"
            placeholder={isKhmer ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល លេខទូរស័ព្ទ ឬតួនាទី...' : 'Search staff by name, email, phone, or role...'}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters and View Options */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">{isKhmer ? 'គ្រប់តួនាទីទាំងអស់' : 'All Roles'}</option>
            <option value="super_admin">SuperAdmin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="goldsmith">Goldsmith</option>
            <option value="accountant">Accountant</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">{isKhmer ? 'គ្រប់ស្ថានភាព' : 'All Status'}</option>
            <option value="active">{isKhmer ? 'សកម្ម (Active)' : 'Active'}</option>
            <option value="inactive">{isKhmer ? 'ផ្អាក (Inactive)' : 'Inactive'}</option>
          </select>

          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
              {isKhmer ? 'បង្ហាញ:' : 'Rows:'}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={1000}>{isKhmer ? 'ទាំងអស់ (Scroll)' : 'All (Scroll)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Staff Table Card (Jewel Luxury Atelier Styling + Scrollable) ───── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        
        {/* Table Top Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 via-amber-50/30 to-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-300/60 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faGem} />
            </div>
            <span className="text-xs font-bold text-slate-800 font-serif">
              {isKhmer ? 'បញ្ជីឈ្មោះបុគ្គលិក Atelier' : 'Atelier Staff Directory'}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-bold shadow-2xs">
              {filteredUsers.length} {isKhmer ? 'នាក់' : 'members'}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            JewelFlow RBAC Security
          </span>
        </div>

        {/* Scrollable Table Body Container (Sticky Header) */}
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
              <tr className="text-slate-600 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap bg-slate-100/95">{isKhmer ? 'បុគ្គលិក / ឈ្មោះ' : 'Staff Member'}</th>
                <th className="py-3 px-4 whitespace-nowrap bg-slate-100/95">{isKhmer ? 'តួនាទី (Role)' : 'Assigned Role'}</th>
                <th className="py-3 px-4 whitespace-nowrap bg-slate-100/95">{isKhmer ? 'ទំនាក់ទំនង' : 'Contact Details'}</th>
                <th className="py-3 px-4 whitespace-nowrap text-center bg-slate-100/95">{isKhmer ? 'ស្ថានភាព' : 'Account Status'}</th>
                <th className="py-3 px-4 whitespace-nowrap text-right bg-slate-100/95">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mx-auto mb-2.5 text-lg">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <p className="font-bold text-slate-700 text-xs">
                      {isKhmer ? 'មិនមានទិន្នន័យបុគ្គលិកត្រូវបង្ហាញទេ' : 'No staff members found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isKhmer ? 'សាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬ Filter' : 'Try adjusting your search query or filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const roleKey = (user.role_name || user.role?.name || 'cashier').toLowerCase();
                  const style = roleStyles[roleKey] || roleStyles.cashier;
                  const isActive = user.status === 'active';
                  const initials = (user.name || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-amber-50/40 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${style.gradient} flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0 ring-2 ring-white overflow-hidden`}>
                            {user.photo ? (
                              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5 font-serif group-hover:text-amber-950">
                              <span>{user.name}</span>
                              {user.email === 'superadmin@jewelflow.com' && (
                                <FontAwesomeIcon icon={faCrown} className="text-amber-500 text-[11px]" title="Super Administrator" />
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1 mt-0.5">
                              <FontAwesomeIcon icon={faEnvelope} className="text-slate-300 text-[9px]" />
                              <span>{user.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge (Jewel Luxury Pill) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] border ${style.bg}`}>
                          <FontAwesomeIcon icon={style.icon || faShield} className="w-3 h-3 opacity-90" />
                          <span>{style.label}</span>
                        </span>
                      </td>

                      {/* Contact Details */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-[11px] font-mono text-slate-700 flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5 text-amber-600" />
                          <span>{user.phone || (isKhmer ? 'មិនមានលេខ' : 'N/A')}</span>
                        </div>
                      </td>

                      {/* Status Toggle Button */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/80'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{isActive ? (isKhmer ? 'សកម្ម' : 'Active') : (isKhmer ? 'ផ្អាក' : 'Inactive')}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                        {canManageUsers && (
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center"
                            title={isKhmer ? 'កែប្រែ' : 'Edit Staff'}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDeleteUsers && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center"
                            title={isKhmer ? 'លុប' : 'Delete Staff'}
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!canManageUsers && !canDeleteUsers && (
                          <span className="text-xs text-slate-400 italic px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
                            {isKhmer ? 'មើលតែប៉ុណ្ណោះ' : 'View Only'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        {pageSize < 1000 && filteredUsers.length > pageSize && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ── Add / Edit User Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={editingUser ? faPenToSquare : faUserPlus} className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {editingUser
                      ? (isKhmer ? 'កែប្រែព័ត៌មានបុគ្គលិក' : 'Edit Staff Member')
                      : (isKhmer ? 'បន្ថែមបុគ្គលិកថ្មី' : 'Create New Staff Member')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'បញ្ចូលព័ត៌មានទូទៅ និងកំណត់តួនាទី' : 'Fill account credentials and assign role'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Modal Form */}
            <form noValidate onSubmit={handleSaveUser} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {isKhmer ? 'ឈ្មោះបុគ្គលិក *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(f => ({ ...f, name: e.target.value }));
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Sokha Chea"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                    formErrors.name ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                  }`}
                />
                {formErrors.name && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{formErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    {isKhmer ? 'អ៊ីមែល *' : 'Email *'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(f => ({ ...f, email: e.target.value }));
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: null }));
                    }}
                    placeholder="user@jewelflow.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                      formErrors.email ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {formErrors.email && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{formErrors.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+855 12 345 678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {isKhmer ? 'ពាក្យសម្ងាត់' : 'Password'} {editingUser ? `(${isKhmer ? 'ទុកទំនេរបើមិនចង់ប្តូរ' : 'leave blank to keep unchanged'})` : '*'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData(f => ({ ...f, password: e.target.value }));
                      if (formErrors.password) setFormErrors(prev => ({ ...prev, password: null }));
                    }}
                    placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                      formErrors.password ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                </div>
                {formErrors.password && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{formErrors.password}</span>
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  {isKhmer ? 'ជ្រើសរើសតួនាទី *' : 'Assigned Atelier Role *'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(roles || []).map((r) => {
                    const isSelected = formData.role_name === r.name || formData.role_id === r.id;
                    const style = roleStyles[r.name] || roleStyles.cashier;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setFormData(f => ({
                            ...f,
                            role_id: r.id,
                            role_name: r.name
                          }));
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all text-left ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-400/30 text-amber-950 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${style.gradient} text-white flex items-center justify-center text-xs shrink-0`}>
                          <FontAwesomeIcon icon={style.icon || faShield} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[11px] capitalize">{r.name.replace('_', ' ')}</p>
                          <p className="text-[10px] text-slate-400 truncate">{style.label.split('(')[0]}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {isKhmer ? 'ស្ថានភាពគណនី' : 'Account Active Status'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isKhmer ? 'អនុញ្ញាតឱ្យបុគ្គលិកចូលប្រើប្រព័ន្ធ' : 'Allow user to sign in to JewelFlow'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(f => ({ ...f, status: f.status === 'active' ? 'inactive' : 'active' }))}
                  className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                    formData.status === 'active' ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Action Buttons */}
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
                    ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                    : (isKhmer ? 'រក្សាទុក' : 'Save Staff Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsersSettingsSection;
