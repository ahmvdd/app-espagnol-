import { state } from '../../lib/state';
import { AXES } from '../../lib/content';
import { chapitreCourant, enregistrerSeance, aujourdhui } from '../../lib/suivi';
import { currentClasseId } from '../../lib/classes';
import { $, $$, esc, toast } from '../../lib/ui';

const HUMEURS = [['😀', 'Bien'], ['😐', 'Moyen'], ['😟', 'Difficile']] as const;
const OBJECTIFS = [['oui', 'Oui'], ['partie', 'En partie'], ['non', 'Non']] as const;

/** Mini-bilan de fin de séance (moins d'une minute), rangé ensuite dans le carnet de bord. */
export function ouvrirBilan(classeId = currentClasseId(), apres: () => void = () => {}): void {
  if (!state.classes.length) { toast('Crée d’abord une classe dans Profe'); location.hash = '#/profe'; return; }
  let cid = state.classes.some(c => c.id === classeId) ? classeId : state.classes[0].id;
  const rep = { humeur: -1, objectif: '', revoir: false };

  const back = document.createElement('div');
  back.className = 'modal-back';
  document.body.append(back);
  const fermer = () => { back.remove(); removeEventListener('keydown', key, true); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } };
  addEventListener('keydown', key, true);

  const render = () => {
    const c = state.classes.find(x => x.id === cid)!;
    const chap = chapitreCourant(c);
    back.innerHTML = `
      <form class="modal bilan" role="dialog" aria-modal="true" aria-labelledby="b-t">
        <h2 id="b-t">📝 Bilan de séance</h2>
        <div class="row wrap">
          <label class="field">Classe <select name="classe">${state.classes.map(x => `<option value="${x.id}" ${x.id === cid ? 'selected' : ''}>${esc(x.nom || 'Sans nom')}</option>`).join('')}</select></label>
          <label class="field">Date <input type="date" name="date" value="${aujourdhui()}"></label>
        </div>
        <label class="field">Chapitre
          <select name="chap">${AXES[c.niveau].filter(a => a.themes.length).map(a => `<optgroup label="Axe ${a.n}">${a.themes.map(t =>
            `<option value="${t.id}" ${t.id === chap ? 'selected' : ''}>${esc(t.titre)}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <label class="field">Ce qu’on a fait <input name="fait" maxlength="140" placeholder="ex. flashcards + quiz par équipes"></label>
        <fieldset class="field"><legend>1. Comment s’est passée la séance ?</legend>
          <div class="row wrap">${HUMEURS.map(([i, l], k) => `<button type="button" class="btn ghost humeur" data-h="${k}" aria-pressed="${rep.humeur === k}"><span aria-hidden="true">${i}</span> ${l}</button>`).join('')}</div></fieldset>
        <fieldset class="field"><legend>2. Objectif atteint ?</legend>
          <div class="row wrap">${OBJECTIFS.map(([v, l]) => `<button type="button" class="btn ghost sm" data-o="${v}" aria-pressed="${rep.objectif === v}">${l}</button>`).join('')}</div></fieldset>
        <label class="field">3. Ce qui a bien marché <input name="bien" maxlength="140"></label>
        <label class="field">4. À modifier ou améliorer <input name="ameliorer" maxlength="140"></label>
        <fieldset class="field"><legend>5. Faut-il revoir ce chapitre ?</legend>
          <div class="row wrap">
            <button type="button" class="btn ghost sm" data-r="1" aria-pressed="${rep.revoir}">Oui → « À revoir »</button>
            <button type="button" class="btn ghost sm" data-r="0" aria-pressed="${!rep.revoir}">Non</button>
          </div></fieldset>
        <div class="row wrap">
          <button class="btn" type="submit">Enregistrer</button>
          <button class="btn ghost" type="button" data-close>Annuler</button>
        </div>
      </form>`;
    const f = $<HTMLFormElement>('form', back);
    $<HTMLSelectElement>('[name=classe]', f).onchange = e => { cid = (e.target as HTMLSelectElement).value; render(); };
    $$('[data-h]', f).forEach(b => b.onclick = () => { rep.humeur = Number(b.dataset.h); $$('[data-h]', f).forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    $$('[data-o]', f).forEach(b => b.onclick = () => { rep.objectif = b.dataset.o!; $$('[data-o]', f).forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    $$('[data-r]', f).forEach(b => b.onclick = () => { rep.revoir = b.dataset.r === '1'; $$('[data-r]', f).forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    $('[data-close]', f).onclick = fermer;
    f.onsubmit = e => {
      e.preventDefault();
      if (rep.humeur < 0 || !rep.objectif) return toast('Réponds aux questions 1 et 2');
      const v = (n: string) => $<HTMLInputElement>(`[name=${n}]`, f).value.trim();
      enregistrerSeance({
        date: v('date') || aujourdhui(), classeId: cid, chapId: $<HTMLSelectElement>('[name=chap]', f).value, fait: v('fait'),
        humeur: rep.humeur as 0 | 1 | 2, objectif: rep.objectif as 'oui' | 'partie' | 'non', bien: v('bien'), ameliorer: v('ameliorer'), revoir: rep.revoir
      });
      toast(rep.revoir ? 'Bilan enregistré · chapitre « À revoir »' : 'Bilan enregistré ✓');
      fermer(); apres();
    };
    $<HTMLButtonElement>('[data-h="0"]', f).focus();
  };
  render();
}

export const HUMEUR_ICON = HUMEURS.map(h => h[0]);
export const OBJECTIF_LABEL: Record<string, string> = Object.fromEntries(OBJECTIFS);
