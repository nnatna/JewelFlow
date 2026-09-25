import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import apiService from '../../services/api';
import { Pagination } from '../common/Pagination';
import { ReportPrintDocument } from './ReportPrintDocument';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie, faReceipt, faArrowsRotate,
  faScaleBalanced, faMoneyBillTransfer, faArrowTrendUp,
  faCalendarDays, faFileArrowDown, faPrint, faGem,
  faCrown, faTriangleExclamation, faDollarSign,
  faMagnifyingGlass, faXmark, faChevronDown, faUserTie,
  faCircleCheck, faCircleExclamation, faTableList,
  faEye, faPhone, faUser, faClock, faHashtag, faBoxOpen
} from '@fortawesome/free-solid-svg-icons';

// ─── Date Presets Helper ──────────────────────────────────────────────────────
const getDatePresets = () => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // This Week (start of week: Monday)
  const d = new Date(now);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff)).toISOString().split('T')[0];

  // This Month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  // This Year
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

  return {
    today: { start: todayStr, end: todayStr },
    thisWeek: { start: startOfWeek, end: todayStr },
    thisMonth: { start: startOfMonth, end: todayStr },
    thisYear: { start: startOfYear, end: todayStr },
    allTime: { start: '2020-01-01', end: todayStr },
  };
};

