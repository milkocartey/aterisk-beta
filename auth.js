/**
 * auth.js — Couche d'authentification ATERISK
 *
 * Fait le pont entre Supabase Auth (réel) et le sessionStorage mock existant.
 * Pendant la migration, les deux systèmes coexistent :
 *   - Pages migrated   → utilisent requireAuth() + getCurrentUser() de ce fichier
 *   - Pages non migrées → continuent à lire sessionStorage 'aterisk_user' directement
 *
 * USAGE (dans une page protégée) :
 *   <script type="module">
 *     import { requireAuth, getCurrentUser } from './auth.js';
 *     await requireAuth(['etudiant']);
 *     const user = getCurrentUser();
 *     document.querySelector('.user-name').textContent = user.name;
 *   </script>
 */

import { supabase, getSession, getProfile, signOut as supabaseSignOut } from './supabase.js';

// ─── REDIRECTION VERS LOGIN ────────────────────────────────────────────────────

const LOGIN_PAGE = 'login.html';

/**
 * Construit l'URL de redirection vers la page de login avec le paramètre
 * ?redirect=PAGE_ACTUELLE pour revenir après connexion.
 * @returns {string}
 */
function buildLoginRedirectUrl() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  return `${LOGIN_PAGE}?redirect=${encodeURIComponent(currentPage)}`;
}

/**
 * Redirige vers login avec une transition CSS pur (même pattern que nav.js).
 */
function redirectToLogin() {
  document.body.style.transition = 'opacity 0.18s ease-in';
  document.body.style.opacity    = '0';
  setTimeout(() => {
    window.location.href = buildLoginRedirectUrl();
  }, 200);
}

// ─── SESSION SYNC ─────────────────────────────────────────────────────────────

/**
 * Récupère le profil depuis Supabase et le synchronise dans sessionStorage
 * pour la compatibilité avec les pages non encore migrées.
 *
 * @param {import('@supabase/supabase-js').User} user
 * @param {Object} profile - ligne de la table `profiles`
 */
function syncToSessionStorage(user, profile) {
  const payload = {
    id:    user.id,
    email: user.email,
    role:  profile.role,
    name:  profile.name,
  };
  sessionStorage.setItem('aterisk_user', JSON.stringify(payload));

  // Compat : les pages vérifient `aterisk_subscriber` pour l'accès premium
  if (profile.is_subscriber) {
    sessionStorage.setItem('aterisk_subscriber', '1');
  } else {
    sessionStorage.removeItem('aterisk_subscriber');
  }
}

/**
 * Supprime les données de session du sessionStorage.
 */
function clearSessionStorage() {
  sessionStorage.removeItem('aterisk_user');
  sessionStorage.removeItem('aterisk_subscriber');
}

// ─── API PUBLIQUE ─────────────────────────────────────────────────────────────

/**
 * Protège une page en vérifiant l'authentification et le rôle.
 *
 * Stratégie :
 *   1. Essaie Supabase (auth réelle)
 *   2. Repli sur sessionStorage (mock auth pendant la migration)
 *   3. Redirige vers login si aucune session valide
 *   4. Vérifie que le rôle est autorisé
 *
 * À appeler en haut de chaque page protégée (remplace l'IIFE synchrone inline).
 *
 * @param {Array<'etudiant'|'mentor'|'admin'|'admin-ecole'>} [allowedRoles=[]] - [] = tous les rôles
 * @returns {Promise<{ id: string, email: string, role: string, name: string }>}
 */
