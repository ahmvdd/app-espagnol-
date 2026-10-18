import c5 from '../content/5e.json';
import c4 from '../content/4e.json';
import c3 from '../content/3e.json';

export type Niveau = '5e' | '4e' | '3e';
export type Theme = { id: string; titre: string; vocab: [string, string][] };

export const NIVEAUX: Niveau[] = ['5e', '4e', '3e'];
export const THEMES = { '5e': c5.themes, '4e': c4.themes, '3e': c3.themes } as unknown as Record<Niveau, Theme[]>;

export function palabraDelDia(d = new Date()) {
  const all = NIVEAUX.flatMap(n => THEMES[n].flatMap(t => t.vocab.map(([es, fr]) => ({ es, fr, niveau: n, theme: t.titre }))));
  const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);
  return all[day % all.length];
}
