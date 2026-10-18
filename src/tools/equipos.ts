import type { Tool } from './index';
import { state, update } from '../lib/state';
import { classeOptions, currentClasseId, rememberClasse } from '../lib/classes';
import { $, $$, esc, pick, shuffle, toast } from '../lib/ui';

const PAYS: [string, string][] = [
  ['España', 'linear-gradient(#AA151B 0 25%,#F1BF00 25% 75%,#AA151B 75%)'],
  ['México', 'linear-gradient(90deg,#006847 0 33.4%,#fff 33.4% 66.6%,#CE1126 66.6%)'],
  ['Argentina', 'radial-gradient(circle,#F6B40E 0 12%,transparent 13%),linear-gradient(#74ACDF 0 33.4%,#fff 33.4% 66.6%,#74ACDF 66.6%)'],
  ['Colombia', 'linear-gradient(#FCD116 0 50%,#003893 50% 75%,#CE1126 75%)'],
  ['Perú', 'linear-gradient(90deg,#D91023 0 33.4%,#fff 33.4% 66.6%,#D91023 66.6%)'],
  ['Chile', 'linear-gradient(90deg,#0039A6 0 33.4%,#fff 33.4%) 0 0/100% 50% no-repeat,#D52B1E'],
  ['Venezuela', 'linear-gradient(#FFCC00 0 33.4%,#00247D 33.4% 66.6%,#CF142B 66.6%)'],
  ['Bolivia', 'linear-gradient(#D52B1E 0 33.4%,#F9E300 33.4% 66.6%,#007934 66.6%)']
];

/** Absents de la séance, par classe (non sauvegardé). */
const absents = new Map<string, Set<string>>();

/** Équipes équilibrées en séparant les paires incompatibles. */
function makeTeams(ids: string[], k: number, bad: [string, string][]): { teams: string[][]; ok: boolean } {
  const conflict = new Map<string, Set<string>>();
  for (const [a, b] of bad) {
    if (!conflict.has(a)) conflict.set(a, new Set());
    if (!conflict.has(b)) conflict.set(b, new Set());
    conflict.get(a)!.add(b); conflict.get(b)!.add(a);
  }
  const cap = Math.ceil(ids.length / k);
  for (let attempt = 0; attempt < 300; attempt++) {
    const teams: string[][] = Array.from({ length: k }, () => []);
    let ok = true;
    for (const id of shuffle(ids)) {
      const opts = teams.filter(t => t.length < cap && !t.some(o => conflict.get(id)?.has(o)));
      if (!opts.length) { ok = false; break; }
      const min = Math.min(...opts.map(t => t.length));
      pick(opts.filter(t => t.length === min)).push(id);
    }
    if (ok) return { teams, ok };
  }
  const teams: string[][] = Array.from({ length: k }, () => []);
  shuffle(ids).forEach((id, i) => teams[i % k].push(id));
  return { teams, ok: false };
}

