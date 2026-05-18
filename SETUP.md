# ATERISK — Guide de mise en production backend

Ce guide couvre tout ce qu'il faut faire pour passer de la démo sessionStorage à un backend réel avec Supabase, Stripe, Cloudflare et Vercel.

---

## Étape 1 — Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et connecte-toi (ou crée un compte gratuit).
2. Clique sur **New project**.
3. Donne-lui un nom (ex: `aterisk-prod`), choisis une région proche (Paris = `eu-west-3`), définis un mot de passe base de données fort et sauvegarde-le dans un gestionnaire de mots de passe.
4. Attends ~2 minutes que le projet démarre.

---

## Étape 2 — Récupérer les clés API

1. Dans le menu latéral du projet, va dans **Settings → API**.
2. Copie :
   - **Project URL** → ressemble à `https://abcdefghijkl.supabase.co`
   - **anon public key** → longue chaîne JWT commençant par `eyJ...`
3. Ouvre le fichier `supabase.js` à la racine du projet et remplace :

```js
const SUPABASE_URL      = 'https://YOUR_PROJECT_REF.supabase.co'; // ← coller ici
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';                        // ← coller ici
```

> **Ne jamais committer la `service_role` key** dans le code — elle contourne toutes les RLS policies et donne un accès admin total à la base.

---

## Étape 3 — Créer le schéma de base de données

1. Dans le menu Supabase, va dans **SQL Editor**.
2. Clique sur **New query**.
3. Copie/colle l'intégralité du fichier `schema.sql` dans l'éditeur.
4. Clique sur **Run** (ou `Ctrl+Entrée`).
5. Vérifie que tout s'exécute sans erreur (les messages `CREATE TABLE`, `CREATE POLICY`, `CREATE TRIGGER` doivent apparaître dans les logs).

> Si tu as une erreur `already exists`, c'est que tu as relancé le script — c'est normal car les `CREATE TABLE IF NOT EXISTS` sont idempotents. Re-run sans problème.

---

## Étape 4 — Activer l'authentification email

