/**
 * supabase.js — Client Supabase + toutes les fonctions utilitaires ATERISK
 *
 * USAGE :
 *   import { supabase, signIn, getMentors } from './supabase.js';
 *
 * CONFIGURATION :
 *   Remplace SUPABASE_URL et SUPABASE_ANON_KEY ci-dessous avec tes valeurs
 *   trouvées dans ton projet Supabase > Settings > API.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// TODO : remplir ces deux valeurs avant de mettre en production
const SUPABASE_URL      = 'https://YOUR_PROJECT_REF.supabase.co'; // TODO
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';                        // TODO

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Stocke la session dans localStorage pour la persistance inter-onglets
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─── HELPERS INTERNES ─────────────────────────────────────────────────────────

/**
 * Lève une erreur normalisée si Supabase renvoie une erreur.
 * @param {Object} error - objet erreur Supabase
 * @param {string} context - label pour le debug
 */
function assertNoError(error, context = '') {
  if (error) {
    const msg = error.message || JSON.stringify(error);
    console.error(`[ATERISK/supabase] ${context} —`, msg);
    throw new Error(msg);
  }
}

// ─── AUTH ──────────────────────────────────────────────────────────────────────

/**
 * Crée un compte Supabase Auth puis insère le profil via le trigger SQL.
 * Le trigger `on_auth_user_created` se charge de créer la ligne dans `profiles`.
 *
 * @param {string} email
 * @param {string} password
 * @param {'etudiant'|'mentor'|'admin'|'admin-ecole'} role
 * @param {string} name  - prénom + nom
 * @param {Object} extraData - champs optionnels (school_id, sector, …)
 * @returns {{ user, session }}
 */
export async function signUp(email, password, role, name, extraData = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, name, ...extraData }, // stocké dans raw_user_meta_data → lu par le trigger
    },
  });
  assertNoError(error, 'signUp');
  return { user: data.user, session: data.session };
}

/**
 * Connecte l'utilisateur et charge son profil en parallèle.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ user, session, profile }}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  assertNoError(error, 'signIn');

  const profile = await getProfile(data.user.id);
  return { user: data.user, session: data.session, profile };
}

/**
 * Déconnecte l'utilisateur côté Supabase.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  assertNoError(error, 'signOut');
}

/**
 * Retourne la session active ou null si non connecté.
 * @returns {import('@supabase/supabase-js').Session|null}
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

/**
 * Retourne le profil de l'utilisateur actuellement connecté.
 * @param {string} [userId] - si omis, utilise l'utilisateur courant
 * @returns {Object|null}
 */
export async function getProfile(userId) {
  let uid = userId;
  if (!uid) {
    const session = await getSession();
    if (!session) return null;
    uid = session.user.id;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  assertNoError(error, 'getProfile');
  return data;
}

/**
 * S'abonne aux changements d'état d'authentification (connexion / déconnexion /
 * rafraîchissement de token).
 *
 * @param {(event: string, session: Object|null) => void} callback
 * @returns {{ data: { subscription } }} - appeler `.subscription.unsubscribe()` pour nettoyer
 */
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ─── ÉTUDIANTS ────────────────────────────────────────────────────────────────

/**
 * @param {string} userId
 * @returns {Object|null}
 */
export async function getStudentProfile(userId) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      profiles ( id, name, email, role, school_id ),
      schools  ( id, name )
    `)
    .eq('user_id', userId)
    .single();

  assertNoError(error, 'getStudentProfile');
  return data;
}

/**
 * @param {string} userId
 * @param {Object} data - champs à mettre à jour (sector_target, cv_url, …)
 */
export async function updateStudentProfile(userId, data) {
  const { error } = await supabase
    .from('students')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  assertNoError(error, 'updateStudentProfile');
}

/**
 * Retourne toutes les séances réservées par l'étudiant, triées par date décroissante.
 * @param {string} userId
 * @returns {Array}
 */
export async function getStudentSessions(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      mentors ( id, profiles ( name ) )
    `)
    .eq('student_id', userId)
    .order('scheduled_at', { ascending: false });

  assertNoError(error, 'getStudentSessions');
  return data ?? [];
}

/**
 * @param {string} userId
 * @returns {{ balance: number }}
 */
export async function getStudentTokens(userId) {
  return getTokenBalance(userId);
}

// ─── MENTORS ──────────────────────────────────────────────────────────────────

/**
 * Liste les mentors publiés avec filtres optionnels.
 *
 * @param {{ sector?: string, level?: 'junior'|'senior', available?: boolean }} [filters]
 * @returns {Array}
 */
export async function getMentors(filters = {}) {
  let query = supabase
    .from('mentors')
    .select(`
      *,
      profiles ( id, name, email )
    `)
    .eq('is_published', true);

  if (filters.sector)    query = query.eq('sector', filters.sector);
  if (filters.level)     query = query.eq('level', filters.level);
  if (filters.available !== undefined) query = query.eq('available', filters.available);

  const { data, error } = await query.order('rating', { ascending: false });
  assertNoError(error, 'getMentors');
  return data ?? [];
}

