// Landing page interactions

// Navbar scroll behavior
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

// Mobile menu
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// FAQ accordion
document.querySelectorAll('.faq-item').forEach((item) => {
  item.querySelector('.faq-question').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// Back to top
document.getElementById('backToTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Contact form ────────────────────────────────────────────────────
// Both the public "Contact Us" form and the in-app customer complaints page
// land in the same admin inbox via POST /api/v1/customer/complaints. That
// endpoint is auth-gated (customer role), so an unauthenticated visitor must
// sign in or register first. We show a modal explaining that, and stash their
// in-progress message in sessionStorage so the customer complaints page can
// rehydrate it after they log in — nothing typed is ever lost.

const contactForm = document.getElementById('contactForm');
const contactMsg  = document.getElementById('contactMsg');
const gateOverlay = document.getElementById('loginGateOverlay');

const openGate = () => { gateOverlay.style.display = 'flex'; };
const closeGate = () => { gateOverlay.style.display = 'none'; };

document.getElementById('loginGateClose').addEventListener('click', closeGate);
gateOverlay.addEventListener('click', (e) => { if (e.target === gateOverlay) closeGate(); });

// Read the logged-in user from localStorage (api.js stores it there post-login).
// Doing this inline so landing.js stays standalone and doesn't pull in api.js.
const getLandingUser = () => {
  try { return JSON.parse(localStorage.getItem('wm_user')); }
  catch { return null; }
};

const showFormMessage = (text, type) => {
  contactMsg.textContent = text;
  contactMsg.className = `form-message ${type}`;
};

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = contactForm.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  const fd = new FormData(contactForm);
  const name    = (fd.get('name')    || '').toString().trim();
  const email   = (fd.get('email')   || '').toString().trim();
  const phone   = (fd.get('phone')   || '').toString().trim();
  const message = (fd.get('message') || '').toString().trim();

  if (message.length < 20) {
    showFormMessage('Please write a bit more detail (at least 20 characters).', 'error');
    return;
  }

  const user = getLandingUser();

  // Gate path: not logged in OR logged in as the wrong role for the customer
  // complaints endpoint. Stash the draft so /customer/complaints.html can
  // rehydrate it after sign-in.
  if (!user || user.role !== 'customer') {
    try {
      sessionStorage.setItem('wm_pending_contact', JSON.stringify({
        name, email, phone, message,
        subject: `Contact from ${name || 'website visitor'}`,
        savedAt: Date.now(),
      }));
    } catch (_) { /* sessionStorage full or blocked — silently degrade */ }

    if (user && user.role !== 'customer') {
      // Logged in as admin/driver — they don't have a customer profile so the
      // complaints endpoint will 404. Be explicit instead of silently failing.
      showFormMessage('This form is for customers. Please use a customer account to send a message.', 'error');
      return;
    }
    openGate();
    return;
  }

  // Authenticated customer path — submit straight to the same endpoint the
  // in-app complaints page uses, with the dedicated 'general_inquiry' category
  // so admin can filter contact-us messages separately from service complaints.
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  btn.disabled = true;
  showFormMessage('', '');

  try {
    const res = await fetch('/api/v1/customer/complaints', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'general_inquiry',
        subject: `Contact from ${name || user.fullName || 'website'}`,
        description: phone ? `${message}\n\n— Contact phone: ${phone}` : message,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);

    showFormMessage("Thanks! Your message is in our admin inbox — we'll reply within 24 hours.", 'success');
    contactForm.reset();
    sessionStorage.removeItem('wm_pending_contact');
  } catch (err) {
    showFormMessage(err.message || 'Could not send right now. Please try again.', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// Intersection observer for animations
const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  }),
  { threshold: 0.1 }
);

document.querySelectorAll('.service-card, .step, .pricing-card, .testimonial-card').forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// Live pricing — homepage cards reflect the current admin-set prices.
// Falls back silently to the hardcoded numbers if the endpoint isn't reachable.
(async () => {
  try {
    const res = await fetch('/api/v1/auth/pricing', { credentials: 'omit' });
    if (!res.ok) return;
    const { data } = await res.json();
    const p = data?.pricing;
    if (!p) return;
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && Number.isFinite(val)) el.textContent = Number.isInteger(val) ? val : val.toFixed(2);
    };
    set('priceBasicAmount',    p.basic);
    set('priceStandardAmount', p.standard);
    set('pricePremiumAmount',  p.premium);
  } catch (_) { /* keep static fallback values */ }
})();
