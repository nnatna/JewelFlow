import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faCheckCircle,
  faFloppyDisk
} from '@fortawesome/free-solid-svg-icons';

export const InventorySettingsSection = () => {
  const { i18n } = useTranslation();
  const { settings, saveSettings, products, showToast } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  const [alertLowStock, setAlertLowStock] = useState(settings?.alert_low_stock !== 'false');
  const [lowStockThreshold, setLowStockThreshold] = useState(settings?.low_stock_threshold || 5);
  const [savingSettings, setSavingSettings] = useState(false);

  // Compute live low stock items
  const lowStockItems = useMemo(() => {
    if (!products) return [];
    return products.filter(p => (Number(p.stock_qty) || 0) <= Number(lowStockThreshold));
  }, [products, lowStockThreshold]);

  const handleSaveInventory = async () => {
    setSavingSettings(true);
    try {
      const payload = {
        alert_low_stock: String(alertLowStock),
        low_stock_threshold: Number(lowStockThreshold),
      };

      await saveSettings(payload);
      showToast(isKhmer ? 'ការកំណត់ស្តុកត្រូវបានរក្សាទុកដោយជោគជ័យ!' : 'Inventory settings saved successfully!', 'success');
    } catch {
      showToast(isKhmer ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save inventory settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6 select-none animate-fadeIn">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
          <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            {isKhmer ? 'ការកំណត់ការជូនដំណឹងស្តុកទាប (Low Stock Alerts)' : 'Low Stock Alert Settings'}
          </h2>
          <p className="text-xs text-slate-500">
            {isKhmer ? 'កំណត់ចំនួនកម្រិតអប្បបរមាដែលត្រូវជូនដំណឹងពេលទំនិញជិតអស់' : 'Configure low inventory thresholds and notification banners'}
          </p>
        </div>
      </div>

      {/* Toggle Enable */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <div>
          <p className="text-xs font-bold text-slate-900">
            {isKhmer ? 'បើកដំណើរការការជូនដំណឹងស្តុកទាប' : 'Enable Low Stock Alert Notifications'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isKhmer ? 'បង្ហាញ Banner ក្រហម និង Badge លើ Catalog ពេលស្តុកធ្លាក់ក្រោមចំនួនកំណត់' : 'Show notification alerts when jewelry quantity drops below threshold'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAlertLowStock(!alertLowStock)}
          className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
            alertLowStock ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
        </button>
      </div>

      {/* Threshold Input */}
      <div className="max-w-md">
        <label className="text-xs text-slate-700 font-bold block mb-1.5">
          {isKhmer ? 'កម្រិតបរិមាណស្តុកទាប (Low Stock Threshold Quantity):' : 'Low Stock Threshold Quantity:'}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="100"
            value={lowStockThreshold}
            onChange={e => setLowStockThreshold(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
          />
          <span className="text-xs font-bold text-slate-500 shrink-0">
            {isKhmer ? 'គ្រឿង (items)' : 'items'}
          </span>
        </div>
      </div>

      {/* Live Low Stock Items Preview */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-3">
          <span>{isKhmer ? 'ទំនិញស្តុកទាបបច្ចុប្បន្ន:' : 'Currently Identified Low Stock Items:'}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
            {lowStockItems.length} {isKhmer ? 'មុខ' : 'items'}
          </span>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-emerald-600" />
            <span>{isKhmer ? 'ទំនិញគ្រឿងអលង្ការទាំងអស់មានស្តុកគ្រប់គ្រាន់' : 'All jewelry pieces currently have sufficient stock.'}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs">
                <div className="truncate mr-2">
                  <p className="font-bold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.code_sku}</p>
                </div>
                <span className="font-mono font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 shrink-0">
                  {item.stock_qty} left
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          onClick={handleSaveInventory}
          disabled={savingSettings}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
          <span>{savingSettings ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកំណត់ស្តុក' : 'Save Inventory Alerts')}</span>
        </button>
      </div>
    </div>
  );
};

export default InventorySettingsSection;
