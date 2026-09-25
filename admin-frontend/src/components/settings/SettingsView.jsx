import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import {
  ProfileSettingsSection,
  GeneralUnitsSection,
  CurrenciesSettingsSection,
  StoreSettingsSection,
  TiersSettingsSection,
  InventorySettingsSection,
  UsersSettingsSection,
  SystemSettingsSection
} from './';
import {
  User as LucideUser,
  Sliders as LucideSliders,
  Crown as LucideCrown,
  Users as LucideUsers,
  Boxes as LucideBoxes,
  Building2 as LucideBuilding,
  Coins as LucideCoins,
  Database as LucideDatabase,
  Settings as LucideSettings,
  ShieldCheck as LucideShieldCheck
} from 'lucide-react';

export const SettingsView = () => {
  const { i18n } = useTranslation();
  const {
    backendConnected,
    settingsTab,
    setSettingsTab,
    hasPermission,
    hasRole,
    currentUser
  } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  const isSuperOrAdmin = hasRole(['super_admin', 'admin']) || currentUser?.email === 'superadmin@jewelflow.com';
  const canViewUsers = hasPermission('view_users') || hasPermission('manage_users') || isSuperOrAdmin;
  const canManageSettings = hasPermission('manage_settings') || isSuperOrAdmin;

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

  // Categorized Sidebar Navigation Items
  const rawSettingsCategoryGroups = [
    {
      groupTitle: isKhmer ? 'គណនី & សុវត្ថិភាព' : 'ACCOUNT & SECURITY',
      items: [
        {
          id: 'profile',
          label: isKhmer ? 'គណនីផ្ទាល់ខ្លួន' : 'My Profile & Security',
          icon: LucideUser,
        },
      ]
    },
    {
      groupTitle: isKhmer ? 'ទូទៅ & អត្រារូបិយប័ណ្ណ' : 'GENERAL & CURRENCIES',
      items: [
        {
          id: 'general',
          label: isKhmer ? 'ទូទៅ & ខ្នាតរង្វាស់' : 'General & Measurement Units',
          icon: LucideSliders,
        },
        {
          id: 'currency',
          label: isKhmer ? 'អត្រាប្តូរប្រាក់ & ខ្នាតមាស' : 'Currency & Gold Standards',
          icon: LucideCoins,
        },
      ]
    },
    {
      groupTitle: isKhmer ? 'ហាង & កម្មវិធីអតិថិជន' : 'ATELIER & LOYALTY',
      items: [
        {
          id: 'store',
          label: isKhmer ? 'ព័ត៌មានហាង & Logo' : 'Store & Atelier Profile',
          icon: LucideBuilding,
        },
        {
          id: 'tiers',
          label: isKhmer ? 'កម្រិត VIP Tiers' : 'VIP Loyalty Tiers',
          icon: LucideCrown,
        },
        {
          id: 'inventory',
          label: isKhmer ? 'ការកំណត់ស្តុក & ការជូនដំណឹង' : 'Inventory & Stock Alerts',
          icon: LucideBoxes,
        },
      ]
    },
    {
      groupTitle: isKhmer ? 'បុគ្គលិក & ប្រព័ន្ធ' : 'STAFF & SYSTEM',
      items: [
        {
          id: 'users',
          label: isKhmer ? 'គ្រប់គ្រងបុគ្គលិក & សិទ្ធិ' : 'Users, Staff & Roles',
          icon: LucideUsers,
        },
        {
          id: 'system',
          label: isKhmer ? 'ប្រព័ន្ធ & ទិន្នន័យ' : 'System Architecture & DB',
          icon: LucideDatabase,
        },
      ]
    }
  ];

  const settingsCategoryGroups = rawSettingsCategoryGroups.map(group => {
    const items = group.items.filter(item => {
      if (item.id === 'profile') return true;
      if (item.id === 'users') return canViewUsers;
      if (item.id === 'system') return isSuperOrAdmin;
      return canManageSettings || isSuperOrAdmin;
    });
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-4 select-none overflow-hidden">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
            <LucideSettings className="w-5 h-5 text-slate-950 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 font-sans">
                {isKhmer ? 'ការកំណត់ប្រព័ន្ធ & ហាងអលង្ការ' : 'System Settings & Atelier Configuration'}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                v2.4 PRO
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

      {/* ── Settings Layout: Pinned Sidebar (Left) + Scrollable Main Content (Right) ── */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-5 items-stretch w-full overflow-hidden">
        {/* Left Side: Settings Sidebar Menu */}
        <aside className="w-full md:w-64 bg-white border border-slate-200 rounded-2xl flex flex-col shrink-0 text-slate-700 shadow-xs select-none h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 border border-amber-300/70 shadow-2xs shrink-0">
              <LucideSettings className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold tracking-tight text-slate-900 truncate font-sans">
                  {isKhmer ? 'ការកំណត់' : 'Settings'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {isKhmer ? 'គ្រប់គ្រងទូទៅ & ប្រព័ន្ធ' : 'Configuration Suite'}
              </p>
            </div>
          </div>

          {/* Navigation Links Grouped by Category */}
          <nav className="flex-1 p-3 space-y-3.5 overflow-y-auto custom-scrollbar">
            {settingsCategoryGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.groupTitle}
                </div>
                {group.items.map(item => {
                  const isActive = activeTab === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group border ${
                        isActive
                          ? 'bg-amber-50 text-amber-900 font-medium border-amber-200/80 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconComp
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 border ${
                            isActive
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200/80 font-medium'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* System Status in Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-yellow-500/10 border border-amber-300/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <LucideShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{isKhmer ? 'ស្ថានភាពប្រព័ន្ធ' : 'System Health'}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 font-bold px-1.5 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  {backendConnected ? (isKhmer ? 'ភ្ជាប់ជោគជ័យ' : 'Connected') : 'Online'}
                </span>
              </div>
              <div className="text-xs font-bold font-mono text-slate-900 mt-1 flex items-center justify-between">
                <span>Laravel 12 (Central)</span>
                <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-1.5 py-0.5 rounded border border-amber-200 font-sans">v2.4 Pro</span>
              </div>
              <div className="text-[10.5px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{isKhmer ? 'ទិន្នន័យ:' : 'Database:'}</span>
                <span className="font-semibold text-emerald-700">
                  {isKhmer ? 'ដំណើរការធម្មតា' : 'Active & Synced'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Active Settings Panel Component (Scrollable) */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar pr-1 pb-8">
          {activeTab === 'profile' && <ProfileSettingsSection />}
          {activeTab === 'general' && <GeneralUnitsSection />}
          {activeTab === 'currency' && <CurrenciesSettingsSection />}
          {activeTab === 'store' && <StoreSettingsSection />}
          {activeTab === 'tiers' && <TiersSettingsSection />}
          {activeTab === 'inventory' && <InventorySettingsSection />}
          {activeTab === 'users' && <UsersSettingsSection />}
          {activeTab === 'system' && <SystemSettingsSection />}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
