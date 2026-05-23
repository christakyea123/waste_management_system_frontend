// Central place to set the company's WhatsApp contact number.
// Update WHATSAPP_NUMBER to the real number when ready — every footer icon
// across the site reads from here, so there's no need to hunt page by page.
//
// Format requirements:
//   - International form, digits only (no +, spaces, or dashes)
//   - Example for Ghana: '233244123456'  (drop the leading 0, prepend 233)
const WHATSAPP_NUMBER = ''; // ← PASTE THE NUMBER HERE
const WHATSAPP_PREFILL = "Hello 035 F Arkoh Waste Management, I'd like to learn more about your services.";

(function wireWhatsapp() {
  const links = document.querySelectorAll('a#whatsappLink, a.whatsapp-link');
  if (!links.length) return;

  const ready = WHATSAPP_NUMBER && /^\d{6,15}$/.test(WHATSAPP_NUMBER);
  const href = ready
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`
    : '#';

  links.forEach((a) => {
    a.setAttribute('href', href);
    if (!ready) {
      a.title = 'WhatsApp number coming soon';
      a.addEventListener('click', (e) => { e.preventDefault(); });
    } else {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      a.title = 'Chat with us on WhatsApp';
    }
  });
})();
