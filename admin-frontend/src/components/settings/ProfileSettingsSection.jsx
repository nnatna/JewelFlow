import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faLock,
  faKey,
  faShieldHalved,
  faFloppyDisk,
  faRotateLeft,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faCrown,
  faCircleExclamation,
  faFingerprint,
  faIdBadge,
  faCamera,
  faCloudArrowUp,
  faTrashCan,
  faImage
} from '@fortawesome/free-solid-svg-icons';

export const ProfileSettingsSection = () => {
  const { i18n } = useTranslation();
  const { currentUser, updateProfile, showToast, confirmDialog } = useApp();

  const isKhmer = (i18n.language || 'km').startsWith('km');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photo: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync initial user data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        photo: currentUser.photo || '',
        password: '',
        confirm_password: '',
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(
          isKhmer ? 'ទំហំរូបភាពមិនអាចលើសពី 5MB ឡើយ!' : 'Image file size cannot exceed 5MB!',
          'warning'
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: '' }));
  };

  const handleReset = () => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        photo: currentUser.photo || '',
        password: '',
        confirm_password: '',
      });
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះពេញ!' : 'Full name is required!';
    }
    if (!formData.email.trim()) {
      newErrors.email = isKhmer ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល!' : 'Email is required!';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = isKhmer ? 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ!' : 'Invalid email format!';
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = isKhmer
          ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ!'
          : 'Password must be at least 6 characters!';
      }
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = isKhmer
          ? 'ការបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នា!'
          : 'Password confirmation does not match!';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(
        isKhmer ? 'សូមត្រួតពិនិត្យទិន្នន័យដែលបានបញ្ចូល!' : 'Please check required fields!',
        'warning'
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        photo: formData.photo || null,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      await updateProfile(payload);
      setFormData((prev) => ({ ...prev, password: '', confirm_password: '' }));
      showToast(
        isKhmer
          ? 'ព័ត៌មានគណនី និងរូបភាពផ្ទាល់ខ្លួនត្រូវបានកែប្រែជោគជ័យ!'
          : 'Profile information & photo updated successfully!',
        'success'
      );
    } catch (err) {
      console.error('Failed to update profile:', err);
      const serverMsg = err.response?.data?.message;
      showToast(
        serverMsg || (isKhmer ? 'បរាជ័យក្នុងការកែប្រែគណនី' : 'Failed to update profile'),
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (formData.name || currentUser?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isSuperAdmin = currentUser?.role_name === 'super_admin' || currentUser?.email === 'superadmin@jewelflow.com';

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* ── Section Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20 shrink-0 font-serif ring-4 ring-amber-100/70 overflow-hidden">
            {formData.photo ? (
              <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {isKhmer ? 'គណនីផ្ទាល់ខ្លួន & សុវត្ថិភាព' : 'My Profile & Security'}
              </h2>
              {isSuperAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  <FontAwesomeIcon icon={faCrown} className="text-amber-600 text-xs" />
                  <span>Super Admin</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKhmer
                ? 'គ្រប់គ្រងរូបភាព ព័ត៌មានផ្ទាល់ខ្លួន អ៊ីមែល លេខទូរស័ព្ទ និងផ្លាស់ប្តូរពាក្យសម្ងាត់សុវត្ថិភាព'
                : 'Manage profile photo, personal details, contact info and account password'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600" />
            <span>{isKhmer ? 'គណនីកំពុងដំណើរការ' : 'Active Staff Session'}</span>
          </span>
        </div>
      </div>

      {/* ── Form Section ── */}
      <form noValidate onSubmit={handleSubmit} className="space-y-6">

        {/* ── 0. Profile Photo Upload Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <FontAwesomeIcon icon={faCamera} className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  {isKhmer ? 'រូបភាពគណនីផ្ទាល់ខ្លួន' : 'Profile Photo'}
                </h3>
                <p className="text-xs text-slate-400 font-normal">
                  {isKhmer ? 'រូបភាពនេះនឹងបង្ហាញនៅលើរបារខាងលើ (Navbar) និងបញ្ជីអ្នកប្រើប្រាស់' : 'This photo is displayed on the top navigation bar and user cards'}
                </p>
              </div>
            </div>

            {formData.photo && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50"
              >
                <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'លុបរូបភាព' : 'Remove Photo'}</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* Avatar Preview */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-md shadow-amber-500/20 font-serif ring-4 ring-amber-100 overflow-hidden">
                {formData.photo ? (
                  <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <label className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-2xs gap-1 text-[11px] font-semibold">
                <FontAwesomeIcon icon={faCamera} className="w-4 h-4 text-amber-400" />
                <span>{isKhmer ? 'ប្តូររូប' : 'Change'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            {/* Upload Controls and Description */}
            <div className="space-y-3 text-left">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isKhmer ? 'ជ្រើសរើសរូបថតផ្ទាល់ខ្លួនថ្មី' : 'Upload a new avatar'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isKhmer
                    ? 'គាំទ្រឯកសារទម្រង់ JPG, PNG, WEBP ឬ GIF (ទំហំអតិបរមា 5MB)'
                    : 'Supports JPG, PNG, WEBP or GIF formats (Max 5MB)'}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-950 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                  <FontAwesomeIcon icon={faCloudArrowUp} className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {formData.photo
                      ? (isKhmer ? 'ជ្រើសរូបភាពផ្សេង' : 'Choose Different Photo')
                      : (isKhmer ? 'ជ្រើសរើសរូបភាព...' : 'Browse Photo...')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>

                {formData.photo && (
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-emerald-600" />
                    <span>{isKhmer ? 'រូបភាពរួចរាល់' : 'Photo ready'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* ── 1. General Profile Info Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <FontAwesomeIcon icon={faIdBadge} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                {isKhmer ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Identity & Details'}
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                {isKhmer ? 'ឈ្មោះ និងព័ត៌មានទំនាក់ទំនងសម្រាប់បង្ហាញក្នុងប្រព័ន្ធ' : 'Your name and contact info displayed across sales & reports'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {isKhmer ? 'ឈ្មោះពេញ *' : 'Full Name *'}
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faUser}
                  className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Master Jeweler Sok"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                    errors.name
                      ? 'border-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 bg-slate-50 focus:bg-white'
                  }`}
                />
              </div>
              {errors.name && (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3 text-rose-500" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {isKhmer ? 'អាសយដ្ឋានអ៊ីមែល *' : 'Email Address *'}
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. staff@jewelflow.com"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-900 focus:outline-none transition-all font-mono ${
                    errors.email
                      ? 'border-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 bg-slate-50 focus:bg-white'
                  }`}
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3 text-rose-500" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {isKhmer ? 'លេខទូរស័ព្ទ' : 'Contact Phone Number'}
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+855 (0) 12 345 678"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 text-xs font-semibold text-slate-900 focus:outline-none bg-slate-50 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Assigned Role (Read-only) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {isKhmer ? 'តួនាទីក្នុងប្រព័ន្ធ' : 'Assigned System Role'}
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faShieldHalved}
                  className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none"
                />
                <input
                  type="text"
                  readOnly
                  disabled
                  value={currentUser?.role_display || (isKhmer ? 'បុគ្គលិកហាង' : 'Staff Member')}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {isKhmer
                  ? 'តួនាទីត្រូវបានកំណត់ដោយថ្នាក់គ្រប់គ្រងប្រព័ន្ធ (Super Administrator)'
                  : 'Role privileges are managed by system administrators'}
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. Password & Security Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <FontAwesomeIcon icon={faLock} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                {isKhmer ? 'សុវត្ថិភាព & ពាក្យសម្ងាត់' : 'Account Security & Password'}
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                {isKhmer
                  ? 'ទុកចោលទទេប្រសិនបើអ្នកមិនចង់ផ្លាស់ប្តូរពាក្យសម្ងាត់'
                  : 'Leave blank if you do not wish to change your current password'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* New Password */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {isKhmer ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faKey}
                  className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isKhmer ? 'បញ្ចូលពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៦ តួ)' : 'Enter new password (min. 6 chars)'}
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                    errors.password
                      ? 'border-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 bg-slate-50 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3 text-rose-500" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {isKhmer ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faKey}
                  className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder={isKhmer ? 'វាយបញ្ចូលពាក្យសម្ងាត់ម្តងទៀត' : 'Re-type new password'}
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                    errors.confirm_password
                      ? 'border-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 bg-slate-50 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                >
                  <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                </button>
              </div>
              {errors.confirm_password && (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3 text-rose-500" />
                  <span>{errors.confirm_password}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Form Actions Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <FontAwesomeIcon icon={faFingerprint} className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isKhmer
                ? 'ការកែប្រែនឹងត្រូវធ្វើសមកាលកម្មជាមួយម៉ាស៊ីនបម្រើ Laravel ភ្លាមៗ'
                : 'Account changes sync immediately across your session and central server'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-2xs inline-flex items-center gap-2 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3 text-slate-500" />
              <span>{isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
              <span>
                {isSaving
                  ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving Changes...')
                  : (isKhmer ? 'រក្សាទុកព័ត៌មានគណនី' : 'Save Profile Changes')}
              </span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default ProfileSettingsSection;
