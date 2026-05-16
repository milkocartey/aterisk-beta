// motion.js — ATERISK
// Re-exporte animate / inView / scroll depuis le CDN Motion,
// et gère les animations .fade-up avec plusieurs filets de sécurité.
//
// ORDRE D'EXÉCUTION :
//   [sync]  1. Inline styles opacity:0 posés AVANT tout await → pas de flash CDN
//   [sync]  2. Nuclear fallback 1500ms — JAMAIS annulé, toujours actif
//   [async] 3. await import CDN dans try/catch global
//   [async] 4. Viewport check 95% → animation immédiate si déjà visible
//   [async] 5. inView + IntersectionObserver en double filet
//   [async] 6. onComplete → retire les inline styles (removeProperty)

const prefersMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop     = !window.matchMedia('(max-width: 768px)').matches;

// ── 1. Inline styles synchrones (avant le await) ──────────────────────────────
// Le CSS NE DOIT PAS avoir opacity:0 sur .fade-up — source unique = JS.
if (prefersMotion && isDesktop) {
  document.querySelectorAll('.fade-up').forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(32px)';
  });
}

// ── 2. Nuclear fallback 1500ms ────────────────────────────────────────────────
// JAMAIS effacé (pas de clearTimeout). Dernier filet absolu :
// si un élément .fade-up a encore opacity:0 après 1500ms (CDN lent,
// inView silencieux, bug quelconque), on le force visible immédiatement.
// C'est un no-op si les animations ont déjà tourné (l'inline opacity n'est
// plus '0' — soit Motion l'a changé, soit removeProperty l'a effacé).
setTimeout(() => {
  document.querySelectorAll('.fade-up').forEach(el => {
    if (el.style.opacity === '0') {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    }
  });
}, 1500);

// ── Stubs exportables (actifs si CDN échoue) ──────────────────────────────────
// nav.js fait `animate(...).finished.then(...)` — le stub doit retourner .finished.
let animate = () => ({ finished: Promise.resolve() });
let inView  = () => {};
let scroll  = () => {};

// ── 3. Import CDN avec try/catch global ───────────────────────────────────────
try {
  const mod = await import('https://cdn.jsdelivr.net/npm/motion@latest/+esm');
  animate = mod.animate;
  inView  = mod.inView;
  scroll  = mod.scroll;

  // ── Animations .fade-up ──────────────────────────────────────────────────
  if (prefersMotion && isDesktop) {
    const _animated = new Set();

    document.querySelectorAll('.fade-up').forEach(el => {

      // Fonction d'animation — une seule exécution par élément.
      // 6. onComplete retire les inline styles pour ne pas bloquer
      //    d'autres animations ou effets CSS ultérieurs.
      function _animateEl() {
        if (_animated.has(el)) return;
        _animated.add(el);
        animate(
          el,
          { opacity: 1, y: 0 },
          { type: 'spring', stiffness: 80, damping: 18 }
        ).finished.then(() => {
          el.style.removeProperty('opacity');
          el.style.removeProperty('transform');
        });
      }

      // ── 4. Déjà dans le viewport (95% de la hauteur) ────────────────────
      // Animé immédiatement sans attendre inView ni un scroll.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
        _animateEl();
        return;
      }

      // ── 5. Double filet : inView Motion + IntersectionObserver ───────────
      // inView déclenche l'animation dès que l'élément entre dans la fenêtre.
      // L'IntersectionObserver est le secours : si inView ne se déclenche pas
      // dans 100ms après que l'élément soit visible, l'IO prend le relais.
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

} catch (e) {
  // Échec CDN — libère tous les éléments immédiatement (retire inline styles).
  // Éléments visibles car le CSS ne porte plus d'opacity:0 sur .fade-up.
  document.querySelectorAll('.fade-up').forEach(el => {
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
  });
}

// Exports live — nav.js et scroll.js lisent animate/inView/scroll depuis ici.
export { animate, inView, scroll };
