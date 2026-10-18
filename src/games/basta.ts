import type { Game } from './engine';
import { startTimer, type Timer } from '../lib/timer';
import { chime } from '../lib/sound';
import { $, $$, esc, pick } from '../lib/ui';

const LETRAS = 'ABCDEFGILMNOPRSTV'.split('');
const CATEGORIAS = ['Un nombre', 'Un país o una ciudad', 'Un animal', 'Una comida', 'Un color o un objeto', 'Una profesión', 'Un verbo'];
const DUREE = 120;

const basta: Game = (el, ctx) => {
  let timer: Timer | null = null, lettre = '', phase: 'pret' | 'joue' | 'fin' = 'pret', reste = DUREE;

  const lancer = () => {
    lettre = pick(LETRAS); phase = 'joue'; reste = DUREE;
    timer?.stop();
    timer = startTimer(DUREE, stop, l => { reste = l; const c = $('#clock', el); if (c) c.textContent = `${Math.floor(l / 60)}:${String(l % 60).padStart(2, '0')}`; });
    render();
  };
  const stop = () => { timer?.stop(); phase = 'fin'; chime(); render(); };

  const render = () => {
    const cats = [...CATEGORIAS, `Una palabra del tema « ${ctx.theme.titre} »`];
    if (phase === 'pret') {
      el.innerHTML = `
        <div class="center">
          <p class="big">Une lettre, ${cats.length} catégories, 2 minutes.</p>
          <p>Chaque équipe écrit un mot espagnol par catégorie qui commence par la lettre. La première qui a tout crie <strong>« ¡Basta! »</strong>.</p>
          <button class="btn bigbtn" id="go">Tirer une lettre</button>
        </div>`;
      $('#go', el).onclick = lancer;
      return;
    }
    el.innerHTML = `
      <div class="basta">
        <div class="center">
          <div class="letra-basta" aria-live="assertive">${lettre}</div>
          ${phase === 'joue' ? `<div class="clock small-clock" id="clock" role="timer">${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, '0')}</div>
            <button class="btn bigbtn danger" id="basta">✋ ¡Basta!</button>` : '<p class="huge win">¡Basta!</p>'}
        </div>
        <ol class="cats">${cats.map(c => `<li lang="es">${esc(c)}</li>`).join('')}</ol>
      </div>
      ${phase === 'fin' ? `
        <section class="panel center">
          <p><strong>Correction</strong> : 10 points par mot que personne d’autre n’a trouvé, 5 points si une autre équipe a le même mot.</p>
          ${ctx.teams.length ? `<div class="row wrap center-row">${ctx.teams.map((t, k) => `
            <span class="row">${t.icon} ${esc(t.nom)} <button class="btn ghost sm" data-t="${k}" data-n="5">+5</button><button class="btn ghost sm" data-t="${k}" data-n="10">+10</button></span>`).join('')}</div>` : ''}
          <button class="btn bigbtn" id="go">Nouvelle lettre</button>
        </section>` : ''}`;
    $('#basta', el)?.addEventListener('click', stop);
    $('#go', el)?.addEventListener('click', lancer);
    $$('[data-t]', el).forEach(b => b.onclick = () => ctx.point(Number(b.dataset.t), Number(b.dataset.n)));
  };

  render();
  return () => timer?.stop();
};

export default basta;
