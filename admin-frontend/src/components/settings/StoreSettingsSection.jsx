import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStore,
  faCamera,
  faCloudArrowUp,
  faImage,
  faEye,
  faGem,
  faCircleDot,
  faFloppyDisk
} from '@fortawesome/free-solid-svg-icons';

export const StoreSettingsSection = () => {
  const { i18n } = useTranslation();
  const { settings, saveSettings, showToast } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  const [savingSettings, setSavingSettings] = useState(false);

  const [storeInfo, setStoreInfo] = useState({
    name: settings?.store_name || (isKhmer ? 'ហាងមាស & គ្រឿងអលង្ការ ជេវែលផ្លូវ (JewelFlow Atelier)' : 'JewelFlow Luxury Atelier & ERP'),
    phone: settings?.store_phone || '+855 (0) 23 999 888',
    email: settings?.store_email || 'contact@jewelflow.com',
    address: settings?.store_address || '#88 Preah Norodom Blvd, Sangkat Chey Chumneas, Phnom Penh, Cambodia',
    vat_tin: settings?.vat_tin || 'K002-901823901',
    invoice_disclaimer: settings?.invoice_disclaimer || (isKhmer ? 'ទំនិញដែលបានទិញរួច អាចប្តូរយកវិញបានក្នុងរយៈពេល ៧ថ្ងៃ ជាមួយវិក្កយបត្រផ្លូវការ។' : 'Purchased jewelry may be exchanged within 7 days with official sales invoice.'),
    logo: settings?.store_logo || null,
  });

  useEffect(() => {
    if (settings) {
      setStoreInfo(prev => ({
        name: settings.store_name ?? prev.name,
        phone: settings.store_phone ?? prev.phone,
        email: settings.store_email ?? prev.email,
        address: settings.store_address ?? prev.address,
        vat_tin: settings.vat_tin ?? prev.vat_tin,
        invoice_disclaimer: settings.invoice_disclaimer ?? prev.invoice_disclaimer,
        logo: settings.store_logo ?? prev.logo,
      }));
    }
  }, [settings]);

  const handleStoreLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(isKhmer ? 'ទំហំរូបភាពមិនអាចលើសពី 5MB ឡើយ' : 'Logo image cannot exceed 5MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreInfo(s => ({ ...s, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStore = async () => {
    setSavingSettings(true);
    try {
      const payload = {
        store_name: storeInfo.name,
        store_phone: storeInfo.phone,
        store_email: storeInfo.email,
        store_address: storeInfo.address,
        vat_tin: storeInfo.vat_tin,
        invoice_disclaimer: storeInfo.invoice_disclaimer,
        store_logo: storeInfo.logo,
      };

      await saveSettings(payload);
      showToast(isKhmer ? 'ព័ត៌មានហាងត្រូវបានរក្សាទុកដោយជោគជ័យ!' : 'Store details saved successfully!', 'success');
    } catch {
      showToast(isKhmer ? 'បរាជ័យក្នុងការរក្សាទុកព័ត៌មានហាង' : 'Failed to save store details', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6 select-none animate-fadeIn">
      {/* Header with Title */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
          <FontAwesomeIcon icon={faStore} className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            {isKhmer ? 'ព័ត៌មានហាង & Logo ក្បាលវិក្កយបត្រ (Store & Atelier Profile)' : 'Store & Atelier Profile'}
          </h2>
          <p className="text-xs text-slate-500">
            {isKhmer ? 'កំណត់ Logo ឈ្មោះហាង លេខទូរស័ព្ទ និងអាសយដ្ឋានលើវិក្កយបត្រ' : 'Configure store brand logo, contact details, address & invoice header'}
          </p>
        </div>
      </div>

      {/* 2-Column Grid: Form Inputs (Left) + Store Logo & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left side: Store Information Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {isKhmer ? 'ឈ្មោះហាងផ្លូវការ (Store Name):' : 'Official Store Name:'}
            </label>
            <input
              type="text"
              value={storeInfo.name}
              onChange={e => setStoreInfo(s => ({ ...s, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {isKhmer ? 'លេខទូរស័ព្ទទាក់ទង (Phone Number):' : 'Contact Phone Number:'}
              </label>
              <input
                type="text"
                value={storeInfo.phone}
                onChange={e => setStoreInfo(s => ({ ...s, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 font-mono bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {isKhmer ? 'អ៊ីមែលហាង (Store Email):' : 'Official Email:'}
              </label>
              <input
                type="email"
                value={storeInfo.email}
                onChange={e => setStoreInfo(s => ({ ...s, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 font-mono bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {isKhmer ? 'លេខអត្តសញ្ញាណកម្មពន្ធ (VAT TIN):' : 'Tax / VAT TIN ID:'}
            </label>
            <input
              type="text"
              value={storeInfo.vat_tin}
              onChange={e => setStoreInfo(s => ({ ...s, vat_tin: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 font-mono bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {isKhmer ? 'អាសយដ្ឋានហាង (Store Address):' : 'Store Address:'}
            </label>
            <input
              type="text"
              value={storeInfo.address}
              onChange={e => setStoreInfo(s => ({ ...s, address: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {isKhmer ? 'លក្ខខណ្ឌចុងវិក្កយបត្រ (Invoice Disclaimer / Notes):' : 'Invoice Footer Disclaimer:'}
            </label>
            <textarea
              rows={2}
              value={storeInfo.invoice_disclaimer}
              onChange={e => setStoreInfo(s => ({ ...s, invoice_disclaimer: e.target.value }))}
              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Right side: Store Logo Upload & Live Letterhead Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Store Logo / Icon Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold text-xs flex items-center gap-2">
                <FontAwesomeIcon icon={faCamera} className="text-amber-600 w-3.5 h-3.5" />
                <span>{isKhmer ? 'រូបភាព Logo / Icon ហាង' : 'Store Brand Logo / Icon'}</span>
              </label>
              {storeInfo.logo && (
                <button
                  type="button"
                  onClick={() => setStoreInfo(s => ({ ...s, logo: null }))}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer transition-colors"
                >
                  {isKhmer ? 'លុប Logo' : 'Remove Logo'}
                </button>
              )}
            </div>

            {/* Logo Dropzone & Preview Display */}
            <div className="w-full relative group">
              {storeInfo.logo ? (
                <div className="relative w-full h-44 bg-white rounded-2xl overflow-hidden border border-amber-200/80 flex items-center justify-center p-4 shadow-sm">
                  <img
                    src={storeInfo.logo}
                    alt="Store Logo Preview"
                    className="max-h-36 max-w-full object-contain"
                  />
                  <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-2xs gap-1.5 text-xs font-semibold">
                    <FontAwesomeIcon icon={faCloudArrowUp} className="w-5 h-5 text-amber-400" />
                    <span>{isKhmer ? 'ចុចដើម្បីប្តូរ Logo ថ្មី' : 'Click to change store logo'}</span>
                    <span className="text-[10px] text-slate-300">PNG, JPG, SVG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleStoreLogoChange}
                    />
                  </label>
                </div>
              ) : (
                <label className="w-full h-44 border-2 border-dashed border-amber-300/80 bg-amber-50/40 hover:bg-amber-50/80 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center group">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    <FontAwesomeIcon icon={faCloudArrowUp} className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isKhmer ? 'ចុចដើម្បីបញ្ចូលរូប Logo ហាង' : 'Upload Store Brand Logo'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    PNG, JPG, SVG, WEBP (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleStoreLogoChange}
                  />
                </label>
              )}
            </div>

            {/* Logo upload button */}
            <label className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-amber-900 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
              <FontAwesomeIcon icon={faImage} className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {storeInfo.logo
                  ? (isKhmer ? 'ប្តូរ Logo ផ្សេង' : 'Change Store Logo')
                  : (isKhmer ? 'ជ្រើសរើសឯកសារ Logo' : 'Browse Store Logo...')}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleStoreLogoChange}
              />
            </label>
          </div>

          {/* Live Invoice Letterhead Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-600">
                <FontAwesomeIcon icon={faEye} className="text-amber-600" />
                <span>{isKhmer ? 'ទម្រង់ក្បាលវិក្កយបត្របោះពុម្ព' : 'Official Invoice Letterhead'}</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold">
                Live Preview
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-bold shadow-xs shrink-0 overflow-hidden">
                  {storeInfo.logo ? (
                    <img src={storeInfo.logo} alt="Store Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <FontAwesomeIcon icon={faGem} className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 font-serif truncate">
                    {storeInfo.name}
                  </p>
                  <p className="text-[10px] text-amber-800 font-mono mt-0.5">
                    VAT TIN: {storeInfo.vat_tin}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 truncate pt-1.5 border-t border-slate-100">
                {storeInfo.address} • Tel: {storeInfo.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Note and Save button */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <FontAwesomeIcon icon={faCircleDot} className="text-amber-500 w-2.5 h-2.5" />
          <span>
            {isKhmer
              ? 'ព័ត៌មាន និង Logo នឹងត្រូវបានបង្ហាញលើវិក្កយបត្រ និងរបាយការណ៍ទាំងអស់'
              : 'Store details and brand logo will be applied across invoices and reports.'}
          </span>
        </p>
        <button
          type="button"
          onClick={handleSaveStore}
          disabled={savingSettings}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
          <span>{savingSettings ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកព័ត៌មានហាង' : 'Save Store Details')}</span>
        </button>
      </div>
    </div>
  );
};

export default StoreSettingsSection;
