/**
 * Outils communs aux fonctions serveur (Vercel) : base Neon, espaces, session.
 * Les mots secrets sont dans les variables d'environnement, jamais dans le code :
 *   ESPACE_1_NOM, ESPACE_1_SECRET, ESPACE_2_NOM, ESPACE_2_SECRET, ESPACE_3_NOM, ESPACE_3_SECRET
 *   SESSION_SECRET (longue chaîne aléatoire), DATABASE_URL (créée par l'intégration Neon)
 */
import { neon } from '@neondatabase/serverless';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export type Espace = { id: string; nom: string };

const COOKIE = 'cv_session';
const DUREE = 30 * 24 * 3600; // 30 jours, en secondes
export const MAX_OCTETS = 2_000_000;
export const VERSIONS_GARDEES = 30;

export function espaces(): (Espace & { secret: string })[] {
  return ['1', '2', '3']
    .map(id => ({ id, nom: process.env[`ESPACE_${id}_NOM`] || `Espace ${id}`, secret: process.env[`ESPACE_${id}_SECRET`] || '' }))
    .filter(e => e.secret.length > 0);
}

const hash = (s: string) => createHash('sha256').update(s, 'utf8').digest();
/** Comparaison à temps constant (pas d'indice sur la longueur ni le contenu). */
export const memeSecret = (a: string, b: string) => timingSafeEqual(hash(a), hash(b));

function cle(): string {
  const k = process.env.SESSION_SECRET;
  if (!k || k.length < 32) throw new Error('SESSION_SECRET manquant ou trop court (32 caractères minimum)');
  return k;
}
const signer = (payload: string) => createHmac('sha256', cle()).update(payload).digest('base64url');

export function cookieSession(espace: string): string {
  const payload = Buffer.from(JSON.stringify({ e: espace, x: Math.floor(Date.now() / 1000) + DUREE })).toString('base64url');
  return `${COOKIE}=${payload}.${signer(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DUREE}`;
}
export const cookieEfface = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

/** Renvoie l'espace de la session, ou null si absente, falsifiée ou expirée. */
export function lireSession(req: Request): Espace | null {
  const brut = (req.headers.get('cookie') || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (!brut) return null;
  const [payload, sig] = brut.split('.');
  if (!payload || !sig) return null;
  const attendu = signer(payload);
  if (sig.length !== attendu.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(attendu))) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof x !== 'number' || x < Date.now() / 1000) return null;
    const esp = espaces().find(s => s.id === e);
    return esp ? { id: esp.id, nom: esp.nom } : null; // un espace retiré invalide ses sessions
  } catch { return null; }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });

let pret: Promise<unknown> | null = null;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant : ajoute Neon au projet Vercel');
  const sql = neon(process.env.DATABASE_URL);
  pret ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS espaces (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS versions (n bigserial PRIMARY KEY, espace text NOT NULL, data jsonb NOT NULL, saved_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE INDEX IF NOT EXISTS versions_espace ON versions (espace, n DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS tentatives (espace text NOT NULL, at timestamptz NOT NULL DEFAULT now())`;
  })().catch(e => { pret = null; throw e; });
  return { sql, pret };
}
