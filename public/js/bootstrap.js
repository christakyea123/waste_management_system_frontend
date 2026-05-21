// ============================================================
// Bootstrap script — runs FIRST on every dashboard page.
// No dependencies. Pure DOM + localStorage. Can't fail.
//
// Job: paint the sidebar user info from localStorage immediately
// so the user is always shown as their real account, even if
// api.js / utils.js fail to load or a later script throws.
// ============================================================

(function () {
  'use strict';

  function getStoredUser() {
    try {
      const raw = localStorage.getItem('wm_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function initials(name) {
    return (name || '?')
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function prettyRole(role) {
    if (!role) return '';
    const map = {
      superadmin: 'Super Admin',
      admin: 'Administrator',
      driver: 'Driver',
      customer: 'Customer',
    };
    return map[role] || role.charAt(0).toUpperCase() + role.slice(1);
  }

  function paintSidebar() {
    const user = getStoredUser();
    if (!user) return;

    const nameEl   = document.querySelector('.user-name');
    const roleEl   = document.querySelector('.user-role');
    const avatarEl = document.querySelector('.user-avatar');

    if (nameEl) nameEl.textContent = user.fullName || 'User';
    if (roleEl) roleEl.textContent = prettyRole(user.role);
    if (avatarEl) {
      if (user.profileImage) {
        avatarEl.innerHTML =
          '<img src="' + user.profileImage + '" alt="" ' +
          'style="width:100%;height:100%;object-fit:cover;border-radius:50%" />';
      } else {
        avatarEl.textContent = initials(user.fullName);
      }
    }
  }

  // Run as soon as the DOM is parsed enough for the sidebar to exist.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paintSidebar);
  } else {
    paintSidebar();
  }

  // Expose for pages that want to re-paint after a profile update.
  window.repaintSidebar = paintSidebar;
})();
