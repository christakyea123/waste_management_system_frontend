// =============================================
// API Client - Cookie-based auth (httpOnly)
// All requests include credentials: 'include' so the browser
// automatically attaches the httpOnly 'token' cookie.
// The JS layer never sees or stores the raw JWT.
// =============================================

const API_BASE = '/api/v1';

class ApiClient {
  get headers() {
    return { 'Content-Type': 'application/json' };
  }

  async request(method, path, data = null, isFormData = false) {
    const options = {
      method,
      credentials: 'include', // sends httpOnly cookie automatically
    };

    if (isFormData) {
      options.headers = {}; // browser sets multipart Content-Type + boundary
      options.body = data;
    } else {
      options.headers = this.headers;
      if (data) options.body = JSON.stringify(data);
    }

    try {
      const res = await fetch(`${API_BASE}${path}`, options);
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        // Session expired or invalid — clear local state and go to login.
        // We show a brief toast first so the user understands why they're being redirected.
        const role = localStorage.getItem('wm_role');
        const target = role === 'driver' ? '/driver/login.html' : '/customer/login.html';
        window.clearAuthState();
        if (typeof Toast !== 'undefined' && Toast.warning) {
          Toast.warning('Session expired', 'Please sign in again.');
          setTimeout(() => { window.location.href = target; }, 1200);
        } else {
          window.location.href = target;
        }
        return null;
      }

      if (!res.ok) {
        const message = json.message || `Request failed (${res.status})`;
        throw new ApiError(message, res.status, json.errors);
      }

      return json;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(`Network error: ${error.message}`, 0);
    }
  }

  get(path)                 { return this.request('GET',    path); }
  post(path, data)          { return this.request('POST',   path, data); }
  put(path, data)           { return this.request('PUT',    path, data); }
  delete(path)              { return this.request('DELETE', path); }
  postForm(path, formData)  { return this.request('POST',   path, formData, true); }
  putForm(path, formData)   { return this.request('PUT',    path, formData, true); }

  // Auth
  login(email, password)  { return this.post('/auth/login', { email, password }); }
  logout()                { return this.post('/auth/logout'); }
  getMe()                 { return this.get('/auth/me'); }
  updateProfile(data)     {
    return data instanceof FormData
      ? this.putForm('/auth/update-profile', data)
      : this.put('/auth/update-profile', data);
  }
  updatePassword(data)    { return this.put('/auth/update-password', data); }
  register(formData)      { return this.postForm('/auth/register', formData); }
  forgotPassword(phone)   { return this.post('/auth/forgot-password', { phone }); }
  resetPassword(data)     { return this.post('/auth/reset-password', data); }
  getPublicRoutes()       { return this.get('/auth/routes'); }
  getPublicPricing()      { return this.get('/auth/pricing'); }

  // Admin
  getDashboard()                          { return this.get('/admin/dashboard'); }
  getOutstanding(params = '')             { return this.get(`/admin/outstanding${params}`); }
  getLiveSchedule(params = '')            { return this.get(`/admin/live-schedule${params}`); }
  runAutoSchedule()                       { return this.post('/admin/auto-schedule/run'); }
  getCustomers(params = '')               { return this.get(`/admin/customers${params}`); }
  getCustomer(id)                         { return this.get(`/admin/customers/${id}`); }
  updateCustomer(id, data)                { return this.put(`/admin/customers/${id}`, data); }
  deleteCustomer(id)                      { return this.delete(`/admin/customers/${id}`); }
  createDriver(formData)                  { return this.postForm('/admin/drivers', formData); }
  getDrivers(params = '')                 { return this.get(`/admin/drivers${params}`); }
  getDriver(id)                           { return this.get(`/admin/drivers/${id}`); }
  updateDriver(id, data)                  { return this.put(`/admin/drivers/${id}`, data); }
  deleteDriver(id)                        { return this.delete(`/admin/drivers/${id}`); }
  assignCustomers(driverId, customerIds)  { return this.post(`/admin/drivers/${driverId}/assign`, { customerIds }); }
  sendBulkSms(data)                       { return this.post('/admin/notifications/bulk-sms', data); }
  getRevenueAnalytics(year)               { return this.get(`/admin/analytics/revenue${year ? `?year=${year}` : ''}`); }
  getCollectionAnalytics(month, year)     { return this.get(`/admin/analytics/collections?month=${month}&year=${year}`); }
  getAdminInvoices(params = '')           { return this.get(`/admin/invoices${params}`); }
  generateInvoices(month, year)           { return this.post('/admin/invoices/generate', { month, year }); }
  sendAllReminders()                      { return this.post('/admin/invoices/send-reminders'); }
  sendInvoiceReminder(id)                 { return this.post(`/admin/invoices/${id}/remind`); }
  getActivityLogs(params = '')            { return this.get(`/admin/activity-logs${params}`); }
  getAdminPayments(params = '')           { return this.get(`/payments${params}`); }
  getAdminCollections(params = '')        { return this.get(`/collections${params}`); }
  getAdminDrivers(params = '')            { return this.get(`/admin/drivers${params}`); }
  getAdminComplaints(params = '')         { return this.get(`/admin/complaints${params}`); }
  updateAdminComplaint(id, data)          { return this.put(`/admin/complaints/${id}`, data); }
  getRoutes(params = '')                  { return this.get(`/admin/routes${params}`); }
  createRoute(data)                       { return this.post('/admin/routes', data); }
  updateRoute(id, data)                   { return this.put(`/admin/routes/${id}`, data); }
  deleteRoute(id)                         { return this.delete(`/admin/routes/${id}`); }
  getPricing()                            { return this.get('/admin/settings/pricing'); }
  updatePricing(data)                     { return this.put('/admin/settings/pricing', data); }

  // Customer
  getCustomerDashboard()              { return this.get('/customer/dashboard'); }
  getMyCollections(params = '')       { return this.get(`/customer/collections${params}`); }
  getMyInvoices(params = '')          { return this.get(`/customer/invoices${params}`); }
  getMyPayments(params = '')          { return this.get(`/customer/payments${params}`); }
  getMyNotifications(params = '')     { return this.get(`/customer/notifications${params}`); }
  markNotificationRead(id)            { return this.put(`/customer/notifications/${id}/read`); }
  submitComplaint(data)               { return this.post('/customer/complaints', data); }
  getMyComplaints()                   { return this.get('/customer/complaints'); }
  updateLocation(data)                { return this.put('/customer/location', data); }

  // Driver
  getDriverDashboard()                    { return this.get('/driver/dashboard'); }
  getDriverCustomers(params = '')         { return this.get(`/driver/customers${params}`); }
  getDriverCollections(params = '')       { return this.get(`/driver/collections${params}`); }
  getDriverCollectionsSummary(params = '') { return this.get(`/driver/collections/summary${params}`); }
  updateCollectionStatus(id, formData)    { return this.putForm(`/driver/collections/${id}`, formData); }
  updateDriverLocation(data)              { return this.put('/driver/location', data); }

  // Payments
  initializePayment(invoiceId)  { return this.post('/payments/initialize', { invoiceId }); }
  verifyPayment(reference)      { return this.get(`/payments/verify/${reference}`); }
  downloadInvoicePdf(id) {
    // Use credentials: 'include' so the httpOnly cookie is sent — no Authorization header needed
    return fetch(`${API_BASE}/payments/invoice/${id}/pdf`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('PDF download failed');
        return r.blob();
      });
  }

  // Collections (Admin)
  getCollections(params = '')     { return this.get(`/collections${params}`); }
  createCollection(data)          { return this.post('/collections', data); }
  bulkCreateCollections(data)     { return this.post('/collections/bulk', data); }
  bulkScheduleCollections(data)   { return this.bulkCreateCollections(data); }
}

