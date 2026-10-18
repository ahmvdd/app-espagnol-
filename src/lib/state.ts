import { loadData, saveData, type Data } from './storage';
import { toast } from './ui';

/** Instance unique des données, partagée par toutes les pages. */
export const state: Data = loadData();

const subs = new Set<(s: Data) => void>();

export function subscribe(fn: (s: Data) => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}

/** Modifie l'état, sauvegarde et prévient les abonnés. */
export function update(fn: (s: Data) => void = () => {}): boolean {
  fn(state);
  const ok = saveData(state);
  if (!ok) toast('Impossible d’enregistrer : stockage plein ou bloqué');
  subs.forEach(f => f(state));
  return ok;
}

/** Remplace tout le contenu (restauration) sans casser les références. */
export const replaceState = (next: Data) => update(s => Object.assign(s, structuredClone(next)));

export const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
