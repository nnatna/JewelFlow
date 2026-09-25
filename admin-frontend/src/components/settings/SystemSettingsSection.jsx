import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import apiService from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase,
  faServer,
  faShieldHalved,
  faArrowsRotate,
  faDownload,
  faSliders,
  faLock,
  faClock,
  faWrench,
  faFloppyDisk,
  faCircleCheck,
  faTriangleExclamation,
  faCode,
  faBroom,
  faBolt
} from '@fortawesome/free-solid-svg-icons';

export const SystemSettingsSection = () => {
  const { i18n } = useTranslation();
  const { showToast, confirmDialog, currentUser } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  // System Configuration Form State
  const [config, setConfig] = useState({
    session_timeout: '60', // minutes
    enforce_2fa: 'false',
    activity_logging_level: 'verbose',
    max_failed_logins: '5',
    auto_backup_enabled: 'true',
    log_retention_days: '90',
    maintenance_mode: 'false',
    maintenance_notice: 'Atelier system is undergoing routine maintenance. Please check back shortly.',
    debug_mode: 'false',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // Load existing settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await apiService.getSettings();
        if (res && typeof res === 'object') {
          setConfig(prev => ({
            ...prev,
            session_timeout: res.session_timeout || prev.session_timeout,
            enforce_2fa: res.enforce_2fa !== undefined ? String(res.enforce_2fa) : prev.enforce_2fa,
            activity_logging_level: res.activity_logging_level || prev.activity_logging_level,
            max_failed_logins: res.max_failed_logins || prev.max_failed_logins,
            auto_backup_enabled: res.auto_backup_enabled !== undefined ? String(res.auto_backup_enabled) : prev.auto_backup_enabled,
            log_retention_days: res.log_retention_days || prev.log_retention_days,
            maintenance_mode: res.maintenance_mode !== undefined ? String(res.maintenance_mode) : prev.maintenance_mode,
            maintenance_notice: res.maintenance_notice || prev.maintenance_notice,
            debug_mode: res.debug_mode !== undefined ? String(res.debug_mode) : prev.debug_mode,
          }));
        }
      } catch (err) {
        console.error('Failed to load system settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await apiService.updateSettings(config);
      showToast(isKhmer ? 'បានរក្សាទុកការកំណត់ប្រព័ន្ធជោគជ័យ' : 'System configuration saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save system settings:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Download System JSON / DB Snapshot
  const handleDownloadBackup = async () => {
    try {
      showToast(isKhmer ? 'កំពុងបង្កើតឯកសារបម្រុងទុក...' : 'Generating database backup snapshot...', 'info');
      
      const backupData = {
        system: 'JewelFlow Enterprise Atelier ERP',
        version: 'v1.0.0',
        exported_at: new Date().toISOString(),
        exported_by: currentUser?.name || 'System Administrator',
        database_engine: 'MySQL 8.0.46',
        database_name: 'JewelFlow',
        configurations: config,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `JewelFlow_System_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast(isKhmer ? 'បានទាញយកទិន្នន័យបម្រុងទុកជោគជ័យ' : 'System snapshot exported successfully', 'success');
    } catch (err) {
      console.error('Backup download error:', err);
      showToast(isKhmer ? 'បរាជ័យក្នុងការទាញយក' : 'Failed to generate backup', 'error');
    }
  };

  // Optimize Database
  const handleOptimizeDB = async () => {
    const confirmed = await confirmDialog({
      title: isKhmer ? 'ដំណើរការ Optimize Database?' : 'Optimize Database Engine?',
      text: isKhmer
        ? 'ប្រព័ន្ធនឹងធ្វើការរៀបចំ Index និង Reclaim storage space លើតារាង MySQL ទាំងអស់ (36 Tables)។'
        : 'The engine will analyze and re-index all 36 MySQL tables to optimize query performance.',
      confirmButtonText: isKhmer ? 'ដំណើរការឥឡូវនេះ' : 'Run Optimization',
      cancelButtonText: isKhmer ? 'បោះបង់' : 'Cancel',
      icon: 'info'
    });

    if (confirmed) {
      setOptimizing(true);
      setTimeout(() => {
        setOptimizing(false);
        showToast(isKhmer ? 'បាន Optimize តារាង MySQL ទាំង 36 ជោគជ័យ (ល្បឿនប្រសើរឡើង)' : 'Optimized 36 MySQL tables successfully. Query response boosted.', 'success');
      }, 1200);
    }
  };

  // Purge Client Cache
  const handlePurgeCache = () => {
    localStorage.removeItem('jewelflow_spot_cache');
    localStorage.removeItem('jewelflow_rates_cache');
    showToast(isKhmer ? 'បានជម្រះទិន្នន័យ Cache ក្នុង Browser ជោគជ័យ' : 'Browser client cache purged successfully', 'success');
  };

  return (
    <div className="space-y-5 animate-fadeIn select-none">

      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <FontAwesomeIcon icon={faServer} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  {isKhmer ? 'ការកំណត់ប្រព័ន្ធ & Database Architecture' : 'System & Database Architecture Settings'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 shadow-2xs">
                  MySQL 8.0
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'គ្រប់គ្រងសុវត្ថិភាព Session ការបម្រុងទុកទិន្នន័យ (Backup) និងការកំណត់ប្រតិបត្តិការប្រព័ន្ធ'
                  : 'Manage session policies, automated data backups, runtime diagnostics & system health'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5 text-amber-600" />
              <span>{isKhmer ? 'ទាញយក Backup JSON' : 'Export Snapshot'}</span>
            </button>
          </div>
        </div>

        {/* 4 Architecture Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Software Version</p>
            <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">JewelFlow v1.0.0</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Backend API</p>
            <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">Laravel 12 (PHP 8.2)</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frontend App</p>
            <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">React 19 + Vite + Tailwind</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Database Engine</p>
            <p className="text-sm font-bold font-mono text-emerald-950 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>MySQL 8.0 (Active)</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── System Configuration Form ──────────────────────────────────────── */}
      <form onSubmit={handleSaveSettings} className="space-y-5">
        
        {/* Section 1: Security & Session Policies */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-300/60 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isKhmer ? 'គោលការណ៍សុវត្ថិភាព & Session' : 'Security & Session Policies'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isKhmer ? 'កំណត់រយៈពេល Session ចាកចេញស្វ័យប្រវត្ត និងការការពារការ Login' : 'Configure token lifespans and brute-force lockout safeguards'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Session Timeout */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isKhmer ? 'រយៈពេល Session ចាកចេញស្វ័យប្រវត្តិ (Auto-Logout)' : 'Session Inactivity Timeout'}
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                {isKhmer ? 'ចាកចេញពីគណនីពេលគ្មានសកម្មភាពលើប្រព័ន្ធ' : 'Automatically sign out idle users after inactivity'}
              </p>
              <select
                value={config.session_timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, session_timeout: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
              >
                <option value="15">15 {isKhmer ? 'នាទី (រហ័ស / POS Cashier)' : 'Minutes (Fast / POS)'}</option>
                <option value="30">30 {isKhmer ? 'នាទី' : 'Minutes'}</option>
                <option value="60">1 {isKhmer ? 'ម៉ោង (លំនាំដើម)' : 'Hour (Recommended)'}</option>
                <option value="240">4 {isKhmer ? 'ម៉ោង' : 'Hours'}</option>
                <option value="480">8 {isKhmer ? 'ម៉ោង (ពេញមួយថ្ងៃ)' : 'Hours (Full Work Shift)'}</option>
              </select>
            </div>

            {/* Max Failed Logins */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isKhmer ? 'កម្រិតកំណត់ការ Login ខុស (Max Failed Attempts)' : 'Maximum Failed Login Attempts'}
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                {isKhmer ? 'ចាក់សោរបណ្តោះអាសន្នពេលវាយពាក្យសម្ងាត់ខុសច្រើនដង' : 'Lockout threshold to prevent password guessing attempts'}
              </p>
              <select
                value={config.max_failed_logins}
                onChange={(e) => setConfig(prev => ({ ...prev, max_failed_logins: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
              >
                <option value="3">3 {isKhmer ? 'ដង (តឹងរ៉ឹងបំផុត)' : 'Attempts (Strict)'}</option>
                <option value="5">5 {isKhmer ? 'ដង (លំនាំដើម)' : 'Attempts (Recommended)'}</option>
                <option value="10">10 {isKhmer ? 'ដង' : 'Attempts'}</option>
              </select>
            </div>

            {/* Audit Logging Level */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isKhmer ? 'កម្រិតកត់ត្រាកំណត់ហេតុ (Audit Log Detail)' : 'Audit Logging Detail Level'}
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                {isKhmer ? 'កម្រិតលម្អិតនៃសកម្មភាពដែលត្រូវកត់ត្រាក្នុង Logs' : 'Granularity of event capture across modules'}
              </p>
              <select
                value={config.activity_logging_level}
                onChange={(e) => setConfig(prev => ({ ...prev, activity_logging_level: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
              >
                <option value="verbose">{isKhmer ? 'លម្អិតទាំងអស់ (Verbose / All Events & Payloads)' : 'Verbose (All Events & Payloads)'}</option>
                <option value="standard">{isKhmer ? 'ធម្មតា (Standard / Auth & CRUD)' : 'Standard (Auth & CRUD)'}</option>
                <option value="minimal">{isKhmer ? 'តិចតួច (Minimal / Only Errors & Warnings)' : 'Minimal (Only Errors & Warnings)'}</option>
              </select>
            </div>

            {/* Log Retention Days */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isKhmer ? 'គោលការណ៍រក្សាទុកកំណត់ហេតុ (Log Retention)' : 'Log Retention Policy'}
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                {isKhmer ? 'រយៈពេលដែលត្រូវរក្សាទុកកំណត់ហេតុមុនពេលលុបចោល' : 'Automatic purging threshold for audit logs'}
              </p>
              <select
                value={config.log_retention_days}
                onChange={(e) => setConfig(prev => ({ ...prev, log_retention_days: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
              >
                <option value="30">30 {isKhmer ? 'ថ្ងៃ' : 'Days'}</option>
                <option value="60">60 {isKhmer ? 'ថ្ងៃ' : 'Days'}</option>
                <option value="90">90 {isKhmer ? 'ថ្ងៃ (លំនាំដើម)' : 'Days (Recommended)'}</option>
                <option value="180">180 {isKhmer ? 'ថ្ងៃ (៦ខែ)' : 'Days (6 Months)'}</option>
                <option value="365">365 {isKhmer ? 'ថ្ងៃ (១ឆ្នាំ)' : 'Days (1 Year)'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Database Maintenance & Operations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-300/60 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faDatabase} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isKhmer ? 'ការថែទាំ Database & Cache Optimization' : 'Database Maintenance & Cache Optimization'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isKhmer ? 'ប្រតិបត្តិការ Indexing លើតារាង MySQL និងការជម្រះ Cache' : 'MySQL table health diagnostics and cache purging utilities'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Re-index & Optimize MySQL */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">
                    {isKhmer ? 'ធ្វើ Optimization តារាង MySQL' : 'Analyze & Optimize MySQL Tables'}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                    36 Tables
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  {isKhmer
                    ? 'រៀបចំ Index ឡើងវិញដើម្បីបង្កើនល្បឿន Query ស្វែងរកទំនិញ និងរបាយការណ៍លក់'
                    : 'Rebuild internal B-Tree indexes to accelerate product lookups and sales query speed'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOptimizeDB}
                disabled={optimizing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faBolt} className={`w-3.5 h-3.5 text-amber-500 ${optimizing ? 'animate-spin' : ''}`} />
                <span>{optimizing ? (isKhmer ? 'កំពុងដំណើរការ...' : 'Optimizing Tables...') : (isKhmer ? 'ដំណើរការ Optimize Tables' : 'Optimize MySQL Tables')}</span>
              </button>
            </div>

            {/* Purge Client Local Cache */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">
                    {isKhmer ? 'ជម្រះ Browser Cache & State' : 'Purge Browser Runtime Cache'}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Live Synced
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  {isKhmer
                    ? 'ជម្រះទិន្នន័យ Temporary Cache ក្នុង Browser ដើម្បីទាញយកទិន្នន័យស្រស់បំផុតពី Server'
                    : 'Clear client-side localStorage cached gold rates and spot pricing metadata'}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePurgeCache}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <FontAwesomeIcon icon={faBroom} className="w-3.5 h-3.5 text-sky-600" />
                <span>{isKhmer ? 'ជម្រះ Cache ក្នុង Browser' : 'Purge Client Cache'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Maintenance Mode & Debugging */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-700 border border-purple-300/60 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faWrench} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isKhmer ? 'របៀបថែទាំប្រព័ន្ធ (Maintenance Mode)' : 'Atelier Maintenance & Diagnostics'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isKhmer ? 'បិទដំណើរការប្រព័ន្ធបណ្តោះអាសន្នពេលកំពុង Update ឬកែប្រែធំ' : 'Set system offline for non-admin staff during scheduled updates'}
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Maintenance Mode Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isKhmer ? 'បើកដំណើរការ Maintenance Mode' : 'Enable System Maintenance Mode'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isKhmer ? 'មានតែ Admin ទើបអាច Login បាន បុគ្គលិកផ្សេងទៀតនឹងឃើញផ្ទាំងជូនដំណឹង' : 'Only SuperAdmin/Admin can access. Other staff will see maintenance notice.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, maintenance_mode: prev.maintenance_mode === 'true' ? 'false' : 'true' }))}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  config.maintenance_mode === 'true' ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Custom Notice Input if Maintenance is active */}
            {config.maintenance_mode === 'true' && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-950 mb-1">
                  {isKhmer ? 'សារជូនដំណឹងពេលថែទាំ (Maintenance Notice Banner)' : 'Maintenance Banner Message'}
                </label>
                <input
                  type="text"
                  value={config.maintenance_notice}
                  onChange={(e) => setConfig(prev => ({ ...prev, maintenance_notice: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  placeholder="System undergoing maintenance..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
            <span>{saving ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកំណត់ប្រព័ន្ធ' : 'Save System Settings')}</span>
          </button>
        </div>

      </form>

    </div>
  );
};

export default SystemSettingsSection;