1. Dans Supabase, va dans **Authentication → Providers**.
2. Vérifie que **Email** est activé (c'est le cas par défaut).
3. Configure les emails transactionnels :
   - Va dans **Authentication → Email Templates**.
   - Personnalise les templates "Confirm signup", "Reset password" avec la charte ATERISK.
4. Optionnel mais recommandé : dans **Authentication → URL Configuration**, ajoute ton domaine de production dans **Redirect URLs** (ex: `https://aterisk.fr/login.html`).

---

## Étape 5 — Créer les premiers comptes admin

1. Va dans **Authentication → Users → Invite user**.
2. Invite ton email admin (ex: `admin@aterisk.fr`).
3. Une fois le compte créé, va dans **SQL Editor** et exécute :

```sql
update profiles
  set role = 'admin', name = 'Admin ATERISK'
  where email = 'admin@aterisk.fr';
```

4. Pour les comptes de démo (mentor, étudiant), crée-les via la même interface puis mets à jour leur rôle de la même façon.

---

## Étape 6 — Configurer Cloudflare (DDoS + rate limiting)

> Cloudflare est gratuit et protège contre le scraping, les bots et les attaques DDoS.

### 6.1 — Ajouter le domaine

1. Crée un compte sur [cloudflare.com](https://cloudflare.com).
2. Ajoute ton domaine (`aterisk.fr`).
3. Cloudflare te donne deux nameservers — mets-les à jour chez ton registrar (OVH, Gandi, etc.).
4. Attends la propagation DNS (5 à 30 minutes).

### 6.2 — Activer les règles de sécurité

Dans le menu Cloudflare de ton domaine :

1. **Security → Settings** → Security Level : `Medium`, Bot Fight Mode : `On`.
2. **Security → WAF → Rate limiting rules** → Crée une règle :
   - **Nom** : `Login rate limit`
   - **URI** : `/login.html`
   - **Threshold** : 10 requêtes par 60 secondes par IP
   - **Action** : Block (durée 10 minutes)
3. **Speed → Optimization** → Active Auto Minify (HTML, CSS, JS) et Brotli compression.

### 6.3 — Headers de sécurité

Dans **Rules → Transform Rules → Modify Response Header**, ajoute :

| Header | Valeur |
|--------|--------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## Étape 7 — Déployer sur Vercel

> Vercel déploie automatiquement sur chaque `git push` et gère le HTTPS, les headers et le CDN global.

### Option A — Drag & drop (le plus simple)

1. Va sur [vercel.com](https://vercel.com) et connecte ton compte GitHub.
2. Clique sur **Add New → Project**.
3. Importe ton repo `aterisk-beta` depuis GitHub.
4. Vercel détecte automatiquement un site statique — laisse tous les paramètres par défaut.
5. Clique **Deploy**.
6. Vercel te donne une URL en `.vercel.app`. Ajoute ensuite ton domaine custom dans **Project Settings → Domains**.

### Option B — CLI

```bash
# Installe la CLI Vercel (une seule fois)
npm i -g vercel

# Dans le dossier du projet
vercel --prod
```

### Headers Vercel (optionnel, déjà couvert par Cloudflare)

Crée un fichier `vercel.json` à la racine si tu veux des headers supplémentaires côté Vercel :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options",        "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

---

## Étape 8 — Configurer Stripe

### 8.1 — Créer les produits

1. Va sur [dashboard.stripe.com](https://dashboard.stripe.com) (compte test d'abord).
2. Dans **Products**, crée :
   - **Abonnement mensuel** — 19 €/mois (ou 9 € avec code école)
   - **Pack 3 tokens** — 28 € (3 séances junior)
   - **Pack 5 tokens** — 42 € (5 séances junior)
   - **Pack senior** — prix au token selon grille
3. Note les `price_id` Stripe de chaque produit (format `price_...`).

### 8.2 — Mettre à jour tarifs.html et tokens.html

Dans `tarifs.html` et `tokens.html`, remplace les liens de paiement `#` par des boutons Stripe Checkout. Exemple de snippet JS à ajouter dans ces pages :

```html
<script src="https://js.stripe.com/v3/"></script>
<script>
const stripe = Stripe('pk_live_YOUR_PUBLISHABLE_KEY'); // TODO

async function checkout(priceId) {
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',                // ou 'payment' pour les tokens
    successUrl: window.location.origin + '/dashboard.html?checkout=success',
    cancelUrl:  window.location.origin + '/tarifs.html',
  });
  if (error) console.error(error);
}
</script>

<!-- Bouton abonnement -->
<button onclick="checkout('price_XXXX_abonnement')">S'abonner — 19€/mois</button>
```

### 8.3 — Configurer les webhooks Stripe

Pour activer/désactiver les abonnements en temps réel dans Supabase :

1. Dans Stripe → **Developers → Webhooks → Add endpoint**.
2. URL : `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
3. Events à écouter :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
4. Crée une **Edge Function Supabase** (`supabase/functions/stripe-webhook/index.ts`) qui écoute ces events et met à jour `profiles.is_subscriber` et `students.subscription_status` en conséquence.

> La mise en place des Edge Functions est documentée ici : https://supabase.com/docs/guides/functions

---

## Checklist finale avant lancement

- [ ] `SUPABASE_URL` et `SUPABASE_ANON_KEY` renseignés dans `supabase.js`
- [ ] `schema.sql` exécuté sans erreur dans Supabase SQL Editor
- [ ] Email auth activé dans Supabase Authentication
- [ ] Compte admin créé et rôle mis à jour dans la DB
- [ ] Domaine ajouté sur Cloudflare + nameservers mis à jour
- [ ] Rate limiting login activé sur Cloudflare
- [ ] Déployé sur Vercel avec domaine custom configuré
- [ ] Produits Stripe créés et `price_id` intégrés dans tarifs.html / tokens.html
- [ ] Webhooks Stripe configurés et Edge Function déployée
- [ ] Tests end-to-end : inscription → abonnement → réservation séance → rapport

---

## Migration depuis le mock sessionStorage

Le fichier `auth.js` est conçu pour fonctionner en parallèle des pages non migrées.

Pendant la migration progressive :
- Les nouvelles pages utilisent `import { requireAuth } from './auth.js'`
- Les anciennes pages continuent avec leur IIFE `sessionStorage` inline
- `auth.js` synchronise automatiquement Supabase → sessionStorage, donc les anciennes pages "voient" les vrais utilisateurs Supabase sans modification

Pour migrer une page existante, remplace l'IIFE en haut du `<body>` :

```html
<!-- AVANT (mock) -->
<script>
(function() {
  const u = JSON.parse(sessionStorage.getItem('aterisk_user') || 'null');
  if (!u || u.role !== 'etudiant') window.location.href = 'login.html';
})();
</script>

<!-- APRÈS (réel) -->
<script type="module">
  import { requireAuth } from './auth.js';
  await requireAuth(['etudiant']);
</script>
```
