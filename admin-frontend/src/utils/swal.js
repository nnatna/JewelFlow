import Swal from 'sweetalert2';

/**
 * JewelFlow Luxury Atelier Custom SweetAlert2 Mixin
 */
const LuxurySwal = Swal.mixin({
  customClass: {
    popup: 'jewelflow-swal-popup',
    title: 'jewelflow-swal-title',
    htmlContainer: 'jewelflow-swal-content',
    confirmButton: 'jewelflow-swal-confirm',
    cancelButton: 'jewelflow-swal-cancel',
    denyButton: 'jewelflow-swal-deny',
    actions: 'jewelflow-swal-actions',
    icon: 'jewelflow-swal-icon'
  },
  buttonsStyling: false,
  reverseButtons: false
});

/**
 * Top-end Toast notification mixin
 */
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  backdrop: false,
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    container: 'jewelflow-swal-toast-container',
    popup: 'jewelflow-swal-toast',
    title: 'jewelflow-swal-toast-title'
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

/**
 * Show a quick toast notification
 * @param {string} title - Title or message
 * @param {'success'|'error'|'warning'|'info'|'question'} icon - SweetAlert2 icon
 * @param {object} [options] - Additional SweetAlert2 options
 */
export const showToast = (title, icon = 'success', options = {}) => {
  return Toast.fire({
    icon,
    title,
    ...options
  });
};

/**
 * Show an elegant confirmation dialog
 * @param {object} params
 * @param {string} params.title - Dialog title
 * @param {string} [params.text] - Dialog text
 * @param {string} [params.html] - HTML content
 * @param {string} [params.confirmButtonText] - Confirmation button label
 * @param {string} [params.cancelButtonText] - Cancel button label
 * @param {'warning'|'question'|'info'|'error'} [params.icon] - Icon
 * @param {boolean} [params.isDanger] - If true, style confirm button with red/danger colors
 * @param {object} [params.options] - Extra SweetAlert options
 * @returns {Promise<boolean>} True if confirmed, false otherwise
 */
export const confirmDialog = async ({
  title = 'Are you sure?',
  text = '',
  html,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  icon = 'warning',
  isDanger = false,
  ...options
} = {}) => {
  const isDestructive = isDanger || (
    Boolean(title && /(delete|remove|discard|void|clear|លុប|សម្អាត)/i.test(title)) ||
    Boolean(confirmButtonText && /(delete|remove|discard|void|clear|លុប|សម្អាត)/i.test(confirmButtonText))
  );

  const customConfirmClass = isDestructive 
    ? 'jewelflow-swal-confirm jewelflow-swal-danger'
    : 'jewelflow-swal-confirm';

  const result = await LuxurySwal.fire({
    title,
    text: html ? undefined : text,
    html: html || undefined,
    icon: icon || (isDestructive ? 'warning' : 'question'),
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: false,
    customClass: {
      popup: 'jewelflow-swal-popup',
      title: 'jewelflow-swal-title',
      htmlContainer: 'jewelflow-swal-content',
      confirmButton: customConfirmClass,
      cancelButton: 'jewelflow-swal-cancel',
      actions: 'jewelflow-swal-actions',
      icon: 'jewelflow-swal-icon'
    },
    ...options
  });

  return Boolean(result.isConfirmed);
};

/**
 * Show a success modal
 */
export const showSuccess = (title, text = '', options = {}) => {
  return LuxurySwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: options.confirmButtonText || 'OK',
    ...options
  });
};

/**
 * Show an error modal
 */
export const showError = (title, text = '', options = {}) => {
  return LuxurySwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: options.confirmButtonText || 'Close',
    ...options
  });
};

/**
 * Show a warning modal
 */
export const showWarning = (title, text = '', options = {}) => {
  return LuxurySwal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: options.confirmButtonText || 'Understand',
    ...options
  });
};

/**
 * Show an info modal
 */
export const showInfo = (title, text = '', options = {}) => {
  return LuxurySwal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: options.confirmButtonText || 'OK',
    ...options
  });
};

/**
 * Show a luxury gold-themed modal for Atelier valuation / high-value operations
 */
export const showGoldAlert = (title, html = '', options = {}) => {
  return LuxurySwal.fire({
    title: `<span class="text-amber-900 font-serif tracking-wide">${title}</span>`,
    html,
    iconHtml: '<i class="fa-solid fa-gem text-amber-500"></i>',
    showConfirmButton: true,
    confirmButtonText: options.confirmButtonText || 'Proceed',
    customClass: {
      popup: 'jewelflow-swal-popup jewelflow-swal-gold-card',
      title: 'jewelflow-swal-title',
      htmlContainer: 'jewelflow-swal-content',
      confirmButton: 'jewelflow-swal-confirm',
      cancelButton: 'jewelflow-swal-cancel',
      actions: 'jewelflow-swal-actions',
      icon: 'jewelflow-swal-gold-icon'
    },
    ...options
  });
};

export const swal = {
  raw: Swal,
  luxury: LuxurySwal,
  toast: showToast,
  confirm: confirmDialog,
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  gold: showGoldAlert
};

export { Swal };
export default swal;
