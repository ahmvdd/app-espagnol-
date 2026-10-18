import type { Game } from './engine';
import { startTimer, type Timer } from '../lib/timer';
import { beep, chime } from '../lib/sound';
import { $, esc, onKeys, shuffle } from '../lib/ui';

const TOUR = 60;

const taboo: Game = (el, ctx) => {
  let timer: Timer | null = null, cartes = shuffle(ctx.theme.vocab), k = 0, reste = TOUR, phase: 'pret' | 'joue' | 'fin' = 'pret', trouves = 0;

  const interdits = (i: number) => {
    const [, fr] = cartes[i];
    const autres = shuffle(cartes.filter((_, j) => j !== i)).slice(0, 2).map(c => c[0]);
    return [fr, ...autres];
  };
  let tabous = interdits(0);

  const carte = (d: number) => {
    k = (k + d) % cartes.length;
    if (k === 0 && d) cartes = shuffle(cartes);
    tabous = interdits(k);
    render();
  };
  const lancer = () => {
    phase = 'joue'; trouves = 0; reste = TOUR;
    timer?.stop();
    timer = startTimer(TOUR, () => { phase = 'fin'; chime(); render(); }, l => { reste = l; const c = $('#clock', el); if (c) c.textContent = String(l); });
    carte(1);
  };
  const ok = () => { trouves++; if (ctx.turn() >= 0) ctx.point(ctx.turn()); else beep(880, 0.12); carte(1); };
  const passe = () => { beep(400, 0.1); carte(1); };

  const render = () => {
    const equipe = ctx.turn() >= 0 ? ctx.teams[ctx.turn()] : null;
    if (phase !== 'joue') {
      el.innerHTML = `
        <div class="center">
          ${phase === 'fin' ? `<p class="huge win">¡Tiempo!</p><p class="big">${trouves} mot(s) trouvé(s)</p>` : `
            <p class="big">Faire deviner le mot espagnol à son équipe… en espagnol !</p>
            <p>Interdit de dire les mots tabous, de traduire en français ou de mimer. 1 minute par équipe.</p>`}
          ${equipe ? `<p class="big">Au tour de ${equipe.icon} ${esc(equipe.nom)}</p>` : ''}
          <button class="btn bigbtn" id="go">${phase === 'fin' ? 'Équipe suivante' : '¡Empezar!'}</button>
        </div>`;
      $('#go', el).onclick = () => { if (phase === 'fin') ctx.nextTurn(); lancer(); };
      return;
    }
    el.innerHTML = `
      <div class="center">
        <div class="row center-row"><span class="pill">${equipe ? `${equipe.icon} ${esc(equipe.nom)}` : 'Toute la classe'}</span><span class="pill">⏱ <span id="clock" role="timer">${reste}</span> s</span></div>
        <div class="taboo-carte">
          <div class="huge" lang="es">${esc(cartes[k][0])}</div>
          <p class="muted">Mots tabous :</p>
          <ul class="tabous">${tabous.map(w => `<li>🚫 ${esc(w)}</li>`).join('')}</ul>
        </div>
        <div class="row wrap center-row">
          <button class="btn ok bigbtn" id="ok">✓ Trouvé</button>
          <button class="btn ghost" id="pass">⏭ Passer</button>
        </div>
        <p class="muted small">Touches : Entrée = trouvé · → = passer</p>
      </div>`;
    $('#ok', el).onclick = ok;
    $('#pass', el).onclick = passe;
  };

  render();
  const off = onKeys({ Enter: () => phase === 'joue' && ok(), ArrowRight: () => phase === 'joue' && passe() });
  return () => { timer?.stop(); off(); };
};

export default taboo;
