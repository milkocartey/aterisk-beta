
# ATERISK — Contexte projet pour Claude Code


## Ce qu'est ATERISK

Plateforme de mentorat humain pour la recherche d'alternance. Les étudiants paient un abonnement mensuel (19€) et accèdent à des mentors juniors/seniors via des séances à la carte. ATERISK prend une commission à la réussite (4% × 4 mois) et travaille avec des écoles partenaires.

**Slogan :** "On ne prend notre part que quand tu as réussi."

---
## Stack technique

- **100% HTML/CSS/JS** — pas de framework, pas de build step
- Repo GitHub : https://github.com/milkocartey/aterisk-beta
- Paiement : Stripe prévu
- Phase actuelle : **beta / MVP**

---
## Pages existantes

| Fichier | Rôle |
|---|---|
| `index.html` | Landing page principale |
| `login.html` | Connexion |
| `inscription.html` | Inscription étudiant |
| `mentor-inscription.html` | Inscription mentor |
| `dashboard.html` | Espace étudiant |
| `dashboard-mentor.html` | Espace mentor |
| `admin.html` | Back-office admin |
| `matching.html` | Matching étudiant ↔ mentor |
| `seance.html` | Réservation / déroulé de séance |
| `mapping.html` | Carte interactive entreprises |
| `ressources.html` | Bibliothèque CV, LM, guides |
| `secteurs.html` | Guides par secteur métier |
| `tarifs.html` | Page tarifs & abonnement |
| `tokens.html` | Achat de tokens séances |
| `aterisk_rapport_mentor.html` | Rapport automatique post-séance |
| `cgu.html` | Conditions générales |
| `404.html` | Page d'erreur |

---
## Modèle économique

1. Abonnement — 19€/mois (9€ via école partenaire)
2. Séances à la carte — ATERISK 30% / mentor 70%
   - Junior 30min : 14€ | Senior 30min : 22€
3. Commission placement — 4% salaire brut × 4 mois
4. Partenariats écoles — delta 10€/étudiant + forfait 650€/mois

Séance découverte : offerte (30min junior, coût 10€ = CAC)
Tokens : 1 token = junior / 1,5 token = senior

---
## État d'avancement

### ✅ Fait
- Structure complète des pages (toutes les vues principales existent)
- Modèle économique finalisé
- Contrat d'abonnement étudiant rédigé
- **index.html** — redesign complet style startup dark/futuriste (inspiré Genially)
  - Hero dark navy (`#030712`) avec gradients animés, grid overlay, grain texture
  - Mega menu nav avec dropdowns hover fluides ("Étudiants ▾" / "Mentors ▾")
  - Nav transparente sur hero (`nav-dark-hero`) → blanche au scroll
  - Marquee strip, step cards, dark CTA section
  - Typographie : DM Serif Display (hero h1) + DM Sans + Unbounded (numéros)
- **Système d'authentification mock** (sessionStorage)
  - `login.html` gère `?redirect=PAGE` — après login retour sur la page demandée
  - Guards synchrones sur 8 pages protégées (avant tout autre script)
  - Redirections par rôle : etudiant → dashboard.html, mentor → dashboard-mentor.html, admin → admin.html
- **nav.js** — réécriture critique
  - Body opacity 100% indépendant du CDN motion.dev (double `requestAnimationFrame` CSS pur)
  - Exit transition CSS pur (plus de `animate().finished` qui pouvait bloquer)
  - Dropdown JS click toggle (`dropdown-open`) en plus du hover CSS
  - Sélecteur `nav:not(.sidebar-nav)` pour éviter le bug sidebar dashboard

### ❌ À faire
- **UI des pages internes** — refaire toutes les pages dans le même style que index.html (dark/futuriste, même direction design) — **objectif session suivante**
- Intégration Stripe (abonnement + tokens + commission)
- Système d'authentification réel (remplacer le mock sessionStorage)
- Logique de matching mentor ↔ étudiant
- Génération automatique des rapports post-séance (IA)
- Dashboard analytics admin
- Badge "Placé via ATERISK" + réseau alumni
- Déclaration de placement + déclenchement commission

---
## Règles de design à respecter

- **Direction artistique** : dark/futuriste startup — référence = index.html actuel + genially.com
- **Palette** : Navy sombre `#030712` (hero/dark sections) + blanc `#fff` (sections claires) + bleu ATERISK `#1A2E7A`
- **Typographie** : DM Serif Display (titres héros), DM Sans (corps), Unbounded (accents chiffres)
- **Boutons** : `border-radius: 100px` (pill) partout
- **Animations** : CSS pur pour le critique (opacity body), motion.dev pour le décoratif
- Responsive desktop-first (mais mobile vérifié)

---
## Décisions techniques prises

- Pas de framework, pas de build — HTML/CSS/JS pur
- motion.dev importé depuis CDN via `motion.js` local — utilisé uniquement pour animations décoratives, jamais pour le rendu critique (body opacity)
- `body{opacity:0;transition:none}` en CSS inline dans chaque page pour éviter le flash → restauré par nav.js via double rAF
- sessionStorage key : `aterisk_user` → JSON `{role: 'etudiant'|'mentor'|'admin', name: '...'}`
- Guards de page : IIFE synchrone au tout début du `<body>`, avant tout script
- `scroll.js` utilise des transitions CSS (pas WAAPI) pour éviter le bug de revert motion.dev

---
## Prochaine session — objectif

Refaire l'UI de toutes les pages internes (dashboard.html, dashboard-mentor.html, matching.html, seance.html, tokens.html, mapping.html, ressources.html, secteurs.html, tarifs.html, admin.html…) dans la même direction design que index.html — dark/futuriste, mega menu cohérent, pill buttons, typographie unifiée.
