/**
 * Synchronisation de l'espace avec la base en ligne (Neon, via /api).
 * L'appareil garde toujours une copie locale : le site marche hors ligne et
 * envoie les changements dès que le réseau revient.
 */
import { EMPTY, wipeAll, type Data } from './storage';
import { replaceState, state, subscribe } from './state';
import { toast } from './ui';

const META = 'rincon.espace';
type Meta = { espace: string; nom: string; updatedAt: string | null; dirty: boolean };
export type Statut = 'ok' | 'envoi' | 'hors-ligne' | 'erreur' | 'deconnecte';

let meta: Meta | null = (() => { try { return JSON.parse(localStorage.getItem(META) || 'null'); } catch { return null; } })();
const ecrireMeta = () => { try { meta ? localStorage.setItem(META, JSON.stringify(meta)) : localStorage.removeItem(META); } catch { /* ignore */ } };

let statut: Statut = meta ? (meta.dirty ? 'envoi' : 'ok') : 'deconnecte';
const ecouteurs = new Set<(s: Statut) => void>();
const changer = (s: Statut) => { statut = s; ecouteurs.forEach(f => f(s)); };
export const onStatut = (f: (s: Statut) => void) => { ecouteurs.add(f); f(statut); return () => ecouteurs.delete(f); };
export const getStatut = () => statut;
export const espaceActif = () => meta && { id: meta.espace, nom: meta.nom };

async function api<T>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const r = await fetch('/api/' + path, { ...init, credentials: 'same-origin', headers: { 'content-type': 'application/json' } });
  let body: any = null;
  try { body = await r.json(); } catch { /* corps vide */ }
  return { status: r.status, body };
}

let applique = false;
/** Remplace les données locales par celles du serveur (l'état local va dans les points de retour). */
function appliquer(data: Data | null, updatedAt: string | null) {
  applique = true;
  try { replaceState({ ...structuredClone(EMPTY), ...(data ?? {}) }); } finally { applique = false; }
  if (meta) { meta.updatedAt = updatedAt; meta.dirty = false; ecrireMeta(); }
}

let enCours: Promise<void> | null = null;
let minuterie: number | undefined;

/** Envoie l'état local s'il a changé. */
export function envoyer(): Promise<void> {
  clearTimeout(minuterie);
  if (!meta?.dirty) return enCours ?? Promise.resolve();
  if (enCours) return enCours.then(envoyer);
  changer('envoi');
  enCours = (async () => {
    try {
      const { status, body } = await api<any>('data', { method: 'PUT', body: JSON.stringify({ data: state, base: meta!.updatedAt }) });
      if (status === 200) { meta!.updatedAt = body.updatedAt; meta!.dirty = false; ecrireMeta(); changer('ok'); }
      else if (status === 409) {
        appliquer(body.data, body.updatedAt);
        toast('Données mises à jour depuis un autre appareil. Ta version est dans Profe → points de retour.');
        changer('ok');
      } else if (status === 401) changer('deconnecte');
      else changer('erreur');
    } catch { changer('hors-ligne'); }
    finally { enCours = null; }
  })();
  return enCours;
}

/** Récupère la version en ligne. Première connexion : les données déjà sur l'appareil sont envoyées. */
export async function recuperer(): Promise<void> {
  if (!meta) return;
  try {
    const { status, body } = await api<{ data: Data | null; updatedAt: string | null }>('data');
    if (status === 401) return changer('deconnecte');
    if (status !== 200) return changer('erreur');
    if (body.data === null) { meta.dirty = true; ecrireMeta(); return envoyer(); }
    if (body.updatedAt !== meta.updatedAt) {
      if (meta.dirty && meta.updatedAt !== null) toast('Données mises à jour depuis un autre appareil. Ta version est dans Profe → points de retour.');
      appliquer(body.data, body.updatedAt);
      changer('ok');
    } else if (meta.dirty) await envoyer();
    else changer('ok');
  } catch { changer('hors-ligne'); }
}

/** Connexion par mot secret : le serveur renvoie l'espace correspondant.
 *  Si l'appareil servait à un autre espace, on repart des données en ligne de celui-ci. */
export async function connecter(secret: string): Promise<string | null> {
  let r;
  try { r = await api<any>('login', { method: 'POST', body: JSON.stringify({ secret }) }); }
  catch { return 'Pas de connexion Internet.'; }
  if (r.status !== 200) return r.body?.erreur ?? 'Connexion impossible.';
  const espace: string = r.body.id;
  if (meta && meta.espace !== espace) { meta = { espace, nom: r.body.nom, updatedAt: null, dirty: false }; ecrireMeta(); appliquer(null, null); wipeAll(); }
  else if (meta) { meta.nom = r.body.nom; ecrireMeta(); }
  else { meta = { espace, nom: r.body.nom, updatedAt: null, dirty: false }; ecrireMeta(); }
  await recuperer();
  return null;
}

/** Déconnexion : n'efface l'appareil qu'une fois tout envoyé. */
export async function deconnecter(): Promise<string | null> {
  if (meta?.dirty) { await envoyer(); if (meta?.dirty) return 'Des changements ne sont pas encore enregistrés en ligne. Connecte-toi à Internet puis réessaie.'; }
  try { await api('logout', { method: 'POST' }); } catch { /* le cookie expirera */ }
  meta = null; ecrireMeta();
  appliquer(null, null);
  wipeAll(); // aucune donnée d'élève ne reste sur l'appareil après la déconnexion
  changer('deconnecte');
  return null;
}

/** Vérifie la session au démarrage (sans bloquer l'usage hors ligne). */
export async function demarrer(): Promise<void> {
  subscribe(() => {
    if (applique || !meta) return;
    meta.dirty = true; ecrireMeta();
    changer('envoi');
    clearTimeout(minuterie);
    minuterie = window.setTimeout(envoyer, 1500);
  });
  addEventListener('online', () => { if (meta) recuperer(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && meta) recuperer(); else if (meta?.dirty) envoyer(); });
  if (!meta) return;
  try {
    const { status } = await api('session');
    if (status === 401) return changer('deconnecte');
  } catch { return changer('hors-ligne'); }
  await recuperer();
}
