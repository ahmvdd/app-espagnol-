import type { Game } from './engine';
import ESCAPES from '../content/escape.json';
import type { Niveau } from '../content/types';
import { startTimer, type Timer } from '../lib/timer';
import { beep, chime } from '../lib/sound';
import { $, $$, esc, shuffle, toast, reducedMotion } from '../lib/ui';

type Enigme = { titre: string; q: string; o: string[]; a: number; chiffre: string; indice: string };
type Escape = { titre: string; axe: string; intro: string; enigmes: Enigme[] };

const PENALITE = 120;

const escape: Game = (el, ctx) => {
  const E = (ESCAPES as Record<Niveau, Escape>)[ctx.niveau];
  let timer: Timer | null = null, duree = 30, reste = 0, debut = 0;
  let resolues: boolean[] = [], indices: boolean[] = [], ouverte = -1, ordres: number[][] = [];
  let phase: 'intro' | 'jeu' | 'gagne' | 'perdu' = 'intro';

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const secouer = (n: HTMLElement) => { if (reducedMotion()) return; n.classList.remove('boum'); void n.offsetWidth; n.classList.add('boum'); };

  const lancer = () => {
    resolues = E.enigmes.map(() => false); indices = E.enigmes.map(() => false);
    ordres = E.enigmes.map(q => shuffle(q.o.map((_, i) => i)));
    ouverte = -1; phase = 'jeu'; debut = Date.now();
    timer?.stop();
    timer = startTimer(duree * 60, () => { phase = 'perdu'; render(); }, l => {
      reste = l;
      const c = $('#esc-clock', el); if (c) { c.textContent = fmt(l); c.classList.toggle('urgent', l <= 60); }
    });
    render();
  };

  const render = () => {
    if (phase === 'intro') {
      el.innerHTML = `
        <div class="center escape-intro">
          <span class="pill">🔐 ${esc(E.axe)}</span>
          <div class="huge" lang="es">${esc(E.titre)}</div>
          <p class="big" lang="es">${esc(E.intro)}</p>
          <div class="row wrap center-row" role="group" aria-label="Durée">
            ${[20, 30, 45].map(m => `<button class="btn ghost" data-m="${m}" aria-pressed="${m === duree}">${m} min</button>`).join('')}
          </div>
          <button class="btn bigbtn" id="go">¡Empezar!</button>
          <p class="muted small">Chaque énigme résolue donne un chiffre du cadenas. Un indice coûte ${PENALITE / 60} minutes.</p>
        </div>`;
      $$('[data-m]', el).forEach(b => b.onclick = () => { duree = Number(b.dataset.m); render(); });
      $('#go', el).onclick = lancer;
      return;
    }
    if (phase === 'gagne' || phase === 'perdu') {
      const s = Math.round((Date.now() - debut) / 1000);
      el.innerHTML = `
        <div class="center">
          ${phase === 'gagne' ? `<div class="count" aria-hidden="true">🔓</div><div class="huge win">¡Habéis escapado!</div><p class="big">en ${fmt(s)}${indices.some(Boolean) ? ` · ${indices.filter(Boolean).length} indice(s)` : ''}</p>`
            : `<div class="count" aria-hidden="true">⏰</div><div class="huge">¡Se acabó el tiempo!</div><p class="big">El código era : <strong>${E.enigmes.map(x => x.chiffre).join('')}</strong></p>`}
          <button class="btn bigbtn" id="again">Rejouer</button>
        </div>`;
      $('#again', el).onclick = () => { phase = 'intro'; render(); };
      return;
    }
    const q = E.enigmes[ouverte];
    el.innerHTML = `
      <div class="escape">
        <div class="row head"><h3 lang="es">${esc(E.titre)}</h3><span class="pill escape-clock" id="esc-clock" role="timer">${fmt(reste || duree * 60)}</span></div>
        <div class="salles">${E.enigmes.map((x, i) => `
          <button class="salle-e ${resolues[i] ? 'ok' : ''}" data-i="${i}" aria-pressed="${i === ouverte}">
            <b>${resolues[i] ? x.chiffre : '?'}</b><span lang="es">${esc(x.titre)}</span>${resolues[i] ? '<small>✓ resuelto</small>' : ''}
          </button>`).join('')}</div>
        ${q ? `
          <section class="panel enigme" id="enigme">
            <p class="big" lang="es">${esc(q.q)}</p>
            <div class="opts">${ordres[ouverte].map(k => `<button class="opt opt-btn ${resolues[ouverte] && k === q.a ? 'correct' : ''}" data-o="${k}" ${resolues[ouverte] ? 'disabled' : ''} lang="es">${esc(q.o[k])}</button>`).join('')}</div>
            ${resolues[ouverte] ? `<p class="win big">¡Correcto! La cifra es ${q.chiffre}.</p>`
              : indices[ouverte] ? `<p class="indice">💡 <span lang="es">${esc(q.indice)}</span></p>` : `<button class="btn ghost sm" id="indice">💡 Pista (−${PENALITE / 60} min)</button>`}
          </section>` : '<p class="center muted">Choisis une salle pour voir son énigme.</p>'}
        <div class="center cadenas">
          <p class="muted">🔒 El candado</p>
          <div class="lock" id="lock">${E.enigmes.map((_, i) => `<input inputmode="numeric" maxlength="1" aria-label="Chiffre ${i + 1}" data-k="${i}">`).join('')}</div>
          <button class="btn" id="open">Abrir</button>
        </div>
      </div>`;

    $$('[data-i]', el).forEach(b => b.onclick = () => { ouverte = Number(b.dataset.i); render(); });
    $$('[data-o]', el).forEach(b => b.onclick = () => {
      if (Number(b.dataset.o) === q.a) { resolues[ouverte] = true; beep(880, 0.2); render(); }
      else { b.classList.add('faux'); beep(200, 0.25); secouer($('#enigme', el)); }
    });
    $('#indice', el)?.addEventListener('click', () => { indices[ouverte] = true; timer?.add(-PENALITE); toast(`Pista : −${PENALITE / 60} minutes`); render(); });
    const ins = $$<HTMLInputElement>('.lock input', el);
    ins.forEach((inp, i) => {
      inp.oninput = () => { inp.value = inp.value.replace(/\D/g, ''); if (inp.value && ins[i + 1]) ins[i + 1].focus(); };
      inp.onkeydown = e => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); if (e.key === 'Enter') $('#open', el).click(); };
    });
    $('#open', el).onclick = () => {
      if (ins.map(x => x.value).join('') === E.enigmes.map(x => x.chiffre).join('')) { timer?.stop(); phase = 'gagne'; chime(); render(); }
      else { secouer($('#lock', el)); beep(200, 0.3); toast('El candado no se abre'); }
    };
  };

  render();
  return () => timer?.stop();
};

export default escape;
