import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { TierModal, TIER_COLORS } from './TierModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCrown,
  faPlus,
  faGem,
  faPercent,
  faCheckCircle,
  faPenToSquare,
  faTrashCan
} from '@fortawesome/free-solid-svg-icons';

export const TiersSettingsSection = () => {
  const { i18n } = useTranslation();
  const {
    tiers,
    addTier,
    editTier,
    removeTier,
    showToast,
    confirmDialog
  } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  // Tier Modal State
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);
  const [tierForm, setTierForm] = useState({
    name: '',
    min_spending: 0,
    discount_rate: 0,
    badge_color: 'amber',
    description: '',
    is_active: true
  });
  const [tierErrors, setTierErrors] = useState({});
  const [savingTier, setSavingTier] = useState(false);

  const openNewTierModal = () => {
    setEditingTierId(null);
    setTierForm({
      name: '',
      min_spending: 0,
      discount_rate: 0,
      badge_color: 'amber',
      description: '',
      is_active: true
    });
    setTierErrors({});
    setShowTierModal(true);
  };

  const openEditTierModal = (tier) => {
    setEditingTierId(tier.id);
    setTierForm({
      name: tier.name || '',
      min_spending: tier.min_spending || 0,
      discount_rate: tier.discount_rate || 0,
      badge_color: tier.badge_color || 'amber',
      description: tier.description || '',
      is_active: tier.is_active !== false
    });
    setTierErrors({});
    setShowTierModal(true);
  };

  const handleSaveTier = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!tierForm.name.trim()) errs.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះកម្រិត!' : 'Please enter tier name!';
    if (tierForm.min_spending === '' || Number(tierForm.min_spending) < 0) {
      errs.min_spending = isKhmer ? 'សូមបញ្ចូលទំហំចំណាយអប្បបរមា!' : 'Minimum spending is required!';
    }
    if (tierForm.discount_rate === '' || Number(tierForm.discount_rate) < 0) {
      errs.discount_rate = isKhmer ? 'សូមបញ្ចូលភាគរយបញ្ចុះតម្លៃ!' : 'Discount rate is required!';
    }

    if (Object.keys(errs).length > 0) {
      setTierErrors(errs);
      showToast(isKhmer ? 'សូមបំពេញព័ត៌មានដែលខ្វះ!' : 'Please check required tier fields!', 'warning');
      return;
    }

    setSavingTier(true);
    try {
      const payload = {
        name: tierForm.name.trim(),
        min_spending: Number(tierForm.min_spending),
        discount_rate: Number(tierForm.discount_rate),
        badge_color: tierForm.badge_color,
        description: tierForm.description.trim() || null,
        is_active: tierForm.is_active
      };

      if (editingTierId) {
        await editTier(editingTierId, payload);
      } else {
        await addTier(payload);
      }
      setShowTierModal(false);
      showToast(isKhmer ? 'រក្សាទុក VIP Tier ជោគជ័យ' : 'Tier saved successfully', 'success');
    } catch {
      showToast(isKhmer ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save tier', 'error');
    } finally {
      setSavingTier(false);
    }
  };

  const handleDeleteTier = async (tier) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបកម្រិត VIP Tier?' : 'Delete Tier?',
      text: isKhmer
        ? `តើអ្នកពិតជាចង់លុបកម្រិត "${tier.name}" នេះមែនទេ?`
        : `Are you sure you want to delete the "${tier.name}" VIP tier?`,
      confirmButtonText: isKhmer ? 'លុបចោល' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
    });

    if (confirmed) {
      try {
        await removeTier(tier.id);
        showToast(isKhmer ? 'លុប VIP Tier បានជោគជ័យ' : 'Tier deleted successfully', 'success');
      } catch {
        showToast(isKhmer ? 'បរាជ័យក្នុងការលុប' : 'Failed to delete tier', 'error');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5 select-none animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <FontAwesomeIcon icon={faCrown} className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {isKhmer ? 'គ្រប់គ្រង VIP Tiers (VIP Loyalty Program)' : 'VIP Tier Management'}
            </h2>
            <p className="text-xs text-slate-500">
              {isKhmer ? 'កំណត់កម្រិត VIP បញ្ចុះតម្លៃ និងលក្ខខណ្ឌចំណាយសរុប' : 'Define discount privileges and total spending requirements'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openNewTierModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>{isKhmer ? 'បន្ថែម Tier ថ្មី' : 'Add New Tier'}</span>
        </button>
      </div>

      {/* Tiers List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
              <th className="py-3 px-3.5 rounded-l-xl">{isKhmer ? 'ឈ្មោះកម្រិត' : 'Tier Name'}</th>
              <th className="py-3 px-3.5">{isKhmer ? 'ចំណាយអប្បបរមា ($)' : 'Min Spend ($)'}</th>
              <th className="py-3 px-3.5">{isKhmer ? 'បញ្ចុះតម្លៃ (%)' : 'Discount Rate'}</th>
              <th className="py-3 px-3.5">{isKhmer ? 'ពណ៌ Badge' : 'Theme Color'}</th>
              <th className="py-3 px-3.5">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              <th className="py-3 px-3.5 text-right rounded-r-xl">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {(tiers || []).map(t => {
              const theme = TIER_COLORS.find(c => c.id === t.badge_color) || TIER_COLORS[1];
              return (
                <tr key={t.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3.5 px-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 ${theme.iconBg}`}>
                        <FontAwesomeIcon icon={theme.icon || faGem} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm font-serif flex items-center gap-1.5">
                          <span>{t.name}</span>
                        </p>
                        {t.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{t.description}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">
                    ${Number(t.min_spending).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-3.5">
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-xl border border-amber-300/80 shadow-2xs">
                      <FontAwesomeIcon icon={faPercent} className="w-2.5 h-2.5 text-amber-700" />
                      <span>{t.discount_rate}% {isKhmer ? 'បញ្ចុះ' : 'OFF'}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${theme.badge}`}>
                      <FontAwesomeIcon icon={theme.icon || faGem} className="w-3 h-3 opacity-90" />
                      <span>{theme.shortLabel || theme.label}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-3.5">
                    {t.is_active !== false ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-emerald-600" />
                        <span>{isKhmer ? 'ដំណើរការ' : 'Active'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                        <span>{isKhmer ? 'បិទ' : 'Inactive'}</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditTierModal(t)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center"
                      title={isKhmer ? 'កែប្រែ' : 'Edit'}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTier(t)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center"
                      title={isKhmer ? 'លុប' : 'Delete'}
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Tier Modal */}
      <TierModal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        onSubmit={handleSaveTier}
        tierForm={tierForm}
        setTierForm={setTierForm}
        tierErrors={tierErrors}
        setTierErrors={setTierErrors}
        editingTierId={editingTierId}
        savingTier={savingTier}
        isKhmer={isKhmer}
      />
    </div>
  );
};

export default TiersSettingsSection;
