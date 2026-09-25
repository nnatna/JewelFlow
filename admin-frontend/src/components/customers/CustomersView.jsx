import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserPlus,
  faCrown,
  faPhone,
  faEnvelope,
  faLocationDot,
  faBagShopping,
  faXmark,
  faFilter,
  faGift,
  faTag,
  faCircleInfo,
  faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';

export const CustomersView = () => {
  const { t, i18n } = useTranslation();
  const isKhmer = (i18n.language || 'km').startsWith('km');
  const {
    customers,
    promotions,
    addCustomer,
    setSelectedCustomer,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    showToast
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tier: 'Standard',
    discount_rate: 0.0
  });
  const [custErrors, setCustErrors] = useState({});

  const cleanQ = (searchQuery || '').toLowerCase().trim();
  const filteredCustomers = customers.filter(c =>
    !cleanQ || (
      c.name?.toLowerCase().includes(cleanQ) ||
      c.phone?.includes(cleanQ) ||
      c.email?.toLowerCase().includes(cleanQ)
    )
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    const errs = {};
    if (!newCust.name || !newCust.name.trim()) {
      errs.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះអតិថិជន!' : 'Customer full name is required!';
    }
    if (!newCust.phone || !newCust.phone.trim()) {
      errs.phone = isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Phone number is required!';
    }
    if (Object.keys(errs).length > 0) {
      setCustErrors(errs);
      showToast(isKhmer ? 'សូមបំពេញព័ត៌មានដែលចាំបាច់!' : 'Please fill in required fields!', 'warning');
      return;
    }

    setCustErrors({});
    addCustomer({
      ...newCust,
      tier: 'Standard',
      discount_rate: 0.0,
      total_spent: 0
    });
    setIsAddModalOpen(false);
    setNewCust({ name: '', phone: '', email: '', address: '', tier: 'Standard', discount_rate: 0.0 });
  };

  const startPosForCustomer = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('pos');
  };

  const totalClientsSpend = customers.reduce((acc, c) => acc + (parseFloat(c.total_spent) || 0), 0);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-amber-600" />
            {t('customers.title', 'Customer List')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('customers.subtitle', 'Customer register with VIP tier privileges, loyalty points accrual, and purchase history')} ({customers.length} {t('customers.totalClients', 'total customers')}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-right shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t('customers.portfolio', 'Total Customer Portfolio')}</span>
            <span className="text-base font-mono font-bold text-amber-700">
              ${totalClientsSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
            {t('customers.enrollClient', 'Register Customer')}
          </button>
        </div>
      </div>



      {/* Customers Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-4 whitespace-nowrap min-w-[200px]">{t('customers.clientName', 'Customer Name')}</th>
                <th className="p-4 whitespace-nowrap">{t('customers.tier', 'VIP Tier & Privilege')}</th>
                <th className="p-4 whitespace-nowrap">{t('customers.contact', 'Phone Number')}</th>
                <th className="p-4 whitespace-nowrap">{t('customers.email', 'Email Address')}</th>
                <th className="p-4 whitespace-nowrap min-w-[220px]">{t('customers.address', 'Residence Address')}</th>
                <th className="p-4 whitespace-nowrap text-center">{t('customers.points', 'Loyalty Points')}</th>
                <th className="p-4 whitespace-nowrap text-right">{t('customers.totalSpent', 'Lifetime Spend')}</th>
                <th className="p-4 whitespace-nowrap text-right">{t('customers.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.map(customer => {
                const isDiamond = customer.tier === 'Diamond VIP';
                const isPlatinum = customer.tier === 'Platinum';

                // Find active promotion matching this customer's tier
                const today = new Date().toISOString().split('T')[0];
                const activePromo = (promotions || []).find(p => {
                  if (!p.is_active) return false;
                  if (p.start_date && p.start_date.split('T')[0] > today) return false;
                  if (p.end_date && p.end_date.split('T')[0] < today) return false;
                  return p.tier_requirement === customer.tier;
                });

                return (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 min-w-[200px]">
                      <div className="font-bold text-slate-900 text-sm font-serif">{customer.name}</div>
                      <span className="text-[11px] text-slate-400 font-mono">ID: CLT-{customer.id.toString().padStart(4, '0')}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          isDiamond
                            ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                            : isPlatinum
                            ? 'bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs'
                            : customer.tier === 'Gold'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          <FontAwesomeIcon icon={faCrown} className={`w-3.5 h-3.5 ${
                            isDiamond ? 'text-purple-600' : isPlatinum ? 'text-slate-500' : 'text-amber-600'
                          }`} />
                          <span>{customer.tier}</span>
                          <span className="opacity-80 font-normal">
                            ({customer.discount_rate}%)
                          </span>
                        </span>

                        {activePromo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs" title={activePromo.name}>
                            <FontAwesomeIcon icon={faGift} className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{activePromo.discount_value}% Promo</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-700 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5 text-slate-400" />
                        {customer.phone}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono whitespace-nowrap">
                      {customer.email ? (
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faEnvelope} className="w-3.5 h-3.5 text-slate-400" />
                          {customer.email}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">{t('customers.notOnFile', 'Not on file')}</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 min-w-[220px]">
                      {customer.address ? (
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full font-bold text-amber-800 bg-amber-50 border border-amber-200">
                        {customer.loyalty_points} {t('customers.pts', 'pts')}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-sm text-slate-900 whitespace-nowrap">
                      ${(parseFloat(customer.total_spent) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => startPosForCustomer(customer)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 border border-amber-200 hover:border-amber-500 font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
                      >
                        <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5" />
                        {t('customers.billInPos', 'Bill in POS')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (10 per page) */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredCustomers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={faUserPlus} className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {t('customers.enrollModalTitle', 'Register New Jewelry Customer')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'ចុះឈ្មោះអតិថិជនថ្មីដើម្បីទទួលបាន VIP Discount & Rewards' : 'Create profile and assign VIP membership tier'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title={isKhmer ? 'បិទ' : 'Close'}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <form noValidate onSubmit={handleCreateCustomer} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {t('customers.fullName', 'Full Name')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCust.name}
                  onChange={(e) => {
                    setNewCust({ ...newCust, name: e.target.value });
                    if (custErrors.name) setCustErrors(prev => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Lady Evelyn Montgomery"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold bg-slate-50 border focus:bg-white focus:outline-none transition-all ${
                    custErrors.name
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                  }`}
                />
                {custErrors.name && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{custErrors.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {t('customers.phone', 'Phone Number')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCust.phone}
                  onChange={(e) => {
                    setNewCust({ ...newCust, phone: e.target.value });
                    if (custErrors.phone) setCustErrors(prev => ({ ...prev, phone: null }));
                  }}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-900 font-semibold bg-slate-50 border focus:bg-white focus:outline-none transition-all ${
                    custErrors.phone
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
                  }`}
                />
                {custErrors.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{custErrors.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">{t('customers.email', 'Email Address')}</label>
                <input
                  type="email"
                  value={newCust.email}
                  onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                  placeholder="client@luxury.com"
                  className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 font-mono text-xs text-slate-900 font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {t('customers.tierLabel', isKhmer ? 'កម្រិតសមាជិកភាព VIP' : 'VIP Privilege Tier')}
                </label>
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      <FontAwesomeIcon icon={faCrown} className="text-amber-500 w-3.5 h-3.5" />
                      <span>{isKhmer ? 'កម្រិតចាប់ផ្តើម: Standard (0%)' : 'Starting Level: Standard (0%)'}</span>
                    </span>
                    <span className="text-[10px] text-amber-900 font-bold bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded-md">
                      {isKhmer ? 'ដំឡើងស្វ័យប្រវត្តិតាមការទិញ' : 'Auto Upgrade on Purchase'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal flex items-start gap-1.5">
                    <FontAwesomeIcon icon={faCircleInfo} className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span>
                      {isKhmer
                        ? 'កម្រិត VIP នឹងត្រូវបានដំឡើងស្វ័យប្រវត្តិតាមរយៈទំហំនៃការទិញទំនិញជាក់ស្តែងរបស់អតិថិជន៖ Gold ($1,000+ = 2%), Platinum ($5,000+ = 3%), Diamond VIP ($10,000+ = 5%)។'
                        : 'VIP tier level automatically unlocks & upgrades based on cumulative purchases: Gold ($1,000+ = 2%), Platinum ($5,000+ = 3%), Diamond VIP ($10,000+ = 5%).'}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">{t('customers.address', 'Residence Address')}</label>
                <input
                  type="text"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="City, State"
                  className="w-full rounded-xl px-3.5 py-2.5 border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  {t('customers.enrollClient', 'Register Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