export const ReportsView = () => {
  const { t, i18n } = useTranslation();
  const isKhmer = (i18n.language || '').startsWith('km');
  const { customers, categories, metalTypes, showToast, exchangeRate, settings, searchQuery } = useApp();

  const presets = useMemo(() => getDatePresets(), []);

  // ── State (Defaults to 'sales' Sales Ledger) ───────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState('thisMonth');
  const [startDate, setStartDate] = useState(presets.thisMonth.start);
  const [endDate, setEndDate] = useState(presets.thisMonth.end);
  const [reportTab, setReportTab] = useState('sales'); // 'sales' | 'summary' | 'buybacks' | 'inventory' | 'cashflow' | 'goldrates'
  const [loading, setLoading] = useState(false);

  // Dynamic Filters (តាមយើងដាក់)
  const [users, setUsers] = useState([]);
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterMetal, setFilterMetal] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Selected Sale for Detail Modal
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);

  // Report Data Stores
  const [summaryData, setSummaryData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [buybackData, setBuybackData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [goldRateData, setGoldRateData] = useState(null);

  // Pagination for sub-tables
  const [salesPage, setSalesPage] = useState(1);
  const [buybackPage, setBuybackPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [goldRatePage, setGoldRatePage] = useState(1);
  const pageSize = 12;

  // ── Load Staff / Users for filter ──────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const u = await apiService.getUsers();
        if (Array.isArray(u)) setUsers(u);
      } catch (err) {
        console.error('Failed to load users for filter:', err);
      }
    };
    fetchUsers();
  }, []);

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    filterCustomer || filterUser || filterMetal || filterCategory || filterStatus || searchQuery.trim() || selectedPreset !== 'thisMonth'
  );

  const resetAllFilters = () => {
    setSelectedPreset('thisMonth');
    setStartDate(presets.thisMonth.start);
    setEndDate(presets.thisMonth.end);
    setFilterCustomer('');
    setFilterUser('');
    setFilterMetal('');
    setFilterCategory('');
    setFilterStatus('');
    setSearchQuery('');
    setSalesPage(1);
    setBuybackPage(1);
    setInventoryPage(1);
    setGoldRatePage(1);
  };

  // ── Fetch active report strictly with all user-selected filters ────────────
  const fetchReportData = useCallback(async () => {
    setLoading(true);

    const params = {
      start_date: startDate,
      end_date: endDate,
    };
    if (filterCustomer) params.customer_id = filterCustomer;
    if (filterUser) params.user_id = filterUser;
    if (filterMetal) params.metal_type_id = filterMetal;
    if (filterCategory) params.category_id = filterCategory;
    if (filterStatus) params.status = filterStatus;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    try {
      if (reportTab === 'summary') {
        const data = await apiService.getReportSummary(params);
        setSummaryData(data);
      } else if (reportTab === 'sales') {
        const data = await apiService.getReportSales({ ...params, per_page: 100 });
        setSalesData(data);
      } else if (reportTab === 'buybacks') {
        const data = await apiService.getReportBuybacks({ ...params, per_page: 100 });
        setBuybackData(data);
      } else if (reportTab === 'inventory') {
        const data = await apiService.getReportInventory({ ...params, per_page: 100 });
        setInventoryData(data);
      } else if (reportTab === 'cashflow') {
        const data = await apiService.getReportCashFlow(params);
        setCashFlowData(data);
      } else if (reportTab === 'goldrates') {
        const data = await apiService.getReportGoldRatesHistory(params);
        setGoldRateData(data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការទាញយករបាយការណ៍' : 'Failed to fetch report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterCustomer, filterUser, filterMetal, filterCategory, filterStatus, searchQuery, reportTab, isKhmer, showToast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Handle Preset Change
  const handlePresetSelect = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presets[presetKey]) {
      setStartDate(presets[presetKey].start);
      setEndDate(presets[presetKey].end);
    }
  };

  // ── Export CSV Handler ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    let rows = [];
    let filename = `JewelFlow_Report_${reportTab}_${startDate}_to_${endDate}.csv`;

    if (reportTab === 'summary' && summaryData) {
      rows = [
        ['Category', 'Metric', 'Value', 'Unit'],
        ['Sales & Revenue', 'Gross Sales', summaryData.sales?.gross_total || 0, 'USD'],
        ['Sales & Revenue', 'Total Discounts', summaryData.sales?.discount || 0, 'USD'],
        ['Sales & Revenue', 'Net Sales', summaryData.sales?.grand_total || 0, 'USD'],
        ['Sales & Revenue', 'Total Invoices', summaryData.sales?.count || 0, 'Invoices'],
        ['Sales & Revenue', 'Gold Sold (Grams)', summaryData.sales?.weight_sold?.grams || 0, 'Grams'],
        ['Sales & Revenue', 'Gold Sold (Chi)', summaryData.sales?.weight_sold?.chi || 0, 'Chi'],
        ['Sales & Revenue', 'Labor Fee Revenue', summaryData.sales?.labor_fee_collected || 0, 'USD'],
        ['Sales & Revenue', 'Gemstones Revenue', summaryData.sales?.gemstone_revenue || 0, 'USD'],
        ['Scrap Buybacks', 'Total Buyback Tickets', summaryData.buybacks?.count || 0, 'Tickets'],
        ['Scrap Buybacks', 'Total Payout', summaryData.buybacks?.total_payout || 0, 'USD'],
        ['Scrap Buybacks', 'Scrap Gold Weight (Chi)', summaryData.buybacks?.scrap_weight?.chi || 0, 'Chi'],
        ['Scrap Buybacks', 'Deductions Profit', summaryData.buybacks?.total_deductions_profit || 0, 'USD'],
        ['Vault Inventory', 'Total Registered SKUs', summaryData.vault_inventory?.total_products || 0, 'SKUs'],
        ['Vault Inventory', 'Total In-Stock Units', summaryData.vault_inventory?.total_units_in_stock || 0, 'Pieces'],
        ['Vault Inventory', 'Total Gold Weight (Chi)', summaryData.vault_inventory?.total_gold_weight?.chi || 0, 'Chi'],
        ['Vault Inventory', 'Retail Valuation', summaryData.vault_inventory?.estimated_retail_valuation || 0, 'USD'],
        ['Vault Inventory', 'Cost Valuation', summaryData.vault_inventory?.estimated_cost_valuation || 0, 'USD'],
        ['Cash Flow', 'Cash Inflow (Sales)', summaryData.financial?.cash_in || 0, 'USD'],
        ['Cash Flow', 'Cash Outflow (Buybacks & Purchases)', summaryData.financial?.cash_out || 0, 'USD'],
        ['Cash Flow', 'Net Cash Position', summaryData.financial?.net_cash_flow || 0, 'USD'],
      ];
    } else if (reportTab === 'sales' && salesData) {
      rows = [
        ['Invoice #', 'Date', 'Customer', 'Items Count', 'Gross Total USD', 'Discount USD', 'Grand Total USD', 'Status'],
        ...(salesData.sales_list?.data || []).map(s => [
          s.invoice_no || `INV-${s.id}`,
          s.sale_date ? String(s.sale_date).slice(0, 10) : '',
          `"${s.customer?.name || 'Walk-in Customer'}"`,
          s.sale_items?.length || 1,
          s.total_amount || 0,
          s.discount || 0,
          s.grand_total_usd || 0,
          s.status || 'completed'
        ])
      ];
    } else if (reportTab === 'buybacks' && buybackData) {
      rows = [
        ['Ticket #', 'Date', 'Customer', 'Metal Karat', 'Gross Weight (g)', 'Weight (Chi)', 'Rate ($/g)', 'Payout ($)'],
        ...(buybackData.buybacks_list?.data || []).map(b => [
          `#${b.id}`,
          b.buyback_date ? String(b.buyback_date).slice(0, 10) : '',
          `"${b.customer?.name || 'Walk-in Customer'}"`,
          `"${b.metal_type?.name || 'Gold Scrap'}"`,
          b.weight || 0,
          ((b.weight || 0) / 3.75).toFixed(2),
          b.buyback_rate || 0,
          b.total_refund || 0
        ])
      ];
    } else if (reportTab === 'inventory' && inventoryData) {
      rows = [
        ['SKU', 'Product Name', 'Category', 'Metal Karat', 'Net Weight (g)', 'Stock Units', 'Est. Retail Valuation ($)'],
        ...(inventoryData.products_list?.data || []).map(p => [
          p.code_sku || `SKU-${p.id}`,
          `"${p.name || ''}"`,
          `"${p.category?.name || 'Jewelry'}"`,
          `"${p.metal_type?.name || 'Gold'}"`,
          p.net_weight || 0,
          p.stock_qty || 0,
          ((p.net_weight * 85.5 + p.labor_cost) * (1 + (p.markup_rate / 100)) * p.stock_qty).toFixed(2)
        ])
      ];
    } else if (reportTab === 'cashflow' && cashFlowData) {
      rows = [
        ['Date', 'Inflow (Sales)', 'Outflow (Buybacks & Purchases)', 'Net Balance'],
        ...(cashFlowData.daily_timeline || []).map(d => [
          d.date,
          d.inflow,
          d.outflow,
          d.net
        ])
      ];
    } else if (reportTab === 'goldrates' && goldRateData) {
      rows = [
        ['Effective Date', 'Metal Karat', 'Sell Rate ($/g)', 'Buy Rate ($/g)', 'Spread ($)', 'Price / Chi ($)'],
        ...(goldRateData.rates || []).map(r => [
          r.effective_date,
          r.metal_name,
          r.sell_rate,
          r.buy_rate,
          r.spread,
          r.price_per_chi
        ])
      ];
    } else {
      showToast(isKhmer ? 'មិនមានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No data available for export', 'info');
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isKhmer ? 'ទាញយក CSV បានជោគជ័យ' : 'CSV exported successfully', 'success');
  };

  // ── Print Report Handler ───────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // ── Tab items definition ───────────────────────────────────────────────────
  const reportTabs = [
    { id: 'sales', label: isKhmer ? 'តារាងប្រតិបត្តិការលក់' : 'Sales Ledger', icon: faReceipt },
    { id: 'summary', label: isKhmer ? 'សង្ខេបទូទៅ' : 'Executive Summary', icon: faChartPie },
    { id: 'buybacks', label: isKhmer ? 'តារាងទិញមាសចាស់' : 'Scrap Buybacks', icon: faArrowsRotate },
    { id: 'inventory', label: isKhmer ? 'តារាងស្តុកមាស & តម្លៃ' : 'Vault Inventory', icon: faScaleBalanced },
    { id: 'cashflow', label: isKhmer ? 'តារាងលំហូរសាច់ប្រាក់' : 'Cash Flow Ledger', icon: faMoneyBillTransfer },
    { id: 'goldrates', label: isKhmer ? 'តារាងប្រវត្តិតម្លៃមាស' : 'Metal Fix History', icon: faArrowTrendUp },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Interactive Web View (Hidden on Print) ────────────────────── */}
      <div className="no-print space-y-5">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-white shrink-0">
            <FontAwesomeIcon icon={faTableList} className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {isKhmer ? 'របាយការណ៍ និងស្ថិតិអាជីវកម្ម' : 'Reports & Analytics'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKhmer ? 'ទិដ្ឋភាពរបាយការណ៍ជាតារាង ងាយស្រួលមើល ពិនិត្យ និងបោះពុម្ព' : 'Tabular ledger & business intelligence reports'}
            </p>
          </div>
        </div>

        {/* Global Export & Print Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchReportData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title={isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <FontAwesomeIcon icon={faFileArrowDown} className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKhmer ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បោះពុម្ពរបាយការណ៍' : 'Print Report'}</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar: Date Presets + Custom Selectors (តាមយើងដាក់) ─────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        
        {/* Row 1: Date Range Presets & Date Pickers */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'today', label: isKhmer ? 'ថ្ងៃនេះ' : 'Today' },
              { key: 'thisWeek', label: isKhmer ? 'សប្តាហ៍នេះ' : 'This Week' },
              { key: 'thisMonth', label: isKhmer ? 'ខែនេះ' : 'This Month' },
              { key: 'thisYear', label: isKhmer ? 'ឆ្នាំនេះ' : 'This Year' },
              { key: 'allTime', label: isKhmer ? 'ទាំងអស់' : 'All Time' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => handlePresetSelect(p.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedPreset === p.key
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
              <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400 w-3 h-3" />
              <span className="font-semibold text-slate-500">{isKhmer ? 'ពី:' : 'From:'}</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="bg-transparent font-mono text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <span className="text-slate-400 font-bold">→</span>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
              <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400 w-3 h-3" />
              <span className="font-semibold text-slate-500">{isKhmer ? 'ដល់:' : 'To:'}</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="bg-transparent font-mono text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Granular Filters (Customer, User/Cashier, Metal, Category, Status) */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          
          {/* Customer Filter */}
          <div className="relative">
            <select
              value={filterCustomer}
              onChange={e => setFilterCustomer(e.target.value)}
              className="w-full pl-3 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white cursor-pointer transition-all font-medium appearance-none"
            >
              <option value="">{isKhmer ? 'អតិថិជនទាំងអស់' : 'All Customers'}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
          </div>

          {/* Cashier / Staff Filter */}
          <div className="relative">
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="w-full pl-3 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white cursor-pointer transition-all font-medium appearance-none"
            >
              <option value="">{isKhmer ? 'បុគ្គលិកទាំងអស់' : 'All Cashiers / Staff'}</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
          </div>

          {/* Metal Purity Filter */}
          <div className="relative">
            <select
              value={filterMetal}
              onChange={e => setFilterMetal(e.target.value)}
              className="w-full pl-3 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white cursor-pointer transition-all font-medium appearance-none"
            >
              <option value="">{isKhmer ? 'កម្រិតទឹកមាសទាំងអស់' : 'All Metal Purities'}</option>
              {metalTypes.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full pl-3 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white cursor-pointer transition-all font-medium appearance-none"
            >
              <option value="">{isKhmer ? 'ប្រភេទគ្រឿងទាំងអស់' : 'All Categories'}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
          </div>

          {/* Status Filter / Clear Filter */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full pl-3 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white cursor-pointer transition-all font-medium appearance-none"
              >
                <option value="">{isKhmer ? 'ស្ថានភាពទាំងអស់' : 'All Statuses'}</option>
                <option value="completed">{isKhmer ? 'ជោគជ័យ' : 'Completed'}</option>
                <option value="pending">{isKhmer ? 'រង់ចាំ' : 'Pending'}</option>
                <option value="cancelled">{isKhmer ? 'បោះបង់' : 'Cancelled'}</option>
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer shrink-0"
                title={isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset Filters'}
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* ── Report Tab Navigation ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-0.5">
        {reportTabs.map(tab => {
          const isActive = reportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setReportTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-amber-500 text-amber-900 bg-amber-50/60 rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Loading Skeleton / Indicator ─────────────────────────────────── */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <FontAwesomeIcon icon={faArrowsRotate} className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-slate-600">
            {isKhmer ? 'កំពុងទាញយកទិន្នន័យរបាយការណ៍...' : 'Loading report records...'}
          </p>
        </div>
      )}

      {/* ── Tab 1: Sales & Revenue Ledger (Clean Table-First Layout) ──────── */}
      {!loading && reportTab === 'sales' && (
        <div className="space-y-5">
          {/* Quick Stats Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'ការលក់ដុល' : 'Gross Sales'}</span>
              <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">${(salesData?.summary?.gross_total || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'បញ្ចុះតម្លៃសរុប' : 'Total Discounts'}</span>
              <p className="text-xl font-extrabold font-mono text-rose-600 mt-1">-${(salesData?.summary?.total_discount || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'ចំណូលលក់សុទ្ធ' : 'Net Sales'}</span>
              <p className="text-xl font-extrabold font-mono text-emerald-600 mt-1">${(salesData?.summary?.grand_total || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'មាសលក់ចេញ' : 'Gold Sold'}</span>
              <p className="text-xl font-extrabold font-mono text-amber-800 mt-1">{salesData?.summary?.weight_sold?.chi || 0} Chi</p>
            </div>
          </div>

          {/* Primary Table: Detailed Sales Transactions Ledger */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} className="text-amber-500 w-3.5 h-3.5" />
                <span>{isKhmer ? 'តារាងប្រតិបត្តិការលក់ (Sales Ledger Table)' : 'Sales Transactions Ledger Table'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-slate-400 font-normal">
                  {(salesData?.sales_list?.data || []).length} {isKhmer ? 'កំណត់ត្រា' : 'records'}
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">{isKhmer ? 'លេខវិក្កយបត្រ' : 'Invoice #'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">{isKhmer ? 'អតិថិជន' : 'Customer'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'អ្នកគិតលុយ' : 'Cashier'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ចំនួនមុខ' : 'Items'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-right">{isKhmer ? 'ការលក់ដុល ($)' : 'Gross ($)'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-right">{isKhmer ? 'បញ្ចុះ ($)' : 'Discount ($)'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap text-right">{isKhmer ? 'ទឹកប្រាក់សរុប (USD)' : 'Grand Total ($)'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(salesData?.sales_list?.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <FontAwesomeIcon icon={faBoxOpen} className="w-8 h-8 text-slate-300 mb-2 block mx-auto" />
                        <span>{isKhmer ? 'មិនមានទិន្នន័យលក់ក្នុងចន្លោះពេលនេះទេ' : 'No sales records found for this period'}</span>
                      </td>
                    </tr>
                  ) : (
                    (salesData?.sales_list?.data || []).slice((salesPage - 1) * pageSize, salesPage * pageSize).map(sale => (
                      <tr
                        key={sale.id}
                        onClick={() => setSelectedSaleDetail(sale)}
                        className="hover:bg-amber-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                          {sale.invoice_no || `INV-${sale.id}`}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-500">{String(sale.sale_date).slice(0, 10)}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span>{sale.customer?.name || 'Walk-in Guest'}</span>
                            {sale.customer?.phone && <span className="text-[10px] text-slate-400 font-mono">{sale.customer.phone}</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{sale.user?.name || 'Staff'}</td>
                        <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-800">
                          {sale.sale_items?.length || 1}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-600">${Number(sale.total_amount || 0).toFixed(2)}</td>
                        <td className="py-3.5 px-3 text-right font-mono text-rose-600">-${Number(sale.discount || 0).toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">${Number(sale.grand_total_usd || 0).toFixed(2)}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {sale.status || 'completed'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedSaleDetail(sale)}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                            title={isKhmer ? 'មើលព័ត៌មានលម្អិត' : 'View Details'}
                          >
                            <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {(salesData?.sales_list?.data || []).length > pageSize && (
              <Pagination
                currentPage={salesPage}
                totalItems={(salesData?.sales_list?.data || []).length}
                pageSize={pageSize}
                onPageChange={setSalesPage}
              />
            )}
          </div>

          {/* Secondary Tables Grid: Breakdown by Metal & Top Sellers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Table: Sales by Metal Karat */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
                <span>{isKhmer ? 'ការលក់តាមប្រភេទទឹកមាស' : 'Sales by Metal Purity'}</span>
                <FontAwesomeIcon icon={faScaleBalanced} className="text-amber-500 w-3 h-3" />
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">{isKhmer ? 'ប្រភេទទឹកមាស' : 'Metal Karat'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'ចំនួន' : 'Qty'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'ទម្ងន់' : 'Weight'}</th>
                    <th className="py-2.5 px-4 text-right">{isKhmer ? 'ចំណូល' : 'Revenue'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(salesData?.sales_by_metal_type || []).map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{m.metal_type}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{m.items_sold_count}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-800">{m.total_weight?.chi} Chi</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">${Number(m.total_revenue || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table: Top 10 Best Selling Items */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
                <span>{isKhmer ? 'គ្រឿងអលង្ការលក់ដាច់បំផុតទាំង ១០' : 'Top 10 Best Sellers'}</span>
                <FontAwesomeIcon icon={faCrown} className="text-amber-500 w-3 h-3" />
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'គ្រឿងអលង្ការ' : 'Jewelry'}</th>
                    <th className="py-2.5 px-2 text-center">{isKhmer ? 'ចំនួន' : 'Qty'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូល' : 'Revenue'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(salesData?.top_products || []).slice(0, 10).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-amber-700 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-[150px]">{p.name}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">{p.quantity_sold}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">${Number(p.total_revenue || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ── Tab 2: Executive Summary (Master Balance Table) ───────────────── */}
      {!loading && reportTab === 'summary' && (
        <div className="space-y-5">
          {/* Quick Summary Pill Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 border-l-4 border-l-emerald-500 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'ចំណូលលក់សុទ្ធ' : 'Net Sales'}</span>
              <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">${(summaryData?.sales?.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-slate-500">{summaryData?.sales?.count || 0} {isKhmer ? 'វិក្កយបត្រ' : 'invoices'}</span>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 border-l-4 border-l-amber-500 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'មាសលក់ចេញ' : 'Gold Sold'}</span>
              <p className="text-xl font-extrabold font-mono text-amber-900 mt-1">{summaryData?.sales?.weight_sold?.chi || 0} <span className="text-xs font-sans text-amber-700">{isKhmer ? 'ជី' : 'Chi'}</span></p>
              <span className="text-[11px] text-slate-500 font-mono">({summaryData?.sales?.weight_sold?.grams || 0} g)</span>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 border-l-4 border-l-rose-500 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'ទិញមាសចាស់ចូល' : 'Scrap Payout'}</span>
              <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">${(summaryData?.buybacks?.total_payout || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-slate-500">{summaryData?.buybacks?.count || 0} {isKhmer ? 'ដង' : 'tickets'}</span>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 border-l-4 border-l-violet-500 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'តម្លៃស្តុកក្នុងឃ្លាំង' : 'Vault Valuation'}</span>
              <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">${(summaryData?.vault_inventory?.estimated_retail_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-slate-500">{summaryData?.vault_inventory?.total_units_in_stock || 0} {isKhmer ? 'គ្រឿង' : 'items'}</span>
            </div>
          </div>

          {/* Master Table: Comprehensive Financial & Operational Summary */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faTableList} className="text-amber-500 w-3.5 h-3.5" />
                <span>{isKhmer ? 'តារាងសង្ខេបរបាយការណ៍ហិរញ្ញវត្ថុ និងប្រតិបត្តិការទូទៅ (Master Balance Ledger)' : 'Master Financial & Operational Summary Table'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-slate-500">{startDate} → {endDate}</span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/75 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-44">{isKhmer ? 'ផ្នែក / ប្រភេទ' : 'Category'}</th>
                    <th className="py-3 px-4">{isKhmer ? 'ឈ្មោះទិន្នន័យ (Metric)' : 'Metric Description'}</th>
                    <th className="py-3 px-4 text-center">{isKhmer ? 'ចំនួន / បរិមាណ' : 'Count / Qty'}</th>
                    <th className="py-3 px-4 text-right">{isKhmer ? 'ទម្ងន់មាស (ជី / ក្រាម)' : 'Gold Weight'}</th>
                    <th className="py-3 px-4 text-right">{isKhmer ? 'ទឹកប្រាក់ (USD)' : 'Amount (USD)'}</th>
                    <th className="py-3 px-4 text-center">{isKhmer ? 'ចំណាំ / ស្ថានភាព' : 'Status / Note'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Sales Group */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 bg-slate-50/40" rowSpan={4}>
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <FontAwesomeIcon icon={faReceipt} className="w-3 h-3" />
                        {isKhmer ? 'ការលក់ចេញ' : 'Sales Revenue'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900">{isKhmer ? 'ការលក់ដុលសរុប (Gross Sales)' : 'Gross Sales Amount'}</td>
                    <td className="py-3 px-4 text-center font-mono">{summaryData?.sales?.count || 0}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-900">{summaryData?.sales?.weight_sold?.chi || 0} Chi</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${(summaryData?.sales?.gross_total || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Gross</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{isKhmer ? 'ការបញ្ចុះតម្លៃសរុប (Promotions & Discounts)' : 'Discounts & VIP Reductions'}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">-</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">-${(summaryData?.sales?.discount || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Discount</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors bg-emerald-50/30">
                    <td className="py-3 px-4 font-bold text-emerald-900">{isKhmer ? 'ចំណូលលក់សុទ្ធ (Net Sales Revenue)' : 'Net Sales Revenue (USD)'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">{summaryData?.sales?.count || 0} inv</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                      {summaryData?.sales?.weight_sold?.chi || 0} Chi ({summaryData?.sales?.weight_sold?.grams || 0}g)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 text-sm">
                      ${(summaryData?.sales?.grand_total || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Net Active</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{isKhmer ? 'កម្រៃឈ្នួលកែច្នៃ & ត្បូងពេជ្រ' : 'Labor Fees & Gemstone Margin'}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">-</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      ${((summaryData?.sales?.labor_fee_collected || 0) + (summaryData?.sales?.gemstone_revenue || 0)).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[11px]">{isKhmer ? 'ថ្លៃជាង & ត្បូង' : 'Services'}</td>
                  </tr>

                  {/* Buybacks Group */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 bg-slate-50/40" rowSpan={2}>
                      <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                        <FontAwesomeIcon icon={faArrowsRotate} className="w-3 h-3" />
                        {isKhmer ? 'ទិញមាសចាស់' : 'Scrap Buybacks'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900">{isKhmer ? 'ទឹកប្រាក់ទិញមាសអេតចាយសរុប (Payout)' : 'Scrap Metal Trade-in Payout'}</td>
                    <td className="py-3 px-4 text-center font-mono">{summaryData?.buybacks?.count || 0}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-900">
                      {summaryData?.buybacks?.scrap_weight?.chi || 0} Chi ({summaryData?.buybacks?.scrap_weight?.grams || 0}g)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">${(summaryData?.buybacks?.total_payout || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Outflow</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{isKhmer ? 'ប្រាក់ចំណេញពីការកាត់កាកសំណល់' : 'Trade-in Deduction Profit'}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">-</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">+${(summaryData?.buybacks?.total_deductions_profit || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[11px]">{isKhmer ? 'កម្រៃកាត់' : 'Retention'}</td>
                  </tr>

                  {/* Vault Inventory Group */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 bg-slate-50/40" rowSpan={2}>
                      <span className="flex items-center gap-1.5 text-violet-700 font-bold">
                        <FontAwesomeIcon icon={faScaleBalanced} className="w-3 h-3" />
                        {isKhmer ? 'ស្តុកក្នុងឃ្លាំង' : 'Vault Inventory'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900">{isKhmer ? 'តម្លៃប៉ាន់ស្មានលក់រាយ (Retail Valuation)' : 'Estimated Retail Valuation (Spot Rate)'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{summaryData?.vault_inventory?.total_units_in_stock || 0} pcs</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-900">
                      {summaryData?.vault_inventory?.total_gold_weight?.chi || 0} Chi ({summaryData?.vault_inventory?.total_gold_weight?.grams || 0}g)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-violet-700">${(summaryData?.vault_inventory?.estimated_retail_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">Live Asset</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{isKhmer ? 'តម្លៃថ្លៃដើមប៉ាន់ស្មាន (Cost Valuation)' : 'Estimated Raw Metal Cost'}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{summaryData?.vault_inventory?.total_products || 0} SKUs</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">${(summaryData?.vault_inventory?.estimated_cost_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[11px]">{isKhmer ? 'ថ្លៃដើម' : 'Cost'}</td>
                  </tr>

                  {/* Cash Flow Position Group */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-amber-50/40">
                    <td className="py-3.5 px-4 font-bold text-slate-800 bg-slate-50/40">
                      <span className="flex items-center gap-1.5 text-sky-700 font-bold">
                        <FontAwesomeIcon icon={faMoneyBillTransfer} className="w-3 h-3" />
                        {isKhmer ? 'លំហូរសាច់ប្រាក់' : 'Net Liquidity'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{isKhmer ? 'លំហូរសាច់ប្រាក់សុទ្ធ (Inflow - Outflow)' : 'Net Cash Position (Sales - Payouts)'}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">-</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">-</td>
                    <td className={`py-3.5 px-4 text-right font-mono font-extrabold text-sm ${(summaryData?.financial?.net_cash_flow || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      ${(summaryData?.financial?.net_cash_flow || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${(summaryData?.financial?.net_cash_flow || 0) >= 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                        {(summaryData?.financial?.net_cash_flow || 0) >= 0 ? 'Surplus' : 'Deficit'}
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Scrap Buybacks Report (Clean Table View) ───────────────── */}
      {!loading && reportTab === 'buybacks' && (
        <div className="space-y-5">
          {/* Quick Stats Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'សរុបប័ណ្ណទិញចូល' : 'Total Tickets'}</span>
              <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">{buybackData?.summary?.total_tickets || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'ទឹកប្រាក់ទិញចូលសរុប' : 'Total Payout'}</span>
              <p className="text-xl font-extrabold font-mono text-rose-700 mt-1">${(buybackData?.summary?.total_payout || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'ទម្ងន់មាសចាស់សរុប' : 'Scrap Gold Weight'}</span>
              <p className="text-xl font-extrabold font-mono text-amber-800 mt-1">{buybackData?.summary?.scrap_weight?.chi || 0} Chi</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'កម្រៃកាត់កាកសំណល់' : 'Deductions Profit'}</span>
              <p className="text-xl font-extrabold font-mono text-emerald-700 mt-1">+${(buybackData?.summary?.total_deductions_profit || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Primary Table: Scrap Buybacks Ledger */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faArrowsRotate} className="text-amber-500 w-3.5 h-3.5" />
                <span>{isKhmer ? 'តារាងកំណត់ត្រាទិញមាសចាស់ចូល (Scrap Buybacks Activity Ledger)' : 'Scrap Buybacks Activity Ledger Table'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-slate-400 font-normal">{(buybackData?.buybacks_list?.data || []).length} {isKhmer ? 'កំណត់ត្រា' : 'records'}</span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">{isKhmer ? 'ប័ណ្ណ #' : 'Ticket #'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">{isKhmer ? 'អតិថិជន' : 'Customer'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'ប្រភេទមាស' : 'Metal Karat'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ទម្ងន់ (ក្រាម)' : 'Weight (g)'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ទម្ងន់ (ជី)' : 'Weight (Chi)'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-right">{isKhmer ? 'តម្លៃទិញ ($/g)' : 'Rate ($/g)'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap text-right">{isKhmer ? 'ទឹកប្រាក់ទិញចូល ($)' : 'Payout ($)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(buybackData?.buybacks_list?.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FontAwesomeIcon icon={faBoxOpen} className="w-8 h-8 text-slate-300 mb-2 block mx-auto" />
                        <span>{isKhmer ? 'មិនមានទិន្នន័យទិញមាសចាស់ចូលទេ' : 'No scrap buyback records found'}</span>
                      </td>
                    </tr>
                  ) : (
                    (buybackData?.buybacks_list?.data || []).slice((buybackPage - 1) * pageSize, buybackPage * pageSize).map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-800">#{b.id}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-500">{String(b.buyback_date).slice(0, 10)}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{b.customer?.name || 'Walk-in Client'}</td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {b.metal_type?.name || 'Gold Scrap'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono">{b.weight} g</td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-900">{((b.weight || 0) / 3.75).toFixed(2)} Chi</td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-600">${b.buyback_rate || 0}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">${Number(b.total_refund || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {(buybackData?.buybacks_list?.data || []).length > pageSize && (
              <Pagination
                currentPage={buybackPage}
                totalItems={(buybackData?.buybacks_list?.data || []).length}
                pageSize={pageSize}
                onPageChange={setBuybackPage}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Tab 4: Vault & Inventory Valuation (Clean Table View) ─────────── */}
      {!loading && reportTab === 'inventory' && (
        <div className="space-y-5">
          {/* Quick Stats Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'ស្តុកគ្រឿងសរុប' : 'Total Stock Units'}</span>
              <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">{inventoryData?.summary?.total_stock_units || 0} pcs</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'ទម្ងន់មាសក្នុងឃ្លាំង' : 'Vault Gold (Chi)'}</span>
              <p className="text-xl font-extrabold font-mono text-amber-800 mt-1">{inventoryData?.summary?.net_gold_weight?.chi || 0} Chi</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'តម្លៃលក់រាយប៉ាន់ស្មាន' : 'Retail Valuation'}</span>
              <p className="text-xl font-extrabold font-mono text-emerald-700 mt-1">${(inventoryData?.summary?.estimated_retail_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'ថ្លៃដើមប៉ាន់ស្មាន' : 'Cost Valuation'}</span>
              <p className="text-xl font-extrabold font-mono text-slate-800 mt-1">${(inventoryData?.summary?.estimated_cost_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Primary Table: Live Vault Inventory Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faScaleBalanced} className="text-amber-500 w-3.5 h-3.5" />
                <span>{isKhmer ? 'តារាងសន្និធិ និងតម្លៃគ្រឿងអលង្ការក្នុងឃ្លាំង (Live Vault Valuation Table)' : 'Live Vault Inventory & Valuation Table'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-slate-400 font-normal">{(inventoryData?.products_list?.data || []).length} {isKhmer ? 'មុខទំនិញ' : 'items'}</span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">{isKhmer ? 'កូដ SKU' : 'SKU'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">{isKhmer ? 'ឈ្មោះគ្រឿងអលង្ការ' : 'Jewelry Piece'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'ប្រភេទ' : 'Category'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">{isKhmer ? 'កម្រិតទឹកមាស' : 'Metal Karat'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ទម្ងន់/គ្រឿង' : 'Unit Weight'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ចំនួនក្នុងស្តុក' : 'In Stock'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap text-right">{isKhmer ? 'តម្លៃលក់ប៉ាន់ស្មាន' : 'Est. Retail Value'}</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(inventoryData?.products_list?.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FontAwesomeIcon icon={faBoxOpen} className="w-8 h-8 text-slate-300 mb-2 block mx-auto" />
                        <span>{isKhmer ? 'មិនមានផលិតផលក្នុងស្តុកទេ' : 'No inventory items found'}</span>
                      </td>
                    </tr>
                  ) : (
                    (inventoryData?.products_list?.data || []).slice((inventoryPage - 1) * pageSize, inventoryPage * pageSize).map(p => {
                      const qty = Number(p.stock_qty || 0);
                      const netWt = Number(p.net_weight || 0);
                      const labor = Number(p.labor_cost || 0);
                      const markup = Number(p.markup_rate || 0);
                      const estItemRetail = ((netWt * 85.50) + labor) * (1 + (markup / 100));
                      const estTotalRetail = estItemRetail * qty;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-800">{p.code_sku || `SKU-${p.id}`}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                          <td className="py-3.5 px-3 text-slate-600">{p.category?.name || 'Jewelry'}</td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              {p.metal_type?.name || 'Gold'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-semibold text-amber-900">
                            {netWt} g ({(netWt / 3.75).toFixed(2)} ជី)
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                            {qty} pcs
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                            ${estTotalRetail.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {qty === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                {isKhmer ? 'អស់ស្តុក' : 'Out of Stock'}
                              </span>
                            ) : qty <= 3 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                {isKhmer ? 'ជិតអស់' : 'Low Stock'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                {isKhmer ? 'គ្រប់គ្រាន់' : 'Available'}
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

            {(inventoryData?.products_list?.data || []).length > pageSize && (
              <Pagination
                currentPage={inventoryPage}
                totalItems={(inventoryData?.products_list?.data || []).length}
                pageSize={pageSize}
                onPageChange={setInventoryPage}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Tab 5: Cash Flow (Clean Table View) ───────────────────────────── */}
      {!loading && reportTab === 'cashflow' && (
        <div className="space-y-5">
          {/* Quick Stats Pills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 border-l-4 border-l-emerald-500 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'សាច់ប្រាក់ចូល (Inflow)' : 'Total Inflow (Sales)'}</span>
              <p className="text-xl font-extrabold font-mono text-emerald-700 mt-1">+${(cashFlowData?.summary?.total_inflow || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 border-l-4 border-l-rose-500 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'សាច់ប្រាក់ចេញ (Outflow)' : 'Total Outflow (Payouts)'}</span>
              <p className="text-xl font-extrabold font-mono text-rose-700 mt-1">-${(cashFlowData?.summary?.total_outflow || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 border-l-4 border-l-amber-500 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'លំហូរសាច់ប្រាក់សុទ្ធ' : 'Net Cash Position'}</span>
              <p className={`text-xl font-extrabold font-mono mt-1 ${(cashFlowData?.summary?.net_cash_flow || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                ${(cashFlowData?.summary?.net_cash_flow || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Daily Cash Movement Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMoneyBillTransfer} className="text-amber-500 w-3.5 h-3.5" />
                <span>{isKhmer ? 'តារាងកំណត់ហេតុលំហូរសាច់ប្រាក់ប្រចាំថ្ងៃ (Daily Cash Flow Ledger)' : 'Daily Cash Flow Movement Table'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-slate-400 font-normal">{(cashFlowData?.daily_timeline || []).length} {isKhmer ? 'ថ្ងៃ' : 'days'}</span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap text-right">{isKhmer ? 'សាច់ប្រាក់ចូល (+)' : 'Inflow (+)'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap text-right">{isKhmer ? 'សាច់ប្រាក់ចេញ (-)' : 'Outflow (-)'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap text-right">{isKhmer ? 'សមតុល្យសុទ្ធប្រចាំថ្ងៃ' : 'Daily Net Balance'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(cashFlowData?.daily_timeline || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <FontAwesomeIcon icon={faBoxOpen} className="w-8 h-8 text-slate-300 mb-2 block mx-auto" />
                        <span>{isKhmer ? 'មិនមានទិន្នន័យលំហូរសាច់ប្រាក់ទេ' : 'No cash flow records found'}</span>
                      </td>
                    </tr>
                  ) : (
                    (cashFlowData?.daily_timeline || []).map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{t.date}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-bold">+${t.inflow.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-rose-700 font-bold">-${t.outflow.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">${t.net.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${t.net >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {t.net >= 0 ? '+ Inflow' : '- Outflow'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 6: Gold Rate History (Clean Table View) ───────────────────── */}
      {!loading && reportTab === 'goldrates' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-amber-500 w-3.5 h-3.5" />
                <span>{isKhmer ? 'តារាងប្រវត្តិតម្លៃហាងឆេងមាសប្រចាំថ្ងៃ (Historical Gold Fix Table)' : 'Historical Gold Fix & Spread Table'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-slate-400 font-normal">{(goldRateData?.rates || []).length} {isKhmer ? 'កំណត់ត្រា' : 'records'}</span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Effective Date'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">{isKhmer ? 'ប្រភេទទឹកមាស' : 'Metal Karat'}</th>
                    <th className="py-3.5 px-3 text-right">{isKhmer ? 'តម្លៃលក់ចេញ ($/g)' : 'Sell Rate ($/g)'}</th>
                    <th className="py-3.5 px-3 text-right">{isKhmer ? 'តម្លៃទិញចូល ($/g)' : 'Buy Rate ($/g)'}</th>
                    <th className="py-3.5 px-3 text-right">{isKhmer ? 'គម្លាតចំណេញ (Spread)' : 'Spread Margin'}</th>
                    <th className="py-3.5 px-4 text-right">{isKhmer ? 'តម្លៃក្នុង ១ ជី ($)' : 'Price / Chi ($)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(goldRateData?.rates || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <FontAwesomeIcon icon={faBoxOpen} className="w-8 h-8 text-slate-300 mb-2 block mx-auto" />
                        <span>{isKhmer ? 'មិនមានប្រវត្តិតម្លៃមាសទេ' : 'No gold rates history records found'}</span>
                      </td>
                    </tr>
                  ) : (
                    (goldRateData?.rates || []).slice((goldRatePage - 1) * pageSize, goldRatePage * pageSize).map(r => (
                      <tr key={r.id || `${r.metal_type_id}-${r.effective_date}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-600">{r.effective_date}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{r.metal_name}</td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-900">${Number(r.sell_rate || 0).toFixed(2)}</td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-700">${Number(r.buy_rate || 0).toFixed(2)}</td>
                        <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold">${Number(r.spread || 0).toFixed(2)} ({r.spread_percentage}%)</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-800">${Number(r.price_per_chi || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {(goldRateData?.rates || []).length > pageSize && (
              <Pagination
                currentPage={goldRatePage}
                totalItems={(goldRateData?.rates || []).length}
                pageSize={pageSize}
                onPageChange={setGoldRatePage}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Sale Invoice Details Modal ────────────────────────────────────── */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-transparent border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                  <FontAwesomeIcon icon={faReceipt} className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 font-mono">
                      {selectedSaleDetail.invoice_no || `INV-${selectedSaleDetail.id}`}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {selectedSaleDetail.status || 'completed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-slate-400" />
                    <span>{String(selectedSaleDetail.sale_date).slice(0, 10)}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content: Customer & Cashier Info */}
            <div className="p-5 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'អតិថិជន' : 'Customer'}</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedSaleDetail.customer?.name || 'Walk-in Guest'}</p>
                  {selectedSaleDetail.customer?.phone && (
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5 flex items-center gap-1">
                      <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5 text-slate-400" />
                      <span>{selectedSaleDetail.customer.phone}</span>
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isKhmer ? 'អ្នកគិតលុយ' : 'Cashier'}</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedSaleDetail.user?.name || 'Staff'}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{isKhmer ? 'ផ្នែកលក់' : 'Sales Department'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faGem} className="text-amber-500" />
                  <span>{isKhmer ? 'មុខទំនិញគ្រឿងអលង្ការក្នុងវិក្កយបត្រ' : 'Jewelry Items Breakdown'}</span>
                </h3>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">{isKhmer ? 'មុខទំនិញ' : 'Item'}</th>
                        <th className="py-2.5 px-2 text-center">{isKhmer ? 'កម្រិត' : 'Karat'}</th>
                        <th className="py-2.5 px-2 text-center">{isKhmer ? 'ទម្ងន់' : 'Weight'}</th>
                        <th className="py-2.5 px-2 text-right">{isKhmer ? 'ថ្លៃជាង' : 'Labor'}</th>
                        <th className="py-2.5 px-2 text-center">{isKhmer ? 'ចំនួន' : 'Qty'}</th>
                        <th className="py-2.5 px-3 text-right">{isKhmer ? 'តម្លៃសរុប' : 'Subtotal'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(selectedSaleDetail.sale_items || selectedSaleDetail.saleItems || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-900">{item.product?.name || `Product #${item.product_id}`}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.product?.code_sku || ''}</p>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              {item.product?.metal_type?.name || item.product?.metalType?.name || 'Gold'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-amber-900 font-semibold">
                            {item.weight_sold || item.product?.net_weight || 0}g
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({(((item.weight_sold || item.product?.net_weight || 0)) / 3.75).toFixed(2)} ជី)
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                            ${Number(item.labor_fee || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                            {item.quantity || 1}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            ${Number(item.subtotal || (item.unit_price * (item.quantity || 1)) || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{isKhmer ? 'សរុបការលក់ដុល (Gross Subtotal):' : 'Gross Subtotal:'}</span>
                  <span className="font-mono font-bold text-slate-900">${Number(selectedSaleDetail.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isKhmer ? 'ការបញ្ចុះតម្លៃ (Discount):' : 'Promotion Discount:'}</span>
                  <span className="font-mono font-bold text-rose-600">-${Number(selectedSaleDetail.discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isKhmer ? 'ពន្ធអាករ (Tax):' : 'Tax / VAT:'}</span>
                  <span className="font-mono font-bold text-slate-900">${Number(selectedSaleDetail.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-amber-200 text-sm font-extrabold text-slate-900">
                  <span>{isKhmer ? 'ទឹកប្រាក់ត្រូវទូទាត់សរុប:' : 'Grand Total:'}</span>
                  <div className="text-right">
                    <span className="font-mono text-emerald-700 text-base block">
                      ${Number(selectedSaleDetail.grand_total_usd || selectedSaleDetail.grand_total || 0).toFixed(2)}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 font-semibold">
                      ៛ {Number(selectedSaleDetail.grand_total_khr || ((selectedSaleDetail.grand_total_usd || 0) * 4100)).toLocaleString()} KHR
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {isKhmer ? 'បិទ' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      </div> {/* close .no-print */}

      {/* ── Official Printable Report Document (Rendered directly on Print) ── */}
      <div className="print-only hidden print:block">
        <ReportPrintDocument
          reportTab={reportTab}
          startDate={startDate}
          endDate={endDate}
          selectedPreset={selectedPreset}
          filterCustomer={filterCustomer}
          filterUser={filterUser}
          filterMetal={filterMetal}
          filterCategory={filterCategory}
          filterStatus={filterStatus}
          searchQuery={searchQuery}
          customers={customers}
          users={users}
          metalTypes={metalTypes}
          categories={categories}
          summaryData={summaryData}
          salesData={salesData}
          buybackData={buybackData}
          inventoryData={inventoryData}
          cashFlowData={cashFlowData}
          goldRateData={goldRateData}
          exchangeRate={exchangeRate}
          settings={settings}
        />
      </div>

    </div>
  );
};

export default ReportsView;
