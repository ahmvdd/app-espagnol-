import type { Tool } from './index';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { $, $$, esc, onKeys } from '../lib/ui';

const CONSIGNAS: [string, string, string][] = [
  ['👂', 'Escuchad', 'Écoutez'],
  ['👀', 'Mirad la pizarra', 'Regardez le tableau'],
  ['✍️', 'Escribid', 'Écrivez'],
  ['📖', 'Leed', 'Lisez'],
  ['🔁', 'Repetid', 'Répétez'],
  ['🙋', 'Levantad la mano', 'Levez la main'],
  ['👥', 'Trabajad en parejas', 'Travaillez à deux'],
  ['🧑‍🤝‍🧑', 'Trabajad en grupos', 'Travaillez en groupes'],
  ['📓', 'Sacad el cuaderno', 'Sortez votre cahier'],
  ['🎒', 'Guardad vuestras cosas', 'Rangez vos affaires'],
  ['🤫', 'Silencio, por favor', 'Silence, s’il vous plaît'],
  ['💭', 'Pensad', 'Réfléchissez']
];

let actuelle = -1;

const consignas: Tool = el => {
  const render = () => {
    if (actuelle >= 0) {
      const [icon, es, fr] = CONSIGNAS[actuelle];
      el.innerHTML = `
        <div class="center consigne-projetee">
          <div class="count" aria-hidden="true">${icon}</div>
          <div class="huge" lang="es">${esc(es)}</div>
          <p class="big muted">${esc(fr)}</p>
          <div class="row wrap center-row">
            <button class="btn ghost" id="prev">←</button>
            <button class="btn" id="say">🔊 Écouter</button>
            <button class="btn ghost" id="next">→</button>
            <button class="btn ghost" id="all">Toutes les consignes</button>
          </div>
        </div>`;
      $('#say', el).onclick = () => speak(es, state.reglages.accent ?? 'es-ES');
      $('#prev', el).onclick = () => go(-1);
      $('#next', el).onclick = () => go(1);
      $('#all', el).onclick = () => { actuelle = -1; render(); };
      return;
    }
    el.innerHTML = `
      <p class="muted center">Un clic pour projeter la consigne en grand.</p>
      <div class="consignas">${CONSIGNAS.map(([icon, es, fr], i) => `
        <button class="panel consigna" data-i="${i}">
          <span class="ico" aria-hidden="true">${icon}</span><strong lang="es">${esc(es)}</strong><span class="muted small">${esc(fr)}</span>
        </button>`).join('')}</div>`;
    $$('[data-i]', el).forEach(b => b.onclick = () => {
      actuelle = Number(b.dataset.i); render();
      speak(CONSIGNAS[actuelle][1], state.reglages.accent ?? 'es-ES');
    });
  };
  const go = (d: number) => { actuelle = (actuelle + d + CONSIGNAS.length) % CONSIGNAS.length; render(); };

  render();
  return onKeys({ ArrowLeft: () => actuelle >= 0 && go(-1), ArrowRight: () => actuelle >= 0 && go(1), Escape: () => { actuelle = -1; render(); } });
};

export default consignas;
