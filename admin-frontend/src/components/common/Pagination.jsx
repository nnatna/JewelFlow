import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const Pagination = ({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange
}) => {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (totalItems <= pageSize) {
    return (
      <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>
          {t('common.showing', 'Showing')}{' '}
          <strong className="text-slate-800 font-bold">{totalItems}</strong>{' '}
          {t('common.of', 'of')}{' '}
          <strong className="text-slate-800 font-bold">{totalItems}</strong>{' '}
          {t('common.results', 'results')}
        </span>
        <span className="text-[11px] text-slate-400">
          {t('common.page', 'Page')} 1 {t('common.of', 'of')} 1 (10 {t('common.perPage', 'per page')})
        </span>
      </div>
    );
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with window
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div className="text-slate-500">
        {t('common.showing', 'Showing')}{' '}
        <strong className="text-slate-800 font-bold">{startItem}</strong>{' '}
        {t('common.to', 'to')}{' '}
        <strong className="text-slate-800 font-bold">{endItem}</strong>{' '}
        {t('common.of', 'of')}{' '}
        <strong className="text-slate-800 font-bold">{totalItems}</strong>{' '}
        {t('common.results', 'results')}
      </div>

      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer"
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Prev Page */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[32px] h-8 px-2 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
              currentPage === page
                ? 'bg-amber-500 text-white shadow-xs border border-amber-500'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next Page */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer"
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer"
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
