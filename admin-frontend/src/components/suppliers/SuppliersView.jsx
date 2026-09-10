import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck,
  faPhone,
  faEnvelope,
  faShieldHalved,
  faBox,
  faMagnifyingGlass,
  faFileLines
} from '@fortawesome/free-solid-svg-icons';

export const SuppliersView = () => {
  const { suppliers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faTruck} className="w-6 h-6 text-amber-600" />
            Bullion Refineries & Gemstone Suppliers Table
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized London Bullion Market (LBMA) precious metal refineries and Antwerp diamond exchanges ({suppliers.length} vendors on record).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 shadow-xs">
          <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">100% LBMA & Responsible Jewellery Council (RJC) Certified</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between w-full">
        <div className="relative w-full max-w-md">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search refinery, broker, or bullion grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-4 whitespace-nowrap min-w-[220px]">Refinery / Supplier Name</th>
                <th className="p-4 whitespace-nowrap">Supply Specialty</th>
                <th className="p-4 whitespace-nowrap">Official Representative</th>
                <th className="p-4 whitespace-nowrap">Phone Number</th>
                <th className="p-4 whitespace-nowrap">Direct Email</th>
                <th className="p-4 whitespace-nowrap text-center">Accreditation</th>
                <th className="p-4 whitespace-nowrap text-center">Next Inbound Shipment</th>
                <th className="p-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSuppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 min-w-[220px]">
                    <span className="font-bold text-slate-900 text-sm font-serif block">{sup.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">ID: VEND-{sup.id.toString().padStart(3, '0')}</span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      {sup.specialty}
                    </span>
                  </td>
                  <td className="p-4 text-slate-800 font-medium whitespace-nowrap">
                    {sup.contact}
                  </td>
                  <td className="p-4 font-mono text-slate-700 whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5 text-slate-400" />
                      {sup.phone}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="w-3.5 h-3.5 text-slate-400" />
                      {sup.email}
                    </span>
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5" />
                      LBMA Approved
                    </span>
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-slate-700 bg-slate-100">
                      <FontAwesomeIcon icon={faBox} className="w-3.5 h-3.5 text-amber-600" />
                      Scheduled
                    </span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 border border-amber-200 hover:border-amber-500 font-semibold text-xs cursor-pointer transition-colors shadow-2xs">
                      <FontAwesomeIcon icon={faFileLines} className="w-3.5 h-3.5" />
                      Issue PO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (10 per page) */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredSuppliers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
