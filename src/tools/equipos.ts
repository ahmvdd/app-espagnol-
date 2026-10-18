import type { Tool } from './index';
import PAISES from '../content/paises.json';
import { state } from '../lib/state';
import { classeOptions, currentClasseId, rememberClasse } from '../lib/classes';
import { makeTeams } from '../lib/teams';
import { toggleFullscreen } from '../lib/fullscreen';
import { $, $$, esc, toast } from '../lib/ui';

/** Absents et dernières équipes, par classe : le temps de la séance (non sauvegardé). */
const absents = new Map<string, Set<string>>();
const derniers = new Map<string, { k: number; teams: string[][]; ok: boolean }>();
let k = 4;

const equipos: Tool = el => {
  let src = currentClasseId();

  const render = () => {
    const c = state.classes.find(x => x.id === src);
    if (!c?.eleves.length) {
      el.innerHTML = `
        ${state.classes.length ? `<label class="field">Classe <select id="src">${classeOptions(src)}</select></label>` : ''}
        <p class="center big">Il faut d’abord une classe avec des prénoms.</p>
        <p class="center"><a class="btn" href="#/profe">Ajouter une classe</a></p>`;
      const s = $<HTMLSelectElement>('#src', el);
      if (s) s.onchange = () => { src = s.value; rememberClasse(src); render(); };
      return;
    }
    if (!absents.has(c.id)) absents.set(c.id, new Set());
    const abs = absents.get(c.id)!;
    const name = new Map(c.eleves.map(e => [e.id, e.prenom]));
    const presents = c.eleves.filter(e => !abs.has(e.id));
    const res = derniers.get(c.id);
    const result = res && res.k === k ? res : null;

    el.innerHTML = `
      <div class="row wrap">
        <label class="field">Classe <select id="src">${classeOptions(src)}</select></label>
        <div class="field">Nombre d’équipes
          <div class="row wrap" role="group">${[2, 3, 4, 5, 6, 7, 8].map(n =>
            `<button class="btn ghost sm" data-k="${n}" aria-pressed="${n === k}">${n}</button>`).join('')}</div>
        </div>
      </div>
      <details id="abs-d">
        <summary>Présents : ${presents.length} / ${c.eleves.length} — toucher un prénom pour le marquer absent</summary>
        <div class="chips">${c.eleves.map(e =>
          `<button class="chip" data-abs="${e.id}" aria-pressed="${!abs.has(e.id)}">${abs.has(e.id) ? '✕ absent · ' : '✓ '}${esc(e.prenom)}</button>`).join('')}</div>
      </details>
      <p class="muted small">${c.incompatibles.length} paire(s) à séparer · <a href="#/profe">Gérer dans Profe</a></p>
      <div class="row wrap center-row">
        <button class="btn bigbtn" id="gen">${result ? '🔀 Refaire' : 'Faire les équipes'}</button>
        ${result ? '<button class="btn ghost" id="proj">⛶ Projeter</button>' : ''}
      </div>
      ${result && !result.ok ? '<p class="confirm center" role="alert">⚠ Impossible de séparer toutes les paires avec ce nombre d’équipes : équipes faites au mieux. Essaie un autre nombre d’équipes.</p>' : ''}
      <div class="teams" id="teams">${(result?.teams ?? []).map((team, i) => `
        <section class="team">
          <div class="row"><i class="flag" style="background:${PAISES[i].drapeau}" aria-hidden="true"></i><h3>${PAISES[i].nom}</h3><span class="pill">${team.length}</span></div>
          <ul>${team.map(id => `<li>${esc(name.get(id))}</li>`).join('')}</ul>
        </section>`).join('')}</div>`;

    $<HTMLSelectElement>('#src', el).onchange = e => { src = (e.target as HTMLSelectElement).value; rememberClasse(src); render(); };
    $$('[data-k]', el).forEach(b => b.onclick = () => { k = Number(b.dataset.k); render(); });
    $$('[data-abs]', el).forEach(b => b.onclick = () => {
      const id = b.dataset.abs!;
      abs.has(id) ? abs.delete(id) : abs.add(id);
      derniers.delete(c.id); render();
      $<HTMLDetailsElement>('#abs-d', el).open = true;
      $<HTMLElement>(`[data-abs="${id}"]`, el).focus();
    });
    $('#gen', el).onclick = () => {
      if (presents.length < k) return toast(`Il faut au moins ${k} élèves présents`);
      derniers.set(c.id, { k, ...makeTeams(presents.map(e => e.id), k, c.incompatibles) });
      render();
    };
    const proj = $('#proj', el);
    if (proj) proj.onclick = () => toggleFullscreen($('#teams', el));
  };

  render();
};

export default equipos;
