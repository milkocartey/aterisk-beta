import { animate, inView } from "https://cdn.jsdelivr.net/npm/motion@latest/+esm";

// ── SECTION SCROLL ANIMATIONS ─────────────────────────────────────────────

// 1. #comment — 4 .step elements, stagger
const stepsContainer = document.querySelector('.steps');
if (stepsContainer) {
  inView(
    stepsContainer,
    () => {
      const steps = stepsContainer.querySelectorAll('.step');
      const delays = [0, 0.08, 0.16, 0.24];
      steps.forEach((el, i) => {
        animate(
          el,
          { opacity: [0, 1], y: [24, 0] },
          { type: 'spring', stiffness: 90, damping: 20, delay: delays[i] ?? i * 0.08 }
        );
      });
    },
    { amount: 'some' }
  );
}

// 2. .why-section — .why-point elements, stagger x slide
const whyPoints = document.querySelector('.why-points');
if (whyPoints) {
  inView(
    whyPoints,
    () => {
      const points = whyPoints.querySelectorAll('.why-point');
      const delays = [0, 0.1, 0.18, 0.26];
      points.forEach((el, i) => {
        animate(
          el,
          { opacity: [0, 1], x: [-20, 0] },
          { type: 'spring', stiffness: 100, damping: 22, delay: delays[i] ?? i * 0.1 }
        );
      });
    },
    { amount: 'some' }
  );
}

// 3. .sectors-section — .sector-card elements, stagger scale
const sectorsGrid = document.querySelector('.sectors-grid');
if (sectorsGrid) {
  inView(
    sectorsGrid,
    () => {
      const cards = sectorsGrid.querySelectorAll('.sector-card');
      cards.forEach((el, i) => {
        animate(
          el,
          { opacity: [0, 1], scale: [0.95, 1] },
          { type: 'spring', stiffness: 120, damping: 22, delay: i * 0.05 }
        );
      });
    },
    { amount: 'some' }
  );
}

// 4. .cta-section — title scale in, then btn-primary attention pulse
const ctaTitle = document.getElementById('cta-title');
if (ctaTitle) {
  inView(
    ctaTitle,
    () => {
      animate(
        ctaTitle,
        { opacity: [0, 1], scale: [0.97, 1] },
        { type: 'spring', stiffness: 80, damping: 20 }
      );
      setTimeout(() => {
        const ctaBtn = document.querySelector('.cta-section .btn-primary');
        if (ctaBtn) {
          animate(
            ctaBtn,
            { scale: [1, 1.04, 1] },
            { duration: 0.5, easing: 'ease-in-out' }
          );
        }
      }, 800);
    },
    { amount: 'some' }
  );
}

// ── HOVER INTERACTIONS ────────────────────────────────────────────────────

// .sector-card — scale + lift on hover
document.querySelectorAll('.sector-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    animate(el, { scale: 1.03, y: -4 }, { type: 'spring', stiffness: 250, damping: 22, duration: 0.25 });
  });
  el.addEventListener('mouseleave', () => {
    animate(el, { scale: 1, y: 0 }, { type: 'spring', stiffness: 250, damping: 22 });
  });
});

// .why-point — nudge right on hover
document.querySelectorAll('.why-point').forEach(el => {
  el.addEventListener('mouseenter', () => {
    animate(el, { x: 6 }, { type: 'spring', stiffness: 400, damping: 30, duration: 0.2 });
  });
  el.addEventListener('mouseleave', () => {
    animate(el, { x: 0 }, { type: 'spring', stiffness: 400, damping: 30 });
  });
});

// .btn-primary — scale on hover
document.querySelectorAll('.btn-primary').forEach(el => {
  el.addEventListener('mouseenter', () => {
    animate(el, { scale: 1.03 }, { type: 'spring', stiffness: 300, damping: 25 });
  });
  el.addEventListener('mouseleave', () => {
    animate(el, { scale: 1 }, { type: 'spring', stiffness: 300, damping: 25 });
  });
});
