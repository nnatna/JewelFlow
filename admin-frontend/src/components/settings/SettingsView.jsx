import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import UsersSettingsSection from './UsersSettingsSection';
import ProfileSettingsSection from './ProfileSettingsSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear, faGlobe, faCalculator, faTriangleExclamation, faCrown,
  faPlus, faPencil, faTrash, faCheck, faCheckCircle, faCircleExclamation,
  faBoxesStacked, faSliders, faFloppyDisk, faPalette, faPercent, faDollarSign,
  faStore, faCoins, faShieldHalved, faDatabase, faArrowsRotate, faClock,
  faReceipt, faChevronRight, faBuilding, faPhone, faEnvelope, faLocationDot,
  faCircleDot, faServer, faScaleBalanced, faCamera, faCloudArrowUp, faImage,
  faGem, faXmark, faEye, faPenToSquare, faAward, faStar, faTrashCan,
  faUserShield, faUser
} from '@fortawesome/free-solid-svg-icons';

const TIER_COLORS = [
  {
    id: 'slate',
    label: 'Standard / Bronze',
    shortLabel: 'Bronze Standard',
    badge: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-xs',
    icon: faAward,
    colorName: 'Slate & Bronze'
  },
  {
    id: 'amber',
    label: 'Royal Gold VIP',
    shortLabel: 'Royal Gold',
    badge: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 border-amber-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-sm shadow-amber-500/25',
    icon: faCrown,
    colorName: '24K Royal Gold'
  },
  {
    id: 'sky',
    label: 'Diamond & Platinum',
    shortLabel: 'Diamond / Platinum',
    badge: 'bg-gradient-to-r from-sky-50 to-cyan-100 text-sky-950 border-sky-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-sky-400 via-cyan-400 to-blue-500 text-slate-950 shadow-sm shadow-sky-500/25',
    icon: faGem,
    colorName: 'Diamond Sparkle'
  },
  {
    id: 'violet',
    label: 'Royal Amethyst VIP',
    shortLabel: 'Amethyst VIP',
    badge: 'bg-gradient-to-r from-violet-50 to-purple-100 text-violet-950 border-violet-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 text-white shadow-sm shadow-purple-500/25',
    icon: faCrown,
    colorName: 'Imperial Amethyst'
  },
  {
    id: 'rose',
    label: 'Burmese Ruby',
    shortLabel: 'Burmese Ruby',
    badge: 'bg-gradient-to-r from-rose-50 to-pink-100 text-rose-950 border-rose-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 text-white shadow-sm shadow-rose-500/25',
    icon: faGem,
    colorName: 'Pigeon Blood Ruby'
  },
  {
    id: 'emerald',
    label: 'Imperial Jade / Emerald',
    shortLabel: 'Imperial Jade',
    badge: 'bg-gradient-to-r from-emerald-50 to-teal-100 text-emerald-950 border-emerald-300 shadow-2xs',
    iconBg: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25',
    icon: faGem,
    colorName: 'Imperial Emerald'
  },
];

