import type { Game } from './engine';
import { beep, gong } from '../lib/sound';
import { $, esc, onKeys, shuffle, timers, reducedMotion } from '../lib/ui';

/** Mèche cachée : la bombe explose au bout de 25 à 70 s, personne ne sait quand. */
const bomba: Game = (el, ctx) => {
  const t = timers();
  let mots = shuffle(ctx.theme.vocab), k = 0, fin = 0, phase: 'pret' | 'joue' | 'boum' = 'pret';

  const tic = () => {
    if (phase !== 'joue') return;
    const reste = fin - Date.now();
    if (reste <= 0) return boum();
    beep(1200, 0.03);
    t.after(tic, Math.max(140, Math.min(900, reste / 12)));
  };
  const boum = () => {
    phase = 'boum'; t.clear(); gong();
    render();
  };
  const start = () => {
    phase = 'joue'; fin = Date.now() + (25 + Math.random() * 45) * 1000;
    render(); tic();
  };
  const suivant = () => { k = (k + 1) % mots.length; if (k === 0) mots = shuffle(mots); render(); };

  const render = () => {
    if (phase === 'pret') {
      el.innerHTML = `
        <div class="center">
          <div class="count" aria-hidden="true">💣</div>
          <p class="big">On se passe la « bombe » (une trousse, une balle…).</p>
          <p>Celui qui la tient traduit le mot affiché en espagnol, puis la passe. Quand elle explose, il donne un mot de plus pour sa défense !</p>
          <button class="btn bigbtn" id="go">¡Empezar!</button>
        </div>`;
      $('#go', el).onclick = start;
      return;
    }
    if (phase === 'boum') {
      el.innerHTML = `
        <div class="center ${reducedMotion() ? '' : 'boum'}">
          <div class="count" aria-hidden="true">💥</div>
          <div class="huge" aria-live="assertive">¡BUM!</div>
          <p class="big">Dernier mot : « ${esc(mots[k][1])} » → <strong lang="es">${esc(mots[k][0])}</strong></p>
          <button class="btn bigbtn" id="go">Nueva ronda</button>
        </div>`;
      $('#go', el).onclick = () => { suivant(); start(); };
      return;
    }
    el.innerHTML = `
      <div class="center">
        <div class="bombe" aria-hidden="true">💣</div>
        <p class="muted">En español :</p>
        <div class="huge">« ${esc(mots[k][1])} »</div>
        <button class="btn bigbtn" id="next">Siguiente palabra →</button>
        <p class="muted small">Espace : mot suivant · ${ctx.teams.length ? 'les points se donnent avec les boutons +1' : 'toute la classe joue'}</p>
      </div>`;
    $('#next', el).onclick = suivant;
  };

  render();
  const off = onKeys({ ' ': () => (phase === 'joue' ? suivant() : $('#go', el)?.click()) });
  return () => { phase = 'pret'; t.clear(); off(); };
};

export default bomba;