/**
 * @param {string} id - UUID mentor
 * @returns {Object|null}
 */
export async function getMentorById(id) {
  const { data, error } = await supabase
    .from('mentors')
    .select(`
      *,
      profiles ( id, name, email )
    `)
    .eq('id', id)
    .single();

  assertNoError(error, 'getMentorById');
  return data;
}

/**
 * @param {string} mentorId
 * @returns {Array}
 */
export async function getMentorSessions(mentorId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      students ( id, profiles ( name ) )
    `)
    .eq('mentor_id', mentorId)
    .order('scheduled_at', { ascending: false });

  assertNoError(error, 'getMentorSessions');
  return data ?? [];
}

/**
 * Crée le profil mentor lié à un utilisateur.
 * @param {string} userId
 * @param {{ sector: string, level: 'junior'|'senior', bio: string, company: string, price_token: number }} data
 * @returns {Object}
 */
export async function createMentorProfile(userId, data) {
  const { data: mentor, error } = await supabase
    .from('mentors')
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  assertNoError(error, 'createMentorProfile');
  return mentor;
}

/**
 * Met à jour un profil mentor (admin uniquement côté RLS).
 * @param {string} mentorId
 * @param {Object} data
 */
export async function updateMentorProfile(mentorId, data) {
  const { error } = await supabase
    .from('mentors')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', mentorId);

  assertNoError(error, 'updateMentorProfile');
}

// ─── RESSOURCES ───────────────────────────────────────────────────────────────

/**
 * Retourne les ressources publiées.
 * @param {boolean|null} [isPremium] - null = toutes, false = gratuites seulement, true = premium seulement
 * @returns {Array}
 */
export async function getResources(isPremium = null) {
  let query = supabase
    .from('resources')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (isPremium !== null) query = query.eq('is_premium', isPremium);

  const { data, error } = await query;
  assertNoError(error, 'getResources');
  return data ?? [];
}

/**
 * Upload un fichier dans le bucket "ressources" et crée la ligne en DB.
 * Réservé aux admins (RLS + Storage policy).
 *
 * @param {File} file
 * @param {{ title: string, description: string, category: string, type: string, is_premium: boolean, emoji?: string, badge?: string, color?: string }} metadata
 * @returns {Object} - la ressource créée
 */
export async function uploadResource(file, metadata) {
  // 1. Upload dans Supabase Storage
  const filePath = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const { error: storageError } = await supabase.storage
    .from('ressources')
    .upload(filePath, file, { upsert: false });

  assertNoError(storageError, 'uploadResource/storage');

  // 2. Récupère l'URL publique (ou signée si le bucket est privé)
  const { data: urlData } = supabase.storage
    .from('ressources')
    .getPublicUrl(filePath);

  // 3. Insère la ligne en DB
  const { data, error } = await supabase
    .from('resources')
    .insert({
      ...metadata,
      file_url: urlData?.publicUrl ?? null,
      file_name: file.name,
    })
    .select()
    .single();

  assertNoError(error, 'uploadResource/db');
  return data;
}

/**
 * Supprime une ressource (fichier Storage + ligne DB). Admin uniquement.
 * @param {string} id - UUID ressource
 */
export async function deleteResource(id) {
  // 1. Récupère le file_name pour supprimer du Storage
  const { data: resource, error: fetchError } = await supabase
    .from('resources')
    .select('file_url, file_name')
    .eq('id', id)
    .single();

  assertNoError(fetchError, 'deleteResource/fetch');

  // 2. Supprime le fichier du bucket (best effort)
  if (resource?.file_name) {
    await supabase.storage.from('ressources').remove([resource.file_name]);
  }

  // 3. Supprime la ligne
  const { error } = await supabase.from('resources').delete().eq('id', id);
  assertNoError(error, 'deleteResource/db');
}

/**
 * Met à jour les métadonnées d'une ressource. Admin uniquement.
 * @param {string} id
 * @param {Object} data
 */
export async function updateResource(id, data) {
  const { error } = await supabase
    .from('resources')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  assertNoError(error, 'updateResource');
}

// ─── SÉANCES ──────────────────────────────────────────────────────────────────

/**
 * Réserve une séance et débite le token correspondant.
 * La déduction de tokens est faite ici côté client ; idéalement à déplacer
 * dans une Edge Function Supabase pour l'atomicité.
 *
 * @param {string} studentId
 * @param {string} mentorId
 * @param {string} scheduledAt - ISO 8601 (ex: "2026-06-15T14:00:00Z")
 * @param {string} topic
 * @returns {Object} - la séance créée
 */
export async function bookSession(studentId, mentorId, scheduledAt, topic) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      student_id:    studentId,
      mentor_id:     mentorId,
      scheduled_at:  scheduledAt,
      topic,
      status:        'pending',
    })
    .select()
    .single();

  assertNoError(error, 'bookSession');
  return data;
}

/**
 * @param {string} sessionId
 * @param {'pending'|'confirmed'|'completed'|'cancelled'} status
 */
export async function updateSessionStatus(sessionId, status) {
  const { error } = await supabase
    .from('sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  assertNoError(error, 'updateSessionStatus');
}

/**
 * Retourne les séances à venir pour un utilisateur (étudiant ou mentor).
 *
 * @param {string} userId
 * @param {'etudiant'|'mentor'} role
 * @returns {Array}
 */
export async function getUpcomingSessions(userId, role) {
  const field = role === 'mentor' ? 'mentor_id' : 'student_id';
  const now   = new Date().toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      mentors  ( id, profiles ( name ) ),
      students ( id, profiles ( name ) )
    `)
    .eq(field, userId)
    .gte('scheduled_at', now)
    .in('status', ['pending', 'confirmed'])
    .order('scheduled_at', { ascending: true });

  assertNoError(error, 'getUpcomingSessions');
  return data ?? [];
}

