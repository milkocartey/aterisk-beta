// motion.js — ATERISK
// Import STATIQUE (pas de top-level await) pour ne pas bloquer nav.js.
// nav.js importe depuis ce fichier → il doit s'exécuter dès que le CDN répond,
// pas être bloqué par un await en attente.

import { animate, inView, scroll } from 'https://cdn.jsdelivr.net/npm/motion@latest/+esm';

const prefersMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop     = !window.matchMedia('(max-width: 768px)').matches;

// ── Nuclear fallback 1500ms ───────────────────────────────────────────────────
// JAMAIS annulé. Dernier filet absolu : si un .fade-up a encore opacity:0 en
// inline style après 1500ms, on le force visible. No-op si l'animation a tourné
// (l'inline style a été supprimé par removeProperty dans le onComplete).
setTimeout(() => {
  document.querySelectorAll('.fade-up').forEach(el => {
    if (el.style.opacity === '0') {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    }
  });
}, 1500);

// ── Animations .fade-up ───────────────────────────────────────────────────────
// Le CSS ne doit PAS avoir opacity:0 sur .fade-up (source unique = inline JS).
if (prefersMotion && isDesktop) {
  const _animated = new Set();

  document.querySelectorAll('.fade-up').forEach(el => {
    // Masquage inline (le CDN est déjà chargé ici — static import)
    el.style.opacity   = '0';
    el.style.transform = 'translateY(32px)';

    function _animateEl() {
      if (_animated.has(el)) return;
      _animated.add(el);
      animate(
        el,
        { opacity: 1, y: 0 },
        { type: 'spring', stiffness: 80, damping: 18 }
      ).finished.then(() => {
        // Nettoie les inline styles après animation pour ne pas bloquer
        // d'autres effets CSS/JS ultérieurs.
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
      });
    }

    // Déjà dans le viewport (95% de la hauteur) → animation immédiate
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
      _animateEl();
      return;
    }

    // Double filet : inView Motion + IntersectionObserver de secours
    inView(el, () => _animateEl(), { amount: 0.05 });

    const _io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        _io.disconnect();
        setTimeout(() => _animateEl(), 100); // 100ms de grâce pour inView
      });
    }, { threshold: 0.05 });
    _io.observe(el);
  });
}

export { animate, inView, scroll };
