import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductModal } from './ProductModal';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Gem,
  Grid,
  List,
} from 'lucide-react';

export const ProductList = () => {
  const { products, categories, metalTypes, deleteProduct, calculateProductPrice } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMetal, setSelectedMetal] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // Default to 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category_id === Number(selectedCategory);
    const matchesMetal = selectedMetal === 'all' || p.metal_type_id === Number(selectedMetal);
    return matchesSearch && matchesCategory && matchesMetal;
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Gem className="w-6 h-6 text-amber-600" />
            Jewelry & Bullion Catalog Table
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full inventory ledger with weights, craftsmanship charges, and live re-priced valuations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                viewMode === 'grid' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Jewelry Piece
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs w-full">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU, name, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedMetal}
            onChange={(e) => setSelectedMetal(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
          >
            <option value="all">All Metal Purities</option>
            {metalTypes.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table View (Default) */}
      {viewMode === 'table' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-4 whitespace-nowrap min-w-[280px]">Jewelry Piece</th>
                  <th className="p-4 whitespace-nowrap">SKU & Barcode</th>
                  <th className="p-4 whitespace-nowrap">Category</th>
                  <th className="p-4 whitespace-nowrap">Metal & Purity</th>
                  <th className="p-4 whitespace-nowrap text-center">Net Wt.</th>
                  <th className="p-4 whitespace-nowrap text-center">Labor Fee</th>
                  <th className="p-4 whitespace-nowrap text-center">Markup</th>
                  <th className="p-4 whitespace-nowrap text-right">Live Atelier Price</th>
                  <th className="p-4 whitespace-nowrap text-center">Stock</th>
                  <th className="p-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(product => {
                  const currentPrice = calculateProductPrice(product);
                  const metal = metalTypes.find(m => m.id === product.metal_type_id);
                  const category = categories.find(c => c.id === product.category_id);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 flex items-center gap-3 min-w-[280px]">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{product.name}</span>
                          <span className="text-[11px] text-slate-500 block truncate">{product.description || 'Certified handcrafted piece'}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">{product.code_sku}</span>
                        <span className="text-[11px] text-slate-400 block">{product.barcode || 'N/A'}</span>
                      </td>
                      <td className="p-4 text-slate-700 font-medium whitespace-nowrap">{category?.name}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {metal?.name}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-800 whitespace-nowrap">{product.net_weight}g</td>
                      <td className="p-4 text-center font-mono text-slate-600 whitespace-nowrap">${product.labor_cost}</td>
                      <td className="p-4 text-center font-mono text-slate-500 whitespace-nowrap">{product.markup_rate}%</td>
                      <td className="p-4 text-right font-mono font-bold text-base text-amber-700 whitespace-nowrap">
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center font-mono whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          product.stock_qty <= 2
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {product.stock_qty} pcs
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                            title="Edit Piece"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Delete Piece"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gallery View Option */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
          {filteredProducts.map(product => {
            const currentPrice = calculateProductPrice(product);
            const metal = metalTypes.find(m => m.id === product.metal_type_id);
            const category = categories.find(c => c.id === product.category_id);

            return (
              <div
                key={product.id}
                className="group p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative rounded-xl overflow-hidden mb-3 aspect-square bg-slate-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-amber-800 border border-amber-200 shadow-xs backdrop-blur-sm">
                        {metal?.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/90 text-slate-700 shadow-xs backdrop-blur-sm">
                        {product.net_weight}g
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase tracking-wider text-amber-700 font-bold block mb-0.5">
                    {category?.name}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                    <span>{product.code_sku}</span>
                    <span className={product.stock_qty <= 2 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                      {product.stock_qty} in stock
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Live Atelier Value</div>
                    <div className="text-base font-bold font-mono text-amber-700">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingProduct}
      />
    </div>
  );
};
