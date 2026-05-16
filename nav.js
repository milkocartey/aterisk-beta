import { animate, scroll } from './motion.js';

// ── BODY OPACITY FAILSAFE ─────────────────────────────────────────────────
// If motion.js / CDN is slow, body stays at opacity:0 forever from the
// flash-prevention CSS. Force-restore visibility within 1.2s no matter what.
setTimeout(() => {
  if (parseFloat(getComputedStyle(document.body).opacity) < 0.9) {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '1';
  }
}, 1200);

// ── PAGE ENTER TRANSITION ─────────────────────────────────────────────────
animate(
  document.body,
  { opacity: [0, 1] },
  { duration: 0.22, easing: 'ease-out' }
);

// Animate main content panel with spring y-entrance (not the body itself)
const _main = document.querySelector('.main, .page-wrap');
if (_main) {
  animate(
    _main,
    { opacity: [0, 1], y: [24, 0] },
    { type: 'spring', stiffness: 70, damping: 18 }
  );
}

// ── NAV SCROLL ────────────────────────────────────────────────────────────
const nav = document.querySelector('nav:not(.sidebar-nav)');

if (nav) {
  const isDarkHero = nav.classList.contains('nav-dark-hero');
  let navScrolled = false;

  scroll(() => {
    const past = window.scrollY > 80;
    if (past === navScrolled) return;
    navScrolled = past;

    if (isDarkHero) {
      nav.classList.toggle('nav-scrolled', past);
    } else {
      animate(
        nav,
        past
          ? { backgroundColor: 'rgba(255,255,255,0.98)', boxShadow: '0 1px 20px rgba(26,46,122,0.08)' }
          : { backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 0px 0px rgba(26,46,122,0)' },
        { duration: 0.3 }
      );
    }
  });
}

// ── DROPDOWN CLICK TOGGLE ─────────────────────────────────────────────────
// CSS :hover handles desktop hover. JS click handles touch + keyboard.
document.querySelectorAll('.nav-dropdown-trigger').forEach(trigger => {
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const dropdown = trigger.closest('.nav-dropdown');
    const isOpen = dropdown.classList.contains('dropdown-open');

    // Close all open dropdowns first
    document.querySelectorAll('.nav-dropdown.dropdown-open').forEach(d => {
      d.classList.remove('dropdown-open');
    });

    if (!isOpen) dropdown.classList.add('dropdown-open');
  });
});

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown.dropdown-open').forEach(d => {
    d.classList.remove('dropdown-open');
  });
});

// ── PAGE EXIT TRANSITION ──────────────────────────────────────────────────
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');

  if (
    !href ||
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    !href.endsWith('.html')
  ) return;

  link.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    const dest = link.href;

    // Failsafe: navigate no matter what after 350ms
    let done = false;
    const go = () => { if (!done) { done = true; window.location.href = dest; } };

    try {
      animate(
        document.body,
        { opacity: [1, 0] },
        { duration: 0.18, easing: 'ease-in' }
      ).finished.then(go);
    } catch (_) {
      go();
    }

    setTimeout(go, 350);
  });
});
