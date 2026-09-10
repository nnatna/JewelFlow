import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { ProductModal } from './ProductModal';
import { Pagination } from '../common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faPlus,
  faPenToSquare,
  faTrashCan,
  faGem,
  faTableCellsLarge,
  faList
} from '@fortawesome/free-solid-svg-icons';

const fallbackImg = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80';

export const ProductList = () => {
  const { t } = useTranslation();
  const { products, categories, metalTypes, deleteProduct, calculateProductPrice } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMetal, setSelectedMetal] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category_id === Number(selectedCategory);
    const matchesMetal = selectedMetal === 'all' || p.metal_type_id === Number(selectedMetal);
    return matchesSearch && matchesCategory && matchesMetal;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedMetal]);

  // Paginated slice (10 per page)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            <FontAwesomeIcon icon={faGem} className="w-6 h-6 text-amber-600" />
            {t('catalog.title', 'Jewelry & Bullion Catalog Table')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('catalog.subtitle', 'Full inventory ledger with weights, craftsmanship charges, and live valuations')} ({products.length} {t('catalog.itemsRegistered', 'registered items')}).
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
              <FontAwesomeIcon icon={faList} className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                viewMode === 'grid' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <FontAwesomeIcon icon={faTableCellsLarge} className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            {t('catalog.addPiece', 'Add Jewelry Piece')}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs w-full">
        <div className="relative w-full md:max-w-md">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('catalog.searchItem', 'Search SKU, name, or barcode...')}
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
            <option value="all">{t('catalog.allCategories', 'All Categories')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedMetal}
            onChange={(e) => setSelectedMetal(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
          >
            <option value="all">{t('catalog.allMetals', 'All Metal Purities')}</option>
            {metalTypes.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[220px]">{t('catalog.piece', 'Jewelry Piece')}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">{t('catalog.skuBarcode', 'SKU & Barcode')}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">{t('catalog.category', 'Category')}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">{t('catalog.metalPurity', 'Metal & Purity')}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-center">{t('catalog.netWeight', 'Net Wt.')}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-center">{t('catalog.laborFee', 'Labor Fee')}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-center">{t('catalog.markup', 'Markup')}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">{t('catalog.livePrice', 'Live Atelier Price')}</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-center">{t('catalog.stock', 'Stock')}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center w-28 min-w-[110px] sticky right-0 bg-slate-50 shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                    {t('catalog.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map(product => {
                  const currentPrice = calculateProductPrice(product);
                  const metal = metalTypes.find(m => m.id === product.metal_type_id) || product.metal_type || product.metalType;
                  const category = categories.find(c => c.id === product.category_id) || product.category;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 flex items-center gap-3 min-w-[220px]">
                        <img
                          src={product.image || fallbackImg}
                          alt={product.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackImg;
                          }}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{product.name}</span>
                          <span className="text-[11px] text-slate-500 block truncate">{product.description || 'Certified handcrafted piece'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">{product.code_sku}</span>
                        <span className="text-[11px] text-slate-400 block">{product.barcode || 'N/A'}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">{category?.name || 'Fine Jewelry'}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {metal?.name || 'Fine Metal'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800 whitespace-nowrap">{product.net_weight}g</td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">${product.labor_cost}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-500 whitespace-nowrap">{product.markup_rate}%</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-amber-700 whitespace-nowrap">
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          product.stock_qty <= 2
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {product.stock_qty} {t('catalog.inStock', 'pcs')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap w-28 min-w-[110px] sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer transition-colors"
                            title={t('common.edit', 'Edit')}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 cursor-pointer transition-colors"
                            title={t('common.delete', 'Delete')}
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Gallery View Option */}
      {viewMode === 'grid' && (
        <div className="space-y-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {paginatedProducts.map(product => {
              const currentPrice = calculateProductPrice(product);
              const metal = metalTypes.find(m => m.id === product.metal_type_id) || product.metal_type || product.metalType;
              const category = categories.find(c => c.id === product.category_id) || product.category;

              return (
                <div
                  key={product.id}
                  className="group p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative rounded-xl overflow-hidden mb-3 aspect-square bg-slate-100">
                      <img
                        src={product.image || fallbackImg}
                        alt={product.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackImg;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-amber-800 border border-amber-200 shadow-xs backdrop-blur-sm">
                          {(metal?.name || 'Gold').split(' ')[0]}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/90 text-slate-700 shadow-xs backdrop-blur-sm">
                          {product.net_weight}g
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase tracking-wider text-amber-700 font-bold block mb-0.5">
                      {category?.name || 'Jewelry'}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>{product.code_sku}</span>
                      <span className={product.stock_qty <= 2 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                        {product.stock_qty} {t('catalog.inStock', 'pcs in stock')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">{t('catalog.livePrice', 'Live Atelier Value')}</div>
                      <div className="text-base font-bold font-mono text-amber-700">
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                        title={t('common.edit', 'Edit')}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title={t('common.delete', 'Delete')}
                      >
                        <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredProducts.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
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
