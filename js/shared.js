// ── Scroll Reveal ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Nav scroll effect ──
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ── Mobile menu ──
const mobileBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const bars = mobileBtn.querySelectorAll('span');
    const isOpen = mobileMenu.classList.contains('open');
    if (bars.length === 3) {
      bars[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
      bars[1].style.opacity = isOpen ? '0' : '1';
      bars[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
    }
  });
}

// ── Smooth scroll ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (mobileMenu) mobileMenu.classList.remove('open');
    }
  });
});

// ── Pricing toggle ──
const toggleTrack = document.querySelector('.pricing-toggle-track');
const toggleLabels = document.querySelectorAll('.pricing-toggle-label');
const savePill = document.querySelector('.save-pill');

if (toggleTrack) {
  toggleTrack.addEventListener('click', () => {
    const isAnnual = toggleTrack.classList.toggle('annual');
    toggleLabels.forEach(l => l.classList.toggle('active'));
    if (savePill) savePill.classList.toggle('visible', isAnnual);

    document.querySelectorAll('[data-monthly]').forEach(el => {
      el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly;
    });
    document.querySelectorAll('[data-period]').forEach(el => {
      el.textContent = isAnnual ? '/year' : '/month';
    });
    document.querySelectorAll('[data-note-monthly]').forEach(el => {
      el.textContent = isAnnual ? el.dataset.noteAnnual : el.dataset.noteMonthly;
    });
  });
}

// ── Signup form handler ──
function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('input[type="email"]').value;
  const nameInput = form.querySelector('input[name="name"]');
  const data = nameInput ? { name: nameInput.value, email } : { email };

  fetch('https://scoringzone.app/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).finally(() => {
    const wrapper = form.closest('.form-wrapper') || form;
    const success = wrapper.parentElement.querySelector('.success-state') ||
                    document.getElementById('signup-success');
    wrapper.style.display = 'none';
    if (success) success.classList.add('visible');
  });
}

// ── iPhone 3D tilt ──
const iphoneMockup = document.querySelector('.iphone-mockup');
if (iphoneMockup && window.innerWidth > 1024) {
  document.addEventListener('mousemove', (e) => {
    const rect = iphoneMockup.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / window.innerWidth;
    const dy = (e.clientY - cy) / window.innerHeight;
    const rotateY = dx * 8;
    const rotateX = -dy * 8;
    iphoneMockup.querySelector('.iphone-frame').style.transform =
      `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
}
