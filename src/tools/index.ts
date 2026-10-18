import minuteur from './minuteur';
import ruleta from './ruleta';
import equipos from './equipos';
import congelados from './congelados';
import voz from './voz';
import rituel from './rituel';
import pausas from './pausas';
import roles from './roles';
import consignas from './consignas';
import sonometro from './sonometro';
import rotations from './rotations';
import plan from './plan';
import vuelta from './vuelta';

export type Tool = (el: HTMLElement, params: URLSearchParams) => void | (() => void);
export type ToolInfo = { id: string; nom: string; es: string; desc: string; icon: string; run: Tool };

export const TOOLS: ToolInfo[] = [
  { id: 'minuteur', nom: 'Minuteur', es: 'El cronómetro', desc: 'Minuteur géant', icon: '⏱', run: minuteur },
  { id: 'ruleta', nom: 'Roulette', es: 'La ruleta', desc: 'Tirer un élève au sort', icon: '🎡', run: ruleta },
  { id: 'equipos', nom: 'Équipes', es: 'Los equipos', desc: 'Faire des équipes', icon: '👥', run: equipos },
  { id: 'congelados', nom: 'Congelados', es: '¡Congelados!', desc: 'Tout le monde s’arrête', icon: '❄', run: congelados },
  { id: 'voz', nom: 'Niveau de voix', es: 'El nivel de voz', desc: 'Du silence à la voix de classe', icon: '🔉', run: voz },
  { id: 'sonometre', nom: 'Sonomètre', es: 'El sonómetro', desc: 'Le micro mesure le bruit', icon: '🎙', run: sonometro },
  { id: 'rituel', nom: 'Rituel d’entrée', es: 'El ritual', desc: 'Consigne, 3 minutes, mini-défi', icon: '🚪', run: rituel },
  { id: 'pauses', nom: 'Pauses énergie', es: 'Pausas activas', desc: 'Simón dice, mimes, étirements', icon: '🤸', run: pausas },
  { id: 'vuelta', nom: 'La Vuelta', es: 'La Vuelta', desc: 'Course d’étapes par équipes sur la carte', icon: '🚴', run: vuelta },
  { id: 'plan', nom: 'Plan de classe', es: 'El plano de la clase', desc: 'Glisser les élèves à leur place', icon: '🪑', run: plan },
  { id: 'roles', nom: 'Rôles tournants', es: 'Los roles', desc: 'Secrétaire, gardien du temps…', icon: '🎖', run: roles },
  { id: 'rotations', nom: 'Travail de groupe', es: 'Rotaciones', desc: 'Speed meeting, world café, classe puzzle', icon: '🔁', run: rotations },
  { id: 'consignes', nom: 'Consignes en images', es: 'Las consignas', desc: 'Pictos bilingues à projeter', icon: '🖼', run: consignas }
];

export const toolCard = (t: ToolInfo, query = '') =>
  `<a class="panel tool-card" href="#/herramientas/${t.id}${query}"><span class="ico" aria-hidden="true">${t.icon}</span><strong>${t.nom}</strong><span class="es" lang="es">${t.es}</span><span class="muted small">${t.desc}</span></a>`;
