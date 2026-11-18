import type { Game } from './engine';
import { startTimer, type Timer } from '../lib/timer';
import { beep, chime } from '../lib/sound';
import { $, esc, onKeys, shuffle } from '../lib/ui';

/**
 * ¡Dibújalo! : un élève dessine au tableau un mot du chapitre, son équipe devine… en espagnol.
 * Le mot reste caché à la classe (on le regarde en maintenant le bouton).
 */
const TOUR = 60;

const dibujalo: Game = (el, ctx) => {
  let timer: Timer | null = null, mots = shuffle(ctx.theme.vocab), k = 0, reste = TOUR, phase: 'pret' | 'joue' | 'fin' = 'pret', trouves: string[] = [];

  const mot = () => mots[k % mots.length];
  const suivant = () => { k++; if (k % mots.length === 0) mots = shuffle(mots); render(); };
  const lancer = () => {
    phase = 'joue'; trouves = []; reste = TOUR;
    timer?.stop();
    timer = startTimer(TOUR, () => { phase = 'fin'; chime(); render(); }, l => {
      reste = l; const c = $('#clock', el); if (c) c.textContent = String(l);
      if (l <= 5 && l > 0) beep(600, 0.08);
    });
    suivant();
  };
  const ok = () => { trouves.push(mot()[0]); ctx.point(ctx.turn()); beep(880, 0.15); suivant(); };
  const passe = () => { beep(380, 0.1); suivant(); };

  const render = () => {
    const e = ctx.teams[ctx.turn()];
    if (phase !== 'joue') {
      el.innerHTML = `
        <div class="center">
          <div class="count" aria-hidden="true">🖍</div>
          ${phase === 'fin' ? `<p class="huge win" lang="es">¡Tiempo!</p>
            <p class="big">${trouves.length} mot(s) trouvé(s)${trouves.length ? ` : <span lang="es">${trouves.map(esc).join(', ')}</span>` : ''}</p>` : `
            <div class="huge" lang="es">¡Dibújalo!</div>
            <p class="big">Un élève dessine le mot au tableau, son équipe le devine en espagnol.</p>
            <ul class="regles">
              <li>✏️ Interdit d’écrire des lettres, des chiffres ou de parler.</li>
              <li>🗣 L’équipe répond avec une phrase : <span lang="es">« ¿Es un/una… ? »</span>, <span lang="es">« ¡Es…! »</span></li>
              <li>⏱ 1 minute par équipe, autant de mots que possible : +1 point par mot.</li>
            </ul>`}
          <p class="big">Au tour de ${e.icon} ${esc(e.nom)}</p>
          <button class="btn bigbtn" id="go">${phase === 'fin' ? 'Équipe suivante' : '¡A dibujar!'}</button>
        </div>`;
      $('#go', el).onclick = () => { if (phase === 'fin') ctx.nextTurn(); lancer(); };
      return;
    }
    el.innerHTML = `
      <div class="center">
        <div class="row center-row"><span class="pill">${e.icon} ${esc(e.nom)}</span><span class="pill">⏱ <span id="clock" role="timer">${reste}</span> s</span><span class="pill">✓ ${trouves.length}</span></div>
        <div class="taboo-carte cachee" id="carte">
          <div class="huge" aria-hidden="true">🂠</div>
          <p class="big">Mot caché</p>
          <p class="muted">Le dessinateur maintient le bouton pour voir le mot.</p>
        </div>
        <button class="btn" id="voir">👁 Maintenir pour voir</button>
        <div class="row wrap center-row">
          <button class="btn ok bigbtn" id="ok">✓ Trouvé</button>
          <button class="btn ghost" id="pass">⏭ Passer</button>
        </div>
        <p class="muted small">Touches : Entrée = trouvé · → = passer</p>
      </div>`;
    const carte = $('#carte', el), [es, fr] = mot();
    const montrer = (v: boolean) => {
      carte.classList.toggle('cachee', !v);
      carte.innerHTML = v ? `<div class="huge" lang="es">${esc(es)}</div><p class="muted">${esc(fr)}</p>`
        : `<div class="huge" aria-hidden="true">🂠</div><p class="big">Mot caché</p><p class="muted">Le dessinateur maintient le bouton pour voir le mot.</p>`;
    };
    const voir = $<HTMLButtonElement>('#voir', el);
    voir.onpointerdown = e => { e.preventDefault(); montrer(true); };
    voir.onpointerup = voir.onpointerleave = voir.onpointercancel = () => montrer(false);
    voir.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); montrer(true); } };
    voir.onkeyup = () => montrer(false);
    $('#ok', el).onclick = ok;
    $('#pass', el).onclick = passe;
  };

  render();
  const off = onKeys({ Enter: () => phase === 'joue' && ok(), ArrowRight: () => phase === 'joue' && passe() });
  return () => { timer?.stop(); off(); };
};

export default dibujalo;
