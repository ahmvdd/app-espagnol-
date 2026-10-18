import type { Tool } from './index';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { beep, chime } from '../lib/sound';
import { $, $$, esc, shuffle, timers } from '../lib/ui';

type Etape = { es: string; fr: string; icon: string };
type Pause = { id: string; titre: string; icon: string; regle: string; etapes: () => Etape[] };

const SIMON: [string, string, string][] = [
  ['levantad las manos', 'levez les mains', '🙌'], ['tocad la cabeza', 'touchez votre tête', '🙆'],
  ['saltad', 'sautez', '🦘'], ['sentaos', 'asseyez-vous', '🪑'], ['levantaos', 'levez-vous', '🧍'],
  ['tocad la nariz', 'touchez votre nez', '👃'], ['cerrad los ojos', 'fermez les yeux', '😌'],
  ['aplaudid', 'applaudissez', '👏'], ['girad', 'tournez sur vous-mêmes', '🔄'], ['tocad los pies', 'touchez vos pieds', '🦶']
];
const VERBOS: [string, string, string][] = [
  ['correr', 'courir', '🏃'], ['nadar', 'nager', '🏊'], ['bailar', 'danser', '💃'], ['cantar', 'chanter', '🎤'],
  ['dormir', 'dormir', '😴'], ['comer', 'manger', '🍽'], ['escribir', 'écrire', '✍️'], ['leer', 'lire', '📖'],
  ['cocinar', 'cuisiner', '🍳'], ['conducir', 'conduire', '🚗'], ['jugar al fútbol', 'jouer au foot', '⚽'], ['llorar', 'pleurer', '😢']
];
const ESTIRAMIENTOS: [string, string, string][] = [
  ['Estirad los brazos hacia arriba', 'Étirez les bras vers le haut', '🙆'],
  ['Girad la cabeza despacio', 'Tournez doucement la tête', '🔄'],
  ['Subid y bajad los hombros', 'Montez et descendez les épaules', '🤷'],
  ['Respirad hondo tres veces', 'Respirez profondément trois fois', '🌬'],
  ['Estirad los brazos hacia delante', 'Étirez les bras devant vous', '🫸'],
  ['Moved las manos y los dedos', 'Bougez les mains et les doigts', '🖐'],
  ['Inclinaos a la derecha, luego a la izquierda', 'Penchez-vous à droite, puis à gauche', '↔️']
];

const PAUSES: Pause[] = [
  {
    id: 'simon', titre: 'Simón dice', icon: '🗣', regle: 'On fait le geste seulement si la consigne commence par « Simón dice ». Sinon, on ne bouge pas !',
    etapes: () => shuffle(SIMON).slice(0, 8).map(([es, fr, icon]) => {
      const simon = Math.random() < 0.7;
      return { es: simon ? `Simón dice : ¡${es}!` : `¡${es[0].toUpperCase() + es.slice(1)}!`, fr: simon ? fr : `piège : on ne bouge pas (${fr})`, icon: simon ? icon : '🙅' };
    })
  },
  { id: 'mimos', titre: 'Mimes de verbes', icon: '🎭', regle: 'Tout le monde mime le verbe affiché, en silence.', etapes: () => shuffle(VERBOS).slice(0, 8).map(([es, fr, icon]) => ({ es, fr, icon })) },
  { id: 'estiramientos', titre: 'Étirements', icon: '🧘', regle: 'On suit les consignes calmement, sans parler.', etapes: () => ESTIRAMIENTOS.map(([es, fr, icon]) => ({ es, fr, icon })) }
];

const DUREE_ETAPE = 7000;

const pausas: Tool = el => {
  const t = timers();

  const menu = () => {
    t.clear();
    el.innerHTML = `
      <div class="center">
        <p class="big">Une pause d’une minute, consignes en espagnol.</p>
        <div class="sos-grid">${PAUSES.map(p => `
          <button class="panel sos-col pause-btn" data-p="${p.id}">
            <span class="count" aria-hidden="true" style="font-size:3rem">${p.icon}</span>
            <strong class="big">${p.titre}</strong><span class="muted">${p.regle}</span>
          </button>`).join('')}</div>
      </div>`;
    $$('[data-p]', el).forEach(b => b.onclick = () => lancer(PAUSES.find(p => p.id === b.dataset.p)!));
  };

  const lancer = (p: Pause) => {
    const etapes = p.etapes();
    let i = 0;
    const step = () => {
      if (i >= etapes.length) {
        chime();
        el.innerHTML = `<div class="center"><div class="huge win">¡Muy bien!</div><p class="big">On se rassoit calmement.</p><button class="btn bigbtn" id="back">Retour</button></div>`;
        $('#back', el).onclick = menu;
        return;
      }
      const e = etapes[i];
      el.innerHTML = `
        <div class="center pause">
          <span class="pill">${p.titre} · ${i + 1} / ${etapes.length}</span>
          <div class="count" aria-hidden="true">${e.icon}</div>
          <div class="huge" lang="es" aria-live="assertive">${esc(e.es)}</div>
          <p class="big muted">${esc(e.fr)}</p>
          <div class="barre"><i style="animation-duration:${DUREE_ETAPE}ms"></i></div>
          <button class="btn ghost sm" id="stop">Arrêter</button>
        </div>`;
      $('#stop', el).onclick = menu;
      if (!speak(e.es.replace(':', ','), state.reglages.accent ?? 'es-ES', 1)) beep(660, 0.1);
      i++;
      t.after(step, DUREE_ETAPE);
    };
    step();
  };

  menu();
  return () => t.clear();
};

export default pausas;
