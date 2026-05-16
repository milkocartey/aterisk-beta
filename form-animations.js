import { animate } from './motion.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const SPRING_LABEL = { type: 'spring', stiffness: 300, damping: 28 };
const SPRING_ENTER = { type: 'spring', stiffness: 90,  damping: 20 };
const SPRING_HOVER = { type: 'spring', stiffness: 300, damping: 25 };

const BLUE_MID    = '#2A45B0';
const BORDER_CLR  = '#DDE3F0';

// ── Label float ───────────────────────────────────────────────────────────────
function initLabelFloat() {
  document.querySelectorAll('.field').forEach(field => {
    const label = field.querySelector('label');
    const input = field.querySelector('input:not([type="checkbox"]), textarea');
    if (!label || !input) return;

    const idleColor = getComputedStyle(label).color;
    label.style.transformOrigin = 'left center';

    input.addEventListener('focus', () => {
      animate(label, { y: -20, scale: 0.82, color: BLUE_MID }, SPRING_LABEL);
    });

    input.addEventListener('blur', () => {
      if (!input.value.trim()) {
        animate(label, { y: 0, scale: 1, color: idleColor }, SPRING_LABEL);
      }
    });
  });
}

// ── Focus ring (Motion-owned) ─────────────────────────────────────────────────
function initFocusRing() {
  document.querySelectorAll('.field input:not([type="checkbox"]), .field textarea').forEach(input => {
    input.addEventListener('focus', () => {
      animate(input, {
        borderColor: BLUE_MID,
        boxShadow: '0 0 0 3px rgba(42,69,176,0.15)'
      }, { duration: 0.18, easing: 'ease-out' });
    });

    input.addEventListener('blur', () => {
      const isError = input.classList.contains('error') || input.classList.contains('field-error');
      animate(input, {
        borderColor: isError ? '#DC2626' : BORDER_CLR,
        boxShadow: '0 0 0 0px rgba(42,69,176,0)'
      }, { duration: 0.2, easing: 'ease-out' });
    });
  });
}

// ── Submit button hover ───────────────────────────────────────────────────────
function initButtonHover() {
  document.querySelectorAll('.btn-login, .btn-next').forEach(btn => {
    btn.style.willChange = 'transform';

    btn.addEventListener('mouseenter', () => {
      if (btn.disabled) return;
      animate(btn, { y: -2 }, SPRING_HOVER);
    });
    btn.addEventListener('mouseleave', () => {
      animate(btn, { y: 0 }, SPRING_HOVER);
    });
    btn.addEventListener('mousedown', () => {
      if (btn.disabled) return;
      animate(btn, { scale: 0.97 }, { duration: 0.08 });
    });
    btn.addEventListener('mouseup', () => {
      animate(btn, { scale: 1 }, { type: 'spring', stiffness: 400, damping: 20 });
    });
  });
}

// ── Page enter stagger ────────────────────────────────────────────────────────
function initPageEnterStagger() {
  // Multi-step forms: only stagger the active step's fields
  const activeStep = document.querySelector('.step-block.active');
  const container  = activeStep || document.body;
  const fields     = Array.from(container.querySelectorAll('.field'));

  // Pre-hide synchronously
  fields.forEach(f => {
    f.style.opacity = '0';
    f.style.transform = 'translateY(20px)';
  });

  // Stagger in
  fields.forEach((field, i) => {
    animate(field, { opacity: 1, y: 0 }, { ...SPRING_ENTER, delay: i * 0.05 });
  });
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Call this after a successful form submission to animate the button.
 * @param {HTMLElement} btn
 * @param {string} text
 */
export function triggerSubmitSuccess(btn, text = "✓ C'est parti !") {
  btn.disabled = true;
  animate(btn, { scale: 0.95 }, { duration: 0.08 }).then(() => {
    btn.textContent = text;
    animate(btn, { scale: 1, backgroundColor: '#16A34A' }, {
      type: 'spring', stiffness: 200, damping: 18
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLabelFloat();
  initFocusRing();
  initButtonHover();
  initPageEnterStagger();
});
