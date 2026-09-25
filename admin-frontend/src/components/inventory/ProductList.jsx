import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { ProductModal } from './ProductModal';
import { Pagination } from '../common/Pagination';
import { Alert } from '../common/Alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPenToSquare,
  faTrashCan,
  faGem,
  faTableCellsLarge,
  faList,
  faFilter,
  faXmark,
  faRotateRight,
  faCircleCheck
} from '@fortawesome/free-solid-svg-icons';

const fallbackImg = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80';

export const ProductList = () => {
  const { t, i18n } = useTranslation();
  const {
    products,
    categories,
    metalTypes,
    materials,
    deleteProduct,
    calculateProductPrice,
    searchQuery,
    setSearchQuery,
    confirmDialog,
    showToast,
    refreshAllData,
    refreshProducts,
    isInitialLoading
  } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMetal, setSelectedMetal] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const pageSize = 10;

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await refreshAllData(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter products using global searchQuery
  const cleanQ = (searchQuery || '').toLowerCase().trim();
  const filteredProducts = products.filter(p => {
    const matchesSearch = !cleanQ || (
      p.name?.toLowerCase().includes(cleanQ) ||
      p.code_sku?.toLowerCase().includes(cleanQ) ||
      p.barcode?.includes(cleanQ)
    );
    const matchesCategory = selectedCategory === 'all' || p.category_id === Number(selectedCategory);
    const matchesMetal = selectedMetal === 'all' || p.metal_type_id === Number(selectedMetal);
    return matchesSearch && matchesCategory && matchesMetal;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedMetal]);

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

  const handleDeleteProduct = async (product) => {
    const isKhmer = (i18n.language || 'km').startsWith('km');
    const confirmed = await confirmDialog({
      title: isKhmer ? 'តើអ្នកពិតជាចង់លុបគ្រឿងអលង្ការនេះមែនទេ?' : 'Delete Jewelry Piece?',
      html: `
        <div class="text-center">
          <p class="text-sm text-slate-600 mb-3">
            ${isKhmer ? 'តើអ្នកចង់លុបធាតុនេះចេញពីបញ្ជីសារពើភណ្ឌមែនទេ?' : 'Are you sure you want to remove this piece from inventory?'}
          </p>
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block text-left text-xs text-slate-800">
            <span class="font-bold text-slate-900 block">${product.name}</span>
            <span class="font-mono text-slate-500">SKU: ${product.code_sku || 'N/A'}</span>
          </div>
          <p class="text-xs text-rose-500 mt-3 font-medium">
            ${isKhmer ? 'សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ!' : 'This action cannot be undone.'}
          </p>
        </div>
      `,
      confirmButtonText: isKhmer ? 'យល់ព្រមលុប' : 'Yes, Delete It',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      await deleteProduct(product.id);
    }
  };

  const [showLowStockAlert, setShowLowStockAlert] = useState(true);
  const lowStockCount = products.filter(p => Number(p.stock_qty) <= 3).length;

  return (
    <div className="space-y-6 w-full">
      {/* Low Stock Alert Banner */}
      {showLowStockAlert && lowStockCount > 0 && !cleanQ && (
        <Alert
          type="warning"
          variant="standard"
          title={t('dashboard.lowStockAlert', 'Low Stock Warning')}
          message={`${lowStockCount} jewelry piece(s) in catalog have fallen to critical stock levels (≤ 3 units). Restock is recommended to maintain active POS operations.`}
          dismissible
          onClose={() => setShowLowStockAlert(false)}
        />
      )}

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
          {/* Sync / Refresh from Backend Button */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            title={isKhmer ? 'ទាញទិន្នន័យពី Database ឡើងវិញ' : 'Sync / Refresh from Database'}
          >
            <FontAwesomeIcon icon={faRotateRight} className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              title={t('catalog.tableView', 'Table View')}
            >
              <FontAwesomeIcon icon={faList} className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              title={t('catalog.gridView', 'Grid View')}
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
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <FontAwesomeIcon icon={faFilter} className="w-3.5 h-3.5 text-amber-600" />
          <span>{filteredProducts.length} {t('catalog.itemsFound', 'items listed')}</span>
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

      {/* Empty State when no items matched */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
            <FontAwesomeIcon icon={faGem} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {cleanQ || selectedCategory !== 'all' || selectedMetal !== 'all'
                ? (isKhmer ? 'រកមិនឃើញគ្រឿងអលង្ការដែលត្រូវគ្នានឹងតម្រង' : 'No Matching Jewelry Found')
                : (isKhmer ? 'មិនទាន់មានគ្រឿងអលង្ការក្នុងកាតាឡុក' : 'No Jewelry Pieces in Vault')}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {cleanQ || selectedCategory !== 'all' || selectedMetal !== 'all'
                ? (isKhmer ? 'សូមសាកល្បងសម្អាតពាក្យស្វែងរក ឬផ្លាស់ប្តូរតម្រងប្រភេទ/ទម្ងន់។' : 'Try clearing your search query or changing category and metal purity filters.')
                : (isKhmer ? 'ចុចប៊ូតុងខាងក្រោមដើម្បីទាញទិន្នន័យពី Database ឬចុះឈ្មោះគ្រឿងអលង្ការថ្មី។' : 'Sync data from the database or register a new handcrafted jewelry item.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-950 font-bold text-xs rounded-xl border border-slate-200 hover:border-amber-300 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <FontAwesomeIcon icon={faRotateRight} className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : 'text-amber-600'}`} />
              <span>{isKhmer ? 'ទាញទិន្នន័យពី Database' : 'Sync from Database'}</span>
            </button>

            {(cleanQ || selectedCategory !== 'all' || selectedMetal !== 'all') ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedMetal('all');
                }}
                className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition-all"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'សម្អាតតម្រង' : 'Clear Filters'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition-all"
              >
                <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'ចុះឈ្មោះគ្រឿងដំបូង' : 'Register First Piece'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
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
                      <th className="py-3.5 px-3 whitespace-nowrap">{t('catalog.materials', 'Materials')}</th>
                      <th className="py-3.5 px-3 whitespace-nowrap text-center">{t('catalog.chiWeight', 'Weight (Chi)')}</th>
                      <th className="py-3.5 px-3 whitespace-nowrap text-center">{t('catalog.laborFee', 'Labor Fee')}</th>
                      <th className="py-3.5 px-3 whitespace-nowrap text-center">{t('catalog.markup', 'Markup')}</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-right">{t('catalog.livePrice', 'Live Atelier Price')}</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center w-28 min-w-[110px] sticky right-0 bg-slate-50 shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                        {t('catalog.actions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedProducts.map(product => {
                      const currentPrice = calculateProductPrice(product);
                      const matchedMaterial = materials?.find(m =>
                        (product.material_id && Number(m.id) === Number(product.material_id)) ||
                        (product.metal_type_id && Number(m.metal_type_id) === Number(product.metal_type_id))
                      );
                      const metal = metalTypes.find(m => m.id === product.metal_type_id) || product.metal_type || product.metalType;
                      const category = categories.find(c => c.id === product.category_id) || product.category;

                      return (
                        <tr
                          key={product.id}
                          onClick={() => handleEdit(product)}
                          className="hover:bg-amber-50/50 transition-colors group cursor-pointer"
                          title={t('common.edit', 'Click to view / edit')}
                        >
                          <td className="py-3.5 px-4 flex items-center gap-3 min-w-[200px]">
                            <img
                              src={product.image || fallbackImg}
                              alt={product.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = fallbackImg;
                              }}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0 bg-slate-100 group-hover:border-amber-300 transition-colors"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate group-hover:text-amber-900 transition-colors">{product.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                            <span className="font-bold text-slate-800 block">{product.code_sku}</span>
                            <span className="text-[11px] text-slate-400 block">{product.barcode || 'N/A'}</span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">{category?.name || 'Fine Jewelry'}</td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                              {matchedMaterial ? matchedMaterial.name : (metal?.name || 'Fine Material')}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono whitespace-nowrap">
                            <span className="font-bold text-amber-900 block">{((product.net_weight || 0) / 3.75).toFixed(2)} {t('cambodiaGold.chi', 'Chi')}</span>
                            <span className="text-[10px] text-slate-400 block">
                              {product.gross_weight && Number(product.gross_weight) > 0
                                ? `Gross: ${((product.gross_weight || 0) / 3.75).toFixed(2)} Chi`
                                : `(${product.net_weight}g)`}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">${product.labor_cost}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-slate-500 whitespace-nowrap">{product.markup_rate}%</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-amber-700 whitespace-nowrap">
                            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap w-28 min-w-[110px] sticky right-0 bg-white group-hover:bg-amber-50/50 transition-colors shadow-[-4px_0_8px_rgba(0,0,0,0.03)] z-10">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(product);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 cursor-pointer transition-colors"
                                title={t('common.edit', 'Edit')}
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProduct(product);
                                }}
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
                  const matchedMaterial = materials?.find(m =>
                    (product.material_id && Number(m.id) === Number(product.material_id)) ||
                    (product.metal_type_id && Number(m.metal_type_id) === Number(product.metal_type_id))
                  );
                  const metal = metalTypes.find(m => m.id === product.metal_type_id) || product.metal_type || product.metalType;
                  const category = categories.find(c => c.id === product.category_id) || product.category;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleEdit(product)}
                      className="group p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer select-none active:scale-[0.99]"
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
                              {matchedMaterial ? matchedMaterial.name : (metal?.name || 'Gold')}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/95 text-amber-950 border border-amber-300/60 shadow-xs backdrop-blur-sm">
                              {((product.net_weight || 0) / 3.75).toFixed(2)} {t('cambodiaGold.chi', 'Chi')}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] uppercase tracking-wider text-amber-700 font-bold block mb-0.5">
                          {category?.name || 'Jewelry'}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-800 transition-colors">
                          {product.name}
                        </h3>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          <span>{product.code_sku}</span>
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
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(product);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 cursor-pointer transition-colors"
                            title={t('common.edit', 'Edit')}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
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
        </>
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
