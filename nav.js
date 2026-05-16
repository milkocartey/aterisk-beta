import { animate, scroll } from './motion.js';

// ── BODY ENTER — CSS pur, aucune dépendance CDN ───────────────────────────
// body{opacity:0;transition:none} empêche le flash. On enlève transition:none
// puis on pose opacity:1 dans le prochain frame — le browser fait le fondu.
requestAnimationFrame(() => {
  document.body.style.transition = 'opacity 0.22s ease-out';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });
});

// Animate .main/.page-wrap avec motion.dev (non critique)
const _main = document.querySelector('.main, .page-wrap');
if (_main) {
  animate(_main, { opacity: [0, 1], y: [24, 0] }, { type: 'spring', stiffness: 70, damping: 18 });
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
document.querySelectorAll('.nav-dropdown-trigger').forEach(trigger => {
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const dropdown = trigger.closest('.nav-dropdown');
    const isOpen = dropdown.classList.contains('dropdown-open');
    document.querySelectorAll('.nav-dropdown.dropdown-open').forEach(d => d.classList.remove('dropdown-open'));
    if (!isOpen) dropdown.classList.add('dropdown-open');
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown.dropdown-open').forEach(d => d.classList.remove('dropdown-open'));
});

// ── PAGE EXIT — CSS pur, aucune dépendance CDN ────────────────────────────
// On n'utilise PAS motion.dev ici — si le CDN est lent, la navigation
// serait bloquée sur e.preventDefault(). CSS transition + setTimeout = fiable.
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
    document.body.style.transition = 'opacity 0.18s ease-in';
    document.body.style.opacity = '0';
    setTimeout(() => { window.location.href = dest; }, 200);
  });
});
