// motion.js — ATERISK
// Re-exporte animate / inView / scroll depuis le CDN Motion,
// et gère les animations .fade-up avec plusieurs filets de sécurité :
//
//   1. Inline styles posés SYNCHRONEMENT avant tout await → pas de flash
//   2. Safety timer 2 s → libère les éléments bloqués à opacity:0
//   3. Dynamic import CDN + try/catch global
//   4. Viewport check au load → éléments déjà visibles animés immédiatement
//   5. IntersectionObserver de secours si inView ne se déclenche pas dans 100 ms

const prefersMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop     = !window.matchMedia('(max-width: 768px)').matches;

// ── 1. Inline styles synchrones ───────────────────────────────────────────────
// Posés AVANT le await pour éviter tout flash pendant le chargement CDN.
// Le CSS ne doit plus porter d'opacity:0 sur .fade-up (source unique de vérité).
if (prefersMotion && isDesktop) {
  document.querySelectorAll('.fade-up').forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(32px)';
  });
}

// ── 2. Safety timer — filet de sécurité 2 s ──────────────────────────────────
// Si un élément .fade-up est encore bloqué à opacity:0 après 2 s
// (CDN lent, inView silencieux, erreur quelconque) → on le libère sans animation.
const _safetyTimer = setTimeout(() => {
  document.querySelectorAll('.fade-up').forEach(el => {
    if (el.style.opacity === '0') {
      el.style.opacity   = '';
      el.style.transform = '';
    }
  });
}, 2000);

// ── Stubs exportables par défaut ──────────────────────────────────────────────
// Permettent à nav.js (qui importe depuis motion.js) de fonctionner
// même si le CDN échoue. Le stub animate() retourne un objet avec .finished
// pour que nav.js puisse faire `.finished.then(...)` sans crash.
let animate = () => ({ finished: Promise.resolve() });
let inView  = () => {};
let scroll  = () => {};

// ── 3. Import CDN dans un try/catch global ────────────────────────────────────
try {
  const mod = await import('https://cdn.jsdelivr.net/npm/motion@latest/+esm');
  animate = mod.animate;
  inView  = mod.inView;
  scroll  = mod.scroll;

  // CDN OK → le safety timer n'est plus nécessaire
  clearTimeout(_safetyTimer);

  // ── Animations .fade-up ────────────────────────────────────────────────────
  if (prefersMotion && isDesktop) {
    const _animated = new Set();

    document.querySelectorAll('.fade-up').forEach(el => {

      function _animateEl() {
        if (_animated.has(el)) return; // déjà animé (inView ou IO)
        _animated.add(el);
        animate(
          el,
          { opacity: 1, y: 0 },
          { type: 'spring', stiffness: 80, damping: 18 }
        );
      }

      // ── 4. Déjà dans le viewport au chargement ──────────────────────────
      if (el.getBoundingClientRect().top < window.innerHeight) {
        _animateEl();
        return; // pas besoin d'observer
      }

      // ── 5. inView Motion + IntersectionObserver en parallèle ────────────
      // inView déclenche l'animation dès que l'élément entre dans la fenêtre.
      // L'IO est un secours : si inView ne s'est pas déclenché dans 100 ms
      // après que l'élément soit visible, l'IO prend le relais.
      inView(el, () => _animateEl(), { amount: 0.05 });

      const _io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          _io.disconnect();
          setTimeout(() => _animateEl(), 100); // 100 ms de grâce pour inView
        });
      }, { threshold: 0.05 });

      _io.observe(el);
    });
  }

} catch (e) {
  // ── Échec total CDN — libère tous les éléments cachés ────────────────────
  document.querySelectorAll('.fade-up').forEach(el => {
    el.style.opacity   = '';
    el.style.transform = '';
  });
  // Les stubs restent en place → nav.js fonctionne sans crash
}

// Exports live — nav.js et scroll.js les lisent via import { animate, scroll }
export { animate, inView, scroll };
