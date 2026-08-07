// Shared JS for K. Smithurst sub-pages.
// Nav scroll shadow, mobile toggle, year, scroll reveal, WhatsApp form.

(function() {
  const nav = document.getElementById('navbar');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 8) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    });
  }

  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Working-hours utility
  const text = document.getElementById('hours-text');
  const wrap = document.getElementById('hours-display');
  if (text && wrap) {
    const day = new Date().getDay();
    const hour = new Date().getHours();
    if (day >= 1 && day <= 5 && hour >= 8 && hour < 17) text.textContent = 'Open now — call for a quote';
    else if (day === 6 && hour >= 8 && hour < 13) text.textContent = 'Open Saturday morning';
    else text.textContent = 'Leave us a message anytime';
    wrap.style.display = 'inline-flex';
  }

  // Reveal on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Contact form is now Web3Forms — submit handlers are inlined per page
  // (home: in index.html, contact page: in contact/index.html) so each can
  // bind to its <form> with full control over inline success/error UI.

  // Project filter tabs (projects.html)
  const tabs = document.querySelectorAll('.proj-tab');
  if (tabs.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        document.querySelectorAll('.proj-item').forEach(item => {
          const matches = filter === 'all' || item.dataset.tag === filter;
          item.style.display = matches ? '' : 'none';
        });
      });
    });
  }
})();

// Reviews slider — prev/next on desktop, swipe on mobile (native scroll-snap)
(function() {
  const sliders = document.querySelectorAll('.reviews-slider');
  sliders.forEach(slider => {
    const track = slider.querySelector('.reviews-grid');
    const prev = slider.querySelector('.slider-btn.prev');
    const next = slider.querySelector('.slider-btn.next');
    const controls = slider.querySelector('.slider-controls');
    if (!track || !prev || !next) return;

    const updateState = () => {
      // Hide controls when no scrolling needed
      const overflows = track.scrollWidth > track.clientWidth + 2;
      if (controls) controls.classList.toggle('hidden', !overflows);
      prev.disabled = track.scrollLeft <= 10;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 10;
    };
    const stepBy = (dir) => {
      const card = track.querySelector('.review-card');
      if (!card) return;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || 0);
      track.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
      // Smooth scroll's `scroll` events don't fire reliably across browsers,
      // so update state ourselves on a short tick + after the animation
      // should have settled.
      requestAnimationFrame(updateState);
      setTimeout(updateState, 450);
    };
    prev.addEventListener('click', () => stepBy(-1));
    next.addEventListener('click', () => stepBy(1));
    track.addEventListener('scroll', updateState, { passive: true });
    window.addEventListener('resize', updateState);
    updateState();
  });
})();

