import { shuffle, pick } from './ui';

export type TeamsResult = { teams: string[][]; ok: boolean };

/**
 * Répartit `ids` en `k` équipes équilibrées (écart d'un élève au plus)
 * en séparant les paires incompatibles. Nombre d'essais borné : jamais de boucle infinie.
 */
export function makeTeams(ids: string[], k: number, bad: [string, string][] = [], tries = 400): TeamsResult {
  const conflict = new Map<string, Set<string>>();
  for (const [a, b] of bad) {
    if (!conflict.has(a)) conflict.set(a, new Set());
    if (!conflict.has(b)) conflict.set(b, new Set());
    conflict.get(a)!.add(b); conflict.get(b)!.add(a);
  }
  const cap = Math.ceil(ids.length / k);
  for (let attempt = 0; attempt < tries; attempt++) {
    const teams: string[][] = Array.from({ length: k }, () => []);
    let ok = true;
    for (const id of shuffle(ids)) {
      const opts = teams.filter(t => t.length < cap && !t.some(o => conflict.get(id)?.has(o)));
      if (!opts.length) { ok = false; break; }
      const min = Math.min(...opts.map(t => t.length));
      pick(opts.filter(t => t.length === min)).push(id);
    }
    if (ok && Math.max(...teams.map(t => t.length)) - Math.min(...teams.map(t => t.length)) <= 1) return { teams, ok };
  }
  const teams: string[][] = Array.from({ length: k }, () => []);
  shuffle(ids).forEach((id, i) => teams[i % k].push(id));
  return { teams, ok: false };
}
