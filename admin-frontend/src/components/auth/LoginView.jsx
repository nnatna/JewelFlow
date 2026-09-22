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
  faGlobe,
  faShieldHalved,
  faStore
} from '@fortawesome/free-solid-svg-icons';

export const LoginView = () => {
  const { t, i18n } = useTranslation();
  const { login, showToast } = useApp();

  const currentLang = (i18n.language || 'km').startsWith('en') ? 'en' : 'km';
  const isKhmer = currentLang === 'km';

  // Manual credentials input state (empty by default)
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-white text-slate-800 select-none relative overflow-hidden font-sans">
      
      {/* ── Background Subtle Warm Gold Ambient Glows ─────────────────────── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-yellow-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-50/70 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Header: Brand Logo & Language Switcher ────────────────────── */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <FontAwesomeIcon icon={faGem} className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold font-serif tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>JewelFlow</span>
                <span className="text-[10px] font-sans font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  ATELIER
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-500 tracking-wider">
              {isKhmer ? 'ប្រព័ន្ធគ្រប់គ្រងហាងមាស & គ្រឿងអលង្ការ' : 'Luxury Jewelry ERP & Atelier Suite'}
            </p>
          </div>
        </div>

        {/* Language Pill Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => handleLanguageChange('km')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentLang === 'km'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🇰🇭</span>
            <span>ភាសាខ្មែរ</span>
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentLang === 'en'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🇺🇸</span>
            <span>English</span>
          </button>
        </div>
      </header>

      {/* ── Main Form Area: Centered Elegant White Card ───────────────────── */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center flex-1">
        
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-9 relative overflow-hidden">
          
          {/* Top Gold Accent Border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

          {/* Logo & Card Header */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/25 mx-auto mb-3.5">
              <FontAwesomeIcon icon={faLock} className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
              {isKhmer ? 'ចូលប្រើប្រព័ន្ធ JewelFlow' : 'Sign in to JewelFlow'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isKhmer
                ? 'សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់គណនីរបស់អ្នក'
                : 'Please enter your account email and password'}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fadeIn">
              <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Login Credentials Form */}
          <form noValidate onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700">
                {isKhmer ? 'អាសយដ្ឋានអ៊ីមែល (Email)' : 'Email Address'} <span className="text-rose-500">*</span>
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
                  placeholder="name@jewelflow.com"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50/70 border text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none transition-all font-mono ${
                    fieldErrors.email
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

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700">
                  {isKhmer ? 'ពាក្យសម្ងាត់ (Password)' : 'Password'} <span className="text-rose-500">*</span>
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
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50/70 border text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none transition-all font-mono ${
                    fieldErrors.password
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 text-xs">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span>{isKhmer ? 'ចងចាំគណនីខ្ញុំ' : 'Remember me'}</span>
              </label>

              <span className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold cursor-pointer">
                {isKhmer ? 'ជំនួយការចូល?' : 'Need Help?'}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{isKhmer ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Signing In...'}</span>
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

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-slate-100 bg-white/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div>
          © 2026 JewelFlow Atelier ERP. {isKhmer ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង។' : 'All rights reserved.'}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-amber-800 font-mono font-bold">v2.4 Enterprise</span>
          <span>•</span>
          <span>Spatie RBAC & Sanctum Secured</span>
        </div>
      </footer>

    </div>
  );
};

export default LoginView;
