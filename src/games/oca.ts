import type { Game } from './engine';
import { genQuestions, type QCM } from '../lib/questions';
import { aDire, brancherADire, lancerDe, pion } from './plateau';
import { beep, chime } from '../lib/sound';
import { $, $$, esc } from '../lib/ui';

/**
 * El juego de la oca : le jeu de l'oie, très populaire en Espagne.
 * Case normale = une question du chapitre (juste : on reste, faux : on recule de 2).
 * Cases spéciales avec leurs formules traditionnelles, à dire en espagnol.
 */
const FIN = 40;
const OCAS = [5, 9, 14, 18, 23, 27, 32, 36];
type Especial = { ico: string; es: string; fr: string; frase?: string; vers?: number; pause?: number; rejoue?: boolean };
const ESPECIALES: Record<number, Especial> = {
  6: { ico: '🌉', es: 'El puente', fr: 'Le pont : on saute à la case 12 et on rejoue.', frase: 'De puente a puente y tiro porque me lleva la corriente.', vers: 12, rejoue: true },
  19: { ico: '🏨', es: 'La posada', fr: 'L’auberge : on passe un tour.', frase: 'Estoy cansado, me quedo en la posada.', pause: 1 },
  26: { ico: '🌀', es: 'El laberinto', fr: 'Le labyrinthe : on recule à la case 20.', frase: '¡Me he perdido en el laberinto!', vers: 20 },
  31: { ico: '🕳', es: 'El pozo', fr: 'Le puits : on passe un tour.', frase: '¡Socorro! Estoy en el pozo.', pause: 1 },
  38: { ico: '💀', es: 'La calavera', fr: 'La tête de mort : retour à la case 30.', frase: '¡Qué mala suerte! Vuelvo a la casilla treinta.', vers: 30 }
};
const LETTRES = ['A', 'B', 'C', 'D'];