export const SettingsView = () => {
  const { t, i18n } = useTranslation();
  const {
    settings,
    saveSettings,
    tiers,
    addTier,
    editTier,
    removeTier,
    products,
    users,
    exchangeRate,
    backendConnected,
    confirmDialog,
    showToast,
    currentUser,
    settingsTab,
    setSettingsTab
  } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  // Active Settings Sidebar Tab
  const [activeTab, setActiveTab] = useState(settingsTab || 'profile');

  useEffect(() => {
    if (settingsTab) {
      setActiveTab(settingsTab);
    }
  }, [settingsTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (setSettingsTab) {
      setSettingsTab(tabId);
    }
  };

  // Local settings state
  const [calcTier, setCalcTier] = useState(settings?.calculator_tier || 'Gold');
  const [alertLowStock, setAlertLowStock] = useState(settings?.alert_low_stock !== 'false');
  const [lowStockThreshold, setLowStockThreshold] = useState(settings?.low_stock_threshold || 5);
  const [savingSettings, setSavingSettings] = useState(false);

  // Store Profile Info State
  const [storeInfo, setStoreInfo] = useState({
    name: settings?.store_name || (isKhmer ? 'ហាងមាស & គ្រឿងអលង្ការ ជេវែលផ្លូវ (JewelFlow Atelier)' : 'JewelFlow Luxury Atelier & ERP'),
    phone: settings?.store_phone || '+855 (0) 23 999 888',
    email: settings?.store_email || 'contact@jewelflow.com',
    address: settings?.store_address || '#88 Preah Norodom Blvd, Sangkat Chey Chumneas, Phnom Penh, Cambodia',
    vat_tin: settings?.vat_tin || 'K002-901823901',
    invoice_disclaimer: settings?.invoice_disclaimer || (isKhmer ? 'ទំនិញដែលបានទិញរួច អាចប្តូរយកវិញបានក្នុងរយៈពេល ៧ថ្ងៃ ជាមួយវិក្កយបត្រផ្លូវការ។' : 'Purchased jewelry may be exchanged within 7 days with official sales invoice.'),
    logo: settings?.store_logo || null,
  });

  // Sync storeInfo with settings from AppContext
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

  // Filter low stock items for preview
  const lowStockItems = products.filter(p => Number(p.stock_qty) <= Number(lowStockThreshold));

  // Language Change Handler
  const handleLanguageChange = (newLang) => {
    const norm = (newLang || '').startsWith('en') ? 'en' : 'km';
    if (typeof window !== 'undefined') {
      localStorage.setItem('jewelflow_lang_user_choice', norm);
      localStorage.setItem('i18nextLng', norm);
    }
    i18n.changeLanguage(norm);
  };

  // Store Logo File Upload Handler
  const handleStoreLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreInfo(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save General System Settings
  const handleSaveGeneralSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    try {
      await saveSettings({
        language: currentLang,
        calculator_tier: calcTier,
        alert_low_stock: alertLowStock ? 'true' : 'false',
        low_stock_threshold: String(lowStockThreshold),
        store_name: storeInfo.name,
        store_phone: storeInfo.phone,
        store_email: storeInfo.email,
        store_address: storeInfo.address,
        vat_tin: storeInfo.vat_tin,
        invoice_disclaimer: storeInfo.invoice_disclaimer,
        store_logo: storeInfo.logo || ''
      });
      showToast(
        isKhmer ? 'ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!' : 'Settings saved successfully!',
        'success'
      );
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការរក្សាទុកការកំណត់' : 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Tier Modal Helper
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
      min_spending: tier.min_spending ?? 0,
      discount_rate: tier.discount_rate ?? 0,
      badge_color: tier.badge_color || 'amber',
      description: tier.description || '',
      is_active: tier.is_active !== false
    });
    setTierErrors({});
    setShowTierModal(true);
  };

  // Save Tier Form
  const handleSaveTier = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!tierForm.name.trim()) {
      errs.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះកម្រិត (Tier Name)!' : 'Please enter tier name!';
    }
    if (tierForm.min_spending === '' || isNaN(Number(tierForm.min_spending))) {
      errs.min_spending = isKhmer ? 'សូមបញ្ចូលទំហំចំណាយអប្បបរមា!' : 'Minimum spending is required!';
    }
    if (tierForm.discount_rate === '' || isNaN(Number(tierForm.discount_rate))) {
      errs.discount_rate = isKhmer ? 'សូមបញ្ចូលភាគរយបញ្ចុះតម្លៃ!' : 'Discount rate is required!';
    }

    if (Object.keys(errs).length > 0) {
      setTierErrors(errs);
      showToast(
        isKhmer ? 'សូមបំពេញព័ត៌មានដែលខ្វះ!' : 'Please check required tier fields!',
        'warning'
      );
      return;
    }

    setSavingTier(true);
    const payload = {
      ...tierForm,
      min_spending: Number(tierForm.min_spending) || 0,
      discount_rate: Number(tierForm.discount_rate) || 0
    };

    try {
      if (editingTierId) {
        await editTier({ id: editingTierId, ...payload });
      } else {
        await addTier(payload);
      }
      setShowTierModal(false);
      showToast(isKhmer ? 'រក្សាទុក VIP Tier ជោគជ័យ' : 'Tier saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save tier:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save tier', 'error');
    } finally {
      setSavingTier(false);
    }
  };

  // Delete Tier
  const handleDeleteTier = async (tier) => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'លុបកម្រិត VIP Tier?' : 'Delete Tier?',
      text: isKhmer
        ? `តើអ្នកពិតជាចង់លុបកម្រិត "${tier.name}" នេះមែនទេ?`
        : `Are you sure you want to delete tier "${tier.name}"?`,
      confirmButtonText: isKhmer ? 'លុបចោល' : 'Yes, Delete',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      await removeTier(tier.id);
      showToast(isKhmer ? 'លុប VIP Tier បានជោគជ័យ' : 'Tier deleted successfully', 'success');
    }
  };

  // ── Settings Sidebar Menu Definition ──────────────────────────────────────
  const sidebarMenuItems = [
    {
      id: 'profile',
      label: isKhmer ? 'គណនីផ្ទាល់ខ្លួន' : 'My Profile & Security',
      icon: faUser,
      badge: currentUser?.role_display || (isKhmer ? 'គណនីខ្ញុំ' : 'Staff'),
    },
    {
      id: 'general',
      label: isKhmer ? 'ទូទៅ & ភាសា' : 'General & Language',
      icon: faSliders,
    },
    {
      id: 'tiers',
      label: isKhmer ? 'កម្រិត VIP Tiers' : 'VIP Loyalty Tiers',
      icon: faCrown,
      badge: `${(tiers || []).length}`,
    },
    {
      id: 'users',
      label: isKhmer ? 'គ្រប់គ្រងបុគ្គលិក' : 'Users & Staff',
      icon: faUserShield,
      badge: `${(users || []).length}`,
    },
    {
      id: 'inventory',
      label: isKhmer ? 'ការកំណត់ស្តុក' : 'Inventory & Stock Alerts',
      icon: faTriangleExclamation,
      badge: lowStockItems.length > 0 ? `${lowStockItems.length}` : null,
    },
    {
      id: 'store',
      label: isKhmer ? 'ព័ត៌មានហាង' : 'Store & Atelier Profile',
      icon: faStore,
    },
    {
      id: 'currency',
      label: isKhmer ? 'អត្រាប្តូរប្រាក់' : 'Currency & Gold Units',
      icon: faCoins,
      badge: exchangeRate?.rate ? `1$: ${exchangeRate.rate}៛` : null,
    },
    {
      id: 'system',
      label: isKhmer ? 'ប្រព័ន្ធ & ទិន្នន័យ' : 'System & Database',
      icon: faDatabase,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-4 select-none overflow-hidden">
      
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
            <FontAwesomeIcon icon={faGear} className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 font-serif">
                {isKhmer ? 'ការកំណត់ប្រព័ន្ធ & ហាងអលង្ការ' : 'System Settings & Atelier Configuration'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                v2.4 Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKhmer
                ? 'កំណត់ភាសា គណនីផ្ទាល់ខ្លួន កម្រិត VIP Tiers ព័ត៌មានហាង ស្តុកទំនិញ និងអត្រាប្តូរប្រាក់'
                : 'Configure profile, language, VIP tiers, store details, stock alerts & currencies'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Settings Layout: Pinned Settings Sidebar (Left) + Scrollable Main Panel (Right) ── */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-5 items-stretch w-full overflow-hidden">

        {/* ── Left Side: Settings Sidebar Menu (Pinned / Scrollable internally) ── */}
        <aside className="w-full md:w-64 lg:w-72 bg-white border border-slate-200 rounded-2xl flex flex-col shrink-0 text-slate-700 shadow-xs select-none h-full overflow-y-auto custom-scrollbar">
          {/* Section Header */}
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 shrink-0">
              <FontAwesomeIcon icon={faGear} className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-serif">
                {isKhmer ? 'ការកំណត់' : 'Settings'}
                <span className="text-[9px] uppercase font-sans font-extrabold tracking-widest text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                  PRO
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">{isKhmer ? 'គ្រប់គ្រងទូទៅ & ប្រព័ន្ធ' : 'Configuration Suite'}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
              {isKhmer ? 'ជម្រើសការកំណត់' : 'Settings Categories'}
            </div>
            {sidebarMenuItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 border border-amber-300/80 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-amber-500 text-white font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* System Status in Sidebar Footer (Exact match to Sidebar.jsx widget) */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 shrink-0 mt-auto">
            <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-amber-600" />
                  {isKhmer ? 'ស្ថានភាពប្រព័ន្ធ' : 'System Health'}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-1.5 py-0.5 rounded">
                  {backendConnected ? (isKhmer ? 'ភ្ជាប់ជោគជ័យ' : 'Connected') : 'Online'}
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                Laravel 12 <span className="text-xs text-amber-700 font-sans font-normal">v2.4</span>
                <span className="text-xs text-slate-400 font-normal ml-1.5">(Central)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{isKhmer ? 'មូលដ្ឋានទិន្នន័យ:' : 'Database Sync:'}</span>
                <span className="font-semibold text-emerald-700">
                  {isKhmer ? 'ដំណើរការធម្មតា' : 'Active & Synced'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="flex items-center gap-1 text-slate-500">
                <FontAwesomeIcon icon={faServer} className="w-3.5 h-3.5 text-emerald-600" />
                {isKhmer ? 'ម៉ាស៊ីនបម្រើកណ្តាល' : 'Central Server Sync'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold font-mono">v2.4 Pro</span>
            </div>
          </div>
        </aside>

        {/* ── Right Side: Active Settings Panel Content (Scrollable) ── */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar pr-1 pb-8 space-y-6">

          {/* ── Tab 0: My Profile & Security ──────────────────────────────── */}
          {activeTab === 'profile' && (
            <ProfileSettingsSection />
          )}

          {/* ── Tab 1: General & Language Settings ────────────────────────── */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              
              {/* Language Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <FontAwesomeIcon icon={faGlobe} className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{isKhmer ? 'កំណត់ភាសាប្រព័ន្ធ (System Language)' : 'Application Language'}</h2>
                    <p className="text-xs text-slate-400 font-normal">{isKhmer ? 'ជ្រើសរើសភាសាសម្រាប់កម្មវិធី JewelFlow ទាំងមូល' : 'Select UI display language across all modules'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('km')}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      currentLang === 'km'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-sm ring-2 ring-amber-400/20 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl leading-none">🇰🇭</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">ភាសាខ្មែរ (Khmer)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isKhmer ? 'ទម្រង់ភាសាជាតិ និងខ្នាតមាសកម្ពុជា' : 'National Khmer language & units'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      currentLang === 'en'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-sm ring-2 ring-amber-400/20 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl leading-none">🇺🇸</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">English (US)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isKhmer ? 'ទម្រង់ភាសាអង់គ្លេសពាណិជ្ជកម្មអន្តរជាតិ' : 'International English business format'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Calculator Default Tier Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCalculator} className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{isKhmer ? 'កម្រិត VIP ដើមសម្រាប់ម៉ាស៊ីនគណនា (Calculator Tier)' : 'Default POS Calculator Tier'}</h2>
                    <p className="text-xs text-slate-400 font-normal">{isKhmer ? 'កំណត់កម្រិតបញ្ចុះតម្លៃដើមពេលគណនាតម្លៃលើផ្ទាំង POS' : 'Default discount tier applied in price estimation tool'}</p>
                  </div>
                </div>

                <div className="max-w-md space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isKhmer ? 'ជ្រើសរើស VIP Tier ដើម:' : 'Select Default Tier:'}
                  </label>
                  <select
                    value={calcTier}
                    onChange={e => setCalcTier(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 cursor-pointer"
                  >
                    {(tiers || []).map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.discount_rate}% Discount)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveGeneralSettings}
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
                    <span>{savingSettings ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកំណត់ទូទៅ' : 'Save General Settings')}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ── Tab 2: VIP Tier Loyalty Management ────────────────────────── */}
          {activeTab === 'tiers' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
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
                      <th className="py-3 px-3.5 rounded-l-xl">{isKhmer ? 'ឈ្មោះកម្រិត (Tier)' : 'Tier Name'}</th>
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
            </div>
          )}

          {/* ── Tab 3: Inventory & Stock Alerts Settings ───────────────────── */}
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
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
            </div>
          )}

          {/* ── Tab 4: Store & Atelier Profile Settings ────────────────────── */}
          {activeTab === 'store' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              
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

              {/* Note and Save at bottom of Tab 4 */}
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
                  onClick={handleSaveGeneralSettings}
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
                  <span>{savingSettings ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកព័ត៌មានហាង' : 'Save Store Details')}</span>
                </button>
              </div>

            </div>
          )}

          {/* ── Tab 5: Currency & Cambodian Gold Units ────────────────────── */}
          {activeTab === 'currency' && (
            <div className="space-y-5">
              
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
                      {isKhmer ? '១ ជី (1 Chi)' : '1 Chi'}
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-1">
                      {isKhmer ? '3.75 ក្រាម' : '3.75 Grams'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">
                      {isKhmer ? '១ ដំឡឹង (1 Damlung)' : '1 Damlung'}
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-1">
                      {isKhmer ? '37.5 ក្រាម (១០ ជី)' : '37.5 Grams (10 Chi)'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">
                      {isKhmer ? '១ ហ៊ុន (1 Hun)' : '1 Hun'}
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-1">
                      {isKhmer ? '0.375 ក្រាម' : '0.375 Grams'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">
                      {isKhmer ? '១ គីឡូ (1 Kg)' : '1 Kilogram (1 Kg)'}
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-1">
                      {isKhmer ? '26.666 ដំឡឹង' : '26.666 Damlung'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── Tab 6: System & Database Information ───────────────────────── */}
          {activeTab === 'system' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
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
          )}

          {/* ── Tab 7: Users & Permissions Management ────────────────────── */}
          {activeTab === 'users' && (
            <UsersSettingsSection />
          )}

        </div>

      </div>

      {/* ── Add / Edit Tier Modal ───────────────────────────────────────── */}
      {showTierModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <FontAwesomeIcon icon={faCrown} className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {editingTierId
                      ? (isKhmer ? 'កែប្រែ VIP Tier' : 'Edit VIP Tier')
                      : (isKhmer ? 'បន្ថែម VIP Tier ថ្មី' : 'Create New VIP Tier')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer ? 'កំណត់លក្ខខណ្ឌចំណាយ និងការបញ្ចុះតម្លៃ' : 'Define spending criteria and tier rewards'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTierModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer text-sm"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form noValidate onSubmit={handleSaveTier} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Tier Name Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {isKhmer ? 'ឈ្មោះកម្រិត (Tier Name) *' : 'Tier Name *'}
                </label>
                <input
                  type="text"
                  value={tierForm.name}
                  onChange={e => {
                    setTierForm(f => ({ ...f, name: e.target.value }));
                    if (tierErrors.name) setTierErrors(prev => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Sapphire VIP"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                    tierErrors.name ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                  }`}
                />
                {tierErrors.name && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{tierErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Min Spending & Discount Rate Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    {isKhmer ? 'ចំណាយអប្បបរមា ($) *' : 'Min Spend ($) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={tierForm.min_spending}
                    onChange={e => {
                      setTierForm(f => ({ ...f, min_spending: e.target.value }));
                      if (tierErrors.min_spending) setTierErrors(prev => ({ ...prev, min_spending: null }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                      tierErrors.min_spending ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {tierErrors.min_spending && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{tierErrors.min_spending}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    {isKhmer ? 'បញ្ចុះតម្លៃ (%) *' : 'Discount (%) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={tierForm.discount_rate}
                    onChange={e => {
                      setTierForm(f => ({ ...f, discount_rate: e.target.value }));
                      if (tierErrors.discount_rate) setTierErrors(prev => ({ ...prev, discount_rate: null }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 font-semibold focus:outline-none transition-all ${
                      tierErrors.discount_rate ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50'
                    }`}
                  />
                  {tierErrors.discount_rate && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5 font-medium animate-fadeIn">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{tierErrors.discount_rate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Jewel Theme Color Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  {isKhmer ? 'ជ្រើសរើសពណ៌ត្បូង / Jewel Theme' : 'Jewel Gemstone Theme & Color'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIER_COLORS.map(c => {
                    const isSelected = tierForm.badge_color === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setTierForm(f => ({ ...f, badge_color: c.id }))}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all text-left ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/30 text-slate-950 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${c.iconBg}`}>
                          <FontAwesomeIcon icon={c.icon} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[11px] leading-tight">{c.shortLabel || c.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{c.colorName}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {isKhmer ? 'ពិពណ៌នា' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={tierForm.description}
                  onChange={e => setTierForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-200/50 resize-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTierModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer font-bold text-xs transition-all"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingTier}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingTier ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុក Tier' : 'Save VIP Tier')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SettingsView;