class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const api = new ApiClient();

// ── Auth state helpers ──────────────────────────────────────────
// We store only non-sensitive user data (name, role, email) in localStorage.
// The actual JWT lives exclusively in an httpOnly cookie managed by the server.

const saveAuthState = (data) => {
  localStorage.setItem('wm_user', JSON.stringify(data.user));
  localStorage.setItem('wm_role', data.user.role);
  // Record local expiry aligned with JWT_COOKIE_EXPIRE (default 7 days)
  // so requireAuth can detect stale sessions without an extra network call.
  const expiryDays = 7;
  localStorage.setItem('wm_auth_expiry', (Date.now() + expiryDays * 86400_000).toString());
};

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem('wm_user')); }
  catch { return null; }
};

window.clearAuthState = () => {
  localStorage.removeItem('wm_user');
  localStorage.removeItem('wm_role');
  localStorage.removeItem('wm_auth_expiry');
};

// Role hierarchy: superadmin inherits all admin (and lower) permissions
const ROLE_LEVELS = { customer: 0, driver: 1, admin: 2, superadmin: 3 };

const requireAuth = (allowedRoles = []) => {
  const user   = getAuthUser();
  const expiry = localStorage.getItem('wm_auth_expiry');

  const loginPath = (role) => {
    if (role === 'driver') return '/driver/login.html';
    return '/customer/login.html';
  };

  // No user data or session marker expired → force login
  if (!user || (expiry && Date.now() > parseInt(expiry, 10))) {
    window.clearAuthState();
    window.location.href = loginPath(localStorage.getItem('wm_role') || 'customer');
    return null;
  }

  // Role check using hierarchy: user passes if their level >= minimum required level
  if (allowedRoles.length) {
    const minLevel  = Math.min(...allowedRoles.map(r => ROLE_LEVELS[r] ?? Infinity));
    const userLevel = ROLE_LEVELS[user.role] ?? -1;
    if (userLevel < minLevel) {
      window.location.href = loginPath(user.role);
      return null;
    }
  }

  return user;
};
