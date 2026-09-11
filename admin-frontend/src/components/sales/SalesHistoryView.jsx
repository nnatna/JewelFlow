import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { InvoiceModal } from '../pos/InvoiceModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClockRotateLeft,
  faReceipt,
  faDollarSign,
  faScaleBalanced,
  faBagShopping,
  faPrint,
  faFileCsv,
  faChevronDown,
  faChevronUp,
  faCreditCard,
  faMoneyBillWave,
  faBuildingColumns,
  faUser,
  faCalendarDays,
  faCircleCheck,
  faGem,
  faFilter,
  faXmark
} from '@fortawesome/free-solid-svg-icons';

export const SalesHistoryView = () => {
  const { t, i18n } = useTranslation();
  const { sales, setActiveTab, updateSaleStatus, updateSaleItemStatus, searchQuery, setSearchQuery } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Filter States
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'pending', 'cancelled'
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter Logic
  const filteredSales = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    return sales.filter(sale => {
      // 1. Global Search Query
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch = !q || (
        sale.invoice_no?.toLowerCase().includes(q) ||
        sale.customer_name?.toLowerCase().includes(q) ||
        sale.customer_phone?.toLowerCase().includes(q) ||
        sale.customer_email?.toLowerCase().includes(q) ||
        sale.user_name?.toLowerCase().includes(q) ||
        sale.payment_ref?.toLowerCase().includes(q) ||
        (sale.items || []).some(it => 
          it.product_name?.toLowerCase().includes(q) || 
          it.code_sku?.toLowerCase().includes(q)
        )
      );

      if (!matchesSearch) return false;

      // 2. Date Range Filter
      if (dateFilter !== 'all') {
        if (!sale.sale_date) return true;
        const saleDateStr = sale.sale_date.split('T')[0];
        if (dateFilter === 'today') {
          if (saleDateStr !== todayStr) return false;
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          if (saleDateStr < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          if (saleDateStr < thirtyDaysAgo) return false;
        }
      }

      // 3. Payment Method Filter
      if (paymentFilter !== 'all') {
        const pNorm = (sale.payment_method || '').toLowerCase().replace(/[\s_-]+/g, '');
        const fNorm = paymentFilter.toLowerCase().replace(/[\s_-]+/g, '');
        if (!pNorm.includes(fNorm) && !fNorm.includes(pNorm)) {
          return false;
        }
      }

      // 4. Status Filter
      if (statusFilter !== 'all') {
        if ((sale.status || 'completed').toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [sales, searchQuery, dateFilter, paymentFilter, statusFilter]);

  // Pagination Slice
  const totalItems = filteredSales.length;
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalRev = sales.reduce((acc, s) => acc + (parseFloat(s.grand_total) || 0), 0);
    const totalCount = sales.length;
    const completedCount = sales.filter(s => (s.status || 'completed') === 'completed').length;
    const pendingCount = sales.filter(s => s.status === 'pending').length;
    const cancelledCount = sales.filter(s => s.status === 'cancelled').length;
    const avgVal = totalCount > 0 ? totalRev / totalCount : 0;
    const totalItemsCount = sales.reduce((acc, s) => {
      return acc + (s.items || []).reduce((subAcc, item) => subAcc + (parseInt(item.qty, 10) || 1), 0);
    }, 0);
    const totalWeight = sales.reduce((acc, s) => {
      return acc + (s.items || []).reduce((subAcc, item) => subAcc + ((parseFloat(item.weight_g) || 0) * (parseInt(item.qty, 10) || 1)), 0);
    }, 0);

    return { totalRev, totalCount, completedCount, pendingCount, cancelledCount, avgVal, totalItemsCount, totalWeight };
  }, [sales]);

  // Toggle Row Expansion for details
  const toggleExpand = (id) => {
    setExpandedSaleId(prev => (prev === id ? null : id));
  };

  // Payment method badge helper
  const getPaymentBadge = (method) => {
    const m = (method || '').toLowerCase().replace(/_/g, ' ');
    if (m.includes('card')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <FontAwesomeIcon icon={faCreditCard} className="w-3 h-3" />
          {t('pos.creditCard', 'Credit Card')}
        </span>
      );
    }
    if (m.includes('wire') || m.includes('bank') || m.includes('transfer')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <FontAwesomeIcon icon={faBuildingColumns} className="w-3 h-3" />
          {t('salesHistory.bankTransfer', 'Bank Transfer')}
        </span>
      );
    }
    if (m.includes('qr')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <FontAwesomeIcon icon={faReceipt} className="w-3 h-3" />
          {t('salesHistory.qrCode', 'QR Code')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <FontAwesomeIcon icon={faMoneyBillWave} className="w-3 h-3" />
        {t('pos.cash', 'Cash')}
      </span>
    );
  };

  // Export Sales to CSV
  const handleExportCsv = () => {
    if (!filteredSales.length) return;

    const headers = ['Invoice No', 'Date', 'Customer Name', 'Phone', 'Items Count', 'Subtotal ($)', 'Discount ($)', 'Tax ($)', 'Grand Total ($)', 'Payment Method', 'Status', 'Staff'];
    const rows = filteredSales.map(s => [
      `"${s.invoice_no}"`,
      `"${s.sale_date}"`,
      `"${s.customer_name || 'Walk-in Guest'}"`,
      `"${s.customer_phone || ''}"`,
      (s.items || []).length,
      (s.total_amount || 0).toFixed(2),
      (s.discount || 0).toFixed(2),
      (s.tax || 0).toFixed(2),
      (s.grand_total || 0).toFixed(2),
      `"${s.payment_method || 'Credit Card'}"`,
      `"${s.payment_status || 'Paid'}"`,
      `"${s.user_name || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JewelFlow_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 via-white to-amber-100/40 p-6 rounded-2xl border border-amber-200/80 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold mb-2">
            <FontAwesomeIcon icon={faClockRotateLeft} className="w-3.5 h-3.5 text-amber-600" />
            {t('salesHistory.title', 'Sales & Invoices History')}
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-serif">
            {t('salesHistory.title', 'Sales & Invoices History')}
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-xl">
            {t('salesHistory.subtitle', 'Complete register of atelier sales receipts, customer orders, and bullion invoices')} ({sales.length} {t('salesHistory.totalInvoices', 'Total Invoices')}).
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={handleExportCsv}
            disabled={filteredSales.length === 0}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-4 py-2.5 rounded-xl text-sm shadow-xs cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faFileCsv} className="w-4 h-4 text-emerald-600" />
            {t('salesHistory.exportCsv', 'Export CSV')}
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4" />
            {t('salesHistory.newSale', 'New POS Sale')}
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('salesHistory.totalRevenue', 'Total Sales Volume')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faDollarSign} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-900">
            ${metrics.totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('salesHistory.acrossCompleted', 'Across')} {metrics.totalCount} {t('salesHistory.completedTrans', 'completed transactions')}
          </div>
        </div>

        {/* Total Invoices */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('salesHistory.totalInvoices', 'Total Invoices')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faReceipt} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-900">
            {metrics.totalCount}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="text-emerald-700">{metrics.completedCount} {t('salesHistory.statusCompleted', 'Completed')}</span>
            {metrics.pendingCount > 0 && <span className="text-amber-700">• {metrics.pendingCount} {t('salesHistory.statusPending', 'Pending')}</span>}
            {metrics.cancelledCount > 0 && <span className="text-rose-600">• {metrics.cancelledCount} {t('salesHistory.statusCancelled', 'Cancelled')}</span>}
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('salesHistory.avgTicket', 'Average Sale Value')}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faGem} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-900">
            ${metrics.avgVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('salesHistory.perTicket', 'Per customer checkout ticket')}
          </div>
        </div>

        {/* Total Metal Weight Sold */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('salesHistory.goldSold', 'Gold Transacted')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faScaleBalanced} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-amber-800">
            {metrics.totalWeight.toFixed(2)} <span className="text-sm font-sans font-normal text-slate-600">{t('cambodiaGold.gram', 'grams')}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {metrics.totalItemsCount} {t('salesHistory.piecesDelivered', 'jewelry pieces delivered')}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Active Filter Indicator */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {searchQuery ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium text-xs">
              <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('catalog.filterActive', 'Navbar Filter:')} <strong className="font-bold font-mono text-amber-950">"{searchQuery}"</strong></span>
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 text-slate-400 hover:text-amber-700 p-0.5 rounded transition-colors cursor-pointer"
                title={t('common.clear', 'Clear')}
              >
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
              <span>{filteredSales.length} {t('salesHistory.recordsFound', 'transactions on record')}</span>
            </div>
          )}
        </div>

        {/* Date & Payment Method Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Quick Date Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            {[
              { id: 'all', label: t('salesHistory.filterAll', 'All Time') },
              { id: 'today', label: t('salesHistory.filterToday', 'Today') },
              { id: 'week', label: t('salesHistory.filterWeek', 'This Week') },
              { id: 'month', label: t('salesHistory.filterMonth', 'This Month') },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setDateFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-amber-500 focus:outline-none cursor-pointer"
          >
            <option value="all">{t('salesHistory.allMethods', 'All Payment Types')}</option>
            <option value="cash">{t('pos.cash', 'Cash')}</option>
            <option value="credit_card">{t('pos.creditCard', 'Credit Card')}</option>
            <option value="bank_transfer">{t('salesHistory.bankTransfer', 'Bank Transfer')}</option>
            <option value="qr_code">{t('salesHistory.qrKhqr', 'QR Code / KHQR')}</option>
          </select>

          {/* Order Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-amber-500 focus:outline-none cursor-pointer"
          >
            <option value="all">{t('salesHistory.allStatuses', 'All Statuses')}</option>
            <option value="completed">✓ {t('salesHistory.statusCompleted', 'Completed')}</option>
            <option value="pending">⏱ {t('salesHistory.statusPending', 'Pending')}</option>
            <option value="cancelled">✕ {t('salesHistory.statusCancelled', 'Cancelled')}</option>
          </select>
        </div>
      </div>

      {/* Main Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t('salesHistory.invoiceNo', 'Invoice No.')}</th>
                <th className="py-3.5 px-4">{t('salesHistory.date', 'Date & Time')}</th>
                <th className="py-3.5 px-4">{t('salesHistory.customer', 'Customer')}</th>
                <th className="py-3.5 px-4">{t('salesHistory.itemsCount', 'Items')}</th>
                <th className="py-3.5 px-4">{t('salesHistory.paymentMethod', 'Payment')}</th>
                <th className="py-3.5 px-4 text-center">{t('salesHistory.orderStatus', 'Status')}</th>
                <th className="py-3.5 px-4 text-right">{t('salesHistory.subtotal', 'Subtotal')}</th>
                <th className="py-3.5 px-4 text-right">{t('salesHistory.grandTotal', 'Grand Total')}</th>
                <th className="py-3.5 px-4 text-center">{t('salesHistory.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FontAwesomeIcon icon={faReceipt} className="w-10 h-10 text-slate-300 mb-2 block mx-auto" />
                    <p className="font-semibold text-slate-600">{t('salesHistory.noSalesFound', 'No sales records found matching your filters.')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('salesHistory.tryChangingFilters', 'Try changing your search keywords or date range.')}</p>
                  </td>
                </tr>
              ) : (
                paginatedSales.map(sale => {
                  const isExpanded = expandedSaleId === sale.id;
                  const itemsCount = (sale.items || []).reduce((acc, it) => acc + (parseInt(it.qty, 10) || 1), 0);
                  const totalWeight = (sale.items || []).reduce((acc, it) => acc + ((parseFloat(it.weight_g) || 0) * (parseInt(it.qty, 10) || 1)), 0);

                  return (
                    <React.Fragment key={sale.id}>
                      <tr className={`hover:bg-amber-50/40 transition-colors ${isExpanded ? 'bg-amber-50/50 font-medium' : ''}`}>
                        {/* Invoice Number */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(sale.id)}
                              className="p-1 rounded text-slate-400 hover:text-amber-600 cursor-pointer"
                              title="Toggle line items"
                            >
                              <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="w-3 h-3" />
                            </button>
                            <div>
                              <span className="font-mono font-bold text-amber-900 block">{sale.invoice_no}</span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: #{sale.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faCalendarDays} className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sale.sale_date}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block">{sale.user_name || 'Staff Jeweler'}</span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                              <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate">{sale.customer_name}</span>
                              <span className="text-xs text-slate-500 font-mono">{sale.customer_phone}</span>
                            </div>
                          </div>
                        </td>

                        {/* Items */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-xs font-mono">
                              {itemsCount} {itemsCount > 1 ? t('salesHistory.items', 'items') : t('salesHistory.itemSingle', 'item')}
                            </span>
                            {totalWeight > 0 && (
                              <span className="text-[11px] text-amber-800 font-mono font-medium">
                                ({totalWeight.toFixed(1)}g)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {getPaymentBadge(sale.payment_method)}
                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {sale.payment_status || t('salesHistory.paid', 'Paid')}
                            </div>
                          </div>
                        </td>

                        {/* Status (Interactive) */}
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={sale.status || 'completed'}
                            onChange={(e) => updateSaleStatus(sale.id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                              (sale.status || 'completed') === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/70'
                                : sale.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/70'
                                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/70'
                            }`}
                          >
                            <option value="completed">✓ {t('salesHistory.statusCompleted', 'Completed')}</option>
                            <option value="pending">⏱ {t('salesHistory.statusPending', 'Pending')}</option>
                            <option value="cancelled">✕ {t('salesHistory.statusCancelled', 'Cancelled')}</option>
                          </select>
                        </td>

                        {/* Subtotal & Deductions */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className="text-slate-800">${(sale.total_amount || 0).toFixed(2)}</div>
                          {sale.discount > 0 && (
                            <div className="text-[11px] text-emerald-600 font-medium">-${sale.discount.toFixed(2)} disc</div>
                          )}
                          {sale.tax > 0 && (
                            <div className="text-[11px] text-slate-400">+${sale.tax.toFixed(2)} tax</div>
                          )}
                        </td>

                        {/* Grand Total */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-base font-bold font-mono text-slate-900">
                            ${(sale.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedInvoice(sale)}
                              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all shadow-2xs"
                              title={t('salesHistory.viewInvoice', 'View / Print Invoice')}
                            >
                              <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden sm:inline">{t('salesHistory.viewInvoice', 'Invoice')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Line Items Drawer */}
                      {isExpanded && (
                        <tr className="bg-amber-50/25 border-y border-amber-200/60">
                          <td colSpan={9} className="p-4 sm:p-5">
                            <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                                  <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 text-amber-600" />
                                  {t('salesHistory.lineItems', 'Purchased Items')} ({sale.invoice_no})
                                </h4>
                                <span className="text-xs text-slate-500 font-medium">
                                  {t('salesHistory.staffJeweler', 'Staff Jeweler')}: <strong className="text-slate-900">{sale.user_name || 'Alexander Cross'}</strong>
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="text-slate-500 border-b border-slate-100 font-semibold text-[11px]">
                                    <tr>
                                      <th className="py-2 px-2">{t('salesHistory.item', 'Item Name & SKU')}</th>
                                      <th className="py-2 px-2 text-center">{t('salesHistory.weightChi', isKhmer ? 'ទម្ងន់សុទ្ធ (ជី)' : 'Net Wt. (Chi)')}</th>
                                      <th className="py-2 px-2 text-center">{t('salesHistory.purityRate', 'Metal Rate')}</th>
                                      <th className="py-2 px-2 text-center">{t('salesHistory.laborFee', 'Labor Fee')}</th>
                                      <th className="py-2 px-2 text-center">{t('invoiceModal.qty', 'Qty')}</th>
                                      <th className="py-2 px-2 text-right">{t('salesHistory.unitPrice', 'Unit Price')}</th>
                                      <th className="py-2 px-2 text-right">{t('salesHistory.lineTotal', 'Line Total')}</th>
                                      <th className="py-2 px-2 text-center">{t('common.status', 'Status')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono">
                                    {(sale.items || []).map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/60">
                                        <td className="py-2.5 px-2">
                                          <span className="font-sans font-bold text-slate-900 block">{item.product_name}</span>
                                          <span className="text-[11px] text-slate-400 font-mono">{item.code_sku}</span>
                                        </td>
                                        <td className="py-2.5 px-2 text-center text-slate-700">
                                          {item.weight_g ? (
                                            <>
                                              <span className="font-bold text-amber-950 block">{((parseFloat(item.weight_g) || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}</span>
                                              <span className="text-[10px] text-slate-400 font-normal font-sans">({(parseFloat(item.weight_g) || 0).toFixed(2)}g)</span>
                                            </>
                                          ) : (item.weight_chi ? `${item.weight_chi} ${isKhmer ? 'ជី' : 'Chi'}` : '—')}
                                        </td>
                                        <td className="py-2.5 px-2 text-center text-slate-700">
                                          {item.gold_rate_applied ? `$${(parseFloat(item.gold_rate_applied) || 0).toFixed(2)}/${isKhmer ? 'ជី' : 'chi'}` : '—'}
                                        </td>
                                        <td className="py-2.5 px-2 text-center text-slate-700">
                                          ${(parseFloat(item.labor_fee) || 0).toFixed(2)}
                                        </td>
                                        <td className="py-2.5 px-2 text-center text-slate-900 font-bold">
                                          {item.qty || 1}
                                        </td>
                                        <td className="py-2.5 px-2 text-right text-slate-700">
                                          ${(parseFloat(item.unit_price) || 0).toFixed(2)}
                                        </td>
                                        <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                                          ${(parseFloat(item.total) || 0).toFixed(2)}
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                          <select
                                            value={item.status || 'completed'}
                                            onChange={(e) => updateSaleItemStatus(sale.id, item.id, e.target.value)}
                                            className={`text-[11px] font-bold px-2 py-0.5 rounded border cursor-pointer focus:outline-none transition-colors ${
                                              (item.status || 'completed') === 'completed'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : item.status === 'cancelled'
                                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                                : 'bg-amber-50 text-amber-700 border-amber-300'
                                            }`}
                                          >
                                            <option value="completed">{t('salesHistory.statusCompleted', 'Completed')}</option>
                                            <option value="pending">{t('salesHistory.statusPending', 'Pending')}</option>
                                            <option value="cancelled">{t('salesHistory.statusCancelled', 'Cancelled')}</option>
                                          </select>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Database Payment Breakdown and Notes */}
                              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-slate-500 font-medium">{t('salesHistory.paymentRecord', 'Payment Record:')}</span>
                                  {(sale.payments && sale.payments.length > 0) ? (
                                    sale.payments.map((p, pIdx) => (
                                      <span key={pIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                                        <strong className="capitalize">{p.payment_method?.replace(/_/g, ' ')}</strong>
                                        {p.reference_no && <span className="text-slate-400">({p.reference_no})</span>}
                                        <strong className="text-slate-900">${(parseFloat(p.amount) || 0).toFixed(2)}</strong>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                                      <strong className="capitalize">{sale.payment_method?.replace(/_/g, ' ') || 'Cash'}</strong>
                                      <strong className="text-slate-900">${(parseFloat(sale.grand_total) || 0).toFixed(2)}</strong>
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-500 font-mono text-[11px]">
                                  {t('salesHistory.customerRef', 'Customer Ref:')} {sale.customer_id ? `ID #${sale.customer_id}` : 'Walk-in Guest'} • {t('salesHistory.tax', 'Tax:')} ${(parseFloat(sale.tax) || 0).toFixed(2)}
                                </div>
                              </div>

                              {sale.notes && (
                                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                                  <strong className="text-slate-800">{t('salesHistory.specialNotes', 'Special Notes:')}</strong> {sale.notes}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Luxury Printable Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default SalesHistoryView;
