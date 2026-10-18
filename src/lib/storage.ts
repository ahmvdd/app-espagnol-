/**
 * Stockage local + sauvegardes.
 * 3 niveaux : localStorage (données vivantes), 10 points de retour automatiques,
 * fichier .json exporté/importé par la prof.
 */
export const SCHEMA = 1;
const KEY = 'rincon.v1';
const SNAPS = 'rincon.snapshots';
const LAST_EXPORT = 'rincon.lastExport';
const MAX_SNAPS = 10;
const REMIND_AFTER_DAYS = 7;

export type Eleve = { id: string; prenom: string };
export type Classe = {
  id: string; nom: string; niveau: '5e' | '4e' | '3e'; eleves: Eleve[]; incompatibles: [string, string][];
  /** Rôles tournants : jour de la dernière séance et position dans la rotation. */
  roles?: { jour: string; tour: number };
};
export type Plan = { id: string; classeId: string; nom: string; disposition: 'rangees' | 'ilots' | 'u'; places: (string | null)[] };
export type Reglages = { muet: boolean; volume: number; police: 'standard' | 'dyslexie'; prenomProf: string; accent?: 'es-ES' | 'es-MX' };
export type Data = { classes: Classe[]; plans: Plan[]; reglages: Reglages };
export type Snapshot = { date: number; data: string };

export const EMPTY: Data = {
  classes: [],
  plans: [],
  reglages: { muet: false, volume: 0.6, police: 'standard', prenomProf: '' }
};

export function loadData(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* stockage indisponible */ }
  return structuredClone(EMPTY);
}

/** Les points de retour ne concernent que les classes et plans, pas les réglages (muet, accent...). */
const eleveData = (d: Data) => JSON.stringify([d.classes, d.plans]);

/** Sauvegarde + point de retour automatique (l'état précédent est conservé). */
export function saveData(data: Data): boolean {
  try {
    const prev = localStorage.getItem(KEY);
    if (prev && eleveData(JSON.parse(prev)) !== eleveData(data)) {
      const snaps = getSnapshots();
      snaps.unshift({ date: Date.now(), data: prev });
      localStorage.setItem(SNAPS, JSON.stringify(snaps.slice(0, MAX_SNAPS)));
    }
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false; // stockage plein ou bloqué : l'appelant affiche un message
  }
}

export function getSnapshots(): Snapshot[] {
  try { return JSON.parse(localStorage.getItem(SNAPS) || '[]'); } catch { return []; }
}

/** Revient à un point de retour. `pop` : annulation pure, sans garder l'état actuel. */
export function restoreSnapshot(index: number, pop = false): Data | null {
  const snaps = getSnapshots();
  const s = snaps[index];
  if (!s) return null;
  const data = { ...EMPTY, ...JSON.parse(s.data) } as Data;
  if (!pop) { saveData(data); return data; }
  try {
    localStorage.setItem(KEY, s.data);
    localStorage.setItem(SNAPS, JSON.stringify(snaps.slice(index + 1)));
  } catch { return null; }
  return data;
}

/** Télécharge un fichier rincon-sauvegarde-AAAA-MM-JJ.json */
export function exportBackup(data: Data): void {
  const backup = { app: 'rincon', schema: SCHEMA, date: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rincon-sauvegarde-${backup.date.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  try { localStorage.setItem(LAST_EXPORT, String(Date.now())); } catch { /* ignore */ }
}

export type BackupPreview = { date: string; classes: number; eleves: number; data: Data };

/** Lit et vérifie un fichier de sauvegarde, sans rien écraser. */
export async function readBackup(file: File): Promise<BackupPreview> {
  let b: any;
  try { b = JSON.parse(await file.text()); } catch { throw new Error("Ce fichier est illisible."); }
  if (b?.app !== 'rincon') throw new Error("Ce fichier n'est pas une sauvegarde du site.");
  if (b.schema > SCHEMA) throw new Error('Cette sauvegarde vient d’une version plus récente du site.');
  const data = migrate(b.data, b.schema);
  return {
    date: new Date(b.date).toLocaleDateString('fr-FR'),
    classes: data.classes.length,
    eleves: data.classes.reduce((n, c) => n + c.eleves.length, 0),
    data
  };
}

/** Fait évoluer les anciennes sauvegardes vers le format actuel. */
function migrate(data: any, from: number): Data {
  let d = data;
  // if (from < 2) d = { ...d, nouveauChamp: ... };
  void from;
  return { ...EMPTY, ...d };
}

export function shouldRemindBackup(data: Data): boolean {
  if (!data.classes.length) return false;
  try {
    const last = Number(localStorage.getItem(LAST_EXPORT) || 0);
    return Date.now() - last > REMIND_AFTER_DAYS * 864e5;
  } catch { return false; }
}

/** Demande au navigateur de ne pas effacer les données de lui-même. */
export async function requestPersistence(): Promise<void> {
  try { await navigator.storage?.persist?.(); } catch { /* ignore */ }
}

export function wipeAll(): void {
  try { [KEY, SNAPS, LAST_EXPORT].forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ }
}
