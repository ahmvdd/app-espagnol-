import type { Tool } from './index';
import { state } from '../lib/state';
import { classeOptions, currentClasseId, rememberClasse } from '../lib/classes';
import { beep } from '../lib/sound';
import { $, $$, esc, pick, timers, onKeys, toast, reducedMotion } from '../lib/ui';

/** Tour en cours et volontaires, par classe : survivent à un changement de page (pas au rechargement). */
const drawn = new Map<string, string[]>();
const volontaires = new Map<string, Set<string>>();
let volOnly = false;

const ruleta: Tool = el => {
  const t = timers();
  let src = currentClasseId();
  let nb = 28, spinning = false;

  const classe = () => state.classes.find(c => c.id === src);
  const named = () => !!classe()?.eleves.length;
  const key = () => (named() ? src : `num-${nb}`);
  const vols = () => { if (!volontaires.has(key())) volontaires.set(key(), new Set()); return volontaires.get(key())!; };
  const everyone = () => named() ? classe()!.eleves.map(e => e.prenom) : Array.from({ length: nb }, (_, i) => `N° ${i + 1}`);
  const list = () => (volOnly && named() ? everyone().filter(p => vols().has(p)) : everyone());
  const done = () => (drawn.get(key()) ?? []).filter(x => list().includes(x));

  const info = () => {
    const d = done(), all = list();
    $('#left', el).innerHTML = `<strong>${d.length} / ${all.length} passés</strong>${d.length ? ' : ' + d.map(esc).join(', ') : ''}`;
  };

  const spin = () => {
    if (spinning) return;
    const all = list();
    if (!all.length) return toast('Coche au moins un volontaire');
    let pool = all.filter(x => !done().includes(x));
    if (!pool.length) { drawn.set(key(), (drawn.get(key()) ?? []).filter(x => !all.includes(x))); pool = all; toast('Tout le monde est passé : nouveau tour'); }
    const w = pick(pool), out = $('#out', el);
    out.classList.remove('win');
    spinning = true;
    const finish = () => {
      out.textContent = w; out.classList.add('win');
      drawn.set(key(), [...(drawn.get(key()) ?? []), w]);
      beep(880, 0.18); spinning = false; info();
    };
    if (reducedMotion()) return finish();
    let d = 45;
    const step = () => { out.textContent = pick(all); d *= 1.13; d < 430 ? t.after(step, d) : finish(); };
    step();
  };

  const render = () => {
    el.innerHTML = `
      <div class="row wrap center-row">
        <label class="field">Tirer dans <select id="src">${classeOptions(src, true)}</select></label>
        ${named() ? `<label class="row check"><input type="checkbox" id="vol" ${volOnly ? 'checked' : ''}> Volontaires seulement</label>`
          : `<label class="field">Nombre d’élèves <input id="nb" type="number" min="2" max="40" value="${nb}"></label>`}
      </div>
      ${classe() && !named() ? '<p class="muted center">Cette classe n’a pas encore de prénoms : on tire des numéros. <a href="#/profe">Ajouter les prénoms</a></p>' : ''}
      ${volOnly && named() ? `<div class="chips" role="group" aria-label="Volontaires">${everyone().map(p =>
        `<button class="chip" data-v="${esc(p)}" aria-pressed="${vols().has(p)}">${vols().has(p) ? '✋ ' : ''}${esc(p)}</button>`).join('')}</div>` : ''}
      <div class="center">
        <div class="huge" id="out" aria-live="polite">?</div>
        <button class="btn bigbtn" id="spin">¡Girar!</button>
        <p class="muted" id="left"></p>
        <button class="btn ghost sm" id="again">Remettre tout le monde</button>
        <p class="muted small">Touche Espace pour tirer</p>
      </div>`;
    $<HTMLSelectElement>('#src', el).onchange = e => { src = (e.target as HTMLSelectElement).value; rememberClasse(src); render(); };
    const nbIn = $<HTMLInputElement>('#nb', el);
    if (nbIn) nbIn.onchange = () => { nb = Math.max(2, Math.min(40, Number(nbIn.value) || 28)); nbIn.value = String(nb); info(); };
    const vol = $<HTMLInputElement>('#vol', el);
    if (vol) vol.onchange = () => { volOnly = vol.checked; render(); };
    $$('[data-v]', el).forEach(b => b.onclick = () => {
      const p = b.dataset.v!, v = vols();
      v.has(p) ? v.delete(p) : v.add(p);
      b.setAttribute('aria-pressed', String(v.has(p)));
      b.textContent = (v.has(p) ? '✋ ' : '') + p;
      info();
    });
    $('#spin', el).onclick = spin;
    $('#again', el).onclick = () => { drawn.delete(key()); info(); toast('Tout le monde peut repasser'); };
    info();
  };

  render();
  const off = onKeys({ ' ': spin });
  return () => { t.clear(); off(); };
};

export default ruleta;