export async function requireAuth(allowedRoles = []) {
  // ── 1. Essaie Supabase ───────────────────────────────────────────────────
  try {
    const session = await getSession();

    if (session?.user) {
      // Charge le profil depuis la table `profiles`
      const profile = await getProfile(session.user.id);

      if (profile) {
        // Sync vers sessionStorage pour les pages non migrées
        syncToSessionStorage(session.user, profile);

        // Vérifie le rôle
        if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
          // Rôle non autorisé → redirection vers la bonne page d'accueil
          _redirectByRole(profile.role);
          return null;
        }

        return {
          id:    session.user.id,
          email: session.user.email,
          role:  profile.role,
          name:  profile.name,
        };
      }
    }
  } catch (supabaseError) {
    // Supabase indisponible ou non configuré → repli sur le mock
    console.warn('[ATERISK/auth] Supabase non disponible, repli sur sessionStorage :', supabaseError.message);
  }

  // ── 2. Repli sur sessionStorage (mock auth) ──────────────────────────────
  const stored = sessionStorage.getItem('aterisk_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        _redirectByRole(user.role);
        return null;
      }

      return {
        id:    user.id    ?? null,
        email: user.email ?? '',
        role:  user.role,
        name:  user.name  ?? '',
      };
    } catch {
      // sessionStorage corrompu
      clearSessionStorage();
    }
  }

  // ── 3. Pas de session → login ────────────────────────────────────────────
  redirectToLogin();
  return null;
}

/**
 * Retourne l'utilisateur courant depuis Supabase ou sessionStorage (synchrone).
 * Ne redirige PAS si absent — utilise requireAuth() pour ça.
 *
 * @returns {{ id: string|null, email: string, role: string, name: string }|null}
 */
export function getCurrentUser() {
  // Supabase expose la session en mémoire de manière synchrone après initialisation
  const supabaseUser = supabase.auth.getUser(); // Promise — on ne peut pas l'awaiter ici en sync

  // Repli synchrone sur sessionStorage
  const stored = sessionStorage.getItem('aterisk_user');
  if (stored) {
    try { return JSON.parse(stored); } catch { /* corrompu */ }
  }

  return null;
}

/**
 * Version async de getCurrentUser() — préférable quand tu peux await.
 * @returns {Promise<{ id: string, email: string, role: string, name: string }|null>}
 */
export async function getCurrentUserAsync() {
  try {
    const session = await getSession();
    if (session?.user) {
      const profile = await getProfile(session.user.id);
      if (profile) {
        return {
          id:    session.user.id,
          email: session.user.email,
          role:  profile.role,
          name:  profile.name,
        };
      }
    }
  } catch { /* Supabase non configuré */ }

  // Repli sessionStorage
  return getCurrentUser();
}

/**
 * Déconnecte l'utilisateur (Supabase + sessionStorage) et redirige vers index.html.
 */
export async function logout() {
  try { await supabaseSignOut(); } catch { /* ignore si non connecté */ }
  clearSessionStorage();

  document.body.style.transition = 'opacity 0.18s ease-in';
  document.body.style.opacity    = '0';
  setTimeout(() => { window.location.href = 'index.html'; }, 200);
}

/**
 * Initialise la synchronisation automatique session → sessionStorage.
 * À appeler une seule fois (ex: dans un script global ou layout partagé).
 * Écoute les événements SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED.
 */
export function initAuthSync() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      try {
        const profile = await getProfile(session.user.id);
        if (profile) syncToSessionStorage(session.user, profile);
      } catch { /* ignore */ }
    }

    if (event === 'SIGNED_OUT') {
      clearSessionStorage();
    }
  });
}

// ─── HELPERS INTERNES ─────────────────────────────────────────────────────────

/**
 * Redirige vers la page d'accueil correspondant au rôle.
 * @param {string} role
 */
function _redirectByRole(role) {
  const redirectMap = {
    etudiant:    'dashboard.html',
    mentor:      'dashboard-mentor.html',
    admin:       'admin.html',
    'admin-ecole': 'admin.html',
  };
  window.location.href = redirectMap[role] ?? 'index.html';
}

/**
 * Vérifie si l'URL actuelle est une page de login (pour éviter les boucles).
 * @returns {boolean}
 */
export function isLoginPage() {
  return window.location.pathname.endsWith(LOGIN_PAGE);
}
