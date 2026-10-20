import c5 from '../content/5e.json';
import c4 from '../content/4e.json';
import c3 from '../content/3e.json';
import acts from '../content/activites.json';
import rituelsJson from '../content/rituels.json';
import sosJson from '../content/sos.json';
import site from '../content/site.json';
import citasJson from '../content/citas.json';
import type { Activite, Ambiance, Axe, Niveau, NiveauFile, Situation, Theme } from '../content/types';

export type { Activite, Ambiance, Axe, Niveau, Theme };

/** Les JSON sont vérifiés au build par scripts/check-content.mjs. */
const FILES = { '5e': c5, '4e': c4, '3e': c3 } as unknown as Record<Niveau, NiveauFile>;

export const NIVEAUX: Niveau[] = ['5e', '4e', '3e'];
export const AXES = Object.fromEntries(NIVEAUX.map(n => [n, FILES[n].axes])) as Record<Niveau, Axe[]>;
/** Tous les thèmes d'un niveau, dans l'ordre des axes. */
export const THEMES = Object.fromEntries(NIVEAUX.map(n => [n, FILES[n].axes.flatMap(a => a.themes)])) as Record<Niveau, Theme[]>;
export const CECRL = Object.fromEntries(NIVEAUX.map(n => [n, FILES[n].cecrl])) as Record<Niveau, string>;
export const GRAMMAIRE = Object.fromEntries(NIVEAUX.map(n => [n, FILES[n].grammaire])) as Record<Niveau, string[]>;
export const axeDe = (n: Niveau, themeId: string) => AXES[n].find(a => a.themes.some(t => t.id === themeId));
export const COULEUR = Object.fromEntries(NIVEAUX.map(n => [n, FILES[n].couleur])) as Record<Niveau, string>;
export const ACTIVITES = acts as Activite[];
export const SOS = sosJson as Situation[];
export const RITUELS = rituelsJson as { meteo: [string, string][]; emociones: [string, string][]; preguntas: Record<Niveau, string[]> };
export const SITE = { prenom: site.prenom, dedicace: site.dedicace };

export const DUREES = [5, 10, 15, 20, 30, 50];
export const AMBIANCES: { id: Ambiance; label: string; icon: string }[] = [
  { id: 'calme', label: 'Calme', icon: '🌿' },
  { id: 'normale', label: 'Normale', icon: '🙂' },
  { id: 'agitee', label: 'Agitée', icon: '⚡' }
];

/** Numéro du jour local : même tirage pour toute la journée. */
export const dayIndex = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);

export function palabraDelDia(d = new Date()) {
  const all = NIVEAUX.flatMap(n => THEMES[n].flatMap(t => t.vocab.map(([es, fr]) => ({ es, fr, niveau: n, theme: t.titre }))));
  return all[dayIndex(d) % all.length];
}

/** Citations pour l'enseignante : une phrase de Souhaïla H. environ tous les huit jours, entre les citations célèbres. */
export const CITAS: { texto: string; autor?: string }[] = (() => {
  const prof = [...citasJson.prof];
  const out: { texto: string; autor?: string }[] = [];
  citasJson.celebres.forEach(([texto, autor], i) => {
    if (i % 7 === 0 && prof.length) out.push({ texto: prof.shift()!, autor: citasJson.autorProf });
    out.push({ texto, autor });
  });
  return [...out, ...prof.map(texto => ({ texto, autor: citasJson.autorProf }))];
})();

export const citaDelDia = (decalage = 0, d = new Date()) => CITAS[(dayIndex(d) + decalage) % CITAS.length];

/** Activités qui tiennent dans le temps donné, la plus proche de la durée d'abord. */
export function activitesPour(minutes: number, niveau: Niveau, ambiance: Ambiance): Activite[] {
  return ACTIVITES
    .filter(a => a.niveaux.includes(niveau) && a.ambiance === ambiance && a.duree <= minutes)
    .sort((a, b) => b.duree - a.duree);
}

export const lienActivite = (a: Activite, n: Niveau) => a.outil?.replace('{n}', n);

/** Prénom et dédicace : réglage de l'appareil, sinon valeurs livrées dans site.json. */
export const accueilPerso = (r: { prenomProf: string; dedicace?: string }) => ({
  prenom: r.prenomProf || SITE.prenom,
  dedicace: r.dedicace ?? SITE.dedicace
});

const LAST_THEME = 'rincon.dernierTheme';
export function dernierTheme(n: Niveau): Theme {
  let id = '';
  try { id = JSON.parse(localStorage.getItem(LAST_THEME) || '{}')[n] ?? ''; } catch { /* ignore */ }
  return THEMES[n].find(t => t.id === id) ?? THEMES[n][0];
}
export function rememberTheme(n: Niveau, id: string): void {
  try {
    const m = JSON.parse(localStorage.getItem(LAST_THEME) || '{}');
    m[n] = id;
    localStorage.setItem(LAST_THEME, JSON.stringify(m));
  } catch { /* ignore */ }
}
