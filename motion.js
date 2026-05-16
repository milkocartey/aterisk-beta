// motion.js — ATERISK
// Static import (no top-level await) so nav.js is never blocked.

import { animate, inView, scroll } from 'https://cdn.jsdelivr.net/npm/motion@latest/+esm';

const prefersMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop     = !window.matchMedia('(max-width: 768px)').matches;

// ── Nuclear fallback 1500ms ───────────────────────────────────────────────────
// NEVER cleared. Forces visibility if animation stalled for any reason.
setTimeout(() => {
  document.querySelectorAll('.fade-up').forEach(el => {
    if (el.style.opacity === '0') {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    }
  });
}, 1500);

// ── Animations .fade-up ───────────────────────────────────────────────────────
// Source of truth for opacity/transform is always inline JS (never CSS).
if (prefersMotion) {
  const _animated = new Set();

  document.querySelectorAll('.fade-up').forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(40px)';

    function _animateEl() {
      if (_animated.has(el)) return;
      _animated.add(el);
      animate(
        el,
        { opacity: [0, 1], y: [40, 0] },
        { type: 'spring', stiffness: 60, damping: 15 }
      ).finished.then(() => {
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
      });
    }

    // Already visible: animate immediately
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
      _animateEl();
      return;
    }

    // Dual safety: inView + IntersectionObserver (100ms grace)
    inView(el, () => _animateEl(), { amount: 0.05 });

    const _io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        _io.disconnect();
        setTimeout(() => _animateEl(), 100);
      });
    }, { threshold: 0.05 });
    _io.observe(el);
  });
}

export { animate, inView, scroll };
