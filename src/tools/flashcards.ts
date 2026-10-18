import { state, update } from '../lib/state';
import { speak, hasSpanishVoice, onVoices } from '../lib/speech';
import { $, esc, shuffle, toast, onKeys } from '../lib/ui';

const say = (txt: string) => {
  if (!speak(txt, state.reglages.accent ?? 'es-ES')) toast(state.reglages.muet ? 'Son coupé' : 'Voix espagnole absente sur cet appareil');
};

/** Flashcards retournables (clic, Espace, flèches) avec audio. Renvoie la fonction de nettoyage. */
export function flashcards(el: HTMLElement, vocab: [string, string][]): () => void {
  let deck = [...vocab], i = 0, flipped = false, frFirst = false;

  const render = () => {
    const [es, fr] = deck[i];
    const [front, back] = frFirst ? [fr, es] : [es, fr];
    const accent = state.reglages.accent ?? 'es-ES';
    el.innerHTML = `
      <div class="center">
        <span class="pill">${i + 1} / ${deck.length}</span>
        <button class="flashcard ${flipped ? 'back' : ''}" id="card" aria-label="Retourner la carte">
          <span class="huge" ${flipped !== frFirst ? '' : 'lang="es"'}>${esc(flipped ? back : front)}</span>
          ${flipped ? `<span class="muted">${esc(front)}</span>` : '<span class="muted small">Toucher pour retourner</span>'}
        </button>
        <div class="row wrap center-row">
          <button class="btn ghost" id="prev" aria-label="Carte précédente">←</button>
          <button class="btn" id="say">🔊 Écouter</button>
          <button class="btn ghost" id="next" aria-label="Carte suivante">→</button>
        </div>
        <div class="row wrap center-row">
          <button class="btn ghost sm" id="mix">🔀 Mélanger</button>
          <button class="btn ghost sm" id="side" aria-pressed="${frFirst}">Commencer par le français</button>
          <label class="row small">Accent
            <select id="accent">
              <option value="es-ES" ${accent === 'es-ES' ? 'selected' : ''}>Espagne</option>
              <option value="es-MX" ${accent === 'es-MX' ? 'selected' : ''}>Amérique latine</option>
            </select>
          </label>
        </div>
        <p class="muted small" id="novoice" hidden>🔇 Voix espagnole absente sur cet appareil : l’audio ne marchera pas ici.</p>
        <p class="muted small">Flèches : changer de carte · Espace : retourner</p>
      </div>`;
    $('#card', el).onclick = flip;
    $('#prev', el).onclick = () => go(-1);
    $('#next', el).onclick = () => go(1);
    $('#say', el).onclick = () => say(es);
    $('#mix', el).onclick = () => { deck = shuffle(deck); i = 0; flipped = false; render(); };
    $('#side', el).onclick = () => { frFirst = !frFirst; flipped = false; render(); };
    $<HTMLSelectElement>('#accent', el).onchange = e => update(s => { s.reglages.accent = (e.target as HTMLSelectElement).value as 'es-ES' | 'es-MX'; });
    voiceHint();
  };
  const voiceHint = () => { const n = $('#novoice', el); if (n) n.hidden = hasSpanishVoice(); };
  const flip = () => { flipped = !flipped; render(); $('#card', el).focus(); };
  const go = (d: number) => { i = (i + d + deck.length) % deck.length; flipped = false; render(); };

  render();
  const offVoices = onVoices(voiceHint);
  const offKeys = onKeys({ ArrowLeft: () => go(-1), ArrowRight: () => go(1), ' ': flip });
  return () => { offKeys(); offVoices(); };
}
