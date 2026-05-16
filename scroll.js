import { animate, inView } from './motion.js';

// ── whenVisible: fires immediately if container is in viewport ────────────
function whenVisible(container, callback) {
  const rect = container.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
    callback();
    return;
  }

  let fired = false;
  function fire() {
    if (fired) return;
    fired = true;
    callback();
  }

  inView(container, fire, { amount: 'some' });

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setTimeout(fire, 100);
    });
  }, { threshold: 0.05 });
  io.observe(container);
}

// ── Smooth stagger entrance ───────────────────────────────────────────────
// Uses setTimeout for stagger (more reliable than delay param for springs).
// After animation, sets inline opacity:1 so CSS `opacity:0` doesn't win back.
function staggerIn(elements, { fromY = 48, fromX = 0, scale = 1, gap = 120, duration = 0.65 } = {}) {
  const easing = [0.22, 1, 0.36, 1]; // expo ease-out
  elements.forEach((el, i) => {
    // Pre-hide with inline styles (overrides CSS opacity:0)
    el.style.opacity   = '0';
    el.style.transform = `translate(${fromX}px, ${fromY}px) scale(${scale})`;
  });

  elements.forEach((el, i) => {
    setTimeout(() => {
      animate(
        el,
        { opacity: [0, 1], x: [fromX, 0], y: [fromY, 0], scale: [scale, 1] },
        { duration, easing }
      ).finished.then(() => {
        // Keep inline opacity:1 so CSS opacity:0 doesn't claw back
        el.style.opacity   = '1';
        el.style.transform = 'none';
      });
    }, i * gap);
  });
}

// ── Safety timer — catches CSS-hidden elements if animation never fires ───
setTimeout(() => {
  document.querySelectorAll('.step, .why-point, .sector-card').forEach(el => {
    if (el.style.opacity === '0' || getComputedStyle(el).opacity === '0') {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    }
  });
  const ctaT = document.getElementById('cta-title');
  if (ctaT && (ctaT.style.opacity === '0' || getComputedStyle(ctaT).opacity === '0')) {
    ctaT.style.opacity   = '1';
    ctaT.style.transform = 'none';
  }
}, 2500);

// ── SECTION SCROLL ANIMATIONS ─────────────────────────────────────────────

// 1. Steps — slide up with stagger
const stepsContainer = document.querySelector('.steps');
if (stepsContainer) {
  const steps = Array.from(stepsContainer.querySelectorAll('.step'));

  // Pre-hide immediately (before observer fires)
  steps.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(60px)';
  });

  whenVisible(stepsContainer, () => staggerIn(steps, { fromY: 60, gap: 130, duration: 0.7 }));
}

// 2. Why-points — slide from left with stagger
const whyPoints = document.querySelector('.why-points');
if (whyPoints) {
  const points = Array.from(whyPoints.querySelectorAll('.why-point'));

  points.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateX(-40px)';
  });

  whenVisible(whyPoints, () => staggerIn(points, { fromX: -40, fromY: 0, gap: 110, duration: 0.6 }));
}

// 3. Sector cards — scale + fade stagger
const sectorsGrid = document.querySelector('.sectors-grid');
if (sectorsGrid) {
  const cards = Array.from(sectorsGrid.querySelectorAll('.sector-card'));

  cards.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(32px) scale(0.94)';
  });

  whenVisible(sectorsGrid, () => staggerIn(cards, { fromY: 32, scale: 0.94, gap: 70, duration: 0.55 }));
}

// 4. CTA title — scale + fade
const ctaTitle = document.getElementById('cta-title');
if (ctaTitle) {
  ctaTitle.style.opacity   = '0';
  ctaTitle.style.transform = 'translateY(32px) scale(0.96)';

  whenVisible(ctaTitle, () => {
    animate(
      ctaTitle,
      { opacity: [0, 1], y: [32, 0], scale: [0.96, 1] },
      { duration: 0.7, easing: [0.22, 1, 0.36, 1] }
    ).finished.then(() => {
      ctaTitle.style.opacity   = '1';
      ctaTitle.style.transform = 'none';

      // Attention pulse on the CTA button
      setTimeout(() => {
        const btn = document.querySelector('.cta-section .btn-primary');
        if (btn) {
          animate(btn, { scale: [1, 1.06, 1] }, { duration: 0.55, easing: 'ease-in-out' });
        }
      }, 600);
    });
  });
}

// ── HOVER INTERACTIONS ────────────────────────────────────────────────────

// Sector cards — lift + scale
document.querySelectorAll('.sector-card').forEach(el => {
  el.addEventListener('mouseenter', () =>
    animate(el, { scale: 1.03, y: -6 }, { type: 'spring', stiffness: 280, damping: 22 })
  );
  el.addEventListener('mouseleave', () =>
    animate(el, { scale: 1, y: 0 }, { type: 'spring', stiffness: 280, damping: 22 })
  );
});

// Why-points — nudge right
document.querySelectorAll('.why-point').forEach(el => {
  el.addEventListener('mouseenter', () =>
    animate(el, { x: 8 }, { type: 'spring', stiffness: 400, damping: 30 })
  );
  el.addEventListener('mouseleave', () =>
    animate(el, { x: 0 }, { type: 'spring', stiffness: 400, damping: 30 })
  );
});

// Buttons — scale
document.querySelectorAll('.btn-primary').forEach(el => {
  el.addEventListener('mouseenter', () =>
    animate(el, { scale: 1.04 }, { type: 'spring', stiffness: 300, damping: 25 })
  );
  el.addEventListener('mouseleave', () =>
    animate(el, { scale: 1 }, { type: 'spring', stiffness: 300, damping: 25 })
  );
});
