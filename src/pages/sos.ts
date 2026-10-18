import type { View } from '../router';
import { SOS } from '../lib/content';
import { $$, esc } from '../lib/ui';

/** Idée affichée par situation : garde la position le temps de la séance. */
const idx = SOS.map(() => 0);

export const sos: View = el => {
  const render = () => {
    el.innerHTML = `
      <h1>SOS</h1>
      <p class="muted">Une idée tout de suite, un clic pour la lancer.</p>
      <div class="sos-grid">
        ${SOS.map((s, i) => {
          const idee = s.idees[idx[i]];
          return `
          <section class="panel sos-col">
            <h2><span aria-hidden="true">${s.icon}</span> ${esc(s.titre)}</h2>
            <p class="sos-texte" aria-live="polite">${esc(idee.texte)}</p>
            <div class="stack">
              <a class="btn bigbtn" href="${idee.lien}">${esc(idee.action)}</a>
              <button class="btn ghost" data-autre="${i}">Autre idée (${idx[i] + 1}/${s.idees.length})</button>
            </div>
          </section>`;
        }).join('')}
      </div>`;
    $$('[data-autre]', el).forEach(b => b.onclick = () => {
      const i = Number(b.dataset.autre);
      idx[i] = (idx[i] + 1) % SOS[i].idees.length;
      render();
      $$<HTMLButtonElement>('[data-autre]', el)[i].focus();
    });
  };
  render();
};
