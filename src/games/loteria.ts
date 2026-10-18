import type { Game } from './engine';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { beep } from '../lib/sound';
import { $, esc, onKeys, shuffle } from '../lib/ui';

/** Lotería : les cartes portent la traduction française, la profe tire et annonce le mot espagnol. */
const loteria: Game = (el, ctx) => {
  const vocab = ctx.theme.vocab;
  const taille = vocab.length >= 16 ? 4 : 3;
  let tirage = shuffle(vocab), k = -1, nbCartes = 28;

  const annoncer = () => {
    if (k >= tirage.length - 1) return;
    k++;
    beep(660, 0.08);
    speak(tirage[k][0], state.reglages.accent ?? 'es-ES');
    render();
  };

  const imprimer = () => {
    const zone = document.createElement('div');
    zone.className = 'print-area';
    zone.innerHTML = Array.from({ length: nbCartes }, (_, i) => {
      const mots = shuffle(vocab).slice(0, taille * taille);
      return `<section class="loteria-carte" style="--t:${taille}">
        <header><strong>Lotería</strong> · ${esc(ctx.theme.titre)} · ${ctx.niveau} <span>n° ${i + 1}</span></header>
        <div class="grille">${mots.map(m => `<div>${esc(m[1])}</div>`).join('')}</div>
      </section>`;
    }).join('');
    document.body.append(zone);
    const clean = () => { zone.remove(); removeEventListener('afterprint', clean); };
    addEventListener('afterprint', clean);
    print();
    setTimeout(clean, 60_000);
  };

  const render = () => {
    const actuel = tirage[k];
    el.innerHTML = `
      <div class="loteria">
        <div class="center">
          ${actuel ? `<p class="muted">Carta ${k + 1} / ${tirage.length}</p><div class="huge" lang="es">${esc(actuel[0])}</div>`
            : '<p class="big">Distribue une carte par élève (ou par binôme), puis tire les mots un par un.</p>'}
          <div class="row wrap center-row">
            <button class="btn bigbtn" id="next" ${k >= tirage.length - 1 ? 'disabled' : ''}>${k < 0 ? '¡Empezar!' : 'Siguiente carta'}</button>
            ${actuel ? '<button class="btn ghost" id="say">🔊 Répéter</button>' : ''}
          </div>
          <p class="muted small">Le premier qui remplit sa carte crie « ¡Lotería! » : vérifier avec la liste des mots tirés.</p>
        </div>
        <aside class="panel">
          <h3>Mots tirés (${k + 1})</h3>
          <ol class="tires">${tirage.slice(0, k + 1).map(([es, fr]) => `<li><span lang="es">${esc(es)}</span> <span class="muted">· ${esc(fr)}</span></li>`).join('')}</ol>
          <hr>
          <label class="field">Cartes à imprimer <input type="number" id="nb" min="1" max="40" value="${nbCartes}"></label>
          <button class="btn ghost" id="print">🖨 Imprimer les cartes (${taille}×${taille})</button>
          <button class="btn ghost sm" id="reset">Nouveau tirage</button>
        </aside>
      </div>`;
    $('#next', el).onclick = annoncer;
    $('#say', el)?.addEventListener('click', () => speak(actuel[0], state.reglages.accent ?? 'es-ES'));
    const nb = $<HTMLInputElement>('#nb', el);
    nb.onchange = () => { nbCartes = Math.max(1, Math.min(40, Number(nb.value) || 28)); nb.value = String(nbCartes); };
    $('#print', el).onclick = imprimer;
    $('#reset', el).onclick = () => { tirage = shuffle(vocab); k = -1; render(); };
  };

  render();
  return onKeys({ ' ': annoncer });
};

export default loteria;
