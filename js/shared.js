// ── Typewriter Effect ──
document.querySelectorAll('.typewriter').forEach(el => {
  const cursor = el.querySelector('.typewriter-cursor');
  const chars = [];

  // Collect all child nodes (excluding the cursor)
  const childNodes = [];
  el.childNodes.forEach(node => {
    if (node !== cursor) childNodes.push(node);
  });

  // Split text into words and wrap chars, grouping by word to prevent mid-word line breaks
  function processText(text, container) {
    const parts = text.split(/( )/); // split on single spaces, keeping them
    parts.forEach(part => {
      if (part === ' ') {
        const span = document.createElement('span');
        span.className = 'typewriter-char';
        span.innerHTML = '&nbsp;';
        container.appendChild(span);
        chars.push(span);
      } else if (part.length > 0) {
        const wordWrap = document.createElement('span');
        wordWrap.className = 'typewriter-word';
        for (let i = 0; i < part.length; i++) {
          const span = document.createElement('span');
          span.className = 'typewriter-char';
          span.textContent = part[i];
          wordWrap.appendChild(span);
          chars.push(span);
        }
        container.appendChild(wordWrap);
      }
    });
  }

  // Remove originals and rebuild with char spans
  childNodes.forEach(node => el.removeChild(node));
  childNodes.forEach(node => {
    if (node.nodeType === 3) {
      // Text node — build word-wrapped chars directly into el before cursor
      const frag = document.createDocumentFragment();
      processText(node.textContent, frag);
      el.insertBefore(frag, cursor);
    } else if (node.nodeType === 1) {
      // Element node (e.g. .hero-accent) — replace its contents with char spans
      const text = node.textContent;
      node.textContent = '';
      processText(text, node);
      el.insertBefore(node, cursor);
    }
  });

  el.classList.add('typing');

  // Reveal chars when element scrolls into view
  const typeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        typeObserver.unobserve(entry.target);
        chars.forEach((char, i) => {
          setTimeout(() => {
            char.classList.add('revealed');
            if (i === chars.length - 1 && cursor) {
              cursor.classList.add('done');
            }
          }, i * 112);
        });
      }
    });
  }, { threshold: 0.2 });

  typeObserver.observe(el);
});

// ── Infinite Grid Animation ──
(function() {
  const basePat = document.getElementById('hero-grid-pat');
  const brightPat = document.getElementById('hero-grid-pat-bright');
  const reveal = document.querySelector('.hero-grid-reveal');
  const hero = document.querySelector('.hero');

  if (basePat && brightPat) {
    let offsetX = 0;
    let offsetY = 0;

    function animateGrid() {
      offsetX = (offsetX + 0.5) % 40;
      offsetY = (offsetY + 0.5) % 40;
      basePat.setAttribute('x', offsetX);
      basePat.setAttribute('y', offsetY);
      brightPat.setAttribute('x', offsetX);
      brightPat.setAttribute('y', offsetY);
      requestAnimationFrame(animateGrid);
    }
    requestAnimationFrame(animateGrid);
  }

  if (reveal && hero) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const mask = `radial-gradient(300px circle at ${x}px ${y}px, black, transparent)`;
      reveal.style.maskImage = mask;
      reveal.style.webkitMaskImage = mask;
    });
  }
})();

// ── Scroll Reveal ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Word-by-Word Reveal ──
(function() {
  const wordObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        wordObserver.unobserve(entry.target);
        entry.target.querySelectorAll('.word-animate').forEach(word => {
          const delay = parseInt(word.getAttribute('data-delay')) || 0;
          setTimeout(() => word.classList.add('visible'), delay);
        });
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.hero-sub-words').forEach(el => wordObserver.observe(el));
})();

// ── Scroll Reveal Cards (one-shot, scroll-down only) ──
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.25 });
document.querySelectorAll('.scroll-reveal-card').forEach(el => cardObserver.observe(el));

// ── Nav scroll effect ──
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ── Desktop mega-menu dropdown ──
const dropdowns = document.querySelectorAll('[data-dropdown]');
let closeTimer = null;

function openDropdown(dd) {
  dropdowns.forEach(d => { if (d !== dd) closeDropdown(d); });
  dd.classList.add('open');
  const trigger = dd.querySelector('.nav-dropdown-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
}

function closeDropdown(dd) {
  dd.classList.remove('open');
  const trigger = dd.querySelector('.nav-dropdown-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function closeAllDropdowns() {
  dropdowns.forEach(d => closeDropdown(d));
}

dropdowns.forEach(dd => {
  const trigger = dd.querySelector('.nav-dropdown-trigger');

  // Hover open/close with small delay to prevent flicker
  dd.addEventListener('mouseenter', () => {
    clearTimeout(closeTimer);
    openDropdown(dd);
  });

  dd.addEventListener('mouseleave', () => {
    closeTimer = setTimeout(() => closeDropdown(dd), 150);
  });

  // Click toggle for accessibility
  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dd.classList.contains('open')) {
        closeDropdown(dd);
      } else {
        openDropdown(dd);
      }
    });
  }
});

// Close on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-dropdown]')) closeAllDropdowns();
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllDropdowns();
});

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

// ── Mobile dropdown toggle ──
const mobileTrigger = document.querySelector('.mobile-dropdown-trigger');
if (mobileTrigger) {
  mobileTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    const items = mobileTrigger.nextElementSibling;
    items.classList.toggle('open');
    const svg = mobileTrigger.querySelector('svg');
    if (svg) svg.style.transform = items.classList.contains('open') ? 'rotate(180deg)' : '';
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
      closeAllDropdowns();
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
