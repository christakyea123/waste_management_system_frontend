// =============================================
// Utility Functions - Shared across dashboards
// =============================================

// Toast notification system
const Toast = (() => {
  let container = null;

  const getContainer = () => {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  };

  const icons = {
    success: 'fa-check-circle',
    error:   'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info:    'fa-info-circle',
  };

  const show = (type, title, message, duration = 4000) => {
    const c = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type]} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss" onclick="this.closest('.toast').remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    c.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });
    const timer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, duration);
    toast.querySelector('.toast-close').addEventListener('click', () => clearTimeout(timer));
  };

  return {
    success: (title, msg) => show('success', title, msg),
    error:   (title, msg) => show('error',   title, msg),
    warning: (title, msg) => show('warning', title, msg),
    info:    (title, msg) => show('info',    title, msg),
  };
})();

// Format currency (GHS)
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);

// Format date
const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-GH', {
    year: 'numeric', month: 'short', day: 'numeric', ...options,
  }).format(new Date(date));
};

// Format date + time
const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-GH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
};

// Time ago
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(date);
};

// Status badge HTML
const statusBadge = (status) => {
  const map = {
    active: 'badge-success', paid: 'badge-success', picked: 'badge-success', success: 'badge-success',
    pending: 'badge-warning', scheduled: 'badge-warning', on_route: 'badge-warning',
    overdue: 'badge-danger',  missed: 'badge-danger',  suspended: 'badge-danger', failed: 'badge-danger',
    rescheduled: 'badge-orange', available: 'badge-info', cancelled: 'badge-secondary',
    blocked_access: 'badge-danger', open: 'badge-warning', in_review: 'badge-info',
    resolved: 'badge-success', closed: 'badge-secondary',
  };
  const cls   = map[status] || 'badge-secondary';
  const label = status?.replace(/_/g, ' ') || 'unknown';
  return `<span class="badge ${cls}">${label}</span>`;
};

// Get user initials
const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

// Create avatar HTML
const avatarHtml = (user, size = 'md') => {
  const px = size === 'sm' ? '30px' : size === 'lg' ? '56px' : '40px';
  const style = `width:${px};height:${px};border-radius:50%;object-fit:cover;`;
  if (user?.profileImage) {
    return `<img src="${user.profileImage}" class="avatar avatar-${size}" alt="${user.fullName}" style="${style}">`;
  }
  return `<div class="avatar avatar-${size}">${getInitials(user?.fullName)}</div>`;
};

// Pagination renderer
const renderPagination = (pagination, onPageChange) => {
  const { page, pages, total } = pagination;
  const container = document.createElement('div');
  container.className = 'flex items-center justify-between mt-2';
  container.innerHTML = `
    <span class="text-sm text-muted">Page ${page} of ${pages} (${total} total)</span>
    <div class="pagination" id="paginationBtns"></div>
  `;
  const div = container.querySelector('#paginationBtns');

  const addBtn = (label, pageNum, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.className = `pagination-btn${active ? ' active' : ''}`;
    btn.innerHTML = label;
    btn.disabled  = disabled;
    btn.addEventListener('click', () => onPageChange(pageNum));
    div.appendChild(btn);
  };

  addBtn('<i class="fas fa-chevron-left"></i>', page - 1, page <= 1);
  const start = Math.max(1, page - 2);
  const end   = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) addBtn(i, i, false, i === page);
  addBtn('<i class="fas fa-chevron-right"></i>', page + 1, page >= pages);

  return container;
};

// Skeleton loader rows
const skeletonRows = (count = 5, cols = 5) =>
  Array(count).fill('').map(() =>
    `<tr>${Array(cols).fill('').map(() =>
      `<td><div class="skeleton" style="height:16px;width:80%;border-radius:4px;"></div></td>`
    ).join('')}</tr>`
  ).join('');

// Download blob as file
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Set button loading state
const setButtonLoading = (btn, loading, loadingText = 'Loading...') => {
  if (loading) {
    btn._originalHTML = btn.innerHTML;
    btn.innerHTML     = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    btn.disabled      = true;
  } else {
    btn.innerHTML = btn._originalHTML || btn.innerHTML;
    btn.disabled  = false;
  }
};

// Modal open/close
const openModal  = (id) => document.getElementById(id)?.classList.add('open');
const closeModal = (id) => document.getElementById(id)?.classList.remove('open');

// Month names
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Get query param
const getQueryParam = (key) => new URLSearchParams(window.location.search).get(key);

// Convenience wrapper
const showToast = (message, type = 'info') => (Toast[type] || Toast.info)(message);

// ── Sidebar toggle (mobile) ───────────────────────────────────────
const initSidebar = () => {
  const toggle  = document.querySelector('.sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  // Re-use an existing overlay or create one
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  // Track state explicitly — avoids relying on classList queries mid-transition
  let sidebarOpen = false;

  const openSidebar = () => {
    sidebarOpen = true;
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    sidebarOpen = false;
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    if (sidebarOpen) closeSidebar(); else openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);

  // Close sidebar on nav link click (navigating away)
  sidebar.querySelectorAll('.nav-item').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  // Reset on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeSidebar();
  }, { passive: true });
};

// ── Dark-mode toggle ──────────────────────────────────────────────
const initTheme = () => {
  const saved = localStorage.getItem('wm_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('wm_theme', next);
    });
  });
};

// ── Populate sidebar user card ────────────────────────────────────
const populateSidebarUser = (user) => {
  const nameEl   = document.querySelector('.user-name');
  const roleEl   = document.querySelector('.user-role');
  const avatarEl = document.querySelector('.user-avatar');
  if (nameEl)   nameEl.textContent = user.fullName;
  if (roleEl)   roleEl.textContent = user.role;
  if (avatarEl) {
    if (user.profileImage) {
      avatarEl.innerHTML = `<img src="${user.profileImage}" alt="${user.fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      avatarEl.textContent = getInitials(user.fullName);
    }
  }
};

// ── Logout ────────────────────────────────────────────────────────
// Defined on window so onclick="doLogout()" resolves from inline handlers.
window.doLogout = function doLogout() {
  // Visually disable every logout button to prevent double-click
  document.querySelectorAll('.logout-btn, [onclick="doLogout()"]').forEach((el) => {
    el.disabled = true;
    if (el.tagName === 'BUTTON') el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  });

  const role      = localStorage.getItem('wm_role');
  let loginPath = '/customer/login.html';
  if (role === 'driver') loginPath = '/driver/login.html';

  window.clearAuthState();                    // wipe local session marker immediately
  api.logout().catch(() => {});        // fire-and-forget — server clears cookie
  window.location.href = loginPath;   // redirect; browser will delete cookie on server response
};

// Alias on window in case any page still uses onclick="handleLogout()"
window.handleLogout = window.doLogout;
