
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

### 🔄 En cours
- À compléter au fur et à mesure

### ❌ À faire
- Intégration Stripe (abonnement + tokens + commission)
- Système d'authentification réel
- Logique de matching mentor ↔ étudiant
- Génération automatique des rapports post-séance (IA)
- Dashboard analytics admin
- Badge "Placé via ATERISK" + réseau alumni
- Déclaration de placement + déclenchement commission

---
## Règles de design à respecter

- [ ] Palette de couleurs principale : à préciser
- [ ] Typographie : à préciser
- [ ] Style des composants : à préciser
- [ ] Responsive : mobile-first ou desktop-first ?

---
## Décisions techniques prises

→ À remplir au fil des sessions Claude Code

---
## Prochaine session — objectif

→ Mettre à jour avant chaque session Claude Code
