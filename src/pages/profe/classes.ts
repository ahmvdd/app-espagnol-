import type { Classe } from '../../lib/storage';
import { state, update, uid } from '../../lib/state';
import { confirmModal } from '../../lib/modal';
import { $, $$, esc, toast } from '../../lib/ui';

const NIVEAUX = ['5e', '4e', '3e'] as const;

export const cleanPrenoms = (txt: string) => [...new Set(txt.split(/\r?\n/).map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean))];

function addEleves(c: Classe, prenoms: string[]): number {
  const known = new Set(c.eleves.map(e => e.prenom.toLowerCase()));
  const fresh = prenoms.filter(p => !known.has(p.toLowerCase()));
  c.eleves.push(...fresh.map(prenom => ({ id: uid(), prenom })));
  return fresh.length;
}

function removeEleve(c: Classe, id: string) {
  c.eleves = c.eleves.filter(e => e.id !== id);
  c.incompatibles = c.incompatibles.filter(([a, b]) => a !== id && b !== id);
}

const plural = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

const classeHTML = (c: Classe) => {
  const name = new Map(c.eleves.map(e => [e.id, e.prenom]));
  const opts = c.eleves.map(e => `<option value="${e.id}">${esc(e.prenom)}</option>`).join('');
  return `
  <section class="panel classe" data-id="${c.id}">
    <div class="row wrap">
      <label class="field grow">Nom de la classe
        <input name="nom" value="${esc(c.nom)}" placeholder="ex. 5e B" autocomplete="off" /></label>
      <label class="field">Niveau
        <select name="niveau">${NIVEAUX.map(n => `<option ${n === c.niveau ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    </div>

    <p class="field">${plural(c.eleves.length, 'élève')}</p>
    <ul class="chips" aria-label="Élèves">
      ${c.eleves.map(e => `<li class="chip">${esc(e.prenom)} <button class="x" data-rm="${e.id}" aria-label="Retirer ${esc(e.prenom)}">✕</button></li>`).join('')}
    </ul>
    <form class="row wrap add-one">
      <input name="un" placeholder="Prénom" aria-label="Prénom à ajouter" autocomplete="off" />
      <button class="btn ghost sm">+ Ajouter</button>
    </form>

    <details>
      <summary>Coller une liste de prénoms</summary>
      <label class="field">Un prénom par ligne — doublons et lignes vides retirés
        <textarea name="liste" rows="6" spellcheck="false"></textarea></label>
      <button class="btn ghost sm" data-paste>Ajouter ces prénoms</button>
    </details>

    <details>
      <summary>Ne jamais mettre ensemble (${c.incompatibles.length})</summary>
      ${c.eleves.length < 2 ? '<p class="muted">Ajoute au moins deux élèves.</p>' : `
      <div class="row wrap">
        <select name="inc-a" aria-label="Premier élève">${opts}</select>
        <span>et</span>
        <select name="inc-b" aria-label="Second élève">${opts}</select>
        <button class="btn ghost sm" data-inc-add>Séparer</button>
      </div>`}
      <ul class="snaps">${c.incompatibles.map(([a, b], i) =>
        `<li><span>${esc(name.get(a))} ≠ ${esc(name.get(b))}</span><button class="btn ghost sm" data-inc-rm="${i}">Retirer</button></li>`).join('')}</ul>
    </details>

    <button class="btn ghost sm danger" data-del>Supprimer la classe</button>
  </section>`;
};

export function renderClasses(el: HTMLElement): void {
  const render = (focus?: { id: string; sel: string; open?: number }) => {
    el.innerHTML = `
      <div class="stack">
        ${state.classes.map(classeHTML).join('') || '<p class="panel muted">Aucune classe pour l’instant.</p>'}
        <button class="btn" id="add">+ Ajouter une classe</button>
      </div>`;

    $$('.classe', el).forEach(sec => {
      const c = state.classes.find(x => x.id === sec.dataset.id)!;
      const again = (sel: string, open?: number) => render({ id: c.id, sel, open });

      const nom = $<HTMLInputElement>('[name=nom]', sec);
      nom.onchange = () => { update(() => { c.nom = nom.value.trim() || 'Sans nom'; }); toast('Enregistré ✓'); };
      const niv = $<HTMLSelectElement>('[name=niveau]', sec);
      niv.onchange = () => { update(() => { c.niveau = niv.value as Classe['niveau']; }); toast('Enregistré ✓'); };

      $$('[data-rm]', sec).forEach(b => b.onclick = () => { update(() => removeEleve(c, b.dataset.rm!)); again('[name=un]'); });

      const form = $<HTMLFormElement>('.add-one', sec);
      form.onsubmit = e => {
        e.preventDefault();
        const v = cleanPrenoms($<HTMLInputElement>('[name=un]', form).value);
        if (!v.length) return;
        let n = 0;
        update(() => { n = addEleves(c, v); });
        if (!n) toast('Ce prénom est déjà dans la classe');
        again('[name=un]');
      };

      $('[data-paste]', sec).onclick = () => {
        const ta = $<HTMLTextAreaElement>('[name=liste]', sec);
        let n = 0;
        update(() => { n = addEleves(c, cleanPrenoms(ta.value)); });
        toast(`${plural(n, 'élève')} ajouté${n > 1 ? 's' : ''}`);
        again('[name=un]');
      };

      const incAdd = $('[data-inc-add]', sec);
      if (incAdd) incAdd.onclick = () => {
        const a = $<HTMLSelectElement>('[name=inc-a]', sec).value, b = $<HTMLSelectElement>('[name=inc-b]', sec).value;
        if (a === b) return toast('Choisis deux élèves différents');
        if (c.incompatibles.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return toast('Déjà séparés');
        update(() => c.incompatibles.push([a, b]));
        again('[data-inc-add]', 1);
      };
      $$('[data-inc-rm]', sec).forEach(b => b.onclick = () => {
        update(() => c.incompatibles.splice(Number(b.dataset.incRm), 1));
        again('summary', 1);
      });

      $('[data-del]', sec).onclick = async () => {
        const ok = await confirmModal(`Supprimer « ${c.nom || 'Sans nom'} » ?`,
          `${plural(c.eleves.length, 'élève')} seront retirés. Tu pourras revenir en arrière avec « Annuler la dernière modification ».`,
          'Supprimer', { danger: true });
        if (!ok) return;
        update(s => { s.classes = s.classes.filter(x => x !== c); });
        toast('Classe supprimée'); render();
      };
    });

    $('#add', el).onclick = () => {
      const c: Classe = { id: uid(), nom: '', niveau: '5e', eleves: [], incompatibles: [] };
      update(s => s.classes.push(c));
      render({ id: c.id, sel: '[name=nom]' });
    };

    if (focus) {
      const sec = $(`[data-id="${focus.id}"]`, el);
      if (focus.open !== undefined) $$<HTMLDetailsElement>('details', sec)[focus.open].open = true;
      $<HTMLElement>(focus.sel, sec)?.focus();
    }
  };
  render();
}
