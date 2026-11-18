import type { Game } from './engine';
import { startTimer, type Timer } from '../lib/timer';
import { beep, chime } from '../lib/sound';
import { $, esc, shuffle } from '../lib/ui';

/**
 * ¿Qué falta? : jeu de Kim. La classe mémorise des mots du chapitre,
 * un mot disparaît : il faut dire lequel, en espagnol. Une carte de plus à chaque manche.
 */
const DEBUT = 5, MAX = 12;

const quefalta: Game = (el, ctx) => {
  let n = DEBUT, manche = 0, cartes: [string, string][] = [], falta: [string, string] = ['', ''], timer: Timer | null = null;
  let phase: 'reglas' | 'mira' | 'adivina' | 'sol' = 'reglas';
  const equipe = () => ctx.teams.length ? ctx.teams[ctx.turn()] : null;
  const duree = () => 8 + n * 2;

  const nouvelle = () => {
    manche++;
    cartes = shuffle(ctx.theme.vocab).slice(0, Math.min(n, ctx.theme.vocab.length));
    falta = cartes[Math.floor(Math.random() * cartes.length)];
    phase = 'mira';
    timer?.stop();
    timer = startTimer(duree(), () => { phase = 'adivina'; beep(500, 0.2); render(); }, l => { const c = $('#clock', el); if (c) c.textContent = String(l); });
    render();
  };
  const grille = (liste: [string, string][], cache?: string) =>
    `<div class="falta-grille">${liste.map(([es, fr]) => es === cache
      ? '<div class="falta-carte vide" aria-label="carte manquante">❓</div>'
      : `<div class="falta-carte"><b lang="es">${esc(es)}</b><span class="muted small">${esc(fr)}</span></div>`).join('')}</div>`;

  const render = () => {
    const e = equipe();
    const tete = `<div class="row center-row"><span class="pill">Manche ${manche}</span><span class="pill">${cartes.length} mots</span>${e ? `<span class="pill">${e.icon} ${esc(e.nom)}</span>` : ''}</div>`;
    if (phase === 'reglas') {
      el.innerHTML = `
        <div class="center">
          <div class="count" aria-hidden="true">🧠</div>
          <div class="huge" lang="es">¿Qué falta?</div>
          <p class="big">Mémorisez les mots… l’un d’eux va disparaître !</p>
          <ul class="regles">
            <li>👀 Quelques secondes pour retenir les mots du chapitre.</li>
            <li>❓ Les mots sont mélangés, un a disparu : dites lequel, en espagnol : <span lang="es">« Falta… »</span></li>
            <li>📈 Un mot de plus à chaque manche (jusqu’à ${MAX}). ${ctx.teams.length ? 'Une équipe par manche, +1 point par bonne réponse.' : ''}</li>
          </ul>
          <button class="btn bigbtn" id="go">¡Empezamos!</button>
        </div>`;
      $('#go', el).onclick = nouvelle;
      return;
    }
    if (phase === 'mira') {
      el.innerHTML = `<div class="center">${tete}
        <p class="big" lang="es">¡Memoriza! <span class="pill">⏱ <span id="clock" role="timer">${duree()}</span> s</span></p>
        ${grille(cartes)}
        <button class="btn ghost" id="pret">J’ai retenu, cacher</button></div>`;
      $('#pret', el).onclick = () => { timer?.stop(); phase = 'adivina'; render(); };
      return;
    }
    if (phase === 'adivina') {
      const reste = shuffle(cartes);
      el.innerHTML = `<div class="center">${tete}
        <p class="big" lang="es">¿Qué falta?</p>
        ${grille(reste, falta[0])}
        <p class="muted">Réponse à l’oral, en espagnol : <span lang="es">« Falta… »</span></p>
        <button class="btn bigbtn" id="sol">Voir la réponse</button></div>`;
      $('#sol', el).onclick = () => { phase = 'sol'; render(); };
      return;
    }
    el.innerHTML = `<div class="center">${tete}
      <p class="big" lang="es">Falta…</p>
      <div class="huge win" lang="es">${esc(falta[0])}</div>
      <p class="big">${esc(falta[1])}</p>
      <div class="row wrap center-row">
        <button class="btn ok bigbtn" id="bien">✓ Trouvé</button>
        <button class="btn ghost" id="rate">✗ Raté</button>
      </div></div>`;
    const fin = (ok: boolean) => {
      if (ok) { if (e) ctx.point(ctx.turn()); chime(); n = Math.min(MAX, n + 1); } else beep(220, 0.2);
      if (ctx.teams.length) ctx.nextTurn();
      nouvelle();
    };
    $('#bien', el).onclick = () => fin(true);
    $('#rate', el).onclick = () => fin(false);
  };

  render();
  return () => timer?.stop();
};

export default quefalta;
