// tarifs-animations.js
// Animations pricing cards — ATERISK tarifs page
// Spring physics maison, pas de dépendance externe.

(function () {
  'use strict';

  var BASE_SHADOW    = '0 4px 24px rgba(26,46,122,0.08)';
  var HOVER_SHADOW   = '0 24px 64px rgba(26,46,122,0.16)';
  // Ombre spéciale pour la card featured (anneau bleu + ombre amplifiée)
  var FEATURED_BASE  = '0 0 0 4px rgba(26,46,122,0.08), 0 4px 24px rgba(26,46,122,0.08)';
  var FEATURED_HOVER = '0 0 0 4px rgba(26,46,122,0.12), 0 24px 64px rgba(26,46,122,0.18)';

  // ── Spring state factory ───────────────────────────────────────────────────
  function makeState() {
    return {
      y: 0, yVel: 0,
      sc: 1, scVel: 0,
      op: 0, opVel: 0,
      targetY: 0, targetSc: 1, targetOp: 1,
      stiffY: 70, dampY: 16,
      stiffSc: 70, dampSc: 16,
      stiffOp: 46, dampOp: 16,
      raf: null, last: null,
      entryDone: false,
      featured: false
    };
  }

  // ── Boucle RAF unifiée (entrée + hover) ───────────────────────────────────
  function runTick(el, state, onDone) {
    function tick(now) {
      if (!state.last) state.last = now;
      var dt = Math.min((now - state.last) / 1000, 0.05);
      state.last = now;

      state.yVel  += (-state.stiffY  * (state.y  - state.targetY)  - state.dampY  * state.yVel)  * dt;
      state.y     += state.yVel * dt;

      state.scVel += (-state.stiffSc * (state.sc - state.targetSc) - state.dampSc * state.scVel) * dt;
      state.sc    += state.scVel * dt;

      state.opVel += (-state.stiffOp * (state.op - state.targetOp) - state.dampOp * state.opVel) * dt;
      state.op    += state.opVel * dt;
      state.op     = Math.min(1, Math.max(0, state.op));

      el.style.opacity   = state.op.toFixed(4);
      el.style.transform = 'translateY(' + state.y.toFixed(3) + 'px) scale(' + state.sc.toFixed(5) + ')';

      // Shadow interpolée (après entrée seulement)
      if (state.entryDone) {
        var hovering = Math.abs(state.y) > 0.3 || state.sc > 1.001;
        el.style.boxShadow = hovering
          ? (state.featured ? FEATURED_HOVER : HOVER_SHADOW)
          : (state.featured ? FEATURED_BASE  : BASE_SHADOW);
      }

      var settledY  = Math.abs(state.y  - state.targetY)  < 0.05 && Math.abs(state.yVel)  < 0.05;
      var settledSc = Math.abs(state.sc - state.targetSc) < 0.001 && Math.abs(state.scVel) < 0.001;
      var settledOp = Math.abs(state.op - state.targetOp) < 0.002 && Math.abs(state.opVel) < 0.002;

      if (settledY && settledSc && settledOp) {
        state.y  = state.targetY;
        state.sc = state.targetSc;
        state.op = state.targetOp;

        if (state.targetY === 0 && state.targetSc === 1) {
          el.style.transform = '';
          el.style.boxShadow = state.featured ? FEATURED_BASE : '';
        }
        if (state.targetOp === 1) el.style.opacity = '';

        state.raf  = null;
        state.last = null;

        if (!state.entryDone && onDone) {
          state.entryDone = true;
          onDone();
        }
      } else {
        state.raf = requestAnimationFrame(tick);
      }
    }

    if (!state.raf) {
      state.last = null;
      state.raf  = requestAnimationFrame(tick);
    }
  }

  // ── Entrée stagger ─────────────────────────────────────────────────────────
  // Cards normales : y:32 opacity:0 scale:0.97 → repos (spring 70/16)
  // Card centrale  : même + scale:0.95 → 1 avec overshoot ~1.02 (spring doux)
  function enterCard(el, state, delay) {
    var isFeatured = state.featured;

    state.y        = 32;
    state.targetY  = 0;
    state.sc       = isFeatured ? 0.95 : 0.97;
    state.targetSc = 1;
    state.op       = 0;
    state.targetOp = 1;

    // Spring entrée : 70/16 pour y+opacity, échelle douce pour la featured
    state.stiffY  = 70;  state.dampY  = 16;
    state.stiffOp = 46;  state.dampOp = 16;

    if (isFeatured) {
      // Faible damping sur le scale → overshoot naturel jusqu'à ~1.02
      state.stiffSc = 120; state.dampSc = 7;
    } else {
      state.stiffSc = 70;  state.dampSc = 16;
    }

    el.style.transition = 'none';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(32px) scale(' + state.sc + ')';

    setTimeout(function () {
      runTick(el, state, function () {
        setupHover(el, state);
      });
    }, delay);
  }

  // ── Hover spring ──────────────────────────────────────────────────────────
  function setupHover(el, state) {
    el.addEventListener('mouseenter', function () {
      state.targetY  = -8;
      state.targetSc = 1.02;
      state.stiffY   = 200; state.dampY   = 22;
      state.stiffSc  = 200; state.dampSc  = 22;
      state.stiffOp  = 200; state.dampOp  = 22;
      runTick(el, state, null);
    });

    el.addEventListener('mouseleave', function () {
      state.targetY  = 0;
      state.targetSc = 1;
      runTick(el, state, null);
    });
  }

  // ── Toggle mensuel / annuel (si présent dans le DOM) ─────────────────────
  // Cherche tout élément avec [data-billing-toggle], #billingToggle,
  // ou <input type="checkbox"> / <select> lié aux prix.
  function setupPriceToggle() {
    var toggle =
      document.querySelector('[data-billing-toggle]') ||
      document.querySelector('#billingToggle')        ||
      document.querySelector('.billing-toggle input') ||
      document.querySelector('.toggle-switch input');

    if (!toggle) return;

    var priceEls = document.querySelectorAll('.plan-price .amount, .amount, [data-price]');

    toggle.addEventListener('change', function () {
      priceEls.forEach(function (el) {
        // Flash : opacity + scale doux
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.style.transform  = 'scale(0.9)';

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            el.style.opacity    = '1';
            el.style.transform  = 'scale(1)';

            el.addEventListener('transitionend', function cleanup() {
              el.style.transition = '';
              el.style.opacity    = '';
              el.style.transform  = '';
              el.removeEventListener('transitionend', cleanup);
            });
          });
        });
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    var planCards = document.querySelectorAll('.plan-card');
    // Délais : 0 ms, 120 ms, 240 ms
    var delays = [0, 120, 240];

    planCards.forEach(function (el, i) {
      var state    = makeState();
      state.featured = el.classList.contains('featured');
      enterCard(el, state, delays[i] || i * 120);
    });

    setupPriceToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
