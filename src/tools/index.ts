import minuteur from './minuteur';
import ruleta from './ruleta';
import equipos from './equipos';
import congelados from './congelados';
import voz from './voz';

export type Tool = (el: HTMLElement, params: URLSearchParams) => void | (() => void);
export type ToolInfo = { id: string; nom: string; desc: string; icon: string; run: Tool };

export const TOOLS: ToolInfo[] = [
  { id: 'minutero', nom: 'Minutero', desc: 'Minuteur géant', icon: '⏱', run: minuteur },
  { id: 'ruleta', nom: 'Ruleta', desc: 'Tirer un élève au sort', icon: '🎡', run: ruleta },
  { id: 'equipos', nom: 'Equipos', desc: 'Faire des équipes', icon: '👥', run: equipos },
  { id: 'congelados', nom: 'Congelados', desc: 'Tout le monde s’arrête', icon: '❄', run: congelados },
  { id: 'voz', nom: 'Nivel de voz', desc: 'Niveau de voix 0 à 3', icon: '🔉', run: voz }
];

export const toolCard = (t: ToolInfo, query = '') =>
  `<a class="panel tool-card" href="#/herramientas/${t.id}${query}"><span class="ico" aria-hidden="true">${t.icon}</span><strong>${t.nom}</strong><span class="muted">${t.desc}</span></a>`;
