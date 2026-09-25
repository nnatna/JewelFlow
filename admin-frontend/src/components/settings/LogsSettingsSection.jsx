import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import apiService from '../../services/api';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faListCheck,
  faSearch,
  faRotate,
  faTrashCan,
  faFileExport,
  faShieldHalved,
  faCircleCheck,
  faTriangleExclamation,
  faCircleXmark,
  faInfoCircle,
  faUser,
  faGlobe,
  faLaptop,
  faClock,
  faFilter,
  faEye,
  faXmark,
  faCalendarDays,
  faCodeBranch,
  faLock,
  faKey,
  faBoxOpen,
  faCartShopping,
  faSliders,
  faUsers,
  faArrowsRotate
} from '@fortawesome/free-solid-svg-icons';

export const LogsSettingsSection = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, showToast, confirmDialog } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  const isSuperOrAdmin = currentUser?.role_name === 'super_admin' ||
    currentUser?.role?.name === 'super_admin' ||
    currentUser?.role_name === 'admin' ||
    currentUser?.role?.name === 'admin' ||
    currentUser?.email === 'admin@jewelflow.com';

  // Logs state
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total_logs: 0,
    today_logs: 0,
    auth_events: 0,
    error_logs: 0,
    warning_logs: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, 7days, 30days

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch Logs from Backend
  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      let dateFrom = '';
      const now = new Date();
      if (dateFilter === 'today') {
        dateFrom = now.toISOString().split('T')[0];
      } else if (dateFilter === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        dateFrom = d.toISOString().split('T')[0];
      } else if (dateFilter === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        dateFrom = d.toISOString().split('T')[0];
      }

      const params = {
        page: currentPage,
        per_page: pageSize,
        search: searchTerm || undefined,
        module: moduleFilter !== 'all' ? moduleFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_from: dateFrom || undefined,
      };

      const [logsRes, statsRes] = await Promise.all([
        apiService.getActivityLogs(params),
        apiService.getActivityLogStats()
      ]);

      if (logsRes) {
        if (Array.isArray(logsRes)) {
          setLogs(logsRes);
          setTotalRecords(logsRes.length);
        } else if (logsRes.data) {
          setLogs(logsRes.data);
          setTotalRecords(logsRes.total || logsRes.data.length);
        }
      }

      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, pageSize, moduleFilter, actionFilter, statusFilter, dateFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchLogs();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle Clear Logs
  const handleClearLogs = async () => {
    if (!isSuperOrAdmin) {
      showToast(isKhmer ? 'មានតែ SuperAdmin ទើបអាចលុបកំណត់ហេតុបាន' : 'Only SuperAdmin can clear activity logs', 'warning');
      return;
    }

    const confirmed = await confirmDialog({
      title: isKhmer ? 'សម្អាតកំណត់ហេតុសកម្មភាព?' : 'Purge Activity Logs?',
      text: isKhmer
        ? 'តើអ្នកប្រាកដជាចង់លុបកំណត់ហេតុចាស់ៗចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។'
        : 'Are you sure you want to clear system audit logs? This action cannot be reversed.',
      confirmButtonText: isKhmer ? 'បាទ/ចាស, សម្អាតឥឡូវនេះ' : 'Yes, Purge Logs',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      try {
        await apiService.clearActivityLogs('all');
        showToast(isKhmer ? 'បានសម្អាតកំណត់ហេតុជោគជ័យ' : 'Activity logs purged successfully', 'success');
        fetchLogs();
      } catch (err) {
        console.error('Clear logs error:', err);
        showToast(err.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការសម្អាត' : 'Failed to clear logs'), 'error');
      }
    }
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    if (!logs.length) {
      showToast(isKhmer ? 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No logs available to export', 'info');
      return;
    }

    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Module', 'Action', 'Status', 'IP Address', 'Description'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.created_at).toLocaleString(),
      `"${(l.user_name || 'System').replace(/"/g, '""')}"`,
      l.user_role || 'N/A',
      l.module || 'N/A',
      l.action || 'N/A',
      l.status || 'success',
      l.ip_address || '127.0.0.1',
      `"${(l.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JewelFlow_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isKhmer ? 'បានទាញយកឯកសារ CSV ជោគជ័យ' : 'Exported logs CSV successfully', 'success');
  };

  // Styling helper for actions
  const getActionBadge = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('login') && !act.includes('fail') && !act.includes('block')) {
      return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: faKey, text: 'Login' };
    }
    if (act.includes('logout')) {
      return { bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: faLock, text: 'Logout' };
    }
    if (act.includes('create') || act.includes('add') || act.includes('store')) {
      return { bg: 'bg-sky-50 text-sky-800 border-sky-300', icon: faCircleCheck, text: 'Created' };
    }
    if (act.includes('update') || act.includes('edit') || act.includes('toggle')) {
      return { bg: 'bg-amber-50 text-amber-900 border-amber-300', icon: faSliders, text: 'Updated' };
    }
    if (act.includes('delete') || act.includes('destroy') || act.includes('clear')) {
      return { bg: 'bg-rose-50 text-rose-800 border-rose-300', icon: faTrashCan, text: 'Deleted' };
    }
    if (act.includes('fail') || act.includes('block') || act.includes('error')) {
      return { bg: 'bg-red-50 text-red-800 border-red-300', icon: faTriangleExclamation, text: 'Failed / Blocked' };
    }
    return { bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: faInfoCircle, text: action || 'Action' };
  };

  // Styling helper for modules
  const getModuleBadge = (module) => {
    const mod = (module || '').toLowerCase();
    switch (mod) {
      case 'auth':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-200', icon: faShieldHalved, label: 'Auth' };
      case 'users':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: faUsers, label: 'Staff / Users' };
      case 'products':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: faBoxOpen, label: 'Jewelry Products' };
      case 'sales':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: faCartShopping, label: 'POS / Sales' };
      case 'settings':
        return { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: faSliders, label: 'Settings' };
      case 'units':
        return { bg: 'bg-teal-50 text-teal-800 border-teal-200', icon: faCodeBranch, label: 'Units' };
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: faInfoCircle, label: module || 'System' };
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn select-none">

      {/* ── Top Header & KPI Summary Cards ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <FontAwesomeIcon icon={faListCheck} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  {isKhmer ? 'កំណត់ហេតុសកម្មភាព & សវនកម្ម' : 'Activity Logs & System Audit Trail'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 shadow-2xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  {stats.total_logs || totalRecords} {isKhmer ? 'កំណត់ត្រា' : 'Events'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'តាមដានសកម្មភាពបុគ្គលិក ការកែប្រែទិន្នន័យ ការចូលប្រើប្រព័ន្ធ និងសុវត្ថិភាពទូទៅ'
                  : 'Track staff operations, security logins, inventory edits, and system events'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchLogs(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title={isKhmer ? 'ទាញយកទិន្នន័យឡើងវិញ' : 'Refresh logs'}
            >
              <FontAwesomeIcon icon={faRotate} className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <FontAwesomeIcon icon={faFileExport} className="w-3.5 h-3.5 text-amber-600" />
              <span>{isKhmer ? 'ទាញយក CSV' : 'Export CSV'}</span>
            </button>

            {isSuperOrAdmin && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'សម្អាត Logs' : 'Purge Logs'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isKhmer ? 'សរុបសកម្មភាព' : 'Total Logs'}
              </p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{stats.total_logs || totalRecords}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faListCheck} className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                {isKhmer ? 'ថ្ងៃនេះ' : "Today's Events"}
              </p>
              <p className="text-xl font-bold font-mono text-emerald-900 mt-0.5">{stats.today_logs || 0}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                {isKhmer ? 'សុវត្ថិភាព & Auth' : 'Security / Auth'}
              </p>
              <p className="text-xl font-bold font-mono text-purple-950 mt-0.5">{stats.auth_events || 0}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-purple-600" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                {isKhmer ? 'ការព្រមាន & កំហុស' : 'Warnings / Errors'}
              </p>
              <p className="text-xl font-bold font-mono text-rose-950 mt-0.5">
                {(stats.error_logs || 0) + (stats.warning_logs || 0)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-rose-600" />
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
            placeholder={isKhmer ? 'ស្វែងរកតាមការពិពណ៌នា ឈ្មោះបុគ្គលិក IP ឬសកម្មភាព...' : 'Search logs by description, user, IP, action...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">{isKhmer ? 'គ្រប់ Module' : 'All Modules'}</option>
            <option value="auth">Auth & Security</option>
            <option value="users">Staff & Roles</option>
            <option value="products">Jewelry Products</option>
            <option value="sales">POS & Sales</option>
            <option value="purchases">Purchases</option>
            <option value="materials">Materials</option>
            <option value="settings">Settings</option>
            <option value="units">Units</option>
            <option value="system">System</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">{isKhmer ? 'គ្រប់សកម្មភាព' : 'All Actions'}</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login_failed">Login Failed</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">{isKhmer ? 'គ្រប់ស្ថានភាព' : 'All Status'}</option>
            <option value="success">{isKhmer ? 'ជោគជ័យ (Success)' : 'Success'}</option>
            <option value="warning">{isKhmer ? 'ការព្រមាន (Warning)' : 'Warning'}</option>
            <option value="error">{isKhmer ? 'កំហុស (Error)' : 'Error'}</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">{isKhmer ? 'គ្រប់ពេលវេលា' : 'All Time'}</option>
            <option value="today">{isKhmer ? 'ថ្ងៃនេះ' : 'Today'}</option>
            <option value="7days">{isKhmer ? '៧ ថ្ងៃចុងក្រោយ' : 'Past 7 Days'}</option>
            <option value="30days">{isKhmer ? '៣០ ថ្ងៃចុងក្រោយ' : 'Past 30 Days'}</option>
          </select>
        </div>
      </div>

      {/* ── Activity Logs Table Card ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        
        {/* Table Top Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 via-amber-50/30 to-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-300/60 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <span className="text-xs font-bold text-slate-800 font-serif">
              {isKhmer ? 'បញ្ជីកំណត់ហេតុសកម្មភាពប្រព័ន្ធ' : 'System Audit Activity Log'}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-bold shadow-2xs">
              {totalRecords} {isKhmer ? 'សកម្មភាព' : 'records'}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Immutable Audit Trail
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FontAwesomeIcon icon={faArrowsRotate} className="w-7 h-7 animate-spin text-amber-500 mb-3" />
              <p className="text-xs font-semibold">{isKhmer ? 'កំពុងទាញយកកំណត់ហេតុ...' : 'Loading activity logs...'}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FontAwesomeIcon icon={faListCheck} className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-600">{isKhmer ? 'មិនមានកំណត់ហេតុត្រូវនឹងការស្វែងរកទេ' : 'No activity logs found'}</p>
              <p className="text-xs text-slate-400 mt-1">{isKhmer ? 'សូមសាកល្បងផ្លាស់ប្តូរការច្រោះ ឬពាក្យស្វែងរក' : 'Try clearing filters or search term'}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{isKhmer ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Timestamp'}</th>
                  <th className="py-3 px-4">{isKhmer ? 'បុគ្គលិក / អ្នកប្រើ' : 'Staff / User'}</th>
                  <th className="py-3 px-4">{isKhmer ? 'ផ្នែក (Module)' : 'Module'}</th>
                  <th className="py-3 px-4">{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                  <th className="py-3 px-4">{isKhmer ? 'ការពិពណ៌នា' : 'Description'}</th>
                  <th className="py-3 px-4">{isKhmer ? 'IP & ឧបករណ៍' : 'IP / Device'}</th>
                  <th className="py-3 px-4 text-center">{isKhmer ? 'សកម្មភាព' : 'Inspect'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => {
                  const actionBadge = getActionBadge(log.action);
                  const moduleBadge = getModuleBadge(log.module);
                  const dateObj = new Date(log.created_at);

                  return (
                    <tr key={log.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-900 font-bold text-[11px]">
                          {dateObj.toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-[11px]">
                            {log.user_name ? log.user_name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs truncate max-w-[130px]">
                              {log.user_name || 'System Auto'}
                            </p>
                            <p className="text-[10px] text-slate-400 capitalize">
                              {log.user_role || 'System'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${moduleBadge.bg}`}>
                          <FontAwesomeIcon icon={moduleBadge.icon} className="w-3 h-3" />
                          <span>{moduleBadge.label}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${actionBadge.bg}`}>
                          <FontAwesomeIcon icon={actionBadge.icon} className="w-3 h-3" />
                          <span className="capitalize">{log.action ? log.action.replace('_', ' ') : 'Action'}</span>
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4">
                        <p className="text-xs text-slate-800 font-medium max-w-md line-clamp-2">
                          {log.description}
                        </p>
                      </td>

                      {/* IP & Device */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-mono">
                          <FontAwesomeIcon icon={faGlobe} className="w-3 h-3 text-slate-400" />
                          <span>{log.ip_address || '127.0.0.1'}</span>
                        </div>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-amber-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title={isKhmer ? 'ពិនិត្យលម្អិត' : 'Inspect details'}
                        >
                          <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalRecords > pageSize && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              {isKhmer
                ? `បង្ហាញ ${(currentPage - 1) * pageSize + 1} ដល់ ${Math.min(currentPage * pageSize, totalRecords)} នៃ ${totalRecords} កំណត់ត្រា`
                : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalRecords)} of ${totalRecords} entries`}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalRecords / pageSize)}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>

      {/* ── Log Detail Modal ──────────────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center text-sm font-bold">
                  <FontAwesomeIcon icon={faShieldHalved} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-serif">
                    {isKhmer ? 'ព័ត៌មានលម្អិតសវនកម្ម' : 'Audit Log Event Details'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID #{selectedLog.id} • {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar text-xs">
              {/* Event Overview Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isKhmer ? 'សកម្មភាព & Module' : 'Action & Module'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getModuleBadge(selectedLog.module).bg}`}>
                      {selectedLog.module}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getActionBadge(selectedLog.action).bg}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {selectedLog.description}
                </p>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {isKhmer ? 'អ្នកធ្វើសកម្មភាព' : 'Initiator'}
                  </p>
                  <p className="font-bold text-slate-900 text-xs">{selectedLog.user_name || 'System'}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{selectedLog.user_role || 'System'}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {isKhmer ? 'IP & សុវត្ថិភាព' : 'IP & Security'}
                  </p>
                  <p className="font-mono font-bold text-slate-900 text-xs">{selectedLog.ip_address || '127.0.0.1'}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{selectedLog.status || 'success'}</p>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.user_agent && (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    User Agent / Client Device
                  </p>
                  <p className="font-mono text-[11px] text-slate-700 break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}

              {/* JSON Changes / Values (New vs Old) */}
              {selectedLog.new_values && (
                <div>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {isKhmer ? 'ទិន្នន័យថ្មី (New Values / Payload)' : 'New Payload / Data Snapshot'}
                  </p>
                  <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.old_values && (
                <div>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {isKhmer ? 'ទិន្នន័យចាស់ (Previous Values)' : 'Previous Data Snapshot'}
                  </p>
                  <pre className="p-3.5 rounded-xl bg-slate-900 text-amber-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer shadow-2xs transition-all"
              >
                {isKhmer ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LogsSettingsSection;
