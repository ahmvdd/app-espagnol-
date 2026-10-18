import type { Game } from './engine';
import { winnerText } from './engine';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { beep, chime } from '../lib/sound';
import { $, $$, esc, shuffle, timers } from '../lib/ui';

type Carte = { id: number; txt: string; es: boolean; trouvee: boolean };

const memory: Game = (el, ctx) => {
  const t = timers();
  let cartes: Carte[] = [], ouvertes: number[] = [], bloque = false, coups = 0;

  const nouveau = () => {
    const paires = shuffle(ctx.theme.vocab).slice(0, 8);
    cartes = shuffle(paires.flatMap(([es, fr], id) => [
      { id, txt: es, es: true, trouvee: false },
      { id, txt: fr, es: false, trouvee: false }
    ]));
    ouvertes = []; coups = 0; bloque = false;
    render();
  };

  const retourner = (k: number) => {
    const c = cartes[k];
    if (bloque || c.trouvee || ouvertes.includes(k)) return;
    ouvertes.push(k);
    if (c.es) speak(c.txt, state.reglages.accent ?? 'es-ES');
    if (ouvertes.length === 2) {
      coups++;
      const [a, b] = ouvertes.map(i => cartes[i]);
      if (a.id === b.id) {
        a.trouvee = b.trouvee = true; ouvertes = [];
        if (ctx.turn() >= 0) ctx.point(ctx.turn()); else beep(880, 0.12);
        if (cartes.every(x => x.trouvee)) chime();
      } else {
        bloque = true;
        t.after(() => { ouvertes = []; bloque = false; ctx.nextTurn(); render(); }, 1400);
      }
    }
    render();
    $<HTMLButtonElement>(`[data-k="${k}"]`, el)?.focus();
  };

  const render = () => {
    if (cartes.every(c => c.trouvee)) {
      el.innerHTML = `
        <div class="center">
          <div class="huge win">${esc(winnerText(ctx.teams))}</div>
          <p class="big">${cartes.length / 2} paires en ${coups} coups</p>
          <button class="btn bigbtn" id="again">Nouvelle partie</button>
        </div>`;
      $('#again', el).onclick = nouveau;
      return;
    }
    el.innerHTML = `
      <div class="memory" style="--cols:${cartes.length > 12 ? 4 : 3}">
        ${cartes.map((c, k) => {
          const vue = c.trouvee || ouvertes.includes(k);
          return `<button class="carte ${vue ? 'vue' : ''} ${c.trouvee ? 'trouvee' : ''} ${c.es ? 'es' : 'fr'}" data-k="${k}"
            aria-label="${vue ? esc(c.txt) + (c.trouvee ? ', paire trouvée' : '') : 'Carte ' + (k + 1) + ', face cachée'}" ${c.trouvee ? 'aria-disabled="true"' : ''}>
            ${vue ? `<span ${c.es ? 'lang="es"' : ''}>${esc(c.txt)}</span><small>${c.es ? 'ES' : 'FR'}</small>` : '<span aria-hidden="true">?</span>'}
          </button>`;
        }).join('')}
      </div>
      <p class="muted small center">Retrouver chaque mot espagnol et sa traduction. Paire trouvée : l’équipe rejoue.</p>`;
    $$('[data-k]', el).forEach(b => b.onclick = () => retourner(Number(b.dataset.k)));
  };

  nouveau();
  return () => t.clear();
};

export default memory;