// Lead logger -> Google Sheet (Apps Script). Fires on real contact intent:
// tel:/wa.me/mailto: clicks, review-button clicks, and quote-form submits.
// NEVER navigator.sendBeacon here - it silently drops the /exec cross-origin
// 302 while returning true. fetch + keepalive + no-cors + text/plain is the
// only combination that survives page unload AND avoids a CORS preflight.
// Not consent-gated: sets no cookies, stores no identifiers.
(function() {
  var LEAD_URL = 'https://script.google.com/macros/s/AKfycbxOeYzWtzAgBA3MdQTg-cI0RVxOG7lEQBItV7iWH16XmldMmGly0DfyU7h3Syo8Efp5qQ/exec';

  function sendLead(d) {
    try {
      d.page = location.pathname || '/';
      fetch(LEAD_URL, { method: 'POST', mode: 'no-cors', keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(d) });
    } catch (e) {}
  }

  function where(el) {
    if (!el || !el.closest) return 'page';
    if (el.closest('.whatsapp-float')) return 'whatsapp widget';
    if (el.closest('.utility-bar')) return 'top bar';
    if (el.closest('.navbar')) return 'nav';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.page-banner')) return 'page banner';
    if (el.closest('form') || el.closest('.contact-form')) return 'contact form';
    if (el.closest('.cta-strip')) return 'CTA strip';
    if (el.closest('.final-cta')) return 'bottom CTA';
    if (el.closest('.rv-cta-card') || el.closest('.rv-alt')) return 'review page';
    if (el.closest('footer')) return 'footer';
    return 'page';
  }

  // Capture phase so the row is sent before tel:/wa.me navigation tears the
  // page down; keepalive is what lets the request survive unload.
  document.addEventListener('click', function(e) {
    var t = e.target; if (!t || !t.closest) return;
    var a = t.closest('a'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (a.classList.contains('rv-btn')) {
      sendLead({ type: 'Review click',
        details: a.getAttribute('data-platform') || '', source: 'review page' });
      return;
    }
    if (h.indexOf('tel:') === 0) {
      sendLead({ type: 'Call click', phone: h.replace('tel:', ''), source: where(a) });
    } else if (h.indexOf('wa.me') > -1) {
      sendLead({ type: 'WhatsApp click', source: where(a) });
    } else if (h.indexOf('mailto:') === 0) {
      sendLead({ type: 'Email click',
        details: h.replace('mailto:', '').split('?')[0], source: where(a) });
    }
  }, true);

  // Quote form - capture values at submit time (the page handler resets the
  // form on success, so grabbing them later reads back empty fields).
  document.addEventListener('submit', function(e) {
    var f = e.target;
    if (!f || f.id !== 'contactForm') return;
    function v(name) {
      var el = f.querySelector('[name="' + name + '"]');
      return el ? String(el.value || '').trim() : '';
    }
    var details = v('message');
    var email = v('email');
    if (email) details = (details ? details + '\n' : '') + 'Email: ' + email;
    sendLead({ type: 'Quote form', name: v('name'), phone: v('phone'),
      service: v('service'), details: details, source: 'contact form' });
  }, true);
})();

// Before/After slider — pointer-driven reveal handle
(function() {
  const sliders = document.querySelectorAll('.ba-slider');
  sliders.forEach(slider => {
    const mask = slider.querySelector('.ba-mask-before');
    const beforeImg = slider.querySelector('.ba-mask-before .ba-img');
    const handle = slider.querySelector('.ba-handle');
    if (!mask || !handle) return;

    let dragging = false;

    const setPct = (pct) => {
      pct = Math.max(0, Math.min(100, pct));
      mask.style.width = pct + '%';
      handle.style.left = pct + '%';
    };

    const sizeBeforeImg = () => {
      // The before image inside .ba-mask-before is sized in `vw` by default;
      // we explicitly size it to the slider's actual width so the visible
      // slice always aligns pixel-perfect with the after image behind it.
      if (beforeImg) beforeImg.style.width = slider.clientWidth + 'px';
    };

    const updateFromEvent = (e) => {
      const rect = slider.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX :
                      (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setPct(pct);
    };

    // Pointer events cover mouse / touch / pen
    slider.addEventListener('pointerdown', (e) => {
      dragging = true;
      slider.setPointerCapture(e.pointerId);
      updateFromEvent(e);
    });
    slider.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      e.preventDefault();
      updateFromEvent(e);
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      try { slider.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    slider.addEventListener('pointerup', endDrag);
    slider.addEventListener('pointercancel', endDrag);
    slider.addEventListener('pointerleave', endDrag);

    // Click anywhere jumps the handle there (without dragging)
    // (Already handled by pointerdown above.)

    sizeBeforeImg();
    window.addEventListener('resize', sizeBeforeImg);

    // One-time hint animation on first view
    let played = false;
    const playHint = () => {
      if (played) return; played = true;
      let pct = 50, dir = 1, steps = 0;
      const id = setInterval(() => {
        pct += dir * 2;
        if (pct >= 64 || pct <= 36) dir = -dir;
        setPct(pct);
        if (++steps > 28) { clearInterval(id); setPct(50); }
      }, 28);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { playHint(); io.unobserve(en.target); } });
      }, { threshold: 0.5 });
      io.observe(slider);
    } else {
      setTimeout(playHint, 800);
    }
  });
})();

