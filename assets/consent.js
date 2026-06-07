/* =====================================================
   Cookie consent + Google Analytics 4 loader
   ---------------------------------------------------
   - UK PECR compliant: GA4 won't load unless user clicks Accept.
   - Equal-prominence Accept / Reject buttons.
   - Choice persists in localStorage. Footer link with
     data-cc-reset clears it.
   - Uses Google Consent Mode v2 so even a "rejected" visit
     still pings GA4 cookielessly for headline counts (optional —
     comment the consent default block to disable).
   - Custom events fired on consent:
       click_phone   — any <a href="tel:..."> click
       click_whatsapp — any wa.me link click
       click_email   — any <a href="mailto:..."> click
       form_submit   — when the contact form's success state
                       is reached (Web3Forms green card)
   =====================================================
   REPLACE THE GA_ID BELOW with your GA4 Measurement ID
   (format: G-XXXXXXXXXX) once you have it from
   https://analytics.google.com.
   ===================================================== */

(function() {
  'use strict';

  var GA_ID = 'G-YEGTD074SM';  // K. Smithurst Building Contractors — ksbuildingservices.co.uk
  var STORAGE_KEY = 'ksb_cookie_consent';
  var STORAGE_VER = 'v1';

  // ---------- 1. Inject the banner styles ----------
  var style = document.createElement('style');
  style.textContent =
    '.cc-banner{position:fixed;bottom:0;left:0;right:0;z-index:200;background:#0d1638;color:#fff;padding:18px 22px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.55;box-shadow:0 -8px 32px rgba(0,0,0,0.18);transform:translateY(120%);transition:transform 0.35s ease}' +
    '.cc-banner.in{transform:translateY(0)}' +
    '.cc-inner{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}' +
    '.cc-text{flex:1;min-width:280px}' +
    '.cc-text strong{display:block;font-weight:700;margin-bottom:4px;color:#fff}' +
    '.cc-text span{color:rgba(255,255,255,0.78)}' +
    '.cc-text a{color:#fff;text-decoration:underline;text-underline-offset:2px}' +
    '.cc-buttons{display:flex;gap:10px;flex-shrink:0}' +
    '.cc-btn{display:inline-flex;align-items:center;justify-content:center;padding:11px 22px;border-radius:4px;font-family:inherit;font-size:14px;font-weight:700;letter-spacing:0.02em;cursor:pointer;border:none;transition:transform 0.15s,background 0.15s,color 0.15s;min-width:100px}' +
    '.cc-btn:hover{transform:translateY(-1px)}' +
    '.cc-reject{background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.28)}' +
    '.cc-reject:hover{background:rgba(255,255,255,0.20)}' +
    '.cc-accept{background:#E63329;color:#fff}' +
    '.cc-accept:hover{background:#b8261d}' +
    '@media (max-width:640px){' +
    '.cc-banner{padding:14px 16px}' +
    '.cc-inner{gap:14px}' +
    '.cc-buttons{width:100%;justify-content:stretch}' +
    '.cc-btn{flex:1;min-width:0;padding:12px 16px;font-size:13.5px}' +
    '}';
  document.head.appendChild(style);

  // ---------- 2. Initialise gtag with consent denied ----------
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });

  // Always load gtag.js — Consent Mode v2 sends cookieless pings
  // for rejected visits (so you get headline traffic counts), and
  // full pageviews + events for accepted visits.
  if (GA_ID && GA_ID.indexOf('XXXX') === -1) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  // ---------- 3. Check stored consent ----------
  function readConsent() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      if (!v) return null;
      var parts = v.split(':');
      return parts[0] === STORAGE_VER ? parts[1] : null;
    } catch (e) { return null; }
  }
  function writeConsent(val) {
    try { localStorage.setItem(STORAGE_KEY, STORAGE_VER + ':' + val); } catch (e) {}
  }

  function applyConsent(val) {
    if (val === 'accepted') {
      gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    } else if (val === 'rejected') {
      gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  }

  var stored = readConsent();
  if (stored === 'accepted' || stored === 'rejected') {
    applyConsent(stored);
  }

  // ---------- 4. Show banner if no stored choice ----------
  function showBanner() {
    var banner = document.createElement('div');
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<div class="cc-inner">' +
        '<div class="cc-text">' +
          '<strong>We use cookies</strong>' +
          '<span>We use Google Analytics to count visitors and understand which pages help most. Nothing personal is shared. See our <a href="/privacy/">privacy policy</a>.</span>' +
        '</div>' +
        '<div class="cc-buttons">' +
          '<button type="button" class="cc-btn cc-reject">Reject</button>' +
          '<button type="button" class="cc-btn cc-accept">Accept</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    requestAnimationFrame(function() { banner.classList.add('in'); });

    banner.querySelector('.cc-accept').addEventListener('click', function() {
      writeConsent('accepted');
      applyConsent('accepted');
      hide(banner);
    });
    banner.querySelector('.cc-reject').addEventListener('click', function() {
      writeConsent('rejected');
      applyConsent('rejected');
      hide(banner);
    });
  }
  function hide(banner) {
    banner.classList.remove('in');
    setTimeout(function() { banner.parentNode && banner.parentNode.removeChild(banner); }, 400);
  }

  function init() {
    if (!readConsent()) showBanner();
    bindEvents();
    bindResetLink();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---------- 5. Custom event tracking ----------
  function bindEvents() {
    // Phone clicks
    document.querySelectorAll('a[href^="tel:"]').forEach(function(a) {
      a.addEventListener('click', function() {
        gtag('event', 'click_phone', {
          phone_number: a.getAttribute('href').replace('tel:', ''),
          link_text: (a.textContent || '').trim().slice(0, 60)
        });
      });
    });
    // WhatsApp clicks
    document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) {
      a.addEventListener('click', function() {
        gtag('event', 'click_whatsapp', {
          link_url: a.getAttribute('href')
        });
      });
    });
    // Email link clicks (footer + contact rows, not the form)
    document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) {
      a.addEventListener('click', function() {
        gtag('event', 'click_email', {
          email: a.getAttribute('href').replace('mailto:', '').split('?')[0]
        });
      });
    });
    // Contact form successful submission — watch the result element
    document.querySelectorAll('.form-result').forEach(function(el) {
      var obs = new MutationObserver(function() {
        if (el.classList.contains('success')) {
          gtag('event', 'form_submit', {
            form_id: 'contact_enquiry',
            page_path: location.pathname
          });
          obs.disconnect();
        }
      });
      obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
    // Review-page CTA clicks (for measuring share-link conversion)
    document.querySelectorAll('.rv-btn').forEach(function(a) {
      a.addEventListener('click', function() {
        gtag('event', 'review_click', {
          platform: a.getAttribute('data-platform') || 'unknown'
        });
      });
    });
  }

  // ---------- 6. Footer reset link ----------
  function bindResetLink() {
    document.addEventListener('click', function(e) {
      var t = e.target;
      while (t && t !== document.body) {
        if (t.hasAttribute && t.hasAttribute('data-cc-reset')) {
          e.preventDefault();
          try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
          location.reload();
          return;
        }
        t = t.parentNode;
      }
    });
  }
})();
