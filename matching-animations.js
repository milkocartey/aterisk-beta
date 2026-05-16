// matching-animations.js
// Animations mentor cards — ATERISK matching page
// Spring physics maison, pas de dépendance externe.

(function () {
  'use strict';

  var BASE_SHADOW  = '0 4px 24px rgba(26,46,122,0.08)';
  var HOVER_SHADOW = '0 20px 60px rgba(26,46,122,0.15)';

  // ── Spring tick (une boucle RAF par carte) ────────────────────────────────
  // Chaque carte a son propre état { y, yVel, sc, scVel, op, opVel }.
  // La même fonction tourne pendant l'entrée ET le hover.

  function makeSpringState() {
    return {
      // position courante
      y: 0, yVel: 0,
      sc: 1, scVel: 0,
      op: 0, opVel: 0,
      // cibles
      targetY: 0, targetSc: 1, targetOp: 1,
      // paramètres (modifiables selon le mode)
      stiffY: 80, dampY: 18,
      stiffSc: 80, dampSc: 18,
      stiffOp: 52, dampOp: 18,  // opacity légèrement moins rigide
      // boucle
      raf: null, last: null,
      // état entrée terminée
      entryDone: false
    };
  }

  function runTick(el, state, onEntryDone) {
    function tick(now) {
      if (!state.last) state.last = now;
      var dt = Math.min((now - state.last) / 1000, 0.05);
      state.last = now;

      // Y
      state.yVel  += (-state.stiffY  * (state.y  - state.targetY)  - state.dampY  * state.yVel)  * dt;
      state.y     += state.yVel * dt;
      // Scale
      state.scVel += (-state.stiffSc * (state.sc - state.targetSc) - state.dampSc * state.scVel) * dt;
      state.sc    += state.scVel * dt;
      // Opacity
      state.opVel += (-state.stiffOp * (state.op - state.targetOp) - state.dampOp * state.opVel) * dt;
      state.op    += state.opVel * dt;
      state.op     = Math.min(1, Math.max(0, state.op));

      el.style.opacity   = state.op.toFixed(4);
      el.style.transform = 'translateY(' + state.y.toFixed(3) + 'px) scale(' + state.sc.toFixed(5) + ')';

      // Shadow interpolée au hover (après entrée)
      if (state.entryDone) {
        el.style.boxShadow = Math.abs(state.y) > 0.3 || state.sc > 1.001
          ? HOVER_SHADOW : BASE_SHADOW;
      }

      var settledY  = Math.abs(state.y  - state.targetY)  < 0.05 && Math.abs(state.yVel)  < 0.05;
      var settledSc = Math.abs(state.sc - state.targetSc) < 0.001 && Math.abs(state.scVel) < 0.001;
      var settledOp = Math.abs(state.op - state.targetOp) < 0.002 && Math.abs(state.opVel) < 0.002;

      if (settledY && settledSc && settledOp) {
        state.y  = state.targetY;
        state.sc = state.targetSc;
        state.op = state.targetOp;

        // Nettoyage des inline styles si on est revenu au repos
        if (state.targetY === 0 && state.targetSc === 1) {
          el.style.transform = '';
          el.style.boxShadow = '';
        }
        if (state.targetOp === 1) {
          el.style.opacity = '';
        }

        state.raf  = null;
        state.last = null;

        if (!state.entryDone && onEntryDone) {
          state.entryDone = true;
          onEntryDone();
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

  // ── Entrée : y:24 opacity:0 scale:0.97 → repos ───────────────────────────
  function enterCard(el, state, delay) {
    // Position initiale
    state.y  = 24;   state.targetY  = 0;
    state.sc = 0.97; state.targetSc = 1;
    state.op = 0;    state.targetOp = 1;
    // Spring d'entrée
    state.stiffY  = 80; state.dampY  = 18;
    state.stiffSc = 80; state.dampSc = 18;
    state.stiffOp = 52; state.dampOp = 18;

    // Figer les styles immédiatement (avant que nav.js révèle le body)
    el.style.transition = 'none';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px) scale(0.97)';

    setTimeout(function () {
      runTick(el, state, function () {
        setupHover(el, state);
      });
    }, delay);
  }

  // ── Hover spring : mouseenter ↔ mouseleave ────────────────────────────────
  function setupHover(el, state) {
    el.addEventListener('mouseenter', function () {
      state.targetY  = -6;
      state.targetSc = 1.02;
      state.targetOp = 1;
      // Spring hover plus réactif
      state.stiffY  = 200; state.dampY  = 20;
      state.stiffSc = 200; state.dampSc = 20;
      state.stiffOp = 200; state.dampOp = 20;
      runTick(el, state, null);
    });

    el.addEventListener('mouseleave', function () {
      state.targetY  = 0;
      state.targetSc = 1;
      state.targetOp = 1;
      runTick(el, state, null);
    });
  }

  // ── Animation filtre (si select/input présent) ────────────────────────────
  function setupFilterAnim(cards) {
    var filters = document.querySelectorAll('select, input[type="radio"], input[type="checkbox"]');
    if (!filters.length) return;

    filters.forEach(function (input) {
      input.addEventListener('change', function () {
        cards.forEach(function (card) {
          // Flash discret : dim + shrink, puis retour
          card.el.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
          card.el.style.opacity    = '0.4';
          card.el.style.transform  = 'scale(0.98)';

          setTimeout(function () {
            card.el.style.opacity   = '1';
            card.el.style.transform = '';
            setTimeout(function () {
              card.el.style.transition = 'none';
              // Resynchroniser l'état spring
              card.state.y  = 0; card.state.yVel  = 0;
              card.state.sc = 1; card.state.scVel = 0;
              card.state.op = 1; card.state.opVel = 0;
            }, 200);
          }, 200);
        });
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    var cardEls = document.querySelectorAll('.mentor-card');
    var cards   = [];

    cardEls.forEach(function (el, i) {
      var state = makeSpringState();
      cards.push({ el: el, state: state });
      enterCard(el, state, i * 70);   // stagger 70 ms ≈ 0.07 s
    });

    setupFilterAnim(cards);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
