-- ============================================================
-- ATERISK — Schéma PostgreSQL complet pour Supabase
-- ============================================================
-- Exécute ce fichier dans ton projet Supabase > SQL Editor.
-- L'ordre des CREATE TABLE respecte les dépendances (FK).
-- ============================================================

-- ── EXTENSIONS ────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. SCHOOLS (écoles partenaires)
--    Créée avant profiles car profiles la référence.
-- ============================================================

create table if not exists schools (
  id              uuid        default uuid_generate_v4() primary key,
  name            text        not null,
  email_domain    text,                           -- ex: "hec.fr" (validation email étudiants)
  contact_email   text,
  monthly_fee     numeric(8,2) default 650.00,    -- forfait mensuel école
  student_delta   numeric(8,2) default 10.00,     -- delta/étudiant vs tarif public
  token_balance   integer     default 0,           -- tokens offerts par l'école à ses étudiants
  is_active       boolean     default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table schools is 'Écoles partenaires ATERISK.';

-- ============================================================
-- 2. PROFILES (étend auth.users — créé automatiquement par trigger)
-- ============================================================

create table if not exists profiles (
  id              uuid        references auth.users on delete cascade primary key,
  role            text        not null check (role in ('etudiant', 'mentor', 'admin', 'admin-ecole')),
  name            text        not null,
  email           text        not null,
  school_id       uuid        references schools(id) on delete set null,
  avatar_url      text,
  is_subscriber   boolean     default false,       -- abonnement 19€/mois actif
  stripe_customer_id text,                          -- ID client Stripe
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table profiles is 'Profil commun à tous les utilisateurs. Étendu via students/mentors selon le rôle.';

-- ============================================================
-- 3. STUDENTS (données supplémentaires étudiant)
-- ============================================================

create table if not exists students (
  id              uuid        default uuid_generate_v4() primary key,
  user_id         uuid        references profiles(id) on delete cascade not null unique,
  school_id       uuid        references schools(id) on delete set null,
  -- Profil de recherche
  sector_target   text,                            -- secteur visé
  contract_type   text        check (contract_type in ('alternance', 'stage', 'cdi')),
  level           text        check (level in ('bac', 'bac+2', 'bac+3', 'bac+4', 'bac+5', 'autre')),
  school_name     text,
  graduation_year integer,
  city_target     text,
  -- Documents
  cv_url          text,                            -- URL Supabase Storage
  lm_url          text,
  linkedin_url    text,
  -- Progression
  token_balance   integer     default 0,
  sessions_count  integer     default 0,
  applications_count integer  default 0,
  interviews_count   integer  default 0,
  is_placed       boolean     default false,       -- a trouvé son alternance
  placed_at       timestamptz,
  placement_company text,
  -- Stripe
  subscription_id       text,                      -- ID abonnement Stripe
  subscription_status   text,                      -- active / past_due / canceled
  subscription_period_end timestamptz,
  --
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table students is 'Profil étendu des étudiants. Joint à profiles via user_id.';

-- ============================================================
-- 4. MENTORS
-- ============================================================

create table if not exists mentors (
  id              uuid        default uuid_generate_v4() primary key,
  user_id         uuid        references profiles(id) on delete cascade not null unique,
  -- Profil professionnel
  sector          text        not null,            -- ex: "Tech", "Finance", "Marketing"
  level           text        not null check (level in ('junior', 'senior')),
  company         text,
  job_title       text,
  years_experience integer    default 0,
  bio             text,
  linkedin_url    text,
  photo_url       text,
  -- Disponibilité & tarifs
  available       boolean     default true,
  price_token     numeric(4,2) default 1,          -- 1 = junior, 1.5 = senior
  price_eur       numeric(6,2),                    -- prix affiché (14€ ou 22€)
  -- Statistiques
  sessions_count  integer     default 0,
  rating          numeric(3,2) default 0,          -- moyenne avis (0-5)
  reviews_count   integer     default 0,
  earnings_total  numeric(10,2) default 0,         -- total brut généré
  -- Modération
  is_published    boolean     default false,        -- validé par admin avant affichage
  is_active       boolean     default true,
  --
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table mentors is 'Profil étendu des mentors. Joint à profiles via user_id.';

-- ============================================================
-- 5. RESOURCES (PDFs, guides, templates…)
-- ============================================================

create table if not exists resources (
  id              uuid        default uuid_generate_v4() primary key,
  title           text        not null,
  description     text,
  category        text        not null check (category in ('cv', 'lm', 'reseau', 'entretien', 'secteurs', 'webinaires', 'autre')),
  type            text        not null check (type in ('template', 'guide', 'checklist', 'script', 'video', 'autre')),
  emoji           text        default '📄',
  badge           text        check (badge in ('new', 'pop', 'excl', null)),
  color           text        default '#EEF2FF',
  -- Fichier
  file_url        text,                            -- URL Supabase Storage
  file_name       text,
  file_size_bytes bigint,
  -- Accès
  is_premium      boolean     default true,        -- true = abonnement requis
  is_published    boolean     default false,
  downloads_count integer     default 0,
  -- Audit
  created_by      uuid        references profiles(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table resources is 'Bibliothèque de ressources (CV, LM, guides…). Stockage fichiers dans Supabase Storage bucket "ressources".';

-- ============================================================
-- 6. SESSIONS (séances mentor ↔ étudiant)
-- ============================================================

create table if not exists sessions (
  id              uuid        default uuid_generate_v4() primary key,
  student_id      uuid        references profiles(id) on delete cascade not null,
  mentor_id       uuid        references mentors(id) on delete cascade not null,
  school_id       uuid        references schools(id) on delete set null,  -- pour stats école
  -- Planification
  scheduled_at    timestamptz not null,
  duration_min    integer     default 30,
  topic           text,                            -- sujet / objectif de la séance
  -- État
  status          text        not null default 'pending'
                              check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  cancelled_by    text        check (cancelled_by in ('student', 'mentor', 'admin', null)),
  cancel_reason   text,
  -- Post-séance
  report_url      text,                            -- URL du rapport généré
  student_rating  integer     check (student_rating between 1 and 5),
  student_review  text,
  mentor_notes    text,                            -- notes privées mentor
  -- Facturation
  tokens_charged  numeric(4,2) default 0,
  commission_pct  integer     default 30,          -- % ATERISK sur la séance (30%)
  --
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table sessions is 'Séances de mentorat réservées. Liées à l''étudiant, au mentor et optionnellement à l''école.';

-- ============================================================
-- 7. TOKEN TRANSACTIONS (journal des mouvements de tokens)
-- ============================================================

create table if not exists token_transactions (
  id              uuid        default uuid_generate_v4() primary key,
  student_id      uuid        references profiles(id) on delete cascade not null,
  amount          numeric(6,2) not null,           -- positif = crédit, négatif = débit
  reason          text        not null check (reason in ('achat', 'session', 'offert', 'remboursement', 'admin', 'expiration')),
  session_id      uuid        references sessions(id) on delete set null,
  stripe_payment_intent text,                       -- ID PaymentIntent Stripe (pour les achats)
  notes           text,
  created_at      timestamptz default now()
);

comment on table token_transactions is 'Journal immuable de tous les mouvements de tokens étudiants.';

-- ============================================================
-- 8. STORAGE — Bucket "ressources"
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ressources',
  'ressources',
  false,                  -- privé : téléchargement via URL signée ou policy RLS
  52428800,               -- 50 Mo max par fichier
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png', 'image/jpeg', 'image/webp',
    'video/mp4', 'video/webm'
  ]
)
on conflict (id) do nothing;

-- ============================================================
-- 9. TRIGGER — Création automatique du profil à l'inscription
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'etudiant')
  );
  return new;
end;
$$;

-- Supprime le trigger s'il existe déjà (idempotent)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 10. TRIGGER — updated_at automatique
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Applique le trigger sur toutes les tables qui ont updated_at
do $$
declare
  t text;
begin
  foreach t in array array['schools','profiles','students','mentors','resources','sessions']
  loop
    execute format(
      'drop trigger if exists trg_updated_at on %I;
       create trigger trg_updated_at
         before update on %I
         for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end;
$$;

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Active RLS sur toutes les tables
alter table schools             enable row level security;
alter table profiles            enable row level security;
alter table students            enable row level security;
alter table mentors             enable row level security;
alter table resources           enable row level security;
alter table sessions            enable row level security;
alter table token_transactions  enable row level security;

-- ── Helpers : fonctions qui lisent le JWT pour déterminer le rôle ─────────────

-- Retourne le rôle depuis le profil (sans appel RLS récursif via security definer)
create or replace function auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Retourne le school_id de l'utilisateur courant
create or replace function auth_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

-- ── SCHOOLS ───────────────────────────────────────────────────────────────────

-- Admin ATERISK : tout
create policy "Admin: full access on schools"
  on schools for all
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- Admin école : voir seulement son école
create policy "Admin-ecole: read own school"
  on schools for select
  using (auth_role() = 'admin-ecole' and id = auth_school_id());

-- ── PROFILES ──────────────────────────────────────────────────────────────────

-- Chaque utilisateur voit son propre profil
create policy "Users: read own profile"
  on profiles for select
  using (id = auth.uid());

-- Chaque utilisateur met à jour son propre profil (sauf role/school_id)
create policy "Users: update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admin : tout
create policy "Admin: full access on profiles"
  on profiles for all
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- Admin-école : voir les profils des étudiants de son école
create policy "Admin-ecole: read school students profiles"
  on profiles for select
  using (
    auth_role() = 'admin-ecole'
    and school_id = auth_school_id()
  );

-- Tout le monde peut lire les profils des mentors publiés (pour la page matching)
create policy "Public: read published mentor profiles"
  on profiles for select
  using (
    id in (
      select user_id from public.mentors where is_published = true
    )
  );

-- ── STUDENTS ──────────────────────────────────────────────────────────────────

create policy "Students: read own record"
  on students for select
  using (user_id = auth.uid());

create policy "Students: update own record"
  on students for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Students: insert own record"
  on students for insert
  with check (user_id = auth.uid());

create policy "Admin: full access on students"
  on students for all
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

create policy "Admin-ecole: read school students"
  on students for select
  using (
    auth_role() = 'admin-ecole'
    and school_id = auth_school_id()
  );

-- ── MENTORS ───────────────────────────────────────────────────────────────────

-- Tout utilisateur authentifié peut voir les mentors publiés
create policy "Authenticated: read published mentors"
  on mentors for select
  using (
    auth.role() = 'authenticated'
    and is_published = true
  );

-- Chaque mentor gère son propre profil
create policy "Mentors: manage own profile"
  on mentors for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admin : tout (y compris publication)
create policy "Admin: full access on mentors"
  on mentors for all
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- ── RESOURCES ─────────────────────────────────────────────────────────────────

-- Ressources gratuites publiées : accessibles à tous (même non connecté)
create policy "Public: read free published resources"
  on resources for select
  using (
    is_published = true
    and is_premium = false
  );

-- Ressources premium : abonnés uniquement
create policy "Subscribers: read premium published resources"
  on resources for select
  using (
    is_published = true
    and is_premium = true
    and auth.uid() in (
      select id from public.profiles where is_subscriber = true
    )
  );

-- Admin : CRUD complet
create policy "Admin: full access on resources"
  on resources for all
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- ── SESSIONS ──────────────────────────────────────────────────────────────────

-- Étudiant : voir ses propres séances
create policy "Students: read own sessions"
  on sessions for select
  using (student_id = auth.uid());

-- Étudiant : réserver (insert)
create policy "Students: book sessions"
  on sessions for insert
  with check (student_id = auth.uid());

-- Étudiant : annuler sa séance (update limité aux champs autorisés)
create policy "Students: update own sessions"
  on sessions for update
  using (student_id = auth.uid());

-- Mentor : voir ses séances
create policy "Mentors: read own sessions"
  on sessions for select
  using (
    mentor_id in (
      select id from public.mentors where user_id = auth.uid()
    )
  );

-- Mentor : mettre à jour le statut et les notes de ses séances
create policy "Mentors: update own sessions"
  on sessions for update
  using (
    mentor_id in (
      select id from public.mentors where user_id = auth.uid()
    )
  );

-- Admin-école : voir les séances de ses étudiants
create policy "Admin-ecole: read school sessions"
  on sessions for select
  using (
    auth_role() = 'admin-ecole'
    and school_id = auth_school_id()
  );

-- Admin : tout
create policy "Admin: full access on sessions"
  on sessions for all
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- ── TOKEN TRANSACTIONS ────────────────────────────────────────────────────────

-- Étudiant : voir ses propres transactions (lecture seule)
create policy "Students: read own token transactions"
  on token_transactions for select
  using (student_id = auth.uid());

-- Admin : tout
create policy "Admin: full access on token_transactions"
  on token_transactions for all
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- ── STORAGE RLS ───────────────────────────────────────────────────────────────

-- Admin : peut uploader dans le bucket "ressources"
create policy "Admin: upload resources"
  on storage.objects for insert
  with check (
    bucket_id = 'ressources'
    and auth.role() = 'authenticated'
    and (select auth_role()) = 'admin'
  );

-- Admin : peut supprimer des fichiers
create policy "Admin: delete resources"
  on storage.objects for delete
  using (
    bucket_id = 'ressources'
    and (select auth_role()) = 'admin'
  );

-- Utilisateurs authentifiés : peuvent télécharger
create policy "Authenticated: download resources"
  on storage.objects for select
  using (
    bucket_id = 'ressources'
    and auth.role() = 'authenticated'
  );

-- ============================================================
-- 12. INDEX (performances)
-- ============================================================

create index if not exists idx_profiles_role         on profiles(role);
create index if not exists idx_profiles_school_id    on profiles(school_id);
create index if not exists idx_students_user_id      on students(user_id);
create index if not exists idx_students_school_id    on students(school_id);
create index if not exists idx_mentors_user_id       on mentors(user_id);
create index if not exists idx_mentors_sector        on mentors(sector);
create index if not exists idx_mentors_level         on mentors(level);
create index if not exists idx_mentors_available     on mentors(available);
create index if not exists idx_mentors_published     on mentors(is_published);
create index if not exists idx_sessions_student_id   on sessions(student_id);
create index if not exists idx_sessions_mentor_id    on sessions(mentor_id);
create index if not exists idx_sessions_scheduled_at on sessions(scheduled_at);
create index if not exists idx_sessions_status       on sessions(status);
create index if not exists idx_resources_category    on resources(category);
create index if not exists idx_resources_published   on resources(is_published);
create index if not exists idx_resources_premium     on resources(is_premium);
create index if not exists idx_tokens_student_id     on token_transactions(student_id);

-- ============================================================
-- 13. DONNÉES DE DÉMO (optionnel — commenter en production)
-- ============================================================

-- Décommente et adapte pour créer des comptes de démo via Supabase Auth
-- (les UUID doivent correspondre aux utilisateurs créés dans auth.users)

-- NB : en production, crée les comptes via l'interface Supabase > Authentication
-- puis mets à jour les profils manuellement ou via l'application.

/*
-- Exemple : mettre un compte en admin après création via Auth
update profiles
  set role = 'admin', name = 'Admin ATERISK'
  where email = 'admin@aterisk.fr';

-- Exemple : créer une école
insert into schools (id, name, email_domain, contact_email, monthly_fee)
values (
  uuid_generate_v4(),
  'HEC Paris',
  'hec.fr',
  'partenariat@hec.fr',
  650.00
);
*/
