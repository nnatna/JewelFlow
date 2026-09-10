import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserPlus,
  faMagnifyingGlass,
  faCrown,
  faPhone,
  faEnvelope,
  faLocationDot,
  faBagShopping,
  faXmark
} from '@fortawesome/free-solid-svg-icons';

export const CustomersView = () => {
  const { t } = useTranslation();
  const { customers, addCustomer, setSelectedCustomer, setActiveTab } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tier: 'Gold',
    discount_rate: 2.0
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCust.name || !newCust.phone) return;
    addCustomer(newCust);
    setIsAddModalOpen(false);
    setNewCust({ name: '', phone: '', email: '', address: '', tier: 'Gold', discount_rate: 2.0 });
  };

  const startPosForCustomer = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('pos');
  };

  const totalClientsSpend = customers.reduce((acc, c) => acc + c.total_spent, 0);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-amber-600" />
            {t('customers.title', 'Clientèle & VIP Privilege CRM Table')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('customers.subtitle', 'Client register with VIP tier privileges, loyalty points accrual, and purchase history')} ({customers.length} {t('customers.totalClients', 'total clients')}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-right shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t('customers.portfolio', 'Total Client Portfolio')}</span>
            <span className="text-base font-mono font-bold text-amber-700">
              ${totalClientsSpend.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
            {t('customers.enrollClient', 'Enroll Client')}
          </button>
        </div>
      </div>

      {/* Search toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between w-full">
        <div className="relative w-full max-w-md">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('customers.searchPlaceholder', 'Search client name, phone or email...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-4 whitespace-nowrap min-w-[200px]">{t('customers.clientName', 'Client Name')}</th>
                <th className="p-4 whitespace-nowrap">{t('customers.tier', 'VIP Tier & Privilege')}</th>
                <th className="p-4 whitespace-nowrap">{t('customers.contact', 'Phone Number')}</th>
                <th className="p-4 whitespace-nowrap">Email Address</th>
                <th className="p-4 whitespace-nowrap min-w-[220px]">Residence Address</th>
                <th className="p-4 whitespace-nowrap text-center">Loyalty Points</th>
                <th className="p-4 whitespace-nowrap text-right">{t('customers.totalSpent', 'Lifetime Spend')}</th>
                <th className="p-4 whitespace-nowrap text-right">{t('customers.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.map(customer => {
                const isDiamond = customer.tier === 'Diamond VIP';
                const isPlatinum = customer.tier === 'Platinum';

                return (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 min-w-[200px]">
                      <div className="font-bold text-slate-900 text-sm font-serif">{customer.name}</div>
                      <span className="text-[11px] text-slate-400 font-mono">ID: CLT-{customer.id.toString().padStart(4, '0')}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        isDiamond
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isPlatinum
                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                          : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      }`}>
                        <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5 text-amber-600" />
                        {customer.tier} ({customer.discount_rate}% Privilege)
                      </span>
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
                        <span className="text-slate-400 italic">Not on file</span>
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
                        {customer.loyalty_points} pts
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-sm text-slate-900 whitespace-nowrap">
                      ${customer.total_spent.toLocaleString()}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => startPosForCustomer(customer)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 border border-amber-200 hover:border-amber-500 font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
                      >
                        <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5" />
                        Bill in POS
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

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-slate-900 text-base flex items-center gap-2">
                <FontAwesomeIcon icon={faUserPlus} className="w-5 h-5 text-amber-600" />
                Enroll New Jewelry Client
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Lady Evelyn Montgomery"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={newCust.email}
                  onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                  placeholder="client@luxury.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">VIP Privilege Tier</label>
                <select
                  value={newCust.tier}
                  onChange={(e) => {
                    const tier = e.target.value;
                    let discount = 0;
                    if (tier === 'Diamond VIP') discount = 5.0;
                    else if (tier === 'Platinum') discount = 3.0;
                    else if (tier === 'Gold') discount = 2.0;
                    setNewCust({ ...newCust, tier, discount_rate: discount });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none"
                >
                  <option value="Diamond VIP">Diamond VIP (5% Privilege Discount)</option>
                  <option value="Platinum">Platinum (3% Privilege Discount)</option>
                  <option value="Gold">Gold (2% Privilege Discount)</option>
                  <option value="Standard">Standard Client</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Residence Address</label>
                <input
                  type="text"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="City, State"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold rounded-lg cursor-pointer shadow-md"
                >
                  Enroll Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