const oca: Game = (el, ctx) => {
  let pos: number[] = [], pause: number[] = [], qs: QCM[] = [], k = 0, phase: 'reglas' | 'juego' | 'fin' = 'reglas', gagnant = -1;
  const question = () => { if (k >= qs.length) { qs = genQuestions(ctx.theme, 30); k = 0; } return qs[k++]; };
  const nouveau = () => { pos = ctx.teams.map(() => 1); pause = ctx.teams.map(() => 0); qs = genQuestions(ctx.theme, 30); k = 0; gagnant = -1; phase = 'juego'; };

  const caseHtml = (c: number) => {
    const sp = ESPECIALES[c], estOca = OCAS.includes(c);
    const ici = ctx.teams.map((e, i) => pos[i] === c ? pion(e) : '').join('');
    const ico = c === 1 ? '🏁' : c === FIN ? '🌸' : estOca ? '🦢' : sp?.ico ?? '';
    return `<div class="oca-case ${estOca ? 'oca-oca' : ''} ${sp ? 'oca-sp' : ''} ${c === FIN ? 'oca-fin' : ''}"><b>${c}</b><span aria-hidden="true">${ico}</span><div class="pions">${ici}</div></div>`;
  };
  /** Plateau en serpentin : 8 cases par ligne, une ligne sur deux à l'envers. */
  const plateau = () => {
    const lignes: number[][] = [];
    for (let l = 0; l < FIN / 8; l++) { const r = Array.from({ length: 8 }, (_, j) => l * 8 + j + 1); lignes.push(l % 2 ? r.reverse() : r); }
    return `<div class="oca-plateau">${lignes.map(r => r.map(caseHtml).join('')).join('')}</div>`;
  };

  const suivant = () => {
    ctx.nextTurn();
    let tours = 0;
    while (pause[ctx.turn()] > 0 && tours++ < ctx.teams.length) { pause[ctx.turn()]--; ctx.nextTurn(); }
    render();
  };

  const render = () => {
    if (phase === 'reglas') {
      el.innerHTML = `
        <div class="center plateau-regles">
          <div class="count" aria-hidden="true">🦢</div>
          <div class="huge" lang="es">El juego de la oca</div>
          <p class="big">Le jeu de l’oie, que tous les enfants espagnols connaissent ! Premier arrivé à la case ${FIN} gagne.</p>
          <ul class="regles">
            <li>🎲 On lance le dé et on répond à une question du chapitre : juste = on reste, faux = on recule de 2.</li>
            <li>🦢 <b lang="es">Oca</b> : on saute à l’oie suivante et on rejoue… en criant <span lang="es">« ¡De oca a oca y tiro porque me toca! »</span></li>
            <li>🌉 Pont, 🏨 auberge, 🌀 labyrinthe, 🕳 puits, 💀 tête de mort : chaque case a sa phrase à dire en espagnol.</li>
            <li>Bonne réponse : +1 point. Arrivée : +5 points.</li>
          </ul>
          <button class="btn bigbtn" id="go">¡A jugar!</button>
        </div>`;
      $('#go', el).onclick = () => { nouveau(); render(); };
      return;
    }
    if (phase === 'fin') {
      const e = ctx.teams[gagnant];
      el.innerHTML = `<div class="center"><div class="count" aria-hidden="true">🌸</div>
        <div class="huge win" lang="es">¡${e.icon} ${esc(e.nom)} llega al jardín de la oca!</div>
        <button class="btn bigbtn" id="again">Otra partida</button></div>`;
      $('#again', el).onclick = () => { phase = 'reglas'; render(); };
      return;
    }
    const t = ctx.turn(), e = ctx.teams[t];
    el.innerHTML = `
      <div class="plateau">
        <div class="plateau-corps">${plateau()}
          <section class="panel plateau-action" id="action" aria-live="polite">
            <p class="pill">${e.icon} ${esc(e.nom)} · <span lang="es">casilla ${pos[t]}</span></p>
            <div class="de" id="de" aria-hidden="true">🎲</div>
            <button class="btn bigbtn" id="tirar" lang="es">Tira el dado</button>
          </section>
        </div>
      </div>`;
    $('#tirar', el).onclick = () => {
      $<HTMLButtonElement>('#tirar', el).disabled = true;
      lancerDe($('#de', el), v => { pos[t] = Math.min(FIN, pos[t] + v); setTimeout(() => { render(); arriver(t, v); }, 400); });
    };
  };

  const fin = (z: HTMLElement, msg: string, rejoue = false) => {
    z.innerHTML = `${msg}<button class="btn bigbtn" id="sig" lang="es">${rejoue ? '¡Tira otra vez!' : 'Siguiente equipo'}</button>`;
    $('#sig', z).onclick = () => { if (rejoue) render(); else suivant(); };
  };

  const arriver = (t: number, v: number) => {
    const z = $('#action', el), c = pos[t], e = ctx.teams[t];
    const tete = `<p class="pill">${e.icon} ${esc(e.nom)} · +${v} → <span lang="es">casilla ${c}</span></p>`;
    if (c >= FIN) { gagnant = t; ctx.point(t, 5); chime(); phase = 'fin'; render(); return; }
    if (OCAS.includes(c)) {
      const suivante = OCAS.find(o => o > c) ?? c, ph = '¡De oca a oca y tiro porque me toca!';
      z.innerHTML = `${tete}<h3 lang="es">🦢 ¡Oca!</h3>${aDire(ph)}`;
      const sauter = () => { pos[t] = suivante; render(); fin($('#action', el), `<p class="win big" lang="es">🦢 Casilla ${suivante}</p>`, true); };
      brancherADire(z, ph, sauter, sauter);
      return;
    }
    const sp = ESPECIALES[c];
    if (sp) {
      z.innerHTML = `${tete}<h3 lang="es">${sp.ico} ${sp.es}</h3><p>${esc(sp.fr)}</p>${sp.frase ? aDire(sp.frase) : ''}`;
      const appliquer = () => {
        if (sp.vers) pos[t] = sp.vers;
        if (sp.pause) pause[t] = sp.pause;
        beep(sp.vers && sp.vers < c ? 260 : 700, 0.2);
        render();
        fin($('#action', el), `<p class="big" lang="es">${sp.ico} ${sp.vers ? `Casilla ${sp.vers}` : 'Pierdes un turno'}</p>`, !!sp.rejoue);
      };
      if (sp.frase) brancherADire(z, sp.frase, appliquer, appliquer); else appliquer();
      return;
    }
    const q = question();
    z.innerHTML = `${tete}<p class="big">${esc(q.q)}</p>
      <div class="opts">${q.o.map((o, i) => `<button class="opt opt-btn" data-o="${i}"><b>${LETTRES[i]}</b> ${esc(o)}</button>`).join('')}</div>`;
    $$('[data-o]', z).forEach(b => b.onclick = () => {
      const ok = Number(b.dataset.o) === q.a;
      $$('[data-o]', z).forEach(x => { (x as HTMLButtonElement).disabled = true; if (Number(x.dataset.o) === q.a) x.classList.add('correct'); });
      beep(ok ? 880 : 220, 0.2);
      if (ok) ctx.point(t);
      setTimeout(() => {
        if (!ok) { pos[t] = Math.max(1, c - 2); render(); }
        fin($('#action', el), ok ? '<p class="win big" lang="es">¡Correcto! Te quedas aquí.</p>' : `<p class="big" lang="es">¡Uy! Vuelves a la casilla ${pos[t]}.</p>`);
      }, 900);
    });
  };

  render();
};

export default oca;
