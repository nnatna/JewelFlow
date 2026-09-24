import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCoins,
  faScaleBalanced
} from '@fortawesome/free-solid-svg-icons';

export const CurrenciesSettingsSection = () => {
  const { i18n } = useTranslation();
  const { exchangeRate } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  return (
    <div className="space-y-5 select-none animate-fadeIn">
      {/* FX Rate Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <FontAwesomeIcon icon={faCoins} className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{isKhmer ? 'អត្រាប្តូរប្រាក់ USD ទៅ KHR (Live Exchange Rate)' : 'USD / KHR Exchange Rate'}</h2>
            <p className="text-xs text-slate-400">{isKhmer ? 'អត្រាផ្លាស់ប្តូររូបិយប័ណ្ណស្វ័យប្រវត្តិកំឡុងពេលទូទាត់' : 'Current live conversion rate used for KHR dual currency display'}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{isKhmer ? 'អត្រាទីផ្សារបច្ចុប្បន្ន' : 'Current FX Rate'}</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
              1 USD = {exchangeRate?.rate ? Number(exchangeRate.rate).toLocaleString() : '4,063'} {isKhmer ? '៛ KHR' : 'KHR'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
            ✓ {isKhmer ? 'ភ្ជាប់ទិន្នន័យផ្ទាល់' : 'Live Connected'}
          </span>
        </div>
      </div>

      {/* Cambodian Units Reference Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <FontAwesomeIcon icon={faScaleBalanced} className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{isKhmer ? 'ខ្នាតទម្ងន់មាសខ្មែរ (Cambodian Gold Measurement Standards)' : 'Cambodian Gold Weight Standards'}</h2>
            <p className="text-xs text-slate-400">{isKhmer ? 'ខ្នាតគិតទម្ងន់មាសផ្លូវការក្នុងប្រព័ន្ធ JewelFlow' : 'Standard conversion matrix applied system-wide'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 uppercase">
              {isKhmer ? '១ ជី' : '1 Chi'}
            </span>
            <p className="font-mono font-bold text-slate-900 text-sm mt-1">
              {isKhmer ? '3.75 ក្រាម' : '3.75 Grams'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 uppercase">
              {isKhmer ? '១ ដំឡឹង' : '1 Damlung'}
            </span>
            <p className="font-mono font-bold text-slate-900 text-sm mt-1">
              {isKhmer ? '37.5 ក្រាម (១០ ជី)' : '37.5 Grams (10 Chi)'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 uppercase">
              {isKhmer ? '១ ហ៊ុន' : '1 Hun'}
            </span>
            <p className="font-mono font-bold text-slate-900 text-sm mt-1">
              {isKhmer ? '0.375 ក្រាម' : '0.375 Grams'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 uppercase">
              {isKhmer ? '១ គីឡូ' : '1 Kilogram (1 Kg)'}
            </span>
            <p className="font-mono font-bold text-slate-900 text-sm mt-1">
              {isKhmer ? '26.666 ដំឡឹង' : '26.666 Damlung'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrenciesSettingsSection;
