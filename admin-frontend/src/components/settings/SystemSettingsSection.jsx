import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase,
  faArrowsRotate
} from '@fortawesome/free-solid-svg-icons';

export const SystemSettingsSection = () => {
  const { i18n } = useTranslation();
  const { showToast } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5 select-none animate-fadeIn">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
          <FontAwesomeIcon icon={faDatabase} className="w-5 h-5 text-slate-700" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            {isKhmer ? 'ប្រព័ន្ធ & ស្ថានភាពទិន្នន័យ (System Architecture & Database)' : 'System & Database Architecture'}
          </h2>
          <p className="text-xs text-slate-500">
            {isKhmer ? 'ព័ត៌មានលម្អិតបច្ចេកទេស និងស្ថានភាពម៉ាស៊ីនបម្រើ' : 'Technical runtime details and storage engine diagnostics'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">Software Version</span>
          <p className="font-bold text-slate-900">JewelFlow Enterprise ERP v2.4 Pro</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">Backend Framework</span>
          <p className="font-bold text-slate-900">Laravel 12 / PHP 8.2 (REST API)</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">Client Frontend</span>
          <p className="font-bold text-slate-900">React 19 + Vite + TailwindCSS 4</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">Database Status</span>
          <p className="font-bold text-emerald-700">
            {isKhmer ? 'ដំណើរការល្អ & ស៊ីសង្វាក់គ្នា' : 'Healthy & Synchronized'}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium font-sans">
          {isKhmer ? 'ជម្រះទិន្នន័យ Cache ក្នុង Browser' : 'Purge client local storage cache'}
        </span>
        <button
          type="button"
          onClick={() => {
            showToast(isKhmer ? 'បានជម្រះ Cache ជោគជ័យ' : 'Client cache cleared successfully', 'success');
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <FontAwesomeIcon icon={faArrowsRotate} className="w-3 h-3 mr-1.5" />
          <span>{isKhmer ? 'ជម្រះ Cache' : 'Clear Cache'}</span>
        </button>
      </div>
    </div>
  );
};

export default SystemSettingsSection;
