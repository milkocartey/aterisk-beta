import { animate, inView } from './motion.js';

// Cubic-bezier expo-out — départ rapide, arrivée douce
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

// ── stagger: anime un tableau d'éléments avec CSS transitions ────────────
// CSS transitions ne révertent JAMAIS (contrairement à WAAPI).
// L'état final est toujours inline opacity:1 + transform:none.
function stagger(elements, { fromY = 0, fromX = 0, fromScale = 1, dur = 600, gap = 120 } = {}) {
  elements.forEach((el, i) => {
    // 1. État initial en inline — écrase toute règle CSS
    el.style.transition = 'none';
    el.style.opacity    = '0';
    el.style.transform  = `translate(${fromX}px, ${fromY}px) scale(${fromScale})`;

    // 2. Frame de grâce pour que le navigateur enregistre l'état initial
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.transition = `opacity ${dur}ms ${EASE}, transform ${dur}ms ${EASE}`;
          el.style.opacity    = '1';
          el.style.transform  = 'translate(0, 0) scale(1)';
        }, i * gap);
      });
    });
  });
}

// ── whenVisible: déclenche immédiatement si dans le viewport ─────────────
function whenVisible(el, callback) {
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
    callback(); return;
  }

  let done = false;
  const trigger = () => { if (done) return; done = true; callback(); };

  inView(el, trigger, { amount: 'some' });

  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    setTimeout(trigger, 80);
  }, { threshold: 0.05 });
  io.observe(el);
}

// ── Safety fallback 3s — si rien ne s'est déclenché ──────────────────────
setTimeout(() => {
  document.querySelectorAll('.step, .why-point, .sector-card').forEach(el => {
    if (el.style.opacity === '0') { el.style.opacity = '1'; el.style.transform = 'none'; }
  });
  const t = document.getElementById('cta-title');
  if (t && t.style.opacity === '0') { t.style.opacity = '1'; t.style.transform = 'none'; }
}, 3000);

// ── 1. Steps ──────────────────────────────────────────────────────────────
const stepsWrap = document.querySelector('.steps');
if (stepsWrap) {
  const steps = Array.from(stepsWrap.querySelectorAll('.step'));
  // Cacher immédiatement (inline, pas CSS)
  steps.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(56px)'; });
  whenVisible(stepsWrap, () => stagger(steps, { fromY: 56, dur: 680, gap: 130 }));
}

// ── 2. Why-points ─────────────────────────────────────────────────────────
const whyWrap = document.querySelector('.why-points');
if (whyWrap) {
  const pts = Array.from(whyWrap.querySelectorAll('.why-point'));
  pts.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateX(-36px)'; });
  whenVisible(whyWrap, () => stagger(pts, { fromX: -36, dur: 600, gap: 110 }));
}

// ── 3. Sector cards ───────────────────────────────────────────────────────
const secGrid = document.querySelector('.sectors-grid');
if (secGrid) {
  const cards = Array.from(secGrid.querySelectorAll('.sector-card'));
  cards.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(32px) scale(0.95)'; });
  whenVisible(secGrid, () => stagger(cards, { fromY: 32, fromScale: 0.95, dur: 560, gap: 65 }));
}

// ── 4. CTA title ──────────────────────────────────────────────────────────
const ctaTitle = document.getElementById('cta-title');
if (ctaTitle) {
  ctaTitle.style.opacity   = '0';
  ctaTitle.style.transform = 'translateY(28px) scale(0.97)';
  whenVisible(ctaTitle, () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ctaTitle.style.transition = `opacity 700ms ${EASE}, transform 700ms ${EASE}`;
      ctaTitle.style.opacity    = '1';
      ctaTitle.style.transform  = 'none';

      setTimeout(() => {
        const btn = document.querySelector('.cta-section .btn-primary');
        if (btn) animate(btn, { scale: [1, 1.06, 1] }, { duration: 0.55, easing: 'ease-in-out' });
      }, 600);
    }));
  });
}

// ── Hover interactions (motion.dev spring) ────────────────────────────────
document.querySelectorAll('.sector-card').forEach(el => {
  el.addEventListener('mouseenter', () =>
    animate(el, { scale: 1.03, y: -6 }, { type: 'spring', stiffness: 300, damping: 24 })
  );
  el.addEventListener('mouseleave', () =>
    animate(el, { scale: 1, y: 0 }, { type: 'spring', stiffness: 300, damping: 24 })
  );
});

document.querySelectorAll('.why-point').forEach(el => {
  el.addEventListener('mouseenter', () =>
    animate(el, { x: 8 }, { type: 'spring', stiffness: 400, damping: 30 })
  );
  el.addEventListener('mouseleave', () =>
    animate(el, { x: 0 }, { type: 'spring', stiffness: 400, damping: 30 })
  );
});

document.querySelectorAll('.btn-primary').forEach(el => {
  el.addEventListener('mouseenter', () =>
    animate(el, { scale: 1.04 }, { type: 'spring', stiffness: 300, damping: 25 })
  );
  el.addEventListener('mouseleave', () =>
    animate(el, { scale: 1 }, { type: 'spring', stiffness: 300, damping: 25 })
  );
});
