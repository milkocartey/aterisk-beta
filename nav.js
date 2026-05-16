import { animate, scroll } from './motion.js';

// ── PAGE ENTER TRANSITION ─────────────────────────────────────────────────
// body starts at opacity:0 (set in <head> style), animate in on load
animate(
  document.body,
  { opacity: [0, 1], y: [10, 0] },
  { duration: 0.3, easing: 'ease-out' }
);

// ── NAV SCROLL ────────────────────────────────────────────────────────────
const nav = document.querySelector('nav');

if (nav) {
  let navScrolled = false;

  // scroll() fires the callback on every scroll tick.
  // We read window.scrollY inside it for the pixel threshold.
  scroll(() => {
    const past = window.scrollY > 60;
    if (past === navScrolled) return;
    navScrolled = past;

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
  });
}

// ── PAGE EXIT TRANSITION ──────────────────────────────────────────────────
// Intercept all internal .html links (not anchors, not external)
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');

  // Skip: anchors, empty, external URLs, mailto/tel, already-handled fragments
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
    // Allow ctrl/cmd+click to open in new tab normally
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    const dest = link.href;

    animate(
      document.body,
      { opacity: [1, 0], y: [0, -10] },
      { duration: 0.22, easing: 'ease-in' }
    ).finished.then(() => {
      window.location.href = dest;
    });
  });
});
