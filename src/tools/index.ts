import minuteur from './minuteur';
import ruleta from './ruleta';
import equipos from './equipos';
import congelados from './congelados';
import voz from './voz';

export type Tool = (el: HTMLElement, params: URLSearchParams) => void | (() => void);
export type ToolInfo = { id: string; nom: string; es: string; desc: string; icon: string; run: Tool };

export const TOOLS: ToolInfo[] = [
  { id: 'minuteur', nom: 'Minuteur', es: 'El cronómetro', desc: 'Minuteur géant', icon: '⏱', run: minuteur },
  { id: 'ruleta', nom: 'Roulette', es: 'La ruleta', desc: 'Tirer un élève au sort', icon: '🎡', run: ruleta },
  { id: 'equipos', nom: 'Équipes', es: 'Los equipos', desc: 'Faire des équipes', icon: '👥', run: equipos },
  { id: 'congelados', nom: 'Congelados', es: '¡Congelados!', desc: 'Tout le monde s’arrête', icon: '❄', run: congelados },
  { id: 'voz', nom: 'Niveau de voix', es: 'El nivel de voz', desc: 'Du silence à la voix de classe', icon: '🔉', run: voz }
];

export const toolCard = (t: ToolInfo, query = '') =>
  `<a class="panel tool-card" href="#/herramientas/${t.id}${query}"><span class="ico" aria-hidden="true">${t.icon}</span><strong>${t.nom}</strong><span class="es" lang="es">${t.es}</span><span class="muted small">${t.desc}</span></a>`;
