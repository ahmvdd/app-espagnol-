import { describe, expect, it } from 'vitest';
import { makeTeams } from './teams';

const ids = Array.from({ length: 28 }, (_, i) => 'e' + i);
const bad: [string, string][] = [['e0', 'e1'], ['e2', 'e3'], ['e4', 'e5'], ['e0', 'e6'], ['e7', 'e8'], ['e1', 'e9']];

describe('makeTeams', () => {
  it('100 générations sans aucune paire incompatible ensemble', () => {
    for (let n = 0; n < 100; n++) {
      for (const k of [2, 3, 4, 5, 6, 7, 8]) {
        const { teams, ok } = makeTeams(ids, k, bad);
        expect(ok).toBe(true);
        for (const t of teams) for (const [a, b] of bad) expect(t.includes(a) && t.includes(b)).toBe(false);
      }
    }
  });

  it('effectifs équilibrés et tout le monde placé une fois', () => {
    for (const k of [2, 3, 4, 5, 6, 7, 8]) {
      const { teams } = makeTeams(ids, k, bad);
      const sizes = teams.map(t => t.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(teams.flat().sort()).toEqual([...ids].sort());
    }
  });

  it('signale une contrainte impossible sans boucler', () => {
    const trio: [string, string][] = [['a', 'b'], ['b', 'c'], ['a', 'c']];
    const { ok, teams } = makeTeams(['a', 'b', 'c'], 2, trio);
    expect(ok).toBe(false);
    expect(teams.flat().sort()).toEqual(['a', 'b', 'c']);
  });
});
