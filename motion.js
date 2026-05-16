import { animate, inView, scroll } from "https://cdn.jsdelivr.net/npm/motion@latest/+esm";

// Animate all .fade-up elements when they enter the viewport.
// On mobile (<= 768px) the CSS already shows them — skip JS animation.
const prefersMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = !window.matchMedia('(max-width: 768px)').matches;

if (prefersMotion && isDesktop) {
  document.querySelectorAll('.fade-up').forEach(el => {
    // Set initial hidden state via inline style so it is independent of CSS.
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';

    inView(
      el,
      () => {
        animate(
          el,
          { opacity: 1, y: 0 },
          { type: 'spring', stiffness: 80, damping: 18 }
        );
      },
      { amount: 0.05 }
    );
  });
}

export { animate, inView, scroll };
