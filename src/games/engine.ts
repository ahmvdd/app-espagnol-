import type { Niveau, Theme } from '../content/types';
import { THEMES } from '../lib/content';
import { beep } from '../lib/sound';
import { esc } from '../lib/ui';

export type Team = { nom: string; icon: string; score: number };

export type GameCtx = {
  niveau: Niveau;
  theme: Theme;
  /** Vide = toute la classe joue ensemble, sans score. */
  teams: Team[];
  /** Ajoute des points (jamais de retrait). */
  point: (team: number, n?: number) => void;
  /** Équipe dont c'est le tour (-1 sans équipes). */
  turn: () => number;
  nextTurn: () => void;
};

export type Game = (el: HTMLElement, ctx: GameCtx) => void | (() => void);

export type GameInfo = {
  id: string; nom: string; es: string; desc: string; icon: string;
  run: Game;
  /** Le jeu a besoin d'équipes (sinon « toute la classe » est proposé). */
  needsTeams?: boolean;
  /** Le jeu a son propre contenu par niveau (pas de choix de thème). */
  sansTheme?: boolean;
};

export const EQUIPOS = [
  { nom: 'Sol', icon: '☀️' },
  { nom: 'Luna', icon: '🌙' },
  { nom: 'Mar', icon: '🌊' },
  { nom: 'Fuego', icon: '🔥' }
];

/** Fusionne les thèmes d'un niveau (« Tous les thèmes »). */
export function themeTous(n: Niveau): Theme {
  const all = THEMES[n];
  return {
    id: 'tous', titre: 'Tous les thèmes', objet: '', relu: all.every(t => t.relu), culture: all.flatMap(t => t.culture),
    vocab: all.flatMap(t => t.vocab), phrases: all.flatMap(t => t.phrases),
    quiz: all.flatMap(t => t.quiz), parole: all.flatMap(t => t.parole)
  };
}

export const themeById = (n: Niveau, id: string) => (id === 'tous' ? themeTous(n) : THEMES[n].find(t => t.id === id) ?? THEMES[n][0]);

export function scoreboard(el: HTMLElement, teams: Team[], turn: number): void {
  if (!teams.length) { el.innerHTML = ''; return; }
  const max = Math.max(...teams.map(t => t.score));
  el.innerHTML = teams.map((t, i) => `
    <div class="score ${i === turn ? 'turn' : ''}" ${i === turn ? 'aria-current="true"' : ''}>
      <span>${t.icon} ${esc(t.nom)}${i === turn ? ' <small>· à vous</small>' : ''}</span>
      <b>${t.score}</b>${t.score === max && max > 0 ? '<span aria-label="en tête">👑</span>' : ''}
      <button class="btn ghost sm" data-plus="${i}" aria-label="+1 point pour ${esc(t.nom)}">+1</button>
    </div>`).join('');
}

/** Contexte de jeu relié à un tableau de scores. */
export function makeCtx(niveau: Niveau, theme: Theme, teams: Team[], board: HTMLElement): GameCtx {
  let t = teams.length ? 0 : -1;
  const draw = () => {
    scoreboard(board, teams, t);
    board.querySelectorAll<HTMLButtonElement>('[data-plus]').forEach(b => b.onclick = () => ctx.point(Number(b.dataset.plus)));
  };
  const ctx: GameCtx = {
    niveau, theme, teams,
    point(i, n = 1) { if (!teams[i] || n <= 0) return; teams[i].score += n; beep(880, 0.12); draw(); },
    turn: () => t,
    nextTurn() { if (teams.length) { t = (t + 1) % teams.length; draw(); } }
  };
  draw();
  return ctx;
}

export function winnerText(teams: Team[]): string {
  if (!teams.length) return '¡Muy bien!';
  const max = Math.max(...teams.map(t => t.score));
  const w = teams.filter(t => t.score === max);
  return w.length > 1 ? '¡Empate!' : `¡Gana ${w[0].icon} ${w[0].nom}!`;
}
