import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGem,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faCircleExclamation,
  faShieldHalved,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';

export const LoginView = () => {
  const { t, i18n } = useTranslation();
  const { login, showToast, settings } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  // Credentials input state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Language switcher
  const handleLanguageChange = (lang) => {
    const norm = lang === 'en' ? 'en' : 'km';
    if (typeof window !== 'undefined') {
      localStorage.setItem('jewelflow_lang_user_choice', norm);
      localStorage.setItem('i18nextLng', norm);
    }
    i18n.changeLanguage(norm);
  };

  // Submit Login
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = isKhmer ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល' : 'Please enter your email address';
    }
    if (!password) {
      newErrors.password = isKhmer ? 'សូមបញ្ចូលពាក្យសម្ងាត់' : 'Please enter your password';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      showToast(
        isKhmer
          ? `សូមស្វាគមន៍មកកាន់ JewelFlow, ${res.user?.name || ''}!`
          : `Welcome back to JewelFlow, ${res.user?.name || ''}!`,
        'success'
      );
    } catch (err) {
      console.error('Login error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        (isKhmer ? 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ!' : 'Invalid email or password.');
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none font-sans overflow-y-auto bg-[#fafafa]">

      {/* ── Background Soft Blurred Blue & Orange Mesh Auras on White ──── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Top-left soft warm orange / amber blur */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-gradient-to-br from-orange-300/45 via-amber-200/35 to-orange-100/20 rounded-full blur-[110px]" />

        {/* Top-right soft sky / sapphire blue blur */}
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-gradient-to-bl from-blue-300/40 via-sky-200/35 to-indigo-100/20 rounded-full blur-[110px]" />

        {/* Bottom-left delicate blue-teal blur */}
        <div className="absolute -bottom-36 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-sky-200/40 via-blue-200/30 to-indigo-100/20 rounded-full blur-[110px]" />

        {/* Bottom-right glowing vibrant peach / orange blur */}
        <div className="absolute -bottom-36 -right-32 w-[520px] h-[520px] bg-gradient-to-tl from-orange-300/45 via-amber-200/35 to-yellow-100/20 rounded-full blur-[110px]" />

        {/* Center delicate warm glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-100/30 via-orange-100/35 to-amber-100/30 rounded-full blur-[130px]" />
      </div>

      {/* ── Jewelry Modal Card (Clean Luxury Design) ───────────────────── */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-300/50 overflow-hidden my-auto flex flex-col transition-all duration-300 animate-fadeIn ring-1 ring-slate-100">

        {/* ── Modal Header: Brand, Gem Logo & Language Pill ─────────── */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-orange-50/40 via-amber-50/20 to-white border-b border-slate-100 relative">

          {/* Interactive Language Switcher (EN / KM) - System Style */}
          <button
            type="button"
            onClick={() => handleLanguageChange(isKhmer ? 'en' : 'km')}
            className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs ${isKhmer
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            title={isKhmer ? 'Switch to English' : 'Switch to Khmer'}
          >
            <FontAwesomeIcon icon={faGlobe} className="w-3.5 h-3.5 text-amber-600" />
            <span>{isKhmer ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN'}</span>
          </button>

          {/* Jewelry Atelier Emblem & Brand from System */}
          <div className="flex flex-col items-center text-center mt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 ring-4 ring-amber-100/80 mb-3 overflow-hidden">
              {settings?.store_logo ? (
                <img
                  src={settings.store_logo}
                  alt={settings?.store_name || 'System Logo'}
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <FontAwesomeIcon icon={faGem} className="w-6 h-6 animate-pulse text-slate-950" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
                {settings?.store_name ? settings.store_name.split(' ')[0] : 'JewelFlow'}
              </h2>
              <span className="text-[10px] font-sans font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-900 border border-orange-300">
                ATELIER
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium mt-1">
              {isKhmer
                ? 'ប្រព័ន្ធគ្រប់គ្រងហាងមាស & គ្រឿងអលង្ការ'
                : (settings?.store_name || 'Luxury Jewelry ERP & Atelier Suite')}
            </p>
          </div>

        </div>

        {/* ── Modal Form Body ────────────────────────────────────────── */}
        <div className="p-6 sm:p-7 space-y-4 text-xs">

          <div className="text-center mb-1">
            <h3 className="text-sm font-bold text-slate-800">
              {isKhmer ? 'ចូលប្រើប្រព័ន្ធ' : 'Sign in to your account'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isKhmer
                ? 'សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នក'
                : 'Enter your credentials to access workspace'}
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fadeIn">
              <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form noValidate onSubmit={handleSubmit} className="space-y-4">

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700">
                {isKhmer ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                  }}
                  placeholder="example@gmail.com"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50/90 border text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none transition-all font-mono ${fieldErrors.email
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20'
                    }`}
                />
              </div>
              {fieldErrors.email && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700">
                  {isKhmer ? 'ពាក្យសម្ងាត់' : 'Password'} <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50/90 border text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none transition-all font-mono ${fieldErrors.password
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200/50'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                </button>
              </div>
              {fieldErrors.password && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium animate-fadeIn">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </div>
              )}
            </div>

            {/* Remember Me & Help */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 text-xs">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 accent-amber-500"
                />
                <span>{isKhmer ? 'ចងចាំគណនីខ្ញុំ' : 'Remember me'}</span>
              </label>

              <span className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold cursor-pointer">
                {isKhmer ? 'ជំនួយការចូល?' : 'Need Help?'}
              </span>
            </div>

            {/* System Standard Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isKhmer ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <span>{isKhmer ? 'ចូលប្រព័ន្ធ (Sign In)' : 'Sign In to Atelier'}</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* ── Modal Footer ────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 text-orange-900 font-medium">
            <FontAwesomeIcon icon={faShieldHalved} className="text-orange-600" />
            <span>Sanctum SSL 256-bit</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-600">
            <span>v1.0.0</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LoginView;
