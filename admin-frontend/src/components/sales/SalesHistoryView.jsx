import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { InvoiceModal } from '../pos/InvoiceModal';
import { SettlePaymentModal } from './SettlePaymentModal';
import { CancelRefundModal } from './CancelRefundModal';
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
  faXmark,
  faHandHoldingDollar
} from '@fortawesome/free-solid-svg-icons';

export const SalesHistoryView = () => {
  const { t, i18n } = useTranslation();
  const {
    sales,
    madeProducts,
    updateSaleStatus,
    updateSaleItemStatus,
    updateMadeProductStatus,
    exchangeRate,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    confirmDialog,
    showToast
  } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Filter States
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'pending', 'cancelled'
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [settleModalSale, setSettleModalSale] = useState(null);
  const [cancelModalSale, setCancelModalSale] = useState(null);

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
    const totalRev = sales.reduce((acc, s) => acc + (parseFloat(s.grand_total_usd ?? s.grand_total) || 0), 0);
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

  // Status Change Interceptor: If changing to completed and has deposit / balance due, popup payment modal; if already paid in full, show alert confirm only
  const handleStatusChange = async (sale, newStatus) => {
    if (sale.status === newStatus) return;

    const totalVal = parseFloat(sale.grand_total_usd ?? sale.grand_total) || 0;
    const paidVal = parseFloat(sale.paid_amount ?? 0);
    const rawBalance = parseFloat(sale.balance_due);
    const pStatus = (sale.payment_status || '').toLowerCase();

    // Check if fully paid
    const isPaidInFull = (pStatus === 'paid') || (paidVal >= totalVal && totalVal > 0) || (rawBalance <= 0.01 && totalVal > 0);
    const hasBalanceDue = !isPaidInFull && ((!isNaN(rawBalance) && rawBalance > 0.01) || pStatus === 'partial');

    if (newStatus === 'completed') {
      if (hasBalanceDue) {
        // Only show payment settlement modal if there is remaining balance due
        setSettleModalSale(sale);
        return;
      }

      // If already paid in full, show alert confirm (not choose payment method modal)
      const confirmed = await confirmDialog({
        title: isKhmer ? 'បញ្ជាក់ការបញ្ចប់ការបញ្ជាទិញ?' : 'Complete Order Fulfillment?',
        text: isKhmer
          ? `វិក្កយបត្រ #${sale.invoice_no} បានទូទាត់ប្រាក់គ្រប់ចំនួនរួចរាល់។ តើអ្នកចង់ប្តូរស្ថានភាពទៅជា "រួចរាល់ (Completed)" មែនទេ?`
          : `Invoice #${sale.invoice_no} is already Paid in Full ($${totalVal.toFixed(2)}). Do you want to mark this order as Completed?`,
        confirmButtonText: isKhmer ? 'យល់ព្រម (Completed)' : 'Yes, Complete Order',
        cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
        icon: 'question'
      });

      if (confirmed) {
        await updateSaleStatus(sale.id, 'completed');
        showToast(
          isKhmer
            ? `វិក្កយបត្រ #${sale.invoice_no} បានប្តូរជា Completed រួចរាល់!`
            : `Invoice #${sale.invoice_no} marked as Completed!`,
          'success'
        );
      }
      return;
    }

    if (newStatus === 'cancelled') {
      // Trigger Intelligent Cancellation & Refund Modal
      setCancelModalSale(sale);
      return;
    }

    updateSaleStatus(sale.id, newStatus);
  };

  // Confirm cancellation and process refund/deduction
  const handleCancelRefundConfirm = async (refundDetails) => {
    if (!cancelModalSale) return;
    try {
      // 1. Update sale status to cancelled
      await updateSaleStatus(cancelModalSale.id, 'cancelled');

      // 2. Also cancel any linked Made Jewelry crafting orders that were pending or in-progress
      const cleanInvNo = String(cancelModalSale.invoice_no || '').replace(/[^a-zA-Z0-9]/g, '');
      const linked = (madeProducts || []).filter(mp => {
        const orderNo = String(mp.order_no || '').replace(/[^a-zA-Z0-9]/g, '');
        const mpNotes = String(mp.notes || '');
        return cleanInvNo && (orderNo.includes(cleanInvNo) || mpNotes.includes(cancelModalSale.invoice_no));
      });

      for (const mp of linked) {
        if (mp.status !== 'cancelled' && mp.status !== 'completed') {
          await updateMadeProductStatus(mp.id, 'cancelled');
        }
      }

      // 3. Inform user with rich notification
      const stageText = refundDetails.craftingStage === 'pending'
        ? (isKhmer ? 'មិនទាន់ចាប់ផ្តើមជាង (Pending) - មិនកាត់ថ្លៃឈ្នួលទេ' : 'Not started (Pending) - No labor fee charged')
        : (isKhmer ? 'កំពុង/បានធ្វើរួច (In Progress/Completed) - បានកាត់ថ្លៃឈ្នួលជាង' : 'In Progress/Completed - Labor fee deducted');

      showToast(
        isKhmer
          ? `វិក្កយបត្រ #${cancelModalSale.invoice_no} បានបោះបង់ជោគជ័យ! ដកប្រាក់ជូនអតិថិជន: $${refundDetails.refundAmount?.toFixed(2)} (${stageText})`
          : `Invoice #${cancelModalSale.invoice_no} cancelled! Refunded: $${refundDetails.refundAmount?.toFixed(2)} (${stageText})`,
        'warning'
      );

      setCancelModalSale(null);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      showToast(isKhmer ? 'មានបញ្ហាក្នុងការបោះបង់ការបញ្ជាទិញ' : 'Failed to cancel order', 'error');
    }
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

    const headers = ['Invoice No', 'Date', 'Customer Name', 'Phone', 'Items Count', 'Subtotal ($)', 'Discount ($)', 'Tax ($)', 'Grand Total (USD)', 'Grand Total (KHR)', 'Currency', 'Payment Method', 'Status', 'Staff'];
    const rows = filteredSales.map(s => [
      `"${s.invoice_no}"`,
      `"${s.sale_date}"`,
      `"${s.customer_name || 'Walk-in Guest'}"`,
      `"${s.customer_phone || ''}"`,
      (s.items || []).length,
      (s.total_amount || 0).toFixed(2),
      (s.discount || 0).toFixed(2),
      (s.tax || 0).toFixed(2),
      (parseFloat(s.grand_total_usd ?? s.grand_total) || 0).toFixed(2),
      (parseFloat(s.grand_total_khr) || Math.round((parseFloat(s.grand_total_usd ?? s.grand_total) || 0) * 4100)),
      `"${s.currency || 'USD'}"`,
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
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
          <span>{filteredSales.length} {t('salesHistory.recordsFound', 'transactions on record')}</span>
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
            <option value="completed">{t('salesHistory.statusCompleted', 'Completed')}</option>
            <option value="pending">{t('salesHistory.statusPending', 'Pending')}</option>
            <option value="cancelled">{t('salesHistory.statusCancelled', 'Cancelled')}</option>
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

                        {/* Payment Column */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            {getPaymentBadge(sale.payment_method)}
                            <div>
                              {(sale.payment_status || '').toLowerCase() === 'partial' || (parseFloat(sale.balance_due) || 0) > 0.01 ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300/80">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    {isKhmer ? 'លុយកក់ (Deposit)' : 'Deposit'}
                                  </span>
                                  <div className="text-[10px] font-bold font-mono text-rose-700">
                                    {isKhmer ? 'នៅខ្វះ: ' : 'Due: '}${parseFloat(sale.balance_due || 0).toFixed(2)}
                                  </div>
                                </div>
                              ) : (sale.payment_status || '').toLowerCase() === 'pending' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300/80">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  {isKhmer ? 'រង់ចាំទូទាត់' : 'Pending'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {isKhmer ? 'បានទូទាត់' : 'Paid'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status (Interactive Dropdown) */}
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={sale.status || 'completed'}
                            onChange={(e) => handleStatusChange(sale, e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all ${
                              (sale.status || 'completed') === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/70'
                                : sale.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/70'
                                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/70'
                            }`}
                          >
                            <option value="completed">{t('salesHistory.statusCompleted', 'Completed')}</option>
                            <option value="pending">{t('salesHistory.statusPending', 'Pending')}</option>
                            <option value="cancelled">{t('salesHistory.statusCancelled', 'Cancelled')}</option>
                          </select>
                        </td>

                        {/* Subtotal & Deductions */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className="text-slate-800 font-medium">${(sale.total_amount || 0).toFixed(2)}</div>
                          {sale.discount > 0 && (
                            <div className="text-[11px] text-emerald-600 font-semibold">-${sale.discount.toFixed(2)} disc</div>
                          )}
                          {sale.tax > 0 && (
                            <div className="text-[11px] text-slate-400 font-normal">+${sale.tax.toFixed(2)} tax</div>
                          )}
                        </td>

                        {/* Grand Total */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-base font-bold font-mono text-slate-900 block">
                            ${(parseFloat(sale.grand_total_usd ?? sale.grand_total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs font-mono font-medium text-slate-500 block">
                            ៛{(parseFloat(sale.grand_total_khr) || Math.round((parseFloat(sale.grand_total_usd ?? sale.grand_total) || 0) * 4100)).toLocaleString()}
                          </span>
                        </td>

                        {/* Actions (Harmonized Vertical Stack - White & Orange Theme) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-1.5 min-w-[100px] max-w-[125px] mx-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(sale)}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50/70 text-slate-800 hover:text-orange-950 border border-orange-200/80 hover:border-orange-400 font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
                              title={t('salesHistory.viewInvoice', 'View / Print Invoice')}
                            >
                              <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5 text-orange-500" />
                              <span>{isKhmer ? 'វិក្កយបត្រ' : 'Invoice'}</span>
                            </button>
                            {((sale.payment_status || '').toLowerCase() === 'partial' || (parseFloat(sale.balance_due) || 0) > 0.01) && (
                              <button
                                type="button"
                                onClick={() => setSettleModalSale(sale)}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                                title={isKhmer ? 'ទូទាត់ប្រាក់បង្គ្រប់ការកក់' : 'Settle Deposit Balance'}
                              >
                                <FontAwesomeIcon icon={faHandHoldingDollar} className="w-3.5 h-3.5 text-white" />
                                <span>{isKhmer ? 'បង់បង្គ្រប់' : 'Settle Due'}</span>
                              </button>
                            )}
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
                                        <strong className="text-slate-900">
                                          {p.currency === 'KHR'
                                            ? `៛${Math.round(parseFloat(p.amount) || 0).toLocaleString()}`
                                            : `$${(parseFloat(p.amount) || 0).toFixed(2)}`}
                                        </strong>
                                        <span className="text-[10px] font-bold px-1 rounded bg-amber-100 text-amber-900">{p.currency || sale.currency || 'USD'}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                          (p.status || 'paid').toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {p.status || 'paid'}
                                        </span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                                      <strong className="capitalize">{sale.payment_method?.replace(/_/g, ' ') || 'Cash'}</strong>
                                      <strong className="text-slate-900">${(parseFloat(sale.grand_total_usd ?? sale.grand_total) || 0).toFixed(2)}</strong>
                                      <span className="text-[10px] font-bold px-1 rounded bg-amber-100 text-amber-900">{sale.currency || 'USD'}</span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                        {sale.payment_status || 'paid'}
                                      </span>
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

      {/* Settle Payment Modal for Deposit Orders */}
      {settleModalSale && (
        <SettlePaymentModal
          sale={settleModalSale}
          onClose={() => setSettleModalSale(null)}
          onSuccess={(updatedSale) => {
            setSettleModalSale(null);
            setSelectedInvoice(updatedSale || settleModalSale);
          }}
        />
      )}

      {/* Intelligent Cancellation & Refund Modal */}
      {cancelModalSale && (
        <CancelRefundModal
          sale={cancelModalSale}
          madeProducts={madeProducts}
          exchangeRate={exchangeRate}
          onClose={() => setCancelModalSale(null)}
          onConfirm={handleCancelRefundConfirm}
        />
      )}
    </div>
  );
};

export default SalesHistoryView;
