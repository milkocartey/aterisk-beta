import { animate, scroll } from './motion.js';

// ── PAGE ENTER TRANSITION ─────────────────────────────────────────────────
// Animate body opacity only — y-transform on body breaks position:fixed
// (sidebar, modals) by creating a new containing block for them.
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
// :not(.sidebar-nav) ensures we never accidentally select the sidebar's <nav>
// which would turn the sidebar background white on scroll.
const nav = document.querySelector('nav:not(.sidebar-nav)');

if (nav) {
  // Dark hero pages use CSS class toggle for transparent→white transition.
  // Other pages use motion.dev animate() directly on background.
  const isDarkHero = nav.classList.contains('nav-dark-hero');
  let navScrolled = false;

  scroll(() => {
    const past = window.scrollY > 80;
    if (past === navScrolled) return;
    navScrolled = past;

    if (isDarkHero) {
      // CSS handles the visual transition via .nav-scrolled class
      nav.classList.toggle('nav-scrolled', past);
    } else {
      animate(
        nav,
        past
          ? {
              backgroundColor: 'rgba(255,255,255,0.98)',
              boxShadow: '0 1px 20px rgba(26,46,122,0.08)',
            }
          : {
              backgroundColor: 'rgba(255,255,255,0.92)',
              boxShadow: '0 0px 0px rgba(26,46,122,0)',
            },
        { duration: 0.3 }
      );
    }
  });
}

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

    animate(
      document.body,
      { opacity: [1, 0] },
      { duration: 0.18, easing: 'ease-in' }
    ).finished.then(() => {
      window.location.href = dest;
    });
  });
});