const equipos: Tool = el => {
  let src = currentClasseId();
  let k = 4;
  let result: string[][] = [];

  const render = () => {
    const c = state.classes.find(x => x.id === src);
    if (!c?.eleves.length) {
      el.innerHTML = `
        ${state.classes.length ? `<label class="field">Classe <select id="src">${classeOptions(src)}</select></label>` : ''}
        <p class="center big">Il faut d’abord une classe avec des prénoms.</p>
        <p class="center"><a class="btn" href="#/profe">Ajouter une classe</a></p>`;
      const s = $<HTMLSelectElement>('#src', el);
      if (s) s.onchange = () => { src = s.value; rememberClasse(src); result = []; render(); };
      return;
    }
    if (!absents.has(c.id)) absents.set(c.id, new Set());
    const abs = absents.get(c.id)!;
    const name = new Map(c.eleves.map(e => [e.id, e.prenom]));
    const presents = c.eleves.filter(e => !abs.has(e.id));

    el.innerHTML = `
      <div class="row wrap">
        <label class="field">Classe <select id="src">${classeOptions(src)}</select></label>
        <div class="field">Nombre d’équipes
          <div class="row wrap" role="group">${[2, 3, 4, 5, 6, 7, 8].map(n =>
            `<button class="btn ghost sm" data-k="${n}" aria-pressed="${n === k}">${n}</button>`).join('')}</div>
        </div>
      </div>
      <details>
        <summary>Présents : ${presents.length} / ${c.eleves.length} — toucher un prénom pour le marquer absent</summary>
        <div class="chips">${c.eleves.map(e =>
          `<button class="chip" data-abs="${e.id}" aria-pressed="${!abs.has(e.id)}">${abs.has(e.id) ? '✕ ' : '✓ '}${esc(e.prenom)}</button>`).join('')}</div>
      </details>
      <details>
        <summary>Élèves à ne pas mettre ensemble (${c.incompatibles.length})</summary>
        <div class="row wrap">
          <select id="inc-a" aria-label="Premier élève">${c.eleves.map(e => `<option value="${e.id}">${esc(e.prenom)}</option>`).join('')}</select>
          <span>et</span>
          <select id="inc-b" aria-label="Second élève">${c.eleves.map(e => `<option value="${e.id}">${esc(e.prenom)}</option>`).join('')}</select>
          <button class="btn ghost sm" id="inc-add">Séparer</button>
        </div>
        <ul class="snaps">${c.incompatibles.map(([a, b], i) =>
          `<li><span>${esc(name.get(a))} ≠ ${esc(name.get(b))}</span><button class="btn ghost sm" data-inc="${i}">Retirer</button></li>`).join('')}</ul>
      </details>
      <div class="center"><button class="btn bigbtn" id="gen">${result.length ? 'Mélanger à nouveau' : 'Faire les équipes'}</button></div>
      <div class="teams">${result.map((team, i) => `
        <section class="team">
          <div class="row"><i class="flag" style="background:${PAYS[i][1]}" aria-hidden="true"></i><h3>${PAYS[i][0]}</h3><span class="pill">${team.length}</span></div>
          <ul>${team.map(id => `<li>${esc(name.get(id))}</li>`).join('')}</ul>
        </section>`).join('')}</div>`;

    $<HTMLSelectElement>('#src', el).onchange = e => { src = (e.target as HTMLSelectElement).value; rememberClasse(src); result = []; render(); };
    $$('[data-k]', el).forEach(b => b.onclick = () => { k = Number(b.dataset.k); result = []; render(); });
    $$('[data-abs]', el).forEach(b => b.onclick = () => {
      const id = b.dataset.abs!;
      abs.has(id) ? abs.delete(id) : abs.add(id);
      result = []; render();
      $<HTMLDetailsElement>('details', el).open = true;
    });
    $('#inc-add', el).onclick = () => {
      const a = $<HTMLSelectElement>('#inc-a', el).value, b = $<HTMLSelectElement>('#inc-b', el).value;
      if (a === b) return toast('Choisis deux élèves différents');
      if (c.incompatibles.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return toast('Déjà séparés');
      c.incompatibles.push([a, b]); update(); render();
      $$<HTMLDetailsElement>('details', el)[1].open = true;
    };
    $$('[data-inc]', el).forEach(b => b.onclick = () => {
      c.incompatibles.splice(Number(b.dataset.inc), 1); update(); render();
      $$<HTMLDetailsElement>('details', el)[1].open = true;
    });
    $('#gen', el).onclick = () => {
      if (presents.length < k) return toast(`Il faut au moins ${k} élèves présents`);
      const r = makeTeams(presents.map(e => e.id), k, c.incompatibles);
      if (!r.ok) toast('Impossible de séparer toutes les paires : équipes faites au mieux');
      result = r.teams; render();
    };
  };

  render();
};

export default equipos;
