import type { Tool } from './index';
import type { Classe } from '../lib/storage';
import { state, update } from '../lib/state';
import { classeOptions, currentClasseId, rememberClasse } from '../lib/classes';
import { $, esc } from '../lib/ui';

const ROLES: [string, string, string][] = [
  ['📝', 'Secretario/a', 'Note au tableau les mots nouveaux'],
  ['⏱', 'Guardián del tiempo', 'Surveille le minuteur'],
  ['🤫', 'Guardián del silencio', 'Rappelle le niveau de voix'],
  ['🤝', 'Ayudante', 'Distribue et ramasse le matériel'],
  ['📢', 'Portavoz', 'Résume la séance à la fin']
];

const today = () => new Date().toLocaleDateString('fr-CA');

/** Ordre stable des élèves pour une classe : le même d'une séance à l'autre. */
function ordre(c: Classe) {
  let h = 0;
  for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return [...c.eleves].sort((a, b) => {
    const ha = [...a.id].reduce((x, ch) => (x * 33 + ch.charCodeAt(0) + h) >>> 0, 7);
    const hb = [...b.id].reduce((x, ch) => (x * 33 + ch.charCodeAt(0) + h) >>> 0, 7);
    return ha - hb;
  });
}

const roles: Tool = el => {
  let src = currentClasseId();

  const render = () => {
    const c = state.classes.find(x => x.id === src);
    if (!c || c.eleves.length < ROLES.length) {
      el.innerHTML = `
        ${state.classes.length ? `<label class="field">Classe <select id="src">${classeOptions(src)}</select></label>` : ''}
        <p class="center big">Il faut une classe d’au moins ${ROLES.length} élèves.</p>
        <p class="center"><a class="btn" href="#/profe">Gérer les classes</a></p>`;
      $<HTMLSelectElement>('#src', el)?.addEventListener('change', e => { src = (e.target as HTMLSelectElement).value; rememberClasse(src); render(); });
      return;
    }
    // Nouvelle séance (nouveau jour) : la rotation avance toute seule.
    if (!c.roles) update(() => { c.roles = { jour: today(), tour: 0 }; });
    else if (c.roles.jour !== today()) update(() => { c.roles = { jour: today(), tour: c.roles!.tour + 1 }; });

    const liste = ordre(c);
    const debut = (c.roles!.tour * ROLES.length) % liste.length;
    const qui = ROLES.map((_, i) => liste[(debut + i) % liste.length]);

    el.innerHTML = `
      <div class="row wrap center-row">
        <label class="field">Classe <select id="src">${classeOptions(src)}</select></label>
      </div>
      <p class="center muted">Séance n° ${c.roles!.tour + 1} · la rotation avance automatiquement chaque nouveau jour.</p>
      <div class="roles">${ROLES.map(([icon, es, fr], i) => `
        <section class="panel role">
          <span class="ico" aria-hidden="true">${icon}</span>
          <strong lang="es">${es}</strong>
          <span class="big">${esc(qui[i].prenom)}</span>
          <span class="muted small">${fr}</span>
        </section>`).join('')}</div>
      <div class="row wrap center-row">
        <button class="btn ghost sm" id="prev">← Séance précédente</button>
        <button class="btn ghost sm" id="next">Séance suivante →</button>
      </div>`;
    $<HTMLSelectElement>('#src', el).onchange = e => { src = (e.target as HTMLSelectElement).value; rememberClasse(src); render(); };
    $('#prev', el).onclick = () => { update(() => { c.roles!.tour = Math.max(0, c.roles!.tour - 1); }); render(); };
    $('#next', el).onclick = () => { update(() => { c.roles!.tour++; }); render(); };
  };

  render();
};

export default roles;
