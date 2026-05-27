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

  // Contact form → WhatsApp
  const submit = document.getElementById('submitForm');
  if (submit) {
    submit.addEventListener('click', function(e) {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const service = document.getElementById('service').value;
      const message = document.getElementById('message').value.trim();
      if (!name || !phone || !message) {
        alert('Please fill in your name, phone number and a brief project description.');
        return;
      }
      let msg = "Hi K. Smithurst, I'd like to enquire about a building project.\n\n";
      msg += "Name: " + name + "\n";
      msg += "Phone: " + phone + "\n";
      if (email) msg += "Email: " + email + "\n";
      if (service) msg += "Type of work: " + service + "\n";
      msg += "\nProject details:\n" + message;
      window.open("https://wa.me/441773828516?text=" + encodeURIComponent(msg), "_blank");
    });
  }

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

