import type { GameInfo } from './engine';
import quiz from './quiz';
import rosco from './rosco';
import ahorcado from './ahorcado';
import memory from './memory';
import bomba from './bomba';
import basta from './basta';
import taboo from './taboo';
import loteria from './loteria';
import escape from './escape';

export const GAMES: GameInfo[] = [
  { id: 'quiz', nom: 'Quiz en direct', es: 'El quiz', desc: 'Questions projetées, réponses sur ardoise', icon: '❓', run: quiz },
  { id: 'rosco', nom: 'Rosco', es: 'Pasapalabra', desc: 'Un mot par lettre de l’alphabet', icon: '🔤', run: rosco },
  { id: 'ahorcado', nom: 'Pendu', es: 'El ahorcado', desc: 'Deviner le mot lettre par lettre', icon: '🪢', run: ahorcado },
  { id: 'memory', nom: 'Memory', es: 'El memory', desc: 'Retrouver le mot et sa traduction', icon: '🃏', run: memory },
  { id: 'bomba', nom: 'La bomba', es: 'La bomba', desc: 'Traduire avant l’explosion', icon: '💣', run: bomba },
  { id: 'basta', nom: 'Basta', es: '¡Basta!', desc: 'Une lettre, des catégories, 2 minutes', icon: '✋', run: basta },
  { id: 'taboo', nom: 'Taboo', es: 'Tabú', desc: 'Faire deviner sans les mots interdits', icon: '🚫', run: taboo, needsTeams: true },
  { id: 'escape', nom: 'Escape game', es: 'Escape room', desc: 'Axe 6 : 5 énigmes, un cadenas, 20 à 45 min', icon: '🔐', run: escape, sansTheme: true },
  { id: 'loteria', nom: 'Lotería', es: 'La lotería', desc: 'Bingo avec cartes imprimables', icon: '🎴', run: loteria }
];

export const gameCard = (g: GameInfo) =>
  `<a class="panel tool-card" href="#/juegos/${g.id}"><span class="ico" aria-hidden="true">${g.icon}</span><strong>${g.nom}</strong><span class="es" lang="es">${g.es}</span><span class="muted small">${g.desc}</span></a>`;
