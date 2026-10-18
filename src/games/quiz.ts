import type { Game } from './engine';
import { winnerText } from './engine';
import { genQuestions, type QCM } from '../lib/questions';
import { chime } from '../lib/sound';
import { $, $$, esc, onKeys } from '../lib/ui';

const LETTRES = ['A', 'B', 'C', 'D'];
const MEDAILLE: Record<string, string> = { bronce: '🥉 bronce', plata: '🥈 plata', oro: '🥇 oro' };

const quiz: Game = (el, ctx) => {
  let qs: QCM[] = genQuestions(ctx.theme, 12), i = 0, shown = false;

  const next = () => { i++; shown = false; render(); };
  const reveal = () => { shown = true; render(); };

  const render = () => {
    if (i >= qs.length) {
      chime();
      el.innerHTML = `
        <div class="center">
          <p class="muted">Fin del quiz</p>
          <div class="huge win">${esc(winnerText(ctx.teams))}</div>
          <button class="btn bigbtn" id="again">Nouveau quiz</button>
        </div>`;
      $('#again', el).onclick = () => { qs = genQuestions(ctx.theme, 12); i = 0; render(); };
      return;
    }
    const q = qs[i];
    el.innerHTML = `
      <div class="center">
        <div class="row wrap center-row"><span class="pill">Pregunta ${i + 1} / ${qs.length}</span>${q.diff ? `<span class="pill">${MEDAILLE[q.diff]}</span>` : ''}</div>
        <div class="big quiz-q">${esc(q.q)}</div>
        <ol class="opts">${q.o.map((o, k) => `
          <li class="opt ${shown && k === q.a ? 'correct' : ''} ${shown && k !== q.a ? 'faded' : ''}">
            <b>${LETTRES[k]}</b> ${esc(o)}${shown && k === q.a ? ' <span aria-label="bonne réponse">✓</span>' : ''}</li>`).join('')}
        </ol>
        ${!shown ? '<button class="btn bigbtn" id="reveal">Mostrar respuesta</button>'
          : ctx.teams.length ? `
            <p class="muted">Qui a trouvé ?</p>
            <div class="row wrap center-row">
              ${ctx.teams.map((t, k) => `<button class="btn" data-t="${k}">+1 ${t.icon} ${esc(t.nom)}</button>`).join('')}
              <button class="btn ghost" id="next">Personne → suivante</button>
            </div>`
          : '<button class="btn bigbtn" id="next">Siguiente</button>'}
        <p class="muted small">Réponses à l’oral ou sur ardoise · Espace : révéler / suivante</p>
      </div>`;
    $('#reveal', el)?.addEventListener('click', reveal);
    $('#next', el)?.addEventListener('click', next);
    $$('[data-t]', el).forEach(b => b.onclick = () => { ctx.point(Number(b.dataset.t)); next(); });
  };

  render();
  return onKeys({ ' ': () => (i >= qs.length ? undefined : shown ? next() : reveal()) });
};

export default quiz;
