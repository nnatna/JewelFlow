import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faGem } from '@fortawesome/free-solid-svg-icons';

export const ProductModal = ({ isOpen, onClose, initialData = null }) => {
  const { categories, metalTypes, goldRates, addProduct, updateProduct } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    code_sku: '',
    barcode: '',
    category_id: 1,
    metal_type_id: 1,
    net_weight: 5.0,
    gross_weight: 5.2,
    labor_cost: 150,
    markup_rate: 15,
    stock_qty: 5,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        code_sku: `JWL-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: `893${Math.floor(10000 + Math.random() * 90000)}`,
        category_id: categories[0]?.id || 1,
        metal_type_id: metalTypes[0]?.id || 1,
        net_weight: 5.0,
        gross_weight: 5.2,
        labor_cost: 150,
        markup_rate: 15,
        stock_qty: 5,
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
        description: '',
      });
    }
  }, [initialData, isOpen, categories, metalTypes]);

  if (!isOpen) return null;

  // Live estimated retail calculation
  const metalRateObj = goldRates.find(r => r.metal_type_id === Number(formData.metal_type_id)) || goldRates[0];
  const metalRate = metalRateObj?.rate_per_gram || 85.5;
  const metalVal = (Number(formData.net_weight) || 0) * metalRate;
  const baseCost = metalVal + (Number(formData.labor_cost) || 0);
  const calculatedTag = baseCost * (1 + ((Number(formData.markup_rate) || 0) / 100));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (initialData) {
      updateProduct({ ...initialData, ...formData });
    } else {
      addProduct(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900">
            <FontAwesomeIcon icon={faGem} className="w-5 h-5 text-amber-600" />
            <span>{initialData ? 'Edit Jewelry Specifications' : 'Register New Jewelry Piece'}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 bg-white border border-slate-200 cursor-pointer">
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Product Title</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Celestial Diamond Solitaire Ring"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={formData.code_sku}
                onChange={(e) => setFormData({ ...formData, code_sku: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-medium"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Metal Karat & Purity</label>
              <select
                value={formData.metal_type_id}
                onChange={(e) => setFormData({ ...formData, metal_type_id: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-medium"
              >
                {metalTypes.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Net Gold Weight (grams)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.net_weight}
                onChange={(e) => setFormData({ ...formData, net_weight: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Gross Weight (grams)</label>
              <input
                type="number"
                step="0.01"
                value={formData.gross_weight}
                onChange={(e) => setFormData({ ...formData, gross_weight: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Labor / Making Charge ($)</label>
              <input
                type="number"
                value={formData.labor_cost}
                onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Markup Percentage (%)</label>
              <input
                type="number"
                value={formData.markup_rate}
                onChange={(e) => setFormData({ ...formData, markup_rate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Inventory Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.stock_qty}
                onChange={(e) => setFormData({ ...formData, stock_qty: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Photo URL</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Dynamic Price Preview */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block font-medium">Live Atelier Valuation Preview</span>
              <span className="text-xs text-amber-900 font-semibold">
                {formData.net_weight}g @ ${metalRate.toFixed(2)}/g + ${formData.labor_cost} labor + {formData.markup_rate}% markup
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-800">
              ${calculatedTag.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold rounded-lg cursor-pointer shadow-md"
            >
              {initialData ? 'Save Changes' : 'Create Jewelry Piece'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
