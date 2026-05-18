(function () {
  'use strict';

  const CONSENT_KEY = 'aterisk_cookie_consent';

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch { return null; }
  }

  // Already consented — nothing to show
  if (getConsent()) return;

  const css = `
    #ck-banner {
      position: fixed;
      bottom: 24px; left: 24px; right: 24px;
      max-width: 680px;
      background: #0D1526;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 18px;
      padding: 22px 26px;
      z-index: 9999;
      box-shadow: 0 24px 64px rgba(0,0,0,0.45);
      display: flex;
      align-items: flex-end;
      gap: 24px;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.35s ease, transform 0.35s ease;
      font-family: 'DM Sans', system-ui, sans-serif;
    }
    #ck-banner.visible { opacity: 1; transform: translateY(0); }
    #ck-banner.hiding  { opacity: 0; transform: translateY(16px); }
    .ck-icon { font-size: 28px; flex-shrink: 0; }
    .ck-body { flex: 1; }
    .ck-title {
      font-size: 14px; font-weight: 700; color: white;
      margin-bottom: 5px;
    }
    .ck-text {
      font-size: 12px; color: rgba(255,255,255,0.48);
      line-height: 1.6;
    }
    .ck-text a { color: #60A5FA; text-decoration: none; }
    .ck-text a:hover { text-decoration: underline; }
    .ck-actions {
      display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap;
      align-items: center;
    }
    .ck-btn {
      padding: 9px 18px; border-radius: 100px; border: none;
      font-family: inherit; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.15s; white-space: nowrap;
    }
    .ck-btn-accept { background: white; color: #0D1526; }
    .ck-btn-accept:hover { background: #E8EEF9; transform: translateY(-1px); }
    .ck-btn-refuse {
      background: transparent; color: rgba(255,255,255,0.5);
      border: 1px solid rgba(255,255,255,0.15);
    }
    .ck-btn-refuse:hover { color: white; border-color: rgba(255,255,255,0.35); }
    @media (max-width: 600px) {
      #ck-banner { flex-direction: column; align-items: flex-start; gap: 16px; bottom: 12px; left: 12px; right: 12px; }
      .ck-actions { width: 100%; }
      .ck-btn { flex: 1; text-align: center; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const banner = document.createElement('div');
  banner.id = 'ck-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Gestion des cookies');
  banner.innerHTML = `
    <div class="ck-icon">🍪</div>
    <div class="ck-body">
      <div class="ck-title">Cookies &amp; vie privée</div>
      <div class="ck-text">
        Nous utilisons des cookies strictement nécessaires au fonctionnement du site.
        Aucune donnée n'est partagée avec des tiers sans ton accord.
        <a href="cgu.html#donnees">En savoir plus</a>
      </div>
    </div>
    <div class="ck-actions">
      <button class="ck-btn ck-btn-refuse" id="ck-refuse">Refuser</button>
      <button class="ck-btn ck-btn-accept" id="ck-accept">Accepter</button>
    </div>
  `;
  document.body.appendChild(banner);

  // Show after a short delay (UX: let page render first)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => banner.classList.add('visible'), 800);
    });
  });

  function saveConsent(analytics) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      analytics,
      necessary: true,
      date: new Date().toISOString(),
      version: '1.0'
    }));
  }

  function dismiss() {
    banner.classList.add('hiding');
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
  }

  document.getElementById('ck-accept').addEventListener('click', () => {
    saveConsent(true);
    dismiss();
  });

  document.getElementById('ck-refuse').addEventListener('click', () => {
    saveConsent(false);
    dismiss();
  });
})();
