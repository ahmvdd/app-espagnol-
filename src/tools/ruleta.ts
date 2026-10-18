import type { Tool } from './index';
import { data } from '../lib/store';
import { classeOptions, currentClasseId, rememberClasse } from '../lib/classes';
import { beep } from '../lib/sound';
import { $, esc, pick, timers, onKeys, toast, reducedMotion } from '../lib/ui';

/** Élèves déjà passés, par classe, le temps de la séance (non sauvegardé). */
const drawn = new Map<string, string[]>();

const ruleta: Tool = el => {
  const t = timers();
  let src = currentClasseId();
  let nb = 28, spinning = false;

  const classe = () => data.classes.find(c => c.id === src);
  const list = () => {
    const c = classe();
    return c?.eleves.length ? c.eleves.map(e => e.prenom) : Array.from({ length: nb }, (_, i) => `N° ${i + 1}`);
  };
  const key = () => (classe()?.eleves.length ? src : `num-${nb}`);
  const done = () => drawn.get(key()) ?? [];

  const info = () => {
    const d = done();
    $('#left', el).innerHTML = d.length
      ? `Déjà passés (${d.length} / ${list().length}) : ${d.map(esc).join(', ')}`
      : 'Personne n’est encore passé.';
  };

  const spin = () => {
    if (spinning) return;
    const all = list();
    let pool = all.filter(x => !done().includes(x));
    if (!pool.length) { drawn.delete(key()); pool = all; toast('Tout le monde est passé : on recommence'); }
    const w = pick(pool), out = $('#out', el);
    out.classList.remove('win');
    spinning = true;
    const finish = () => {
      out.textContent = w; out.classList.add('win');
      drawn.set(key(), [...done(), w]);
      beep(880, 0.18); spinning = false; info();
    };
    if (reducedMotion()) return finish();
    let d = 45;
    const step = () => { out.textContent = pick(all); d *= 1.13; d < 430 ? t.after(step, d) : finish(); };
    step();
  };

  const render = () => {
    const c = classe();
    el.innerHTML = `
      <div class="row wrap center-row">
        <label class="field">Tirer dans <select id="src">${classeOptions(src, true)}</select></label>
        ${c?.eleves.length ? '' : `<label class="field">Nombre d’élèves <input id="nb" type="number" min="2" max="40" value="${nb}"></label>`}
      </div>
      ${c && !c.eleves.length ? '<p class="muted center">Cette classe n’a pas encore de prénoms : on tire des numéros. <a href="#/profe">Ajouter les prénoms</a></p>' : ''}
      <div class="center">
        <div class="huge" id="out" aria-live="polite">?</div>
        <button class="btn bigbtn" id="spin">¡Girar!</button>
        <p class="muted" id="left"></p>
        <button class="btn ghost sm" id="again">Tout le monde peut repasser</button>
      </div>`;
    $<HTMLSelectElement>('#src', el).onchange = e => { src = (e.target as HTMLSelectElement).value; rememberClasse(src); render(); };
    const nbIn = $<HTMLInputElement>('#nb', el);
    if (nbIn) nbIn.onchange = () => { nb = Math.max(2, Math.min(40, Number(nbIn.value) || 28)); nbIn.value = String(nb); info(); };
    $('#spin', el).onclick = spin;
    $('#again', el).onclick = () => { drawn.delete(key()); info(); };
    info();
  };

  render();
  const off = onKeys({ ' ': spin });
  return () => { t.clear(); off(); };
};

export default ruleta;