// ─── ÉCOLES ───────────────────────────────────────────────────────────────────

/**
 * @param {string} schoolId
 * @returns {Object|null}
 */
export async function getSchool(schoolId) {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  assertNoError(error, 'getSchool');
  return data;
}

/**
 * Retourne tous les étudiants rattachés à une école (RLS : admin-ecole uniquement).
 * @param {string} schoolId
 * @returns {Array}
 */
export async function getSchoolStudents(schoolId) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      profiles ( id, name, email, created_at )
    `)
    .eq('school_id', schoolId)
    .order('profiles(name)');

  assertNoError(error, 'getSchoolStudents');
  return data ?? [];
}

/**
 * Calcule les stats agrégées d'une école.
 * @param {string} schoolId
 * @returns {{ placementRate: number, totalStudents: number, totalSessions: number, tokenBalance: number }}
 */
export async function getSchoolStats(schoolId) {
  const [studentsRes, sessionsRes, tokensRes] = await Promise.all([
    supabase
      .from('students')
      .select('id, is_placed', { count: 'exact' })
      .eq('school_id', schoolId),

    supabase
      .from('sessions')
      .select('id', { count: 'exact' })
      .eq('school_id', schoolId)
      .eq('status', 'completed'),

    supabase
      .from('schools')
      .select('token_balance')
      .eq('id', schoolId)
      .single(),
  ]);

  assertNoError(studentsRes.error, 'getSchoolStats/students');
  assertNoError(sessionsRes.error, 'getSchoolStats/sessions');
  assertNoError(tokensRes.error,   'getSchoolStats/tokens');

  const students     = studentsRes.data ?? [];
  const totalStudents = studentsRes.count ?? 0;
  const placed        = students.filter(s => s.is_placed).length;

  return {
    placementRate:  totalStudents > 0 ? Math.round((placed / totalStudents) * 100) : 0,
    totalStudents,
    totalSessions:  sessionsRes.count ?? 0,
    tokenBalance:   tokensRes.data?.token_balance ?? 0,
  };
}

// ─── TOKENS ───────────────────────────────────────────────────────────────────

/**
 * @param {string} studentId
 * @returns {{ balance: number }}
 */
export async function getTokenBalance(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select('token_balance')
    .eq('user_id', studentId)
    .single();

  assertNoError(error, 'getTokenBalance');
  return { balance: data?.token_balance ?? 0 };
}

/**
 * Déduit des tokens d'un étudiant (déclenché à la réservation d'une séance).
 * Idéalement à déplacer dans une Edge Function pour l'atomicité.
 *
 * @param {string} studentId
 * @param {number} amount - 1 pour junior, 1.5 pour senior
 * @param {string} sessionId
 */
export async function deductTokens(studentId, amount, sessionId) {
  // 1. Récupère le solde actuel
  const { balance } = await getTokenBalance(studentId);
  if (balance < amount) throw new Error('Solde de tokens insuffisant');

  // 2. Met à jour le solde
  const { error: updateError } = await supabase
    .from('students')
    .update({ token_balance: balance - amount })
    .eq('user_id', studentId);

  assertNoError(updateError, 'deductTokens/update');

  // 3. Log la transaction
  const { error: logError } = await supabase
    .from('token_transactions')
    .insert({
      student_id:  studentId,
      amount:      -amount,
      reason:      'session',
      session_id:  sessionId,
    });

  assertNoError(logError, 'deductTokens/log');
}

/**
 * Ajoute des tokens à un étudiant (admin uniquement côté RLS).
 * @param {string} studentId
 * @param {number} amount
 * @param {string} reason - ex: "achat", "offert", "remboursement"
 */
export async function addTokens(studentId, amount, reason = 'admin') {
  const { balance } = await getTokenBalance(studentId);

  const { error: updateError } = await supabase
    .from('students')
    .update({ token_balance: balance + amount })
    .eq('user_id', studentId);

  assertNoError(updateError, 'addTokens/update');

  const { error: logError } = await supabase
    .from('token_transactions')
    .insert({
      student_id: studentId,
      amount,
      reason,
    });

  assertNoError(logError, 'addTokens/log');
}
