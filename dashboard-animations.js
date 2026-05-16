// dashboard-animations.js
// Animations d'entrée pour les dashboards ATERISK (étudiant + mentor)
// Aucune dépendance externe — spring physics maison via requestAnimationFrame.

(function () {
  'use strict';

  // ─── Spring physics ────────────────────────────────────────────────────────
  // Résout une animation spring en boucle RAF.
  // stiffness ≈ "rapidité", damping ≈ "amorti". Damping bas → léger overshoot.
  function springAnimate({ from, to, stiffness, damping, onUpdate, onDone }) {
    let pos = from, vel = 0, last = null;

    function tick(now) {
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, 0.05); // cap 50 ms
      last = now;

      const force = -stiffness * (pos - to) - damping * vel;
      vel += force * dt;
      pos += vel * dt;

      onUpdate(pos);

      const settled =
        Math.abs(pos - to) < 0.0015 && Math.abs(vel) < 0.0015;

      if (settled) {
        onUpdate(to);
        onDone && onDone();
      } else {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  // ─── Easing ease-out expo ──────────────────────────────────────────────────
  // cubic-bezier(0.16, 1, 0.3, 1) — utilisé pour les compteurs.
  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  // ─── Entrée d'un élément (opacity + translate) ─────────────────────────────
  function enterElement(el, { dx = 0, dy = 0, stiffness = 90, damping = 18, delay = 0 }) {
    el.style.opacity = '0';
    if (dx !== 0 || dy !== 0) {
      el.style.transform = `translate(${dx}px,${dy}px)`;
    }

    setTimeout(function () {
      // Opacity via spring légèrement plus amorti
      springAnimate({
        from: 0, to: 1,
        stiffness: stiffness * 0.65, damping: damping,
        onUpdate: function (v) {
          el.style.opacity = String(Math.min(1, Math.max(0, v)));
        },
        onDone: function () {
          el.style.opacity = '';
        }
      });

      // Translate via spring (séparé pour pouvoir avoir l'overshoot)
      if (dx !== 0 || dy !== 0) {
        let px = dx, py = dy, vx = 0, vy = 0, last2 = null;

        function posStep(now) {
          if (last2 === null) last2 = now;
          const dt = Math.min((now - last2) / 1000, 0.05);
          last2 = now;

          vx += (-stiffness * px - damping * vx) * dt;
          px += vx * dt;

          vy += (-stiffness * py - damping * vy) * dt;
          py += vy * dt;

          el.style.transform = 'translate(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px)';

          const done =
            Math.abs(px) < 0.05 && Math.abs(py) < 0.05 &&
            Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05;

          if (done) {
            el.style.transform = '';
          } else {
            requestAnimationFrame(posStep);
          }
        }

        requestAnimationFrame(posStep);
      }
    }, delay);
  }

  // ─── Compteur animé ────────────────────────────────────────────────────────
  // Anime un entier de 0 → valeur réelle, easing ease-out expo 1.4 s.
  // Ne touche que les éléments dont le contenu commence par un chiffre.
  function animateCounter(el, baseDelay) {
    const original = el.textContent.trim();
    if (!/^\d/.test(original)) return;

    // Extrait la partie numérique au début + suffixe éventuel (€, %, texte)
    const m = original.match(/^([\d\s]+)(.*)/);
    if (!m) return;

    const target = parseInt(m[1].replace(/\s/g, ''), 10);
    const suffix = m[2];
    if (!isFinite(target) || target <= 0) return;

    setTimeout(function () {
      const start = performance.now();
      const duration = 1400;

      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const val = Math.round(easeOutExpo(t) * target);
        el.textContent = val.toLocaleString('fr-FR') + suffix;
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = original; // restaure l'original exact
        }
      }

      requestAnimationFrame(step);
    }, baseDelay);
  }

  // ─── Barre de progression (width) ─────────────────────────────────────────
  function animateBarWidth(el, targetPct, delay) {
    el.style.width = '0%';
    setTimeout(function () {
      springAnimate({
        from: 0, to: targetPct,
        stiffness: 60, damping: 20,
        onUpdate: function (v) {
          el.style.width = Math.max(0, v).toFixed(2) + '%';
        },
        onDone: function () {
          el.style.width = targetPct + '%';
        }
      });
    }, delay);
  }

  // ─── Barre de graphique (height) ───────────────────────────────────────────
  function animateBarHeight(el, targetPx, delay) {
    el.style.height = '0px';
    setTimeout(function () {
      springAnimate({
        from: 0, to: targetPx,
        stiffness: 60, damping: 20,
        onUpdate: function (v) {
          el.style.height = Math.max(0, v).toFixed(2) + 'px';
        },
        onDone: function () {
          el.style.height = targetPx + 'px';
        }
      });
    }, delay);
  }

  // ─── SVG anneau de progression ─────────────────────────────────────────────
  function animateSvgRing(circle, delay) {
    const dash = circle.getAttribute('stroke-dasharray');
    if (!dash) return;
    const parts = dash.split(/\s+/);
    const drawn = parseFloat(parts[0]);
    const total = parseFloat(parts[1]);
    if (!isFinite(drawn) || !isFinite(total) || drawn <= 0) return;

    circle.setAttribute('stroke-dasharray', '0 ' + total);

    setTimeout(function () {
      springAnimate({
        from: 0, to: drawn,
        stiffness: 60, damping: 20,
        onUpdate: function (v) {
          circle.setAttribute(
            'stroke-dasharray',
            Math.max(0, v).toFixed(2) + ' ' + total
          );
        },
        onDone: function () {
          circle.setAttribute('stroke-dasharray', drawn + ' ' + total);
        }
      });
    }, delay);
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // nav.js gère déjà body opacity 0→1 — on ne touche pas body.

    var sidebar = document.querySelector('.sidebar');

    // ── Lire les valeurs cibles des progress bars AVANT de les réinitialiser à 0
    // (les valeurs sont dans les style inline, on doit les lire maintenant)
    var barWidths = [];
    document.querySelectorAll('.eprog-fill, .rating-bar').forEach(function (el) {
      var w = parseFloat(el.style.width) || 0;
      if (w > 0) barWidths.push({ el: el, target: w });
    });

    var barHeights = [];
    document.querySelectorAll('.earn-bar').forEach(function (el) {
      var h = parseFloat(el.style.height) || 0;
      if (h > 0) barHeights.push({ el: el, target: h });
    });

    // ── 1. SIDEBAR — items de navigation (x:-12, stagger 40 ms) ──────────────
    if (sidebar) {
      var navItems = sidebar.querySelectorAll('.nav-item');
      navItems.forEach(function (item, i) {
        enterElement(item, {
          dx: -12, dy: 0,
          stiffness: 120, damping: 24,
          delay: i * 40
        });
      });
    }

    // ── 2. CARDS — entrée depuis y:20 (stagger 60 ms) ─────────────────────────
    // Cible les blocs principaux visibles (.welcome-banner, .stat-card, .card).
    // Pour le dashboard mentor (sections), on ne cible que la section active.
    var scope = document;
    var activeSection = document.querySelector('.section.active');
    if (activeSection) {
      // Le mentor dashboard utilise un système de sections : on anime seulement
      // le contenu de la section visible au chargement.
      scope = activeSection;
    }

    var allCardEls = Array.from(
      scope.querySelectorAll('.welcome-banner, .stat-card, .card')
    ).filter(function (el) {
      // Exclure les éléments dans la sidebar
      return !(sidebar && sidebar.contains(el));
    });

    // Dédupliquer : si un élément est enfant d'un autre élément de la liste,
    // l'ancêtre absorbe l'entrée — on ne double-anime pas.
    var cardSet = new Set(allCardEls);
    var cards = allCardEls.filter(function (el) {
      var p = el.parentElement;
      while (p) {
        if (cardSet.has(p)) return false; // ancêtre déjà dans la liste
        p = p.parentElement;
      }
      return true;
    });

    cards.forEach(function (card, i) {
      enterElement(card, {
        dx: 0, dy: 20,
        stiffness: 90, damping: 18,
        delay: i * 60
      });
    });

    // ── 3. CHIFFRES / STATS — compteurs animés ────────────────────────────────
    // .s-val = dashboard étudiant  |  .sv = dashboard mentor
    var statEls = Array.from(
      (activeSection || document).querySelectorAll('.s-val, .sv')
    ).filter(function (el) {
      return !(sidebar && sidebar.contains(el));
    });

    statEls.forEach(function (el) {
      animateCounter(el, 180); // léger délai pour laisser les cards apparaître
    });

    // ── 4. JAUGES / PROGRESS BARS ─────────────────────────────────────────────
    // Width bars (.eprog-fill sidebar gain, .rating-bar avis)
    barWidths.forEach(function (item, i) {
      animateBarWidth(item.el, item.target, 500 + i * 60);
    });

    // Height bars (histogramme gains .earn-bar)
    barHeights.forEach(function (item, i) {
      animateBarHeight(item.el, item.target, 700 + i * 80);
    });

    // ── 5. SVG ANNEAU (dashboard étudiant — barre circulaire) ─────────────────
    document.querySelectorAll('.progress-ring-wrap svg circle:last-child')
      .forEach(function (circle) {
        animateSvgRing(circle, 350);
      });
  }

  // Lancement : attend le DOM si nécessaire
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM déjà prêt (script en bas de body)
    init();
  }
})();
