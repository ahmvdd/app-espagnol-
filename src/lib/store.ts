import { loadData, saveData, type Data } from './storage';

/** Instance unique des données, partagée par toutes les pages. */
export const data: Data = loadData();

export const commit = (): boolean => saveData(data);

/** Remplace tout le contenu (restauration, effacement) sans casser les références. */
export function replace(next: Data): boolean {
  Object.assign(data, structuredClone(next));
  return commit();
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
