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

// Contact form
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const msg = document.getElementById('contactMsg');
  const originalText = btn.innerHTML;

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  btn.disabled = true;

  // Simulate API call (replace with real endpoint)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  msg.textContent = 'Thank you! We\'ll get back to you within 24 hours.';
  msg.className = 'form-message success';
  e.target.reset();
  btn.innerHTML = originalText;
  btn.disabled = false;
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
