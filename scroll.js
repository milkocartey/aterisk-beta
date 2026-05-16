import { animate, inView } from './motion.js';

// ── Safety timer — forces visibility for CSS-hidden elements ───────────────
// Covers .step, .why-point, .sector-card, #cta-title if inView never fires.
setTimeout(() => {
  document.querySelectorAll('.step, .why-point, .sector-card').forEach(el => {
    const op = getComputedStyle(el).opacity;
    if (op === '0' || el.style.opacity === '0') {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    }
  });
  const ctaT = document.getElementById('cta-title');
  if (ctaT) {
    const op = getComputedStyle(ctaT).opacity;
    if (op === '0' || ctaT.style.opacity === '0') {
      ctaT.style.opacity   = '1';
      ctaT.style.transform = 'none';
    }
  }
}, 2000);

// ── whenVisible: fires immediately if in viewport, else waits ─────────────
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

// ── SECTION SCROLL ANIMATIONS ─────────────────────────────────────────────

// 1. Steps — stagger from below with spring
const stepsContainer = document.querySelector('.steps');
if (stepsContainer) {
  whenVisible(stepsContainer, () => {
    const steps = stepsContainer.querySelectorAll('.step');
    steps.forEach((el, i) => {
      animate(
        el,
        { opacity: [0, 1], y: [48, 0] },
        { type: 'spring', stiffness: 70, damping: 16, delay: i * 0.1 }
      );
    });
  });
}

// 2. Why-points — stagger from left with spring
const whyPoints = document.querySelector('.why-points');
if (whyPoints) {
  whenVisible(whyPoints, () => {
    const points = whyPoints.querySelectorAll('.why-point');
    points.forEach((el, i) => {
      animate(
        el,
        { opacity: [0, 1], x: [-32, 0] },
        { type: 'spring', stiffness: 80, damping: 18, delay: i * 0.1 }
      );
    });
  });
}

// 3. Sector cards — scale + fade stagger
const sectorsGrid = document.querySelector('.sectors-grid');
if (sectorsGrid) {
  whenVisible(sectorsGrid, () => {
    const cards = sectorsGrid.querySelectorAll('.sector-card');
    cards.forEach((el, i) => {
      animate(
        el,
        { opacity: [0, 1], scale: [0.94, 1], y: [20, 0] },
        { type: 'spring', stiffness: 90, damping: 18, delay: i * 0.06 }
      );
    });
  });
}

// 4. CTA section — title scale-in + button pulse
const ctaTitle = document.getElementById('cta-title');
if (ctaTitle) {
  whenVisible(ctaTitle, () => {
    animate(
      ctaTitle,
      { opacity: [0, 1], scale: [0.95, 1], y: [24, 0] },
      { type: 'spring', stiffness: 70, damping: 16 }
    );
    setTimeout(() => {
      const ctaBtn = document.querySelector('.cta-section .btn-primary');
      if (ctaBtn) {
        animate(
          ctaBtn,
          { scale: [1, 1.05, 1] },
          { duration: 0.6, easing: 'ease-in-out' }
        );
      }
    }, 700);
  });
}

// ── HOVER INTERACTIONS ────────────────────────────────────────────────────

// Sector cards — lift + scale
document.querySelectorAll('.sector-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    animate(el, { scale: 1.03, y: -6 }, { type: 'spring', stiffness: 280, damping: 22 });
  });
  el.addEventListener('mouseleave', () => {
    animate(el, { scale: 1, y: 0 }, { type: 'spring', stiffness: 280, damping: 22 });
  });
});

// Why-points — nudge right
document.querySelectorAll('.why-point').forEach(el => {
  el.addEventListener('mouseenter', () => {
    animate(el, { x: 8 }, { type: 'spring', stiffness: 400, damping: 30 });
  });
  el.addEventListener('mouseleave', () => {
    animate(el, { x: 0 }, { type: 'spring', stiffness: 400, damping: 30 });
  });
});

// Buttons — scale
document.querySelectorAll('.btn-primary').forEach(el => {
  el.addEventListener('mouseenter', () => {
    animate(el, { scale: 1.04 }, { type: 'spring', stiffness: 300, damping: 25 });
  });
  el.addEventListener('mouseleave', () => {
    animate(el, { scale: 1 }, { type: 'spring', stiffness: 300, damping: 25 });
  });
});
