import type { View } from '../router';
import { NIVEAUX, THEMES, type Niveau } from '../lib/content';
import { data, commit } from '../lib/store';
import { speak } from '../lib/speech';
import { $, $$, esc, shuffle, toast, onKeys } from '../lib/ui';

const say = (txt: string) => {
  if (!speak(txt, data.reglages.accent ?? 'es-ES')) toast('Pas de voix espagnole disponible (ou son coupé)');
};

export const nivel: View = el => {
  const hashN = location.hash.split('/')[2] as Niveau;
  const n = NIVEAUX.includes(hashN) ? hashN : '5e';
  const themes = THEMES[n];
  let theme = themes[0];
  let deck = [...theme.vocab], i = 0, flipped = false, frFirst = false;

  const render = () => {
    const [es, fr] = deck[i] ?? ['', ''];
    const [front, back] = frFirst ? [fr, es] : [es, fr];
    el.innerHTML = `
      <div class="row head">
        <h1>${n}</h1>
        <div class="row wrap">
          ${NIVEAUX.map(x => `<a class="btn ghost sm" href="#/nivel/${x}" aria-current="${x === n ? 'page' : 'false'}">${x}</a>`).join('')}
        </div>
      </div>
      ${themes.length > 1
        ? `<label class="field">Thème <select id="theme">${themes.map(t => `<option value="${t.id}" ${t === theme ? 'selected' : ''}>${esc(t.titre)}</option>`).join('')}</select></label>`
        : `<h2>${esc(theme.titre)}</h2>`}

      <section class="panel stage center">
        <span class="pill">${i + 1} / ${deck.length}</span>
        <button class="flashcard ${flipped ? 'back' : ''}" id="card" aria-label="Retourner la carte">
          <span class="huge">${esc(flipped ? back : front)}</span>
          ${flipped ? `<span class="muted">${esc(front)}</span>` : '<span class="muted small">Toucher pour retourner</span>'}
        </button>
        <div class="row wrap center-row">
          <button class="btn ghost" id="prev" aria-label="Carte précédente">←</button>
          <button class="btn" id="say">🔈 Écouter</button>
          <button class="btn ghost" id="next" aria-label="Carte suivante">→</button>
        </div>
        <div class="row wrap center-row">
          <button class="btn ghost sm" id="mix">Mélanger</button>
          <button class="btn ghost sm" id="side" aria-pressed="${frFirst}">Commencer par le français</button>
          <label class="row small">Accent
            <select id="accent">
              <option value="es-ES" ${data.reglages.accent !== 'es-MX' ? 'selected' : ''}>Espagne</option>
              <option value="es-MX" ${data.reglages.accent === 'es-MX' ? 'selected' : ''}>Mexique</option>
            </select>
          </label>
        </div>
        <p class="muted small">Flèches : changer de carte · Espace : retourner</p>
      </section>

      <h2>Tout le vocabulaire</h2>
      <div class="table-wrap"><table class="vocab">
        ${theme.vocab.map(([e, f], k) => `<tr><td><strong>${esc(e)}</strong></td><td>${esc(f)}</td><td><button class="btn ghost sm" data-say="${k}" aria-label="Écouter ${esc(e)}">🔈</button></td></tr>`).join('')}
      </table></div>`;

    const sel = $<HTMLSelectElement>('#theme', el);
    if (sel) sel.onchange = () => { theme = themes.find(t => t.id === sel.value)!; deck = [...theme.vocab]; i = 0; flipped = false; render(); };
    $('#card', el).onclick = flip;
    $('#prev', el).onclick = () => go(-1);
    $('#next', el).onclick = () => go(1);
    $('#say', el).onclick = () => say(es);
    $('#mix', el).onclick = () => { deck = shuffle(deck); i = 0; flipped = false; render(); };
    $('#side', el).onclick = () => { frFirst = !frFirst; flipped = false; render(); };
    $<HTMLSelectElement>('#accent', el).onchange = e => { data.reglages.accent = (e.target as HTMLSelectElement).value as 'es-ES' | 'es-MX'; commit(); };
    $$('[data-say]', el).forEach(b => b.onclick = () => say(theme.vocab[Number(b.dataset.say)][0]));
  };

  const flip = () => { flipped = !flipped; render(); };
  const go = (d: number) => { i = (i + d + deck.length) % deck.length; flipped = false; render(); };

  render();
  return onKeys({ ArrowLeft: () => go(-1), ArrowRight: () => go(1), ' ': flip });
};
