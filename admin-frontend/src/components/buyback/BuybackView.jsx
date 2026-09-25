import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { BuybackVoucherModal } from './BuybackVoucherModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faScaleBalanced,
  faFileLines,
  faFilter,
  faXmark,
  faPrint,
  faCircleExclamation,
  faUser,
  faUserPlus,
  faGem,
  faBoxesStacked,
  faWandMagicSparkles,
  faClockRotateLeft,
  faCheckCircle,
  faPlus,
  faRotateRight,
  faCoins,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';

export const BuybackView = () => {
  const { t, i18n } = useTranslation();
  const {
    buybacks = [],
    goldRates = [],
    processBuyback,
    searchQuery,
    setSearchQuery,
    showToast,
    customers = [],
    addCustomer,
    materials = [],
    updateMaterial,
    categories = [],
    addProduct,
    refreshAllData
  } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Modal open state for New Buyback Appraisal Form
  const [isAppraisalModalOpen, setIsAppraisalModalOpen] = useState(false);

  // Customer selection state: 'existing' (old customer) or 'new' (new customer)
  const [customerMode, setCustomerMode] = useState('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Destination type state: 'jewelry' or 'material'
  const [destinationType, setDestinationType] = useState('material');
  // If jewelry: 'old' (old/estate piece) or 'new' (finished new piece)
  const [jewelryCondition, setJewelryCondition] = useState('old');
  const [jewelryName, setJewelryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [autoCatalogJewelry, setAutoCatalogJewelry] = useState(true);

  // If material: target material to update stock
  const [targetMaterialId, setTargetMaterialId] = useState('');

  // Deduplicated & Sorted Metal Rates (Always guarantees 24K Gold at top)
  const availableRates = useMemo(() => {
    const list = Array.isArray(goldRates) ? [...goldRates] : [];
    const uniqueMap = new Map();
    list.forEach(r => {
      const key = r.metal_type_id || r.name;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, r);
      }
    });

    let items = Array.from(uniqueMap.values());
    const has24K = items.some(r => /24K|AU999|99\.9/i.test(r.name));
    if (!has24K) {
      items.unshift({
        id: 'rate-24k',
        metal_type_id: 1,
        name: 'Gold 24K (99.9%)',
        buy_rate_per_gram: 81.20,
        rate_per_gram: 85.50
      });
    }

    // Sort order: 24K first, 22K, 18K Yellow, 18K White, 18K Rose, 14K, Platinum, Silver
    items.sort((a, b) => {
      const getRank = (name = '') => {
        if (/24k|99\.9/i.test(name)) return 1;
        if (/22k|91\.6/i.test(name)) return 2;
        if (/18k.*yellow|yellow.*18k|gold.*18k/i.test(name)) return 3;
        if (/18k.*white|white.*18k/i.test(name)) return 4;
        if (/18k.*rose|rose.*18k/i.test(name)) return 5;
        if (/14k/i.test(name)) return 6;
        if (/pt|plat/i.test(name)) return 7;
        if (/silv|925/i.test(name)) return 8;
        return 50;
      };
      return getRank(a.name) - getRank(b.name);
    });

    return items;
  }, [goldRates]);

  // Appraisal Form Parameters (Chi ជី is primary Cambodian jewelry unit)
  const [selectedMetalId, setSelectedMetalId] = useState(1);
  const [weightUnit, setWeightUnit] = useState('chi'); // 'chi' (ជី) | 'g' (ក្រាម)
  const [enteredWeight, setEnteredWeight] = useState(2.5); // Default 2.5 ជី (9.375g)
  const [meltLossPct, setMeltLossPct] = useState(2.0);
  const [appraisalFee, setAppraisalFee] = useState(20);
  const [payoutMethod, setPayoutMethod] = useState('Cash');
  const [notes, setNotes] = useState('Tested via XRF assay spectrometer. Good purity.');
  const [issuedVoucher, setIssuedVoucher] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageSize = 10;

  // Convert entered weight to Gross Grams and Gross Chi
  const grossWeight = weightUnit === 'chi'
    ? (Number(enteredWeight) || 0) * 3.75
    : (Number(enteredWeight) || 0);
  const grossWeightChi = weightUnit === 'chi'
    ? (Number(enteredWeight) || 0)
    : ((Number(enteredWeight) || 0) / 3.75);

  useEffect(() => {
    if (availableRates && availableRates.length > 0 && !availableRates.some(r => Number(r.metal_type_id) === Number(selectedMetalId))) {
      setSelectedMetalId(availableRates[0].metal_type_id);
    }
  }, [availableRates, selectedMetalId]);

  useEffect(() => {
    if (materials && materials.length > 0 && !targetMaterialId) {
      setTargetMaterialId(materials[0].id);
    }
  }, [materials, targetMaterialId]);

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Handle Existing Customer selection
  const handleSelectExistingCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    const found = customers.find(c => String(c.id) === String(customerId));
    if (found) {
      setCustomerName(found.name || '');
      setCustomerPhone(found.phone || '');
      if (errors.customerName) setErrors(prev => ({ ...prev, customerName: null }));
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  const defaultRate = { id: 1, metal_type_id: 1, name: 'Gold 24K (99.9%)', buy_rate_per_gram: 130.00, rate_per_gram: 137.00 };
  const selectedRate = availableRates.find(r => Number(r.metal_type_id) === Number(selectedMetalId)) || availableRates[0] || defaultRate;
  const buyRate = Number(selectedRate?.buy_rate_per_gram || 130.00);
  const buyRatePerChi = buyRate * 3.75;

  // Live Calculations in Chi and Grams
  const netWeight = Math.max(0, grossWeight * (1 - (Number(meltLossPct) || 0) / 100));
  const netWeightChi = netWeight / 3.75;
  const rawValue = netWeight * buyRate; // or netWeightChi * buyRatePerChi
  const totalPayout = Math.max(0, rawValue - (Number(appraisalFee) || 0));

  // Current selected material info
  const selectedMaterialObj = materials.find(m => String(m.id) === String(targetMaterialId));

  const cleanQ = (searchQuery || '').toLowerCase().trim();
  const safeBuybacks = Array.isArray(buybacks) ? buybacks : [];
  const filteredBuybacks = safeBuybacks.filter(b =>
    !cleanQ || (
      b.customer_name?.toLowerCase().includes(cleanQ) ||
      b.customer_phone?.includes(cleanQ) ||
      b.metal_name?.toLowerCase().includes(cleanQ) ||
      b.buyback_no?.toLowerCase().includes(cleanQ) ||
      b.notes?.toLowerCase().includes(cleanQ) ||
      b.destination_type?.toLowerCase().includes(cleanQ) ||
      b.material_name?.toLowerCase().includes(cleanQ) ||
      b.jewelry_name?.toLowerCase().includes(cleanQ)
    )
  );

  // Statistics
  const stats = useMemo(() => {
    const list = safeBuybacks;
    const totalCount = list.length;
    const totalGrams = list.reduce((sum, b) => sum + (parseFloat(b.net_weight) || 0), 0);
    const totalChi = (totalGrams / 3.75).toFixed(2);
    const totalPayoutAmount = list.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const materialCount = list.filter(b => b.destination_type === 'material').length;

    return { totalCount, totalGrams, totalChi, totalPayoutAmount, materialCount };
  }, [safeBuybacks]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredBuybacks.length / pageSize) || 1;
  const paginatedBuybacks = filteredBuybacks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openNewAppraisalModal = () => {
    setErrors({});
    if (customers.length > 0 && customerMode === 'existing' && !selectedCustomerId) {
      handleSelectExistingCustomer(customers[0].id);
    }
    setIsAppraisalModalOpen(true);
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (customerMode === 'existing' && !selectedCustomerId && !customerName.trim()) {
      newErrors.customerName = isKhmer ? 'សូមជ្រើសរើសអតិថិជនចាស់!' : 'Please select an existing customer!';
    } else if (!customerName || !customerName.trim()) {
      newErrors.customerName = isKhmer ? 'សូមបញ្ចូលឈ្មោះអតិថិជន!' : 'Please enter customer name!';
    }

    if (!grossWeight || parseFloat(grossWeight) <= 0) {
      newErrors.grossWeight = isKhmer ? 'សូមបញ្ចូលទម្ងន់ត្រឹមត្រូវ!' : 'Please enter valid scrap weight!';
    }

    if (destinationType === 'jewelry' && autoCatalogJewelry && !jewelryName.trim()) {
      newErrors.jewelryName = isKhmer ? 'សូមបញ្ចូលឈ្មោះគ្រឿងអលង្ការ!' : 'Please enter jewelry piece title!';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      // 1. If New Customer and phone provided, register to customer list
      let finalCustomerId = selectedCustomerId;
      if (customerMode === 'new' && addCustomer && customerName.trim()) {
        try {
          const newCust = await addCustomer({
            name: customerName.trim(),
            phone: customerPhone ? customerPhone.trim() : '',
            loyalty_points: 50
          });
          if (newCust && newCust.id) finalCustomerId = newCust.id;
        } catch (custErr) {
          console.warn('Customer auto-register error:', custErr);
        }
      }

      // 2. If destination is Material -> Automatically update Material Stock
      if (destinationType === 'material' && selectedMaterialObj && updateMaterial) {
        const addedGrams = parseFloat(netWeight.toFixed(2));
        const currentQty = parseFloat(selectedMaterialObj.stock_qty || 0);
        const newStockQty = Math.round((currentQty + addedGrams) * 100) / 100;
        
        try {
          await updateMaterial(selectedMaterialObj.id, {
            ...selectedMaterialObj,
            stock_qty: newStockQty
          });
          if (showToast) {
            showToast(
              isKhmer
                ? `បានបន្ថែមស្តុក "${selectedMaterialObj.name}" +${addedGrams}g ជោគជ័យ (ស្តុកសរុប: ${newStockQty}g)!`
                : `Added +${addedGrams}g to "${selectedMaterialObj.name}" vault stock (Total: ${newStockQty}g)!`,
              'success'
            );
          }
        } catch (matErr) {
          console.error('Failed to update material stock:', matErr);
        }
      }

      // 3. If destination is Jewelry -> Optionally catalog into products
      if (destinationType === 'jewelry' && autoCatalogJewelry && addProduct && jewelryName.trim()) {
        try {
          await addProduct({
            name: jewelryName.trim(),
            code_sku: `JW-BB-${Date.now().toString().slice(-6)}`,
            category_id: selectedCategoryId || (categories[0]?.id || 1),
            metal_type_id: Number(selectedMetalId) || 1,
            net_weight: parseFloat(netWeight.toFixed(2)),
            gross_weight: parseFloat(grossWeight),
            labor_cost: 0,
            markup_rate: 15,
            stock_qty: 1,
            description: `Buyback item (${jewelryCondition === 'old' ? 'Estate / Pre-owned' : 'Refinished New'}). Bought on ${new Date().toISOString().split('T')[0]}`
          });
          if (showToast) {
            showToast(
              isKhmer
                ? `បានចុះបញ្ជី "${jewelryName}" ចូលកាតាឡុកគ្រឿងអលង្ការដោយជោគជ័យ!`
                : `Registered "${jewelryName}" into Jewelry Catalog!`,
              'info'
            );
          }
        } catch (prodErr) {
          console.error('Failed to auto-catalog jewelry piece:', prodErr);
        }
      }

      // 4. Record the Buyback Voucher
      const voucher = await processBuyback({
        customer_id: finalCustomerId || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone || 'N/A',
        customer_type: customerMode, // 'existing' or 'new'
        destination_type: destinationType, // 'jewelry' or 'material'
        jewelry_condition: destinationType === 'jewelry' ? jewelryCondition : null,
        jewelry_name: destinationType === 'jewelry' ? jewelryName : null,
        material_id: destinationType === 'material' ? (selectedMaterialObj?.id || null) : null,
        material_name: destinationType === 'material' ? (selectedMaterialObj?.name || null) : null,
        metal_type_id: Number(selectedMetalId) || (selectedRate?.metal_type_id || 1),
        metal_name: selectedRate?.name || '24K Gold',
        gross_weight: parseFloat(grossWeight) || 0,
        melt_loss_pct: parseFloat(meltLossPct) || 0,
        net_weight: parseFloat(netWeight.toFixed(2)),
        buy_rate_per_gram: parseFloat(buyRate),
        appraisal_fee: parseFloat(appraisalFee) || 0,
        total_amount: parseFloat(totalPayout.toFixed(2)),
        payment_method: payoutMethod,
        notes: notes || '',
        stock_updated: destinationType === 'material' ? true : (destinationType === 'jewelry' && autoCatalogJewelry)
      });

      if (voucher) {
        setIssuedVoucher(voucher);
        setIsAppraisalModalOpen(false);
        if (showToast) {
          showToast(isKhmer ? 'បានបង្កើតប័ណ្ណទិញចូលដោយជោគជ័យ!' : 'Buyback voucher created successfully!', 'success');
        }
      }

      // Reset form
      if (customerMode === 'new') {
        setCustomerName('');
        setCustomerPhone('');
      }
      setJewelryName('');
      setErrors({});
    } catch (err) {
      console.error('Process buyback error:', err);
      if (showToast) {
        showToast(isKhmer ? 'មានបញ្ហាក្នុងការបង្កើតប័ណ្ណទិញចូល!' : 'Failed to process buyback.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratesList = (goldRates && goldRates.length > 0) ? goldRates : [defaultRate];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full">
      {/* ── 1. Top Header with Quick Action & Summary ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs tracking-wider uppercase mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 font-bold text-[11px]">
              <FontAwesomeIcon icon={faArrowsRotate} className="w-3 h-3 text-amber-600" />
              <span>{isKhmer ? 'ស្ថានីយទិញមាសចាស់ & វត្ថុធាតុដើមចូល' : 'Bullion & Jewelry Buyback Terminal'}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif tracking-tight">
            {isKhmer ? 'តារាងប័ណ្ណទិញមាសចាស់ & ស្តុកចូល' : 'Settled Buyback Vouchers & Inbound Ledger'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isKhmer
              ? 'គ្រប់គ្រងប័ណ្ណទិញមាសចាស់ ពិនិត្យមើលការបញ្ចូលស្តុកវត្ថុធាតុដើមក្នុងឃ្លាំង និងបោះពុម្ពប័ណ្ណទូទាត់ប្រាក់ផ្លូវការ'
              : 'Official scrap buyback ledger, live vault restocking tracking, customer payouts and voucher printing'}
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
            onClick={openNewAppraisalModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 hover:shadow-amber-500/30"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បង្កើតប័ណ្ណទិញចូលថ្មី' : 'New Scrap Buyback'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Statistics Overview Cards (Full Width) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1.5">
            <span>{isKhmer ? 'ប័ណ្ណទិញចូលសរុប' : 'Total Buyback Vouchers'}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <FontAwesomeIcon icon={faFileLines} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-slate-900">{stats.totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">{isKhmer ? 'ប័ណ្ណទិញចូលទាំងអស់' : 'All lifetime vouchers'}</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1.5">
            <span>{isKhmer ? 'ទម្ងន់មាសទិញសរុប' : 'Total Gold Weight Bought'}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
              <FontAwesomeIcon icon={faScaleBalanced} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-amber-950">
            {stats.totalChi} <span className="text-xs font-bold font-sans">{isKhmer ? 'ជី' : 'Chi'}</span>
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">
            ≈ {stats.totalGrams.toFixed(2)} grams
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1.5">
            <span>{isKhmer ? 'ទឹកប្រាក់បើកជូនសរុប' : 'Total Payouts Disbursed'}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <FontAwesomeIcon icon={faMoneyBillWave} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">
            ${stats.totalPayoutAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">{isKhmer ? 'ទូទាត់ជូនអតិថិជន' : 'Total customer payouts'}</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-1.5">
            <span>{isKhmer ? 'តម្លៃទិញចូលបច្ចុប្បន្ន' : 'Live Buy Benchmark'}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
              <FontAwesomeIcon icon={faCoins} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-900">
            ${(buyRate * 3.75).toFixed(2)} <span className="text-xs font-sans text-slate-500 font-normal">/ {isKhmer ? 'ជី' : 'Chi'}</span>
          </p>
          <p className="text-[11px] text-amber-800 font-mono font-bold mt-1">
            ${buyRate.toFixed(2)} / gram (24K Gold)
          </p>
        </div>
      </div>

      {/* ── 3. Full Width Settled Buyback Vouchers Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4 w-full">
        {/* Toolbar with Search and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-serif">
              <FontAwesomeIcon icon={faFileLines} className="w-4 h-4 text-amber-600" />
              <span>{t('buybacks.recentVouchers', 'Settled Buyback Vouchers Table')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKhmer ? 'បញ្ជីប័ណ្ណទិញមាសចាស់ចូល & គោលដៅស្តុក' : 'Official scrap buyback vouchers & inventory destination log'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold shrink-0">
              {filteredBuybacks.length} {isKhmer ? 'ប័ណ្ណ' : 'vouchers'}
            </span>
          </div>
        </div>

        {/* Spacious Full-Width Table */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">{isKhmer ? 'លេខប័ណ្ណ / ថ្ងៃ' : 'Voucher No & Date'}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">{t('buybacks.customer', 'Customer')}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">{isKhmer ? 'ប្រភេទ & គោលដៅស្តុក' : 'Destination / Stock'}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px] text-center">{isKhmer ? 'ប្រភេទ & ទម្ងន់ (ជី)' : 'Metal & Chi Wt.'}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px] text-center">{isKhmer ? 'តម្លៃទិញ (/ជី)' : 'Buy Rate (/Chi)'}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px] text-right">{t('buybacks.payout', 'Net Payout')}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[120px] text-center">{t('common.status', 'Status')}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px] text-center sticky right-0 bg-slate-50 shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                    {t('salesHistory.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBuybacks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 font-sans">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                        <FontAwesomeIcon icon={faArrowsRotate} className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">{isKhmer ? 'មិនមានទិន្នន័យទិញមាសចាស់ចូលទេ' : 'No scrap buyback records found.'}</p>
                      <p className="text-xs text-slate-400 mt-1">{isKhmer ? 'សូមចុច "បង្កើតប័ណ្ណទិញចូលថ្មី" ដើម្បីបញ្ចូលទិន្នន័យ' : 'Click "New Scrap Buyback" to appraise customer gold'}</p>
                    </td>
                  </tr>
                ) : (
                  paginatedBuybacks.map(bb => {
                    const isMaterial = bb.destination_type === 'material';
                    const isJewelry = bb.destination_type === 'jewelry';
                    const itemChi = ((Number(bb.net_weight) || 0) / 3.75).toFixed(2);
                    const itemBuyRateChi = (Number(bb.buy_rate_per_gram || 0) * 3.75).toFixed(2);

                    return (
                      <tr key={bb.id} className="hover:bg-amber-50/40 transition-colors group">
                        {/* Voucher No & Date */}
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <span className="font-bold text-amber-900 block group-hover:text-amber-950 transition-colors">{bb.buyback_no || `BB-${bb.id}`}</span>
                          <span className="text-[11px] text-slate-400 block font-normal font-sans">{bb.buyback_date}</span>
                        </td>

                        {/* Customer Name & Type Badge */}
                        <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">{bb.customer_name || 'Walk-in Customer'}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              bb.customer_type === 'new'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {bb.customer_type === 'new' ? (isKhmer ? 'អតិថិជនថ្មី' : 'New') : (isKhmer ? 'អតិថិជនចាស់' : 'Old Customer')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{bb.customer_phone || ''}</span>
                          </div>
                        </td>

                        {/* Destination & Restock Type */}
                        <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                          {isMaterial ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                <FontAwesomeIcon icon={faBoxesStacked} className="w-2.5 h-2.5 text-amber-600" />
                                <span>{isKhmer ? 'ស្តុកវត្ថុធាតុដើម' : 'Material Vault'}</span>
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 truncate max-w-[160px]">
                                {bb.material_name || 'Gold Granules'} (+{itemChi} ជី)
                              </span>
                            </div>
                          ) : isJewelry ? (
                            <div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                bb.jewelry_condition === 'new'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-purple-50 text-purple-800 border border-purple-200'
                              }`}>
                                <FontAwesomeIcon icon={faGem} className="w-2.5 h-2.5" />
                                <span>{bb.jewelry_condition === 'new' ? (isKhmer ? 'គ្រឿងថ្មី' : 'New Jewelry') : (isKhmer ? 'គ្រឿងចាស់' : 'Old Jewelry')}</span>
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 truncate max-w-[160px]">
                                {bb.jewelry_name || 'Catalog Item'}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                              {isKhmer ? 'មាសចាស់' : 'Scrap'}
                            </span>
                          )}
                        </td>

                        {/* Metal Purity & Weight in Chi */}
                        <td className="py-3.5 px-4 font-sans text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 inline-block mb-0.5">
                            {bb.metal_name || 'Gold'}
                          </span>
                          <div className="font-bold text-amber-950 font-mono text-xs">
                            {itemChi} <span className="font-sans font-bold">{isKhmer ? 'ជី' : 'Chi'}</span>
                            <span className="text-slate-400 font-normal ml-1">({Number(bb.net_weight || 0).toFixed(2)}g)</span>
                          </div>
                        </td>

                        {/* Rate in Chi */}
                        <td className="py-3.5 px-4 font-mono text-center text-slate-700 whitespace-nowrap">
                          <span className="font-bold text-amber-900">${itemBuyRateChi} <span className="text-[10px] text-slate-500 font-sans font-normal">/{isKhmer ? 'ជី' : 'chi'}</span></span>
                          <span className="text-[10px] text-slate-400 block font-normal">(${Number(bb.buy_rate_per_gram || 0).toFixed(2)}/g)</span>
                        </td>

                        {/* Net Payout & Payment Method */}
                        <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                          <span className="font-bold text-slate-900 text-sm block">
                            ${Number(bb.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-amber-700 block font-sans font-semibold">{bb.payment_method || 'Cash'}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center font-sans whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <FontAwesomeIcon icon={faCheckCircle} className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{bb.status || (isKhmer ? 'បានទូទាត់' : 'Paid')}</span>
                          </span>
                        </td>

                        {/* Actions (Sticky) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap w-28 min-w-[110px] sticky right-0 bg-white group-hover:bg-amber-50/40 transition-colors shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                          <button
                            type="button"
                            onClick={() => setIssuedVoucher(bb)}
                            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all shadow-2xs active:scale-95"
                            title={isKhmer ? 'មើលប័ណ្ណទិញចូល / បោះពុម្ព' : 'View / Print Voucher'}
                          >
                            <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5 text-amber-600" />
                            <span>{isKhmer ? 'ប័ណ្ណ' : 'Voucher'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredBuybacks.length > pageSize && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Luxury 2-Column New Buyback Appraisal Modal ── */}
      {isAppraisalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-4xl lg:max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* ── Fixed Header ── */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={faScaleBalanced} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {t('buybacks.appraisalSlip', 'Precious Metal Appraisal Slip')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer
                      ? 'វាយតម្លៃមាសចាស់ពីអតិថិជន និងជ្រើសរើសគោលដៅស្តុក (វត្ថុធាតុដើម ឬគ្រឿងអលង្ការ)'
                      : 'Appraise customer scrap metal and choose inventory destination'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[11px] text-amber-900 font-mono font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {t('buybacks.liveBuyFix', 'Live Buy Fix:')} ${buyRate.toFixed(2)}/g (${(buyRate * 3.75).toFixed(2)}/{isKhmer ? 'ជី' : 'chi'})
                </span>
                <button
                  type="button"
                  onClick={() => setIsAppraisalModalOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                  title={isKhmer ? 'បិទ' : 'Close'}
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Modal Body (2-Column Studio Grid) ── */}
            <form id="buyback-form" noValidate onSubmit={handleProcess} className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ── Left Column: Customer & Metal Assessment (7 Cols) ── */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* 1. Customer Selection Mode (Old vs New) */}
                  <div className="space-y-2 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-800 font-bold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faUser} className="text-amber-600" />
                        <span>{isKhmer ? 'ព័ត៌មានអតិថិជន' : 'Customer Selection'}</span>
                      </span>
                      
                      {/* Mode Selector */}
                      <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerMode('existing');
                            if (customers.length > 0 && !selectedCustomerId) {
                              handleSelectExistingCustomer(customers[0].id);
                            }
                          }}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            customerMode === 'existing'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isKhmer ? 'អតិថិជនចាស់' : 'Old / Existing'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerMode('new');
                            setSelectedCustomerId('');
                            setCustomerName('');
                            setCustomerPhone('');
                          }}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            customerMode === 'new'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isKhmer ? 'អតិថិជនថ្មី' : 'New Customer'}
                        </button>
                      </div>
                    </div>

                    {customerMode === 'existing' ? (
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          {isKhmer ? 'ជ្រើសរើសអតិថិជនចាស់ក្នុងប្រព័ន្ធ' : 'Select Registered Customer'} <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => handleSelectExistingCustomer(e.target.value)}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none transition-colors cursor-pointer ${
                            errors.customerName ? 'border-rose-500 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500'
                          }`}
                        >
                          <option value="">{isKhmer ? '-- ជ្រើសរើសអតិថិជន --' : '-- Choose Customer --'}</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.phone ? `(${c.phone})` : ''} • {c.tier || 'Standard'} ({c.loyalty_points || 0} pts)
                            </option>
                          ))}
                        </select>
                        {customerPhone && (
                          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                            {isKhmer ? 'លេខទូរស័ព្ទ:' : 'Phone:'} {customerPhone}
                          </span>
                        )}
                        {errors.customerName && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                            <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{errors.customerName}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">
                            {isKhmer ? 'ឈ្មោះអតិថិជនថ្មី' : 'New Customer Full Name'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Arthur Pendelton"
                            value={customerName}
                            onChange={(e) => {
                              setCustomerName(e.target.value);
                              if (errors.customerName) setErrors(prev => ({ ...prev, customerName: null }));
                            }}
                            className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none transition-colors ${
                              errors.customerName ? 'border-rose-500 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500'
                            }`}
                          />
                          {errors.customerName && (
                            <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                              <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{errors.customerName}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">
                            {isKhmer ? 'លេខទូរស័ព្ទទំនាក់ទំនង' : 'Customer Phone / Contact'}
                          </label>
                          <input
                            type="text"
                            placeholder="+855 12 345 678"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Metal Assessment & Pricing */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">
                        {t('buybacks.metalAssessment', 'Tested Metal Purity')} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedMetalId}
                        onChange={(e) => setSelectedMetalId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-medium cursor-pointer"
                      >
                        {availableRates.map(r => {
                          const rateVal = Number(r.buy_rate_per_gram || 0);
                          const rateChi = (rateVal * 3.75).toFixed(2);
                          return (
                            <option key={r.id || r.metal_type_id} value={r.metal_type_id}>
                              {r.name} — ទិញចូល: ${rateChi} / {isKhmer ? 'ជី' : 'Chi'} (${rateVal.toFixed(2)}/g)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Weights & Impurity */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-slate-700 font-bold">
                            {isKhmer ? 'ទម្ងន់មាសចាស់' : 'Gross Scrap Weight'} ({weightUnit === 'chi' ? (isKhmer ? 'ជី' : 'Chi') : 'g'}) <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center bg-white p-0.5 rounded border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setWeightUnit('chi')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                weightUnit === 'chi' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {isKhmer ? 'ជី' : 'Chi'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setWeightUnit('g')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                weightUnit === 'g' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              g
                            </button>
                          </div>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={enteredWeight}
                          onChange={(e) => {
                            setEnteredWeight(parseFloat(e.target.value) || 0);
                            if (errors.grossWeight) setErrors(prev => ({ ...prev, grossWeight: null }));
                          }}
                          className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none transition-colors ${
                            errors.grossWeight ? 'border-rose-500 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 focus:bg-white'
                          }`}
                        />
                        <span className="text-[11px] text-slate-500 font-mono mt-1 block font-semibold">
                          {weightUnit === 'chi'
                            ? `≈ ${(enteredWeight * 3.75).toFixed(2)} grams (1 ជី = 3.75g)`
                            : `≈ ${(enteredWeight / 3.75).toFixed(2)} ${isKhmer ? 'ជី' : 'Chi'}`}
                        </span>
                        {errors.grossWeight && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                            <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{errors.grossWeight}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          {t('buybacks.meltLoss', 'Melt Loss / Impurity (%)')}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={meltLossPct}
                          onChange={(e) => setMeltLossPct(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Assay Fee & Payout Tender */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          {t('buybacks.assayFee', 'Assay / Melt Fee ($)')}
                        </label>
                        <input
                          type="number"
                          value={appraisalFee}
                          onChange={(e) => setAppraisalFee(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          {t('buybacks.payoutMethod', 'Payout Tender Method')}
                        </label>
                        <select
                          value={payoutMethod}
                          onChange={(e) => setPayoutMethod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-medium cursor-pointer"
                        >
                          <option value="Cash">{t('pos.cash', 'Instant Cash Payout')}</option>
                          <option value="Store Credit">Store Credit (Trade-In)</option>
                          <option value="Bank Wire">Bank Wire Transfer</option>
                          <option value="KHQR">{t('pos.khqr', 'KHQR')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        {t('buybacks.notes', 'Assay & Purity Notes')}
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                </div>

                {/* ── Right Column: Destination & Live Payout Summary (5 Cols) ── */}
                <div className="lg:col-span-5 space-y-4 flex flex-col">
                  
                  {/* Buyback Destination: Jewelry vs Material */}
                  <div className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-800 font-bold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faBoxesStacked} className="text-amber-600" />
                        <span>{isKhmer ? 'បញ្ចូលទៅក្នុងស្តុក (Destination)' : 'Inventory Restock Destination'}</span>
                      </span>
                      
                      {/* Destination Toggle */}
                      <div className="flex items-center bg-white p-0.5 rounded-lg border border-amber-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setDestinationType('material')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            destinationType === 'material'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isKhmer ? 'វត្ថុធាតុដើម' : 'Material Vault'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDestinationType('jewelry')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            destinationType === 'jewelry'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isKhmer ? 'គ្រឿងអលង្ការ' : 'Jewelry'}
                        </button>
                      </div>
                    </div>

                    {destinationType === 'material' ? (
                      /* Material Selection & Auto-restock */
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            {isKhmer ? 'ជ្រើសរើសវត្ថុធាតុដើមដើម្បីបន្ថែមស្តុក' : 'Select Target Material in Vault'} <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={targetMaterialId}
                            onChange={(e) => setTargetMaterialId(e.target.value)}
                            className="w-full bg-white border border-amber-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
                          >
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.category?.name || 'Metal'}) • {isKhmer ? 'ស្តុកបច្ចុប្បន្ន' : 'Stock'}: {m.stock_qty} {m.unit}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedMaterialObj && (
                          <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1 font-mono">
                            <div className="flex justify-between text-slate-500 text-[11px]">
                              <span>{isKhmer ? 'ស្តុកបច្ចុប្បន្ន:' : 'Current Vault Stock:'}</span>
                              <span className="font-bold text-slate-800">{selectedMaterialObj.stock_qty} {selectedMaterialObj.unit}</span>
                            </div>
                            <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-amber-100">
                              <span>{isKhmer ? 'បន្ថែមស្តុកថ្មី:' : 'Auto Restock:'}</span>
                              <span>+{netWeight.toFixed(2)}g ({((netWeight || 0) / 3.75).toFixed(2)} {isKhmer ? 'ជី' : 'Chi'})</span>
                            </div>
                            <div className="flex justify-between text-amber-950 font-bold text-[11px]">
                              <span>{isKhmer ? 'ស្តុកសរុបក្រោយទិញចូល:' : 'New Total Stock:'}</span>
                              <span>{(parseFloat(selectedMaterialObj.stock_qty || 0) + parseFloat(netWeight.toFixed(2))).toFixed(2)} {selectedMaterialObj.unit}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Jewelry Option: Old vs New */
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            {isKhmer ? 'ស្ថានភាពគ្រឿងអលង្ការ' : 'Jewelry Condition'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setJewelryCondition('old')}
                              className={`p-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                jewelryCondition === 'old'
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <FontAwesomeIcon icon={faClockRotateLeft} />
                              <span>{isKhmer ? 'គ្រឿងចាស់ (មួយទឹក)' : 'Old / Estate'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setJewelryCondition('new')}
                              className={`p-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                jewelryCondition === 'new'
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <FontAwesomeIcon icon={faWandMagicSparkles} />
                              <span>{isKhmer ? 'គ្រឿងថ្មី' : 'New Piece'}</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            {isKhmer ? 'ឈ្មោះគ្រឿងអលង្ការ' : 'Jewelry Piece Title'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder={isKhmer ? 'ឧ. ខ្សែកមាស 24K ក្បាលនាគ (មួយទឹក)' : 'e.g. 24K Estate Solid Gold Dragon Chain'}
                            value={jewelryName}
                            onChange={(e) => {
                              setJewelryName(e.target.value);
                              if (errors.jewelryName) setErrors(prev => ({ ...prev, jewelryName: null }));
                            }}
                            className={`w-full bg-white border rounded-xl px-3 py-2 text-slate-900 focus:outline-none transition-colors ${
                              errors.jewelryName ? 'border-rose-500 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500'
                            }`}
                          />
                          {errors.jewelryName && (
                            <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                              <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{errors.jewelryName}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            {isKhmer ? 'ប្រភេទគ្រឿង' : 'Jewelry Category'}
                          </label>
                          <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none cursor-pointer font-medium"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calculated Payout Summary Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-slate-50 to-white border border-amber-300 shadow-xs space-y-2 font-mono">
                    <div className="flex items-center justify-between text-slate-700 text-xs">
                      <span>{isKhmer ? 'ទម្ងន់មាសសុទ្ធ:' : 'Net Gold Weight:'}</span>
                      <span className="font-bold text-amber-950 text-base">
                        {netWeightChi.toFixed(2)} {isKhmer ? 'ជី' : 'Chi'}
                        <span className="text-xs text-slate-400 font-normal ml-1">({netWeight.toFixed(2)}g)</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 text-xs">
                      <span>{isKhmer ? 'តម្លៃទិញក្នុង ១ ជី:' : 'Buy Rate per Chi:'}</span>
                      <span className="font-bold text-amber-900">${buyRatePerChi.toFixed(2)} / {isKhmer ? 'ជី' : 'Chi'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 text-xs">
                      <span>{isKhmer ? 'តម្លៃមាសសរុប:' : 'Base Gold Value:'}</span>
                      <span className="font-semibold">${rawValue.toFixed(2)}</span>
                    </div>

                    {appraisalFee > 0 && (
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>{isKhmer ? 'ដកសេវាពិសោធន៍:' : 'Less Assay Fee:'}</span>
                        <span>-${parseFloat(appraisalFee).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-base font-bold text-slate-900 pt-2 border-t border-amber-200">
                      <span className="font-serif">{isKhmer ? 'ទឹកប្រាក់បើកជូន:' : 'Cash Payout:'}</span>
                      <span className="text-amber-700 text-2xl font-extrabold font-mono">
                        ${totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            </form>

            {/* ── Fixed Footer ── */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAppraisalModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200/80 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                form="buyback-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? (isKhmer ? 'កំពុងដំណើរការ...' : 'Processing...')
                  : (isKhmer ? 'ដំណើរការ & បោះពុម្ពប័ណ្ណ' : 'Process Buyback & Print')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 5. Luxury Printable Buyback Voucher Modal ── */}
      {issuedVoucher && (
        <BuybackVoucherModal
          voucher={issuedVoucher}
          onClose={() => setIssuedVoucher(null)}
        />
      )}
    </div>
  );
};

export default BuybackView;
