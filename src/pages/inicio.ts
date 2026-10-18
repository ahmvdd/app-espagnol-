import type { View } from '../router';
import { NIVEAUX, THEMES, palabraDelDia } from '../lib/content';
import { state, update } from '../lib/state';
import { speak } from '../lib/speech';
import { TOOLS, toolCard } from '../tools';
import { $, $$, esc, toast } from '../lib/ui';

type Idee = { titre: string; desc: string; liens: [string, string][] };

const IDEES: Record<number, Idee[]> = {
  2: [
    { titre: '🎡 Question flash', desc: 'Un élève tiré au sort répond à une question en espagnol.', liens: [['Ruleta', '#/herramientas/ruleta']] },
    { titre: '📖 Palabra del día', desc: 'Faire deviner le mot du jour, puis le faire répéter à toute la classe.', liens: [] }
  ],
  5: [
    { titre: '🃏 Flashcards', desc: 'Révision express du thème en cours, à l’oral.', liens: NIVEAUX.map(n => [n, `#/nivel/${n}`]) },
    { titre: '⏱ Défi chrono', desc: '1 minute par deux pour écrire un maximum de mots du thème.', liens: [['Minuteur 1 min', '#/herramientas/minutero?t=60']] }
  ],
  10: [
    { titre: '👥 Duel d’équipes', desc: 'Faire 4 équipes : chacune traduit à tour de rôle un mot des flashcards.', liens: [['Équipes', '#/herramientas/equipos'], ['Minuteur 10 min', '#/herramientas/minutero?t=600']] },
    { titre: '🎡 Interrogation orale', desc: 'Ruleta + flashcards : l’élève tiré au sort traduit la carte affichée.', liens: [['Ruleta', '#/herramientas/ruleta']] }
  ]
};

let minutes = 0;

export const inicio: View = el => {
  const p = state.reglages.prenomProf;
  const w = palabraDelDia();
  const date = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const render = () => {
    el.innerHTML = `
      <section class="hero">
        <i class="azulejo band" aria-hidden="true"></i>
        <div><p class="muted">${esc(date)}</p><h1 class="hello">¡Hola${p ? `, ${esc(p)}` : ''}!</h1></div>
      </section>

      <div class="levels">
        ${NIVEAUX.map(n => `<a class="panel level" href="#/nivel/${n}"><span class="huge">${n}</span><span class="muted">${THEMES[n].map(t => esc(t.titre)).join(' · ')}</span></a>`).join('')}
      </div>

      <h2>J’ai… minutes</h2>
      <div class="row wrap" role="group" aria-label="Temps disponible">
        ${[2, 5, 10].map(m => `<button class="btn ghost" data-m="${m}" aria-pressed="${m === minutes}">${m} min</button>`).join('')}
      </div>
      ${minutes ? `<div class="idees">${IDEES[minutes].map(i => `
        <section class="panel">
          <h3>${i.titre}</h3><p>${i.desc}</p>
          <div class="row wrap">${i.liens.length
            ? i.liens.map(([l, h]) => `<a class="btn sm" href="${h}">${esc(l)}</a>`).join('')
            : '<button class="btn sm" data-palabra>Voir le mot du jour</button>'}</div>
        </section>`).join('')}</div>` : ''}

      <h2>Raccourcis</h2>
      <div class="tools">${TOOLS.map(t => toolCard(t)).join('')}</div>

      <h2 id="palabra" tabindex="-1">Palabra del día</h2>
      <section class="panel center">
        <span class="pill">${w.niveau} · ${esc(w.theme)}</span>
        <div class="huge">${esc(w.es)}</div>
        <p class="big" id="trad" hidden>${esc(w.fr)}</p>
        <div class="row wrap center-row">
          <button class="btn ghost" id="say">🔈 Écouter</button>
          <button class="btn" id="reveal">Voir la traduction</button>
        </div>
      </section>`;

    $$('[data-m]', el).forEach(b => b.onclick = () => { minutes = minutes === Number(b.dataset.m) ? 0 : Number(b.dataset.m); render(); });
    $$('[data-palabra]', el).forEach(b => b.onclick = () => { const h = $('#palabra', el); h.scrollIntoView({ behavior: 'smooth' }); h.focus({ preventScroll: true }); });
    $('#say', el).onclick = () => { if (!speak(w.es, state.reglages.accent ?? 'es-ES')) toast('Pas de voix espagnole disponible (ou son coupé)'); };
    $('#reveal', el).onclick = () => { $('#trad', el).hidden = false; $('#reveal', el).hidden = true; };
  };

  render();
};
