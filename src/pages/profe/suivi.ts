import { state } from '../../lib/state';
import { AXES } from '../../lib/content';
import { currentClasseId, rememberClasse } from '../../lib/classes';
import { STATUTS, statutInfo, statutSuivant, modifierSuivi, progression, suiviDe } from '../../lib/suivi';
import { ouvrirBilan } from './bilan';
import { $, $$, esc, toast } from '../../lib/ui';

export function renderSuivi(el: HTMLElement): void {
  let cid = currentClasseId();

  const render = () => {
    const c = state.classes.find(x => x.id === cid);
    if (!c) { el.innerHTML = '<p class="panel muted">Crée d’abord une classe dans l’onglet « Classes ».</p>'; return; }
    const p = progression(c);
    const pct = p.total ? Math.round((p.vus / p.total) * 100) : 0;
    const nb = { 'pas-vu': p.pasVus.length, 'en-cours': p.enCours.length, vu: p.vus, 'a-revoir': p.aRevoir.length };
    el.innerHTML = `
      <div class="row wrap plan-barre">
        <div class="row wrap" role="group" aria-label="Classe">${state.classes.map(x => `<button class="btn ghost sm" data-c="${x.id}" aria-pressed="${x.id === cid}">${esc(x.nom || 'Sans nom')} · ${x.niveau}</button>`).join('')}</div>
        <button class="btn" id="bilan">📝 Bilan de séance</button>
      </div>
      <section class="panel">
        <p class="big">${p.vus} chapitre${p.vus > 1 ? 's' : ''} vu${p.vus > 1 ? 's' : ''} sur ${p.total}</p>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${p.total}" aria-valuenow="${p.vus}" aria-label="Chapitres vus"><i style="width:${pct}%"></i></div>
        <p class="small">${STATUTS.map(s => `${s.icon} ${s.label} : ${nb[s.id]}`).join(' · ')}</p>
        ${p.aRevoir.length || p.enCours.length ? `<p><strong>À reprendre :</strong> ${[...p.aRevoir, ...p.enCours].map(t => `${statutInfo(suiviDe(c, t.id).statut).icon} ${esc(t.titre)}`).join(' · ')}</p>` : ''}
      </section>
      ${AXES[c.niveau].filter(a => a.themes.length).map(a => `
        <h2 class="suivi-axe h3">Axe ${a.n} · ${esc(a.titre)}${a.obligatoire ? ' <span class="pill oblig-pill">⭐ obligatoire</span>' : ''}</h2>
        <div class="suivi-liste">${a.themes.map(t => {
          const s = suiviDe(c, t.id), info = statutInfo(s.statut);
          return `<div class="panel suivi-ligne statut-${s.statut}" data-t="${t.id}">
            <button class="btn ghost sm statut" data-statut="${t.id}" aria-label="Statut de ${esc(t.titre)} : ${info.label}. Cliquer pour changer.">${info.icon} ${info.label}</button>
            <a href="#/nivel/${c.niveau}/${t.id}" class="suivi-titre">${esc(t.titre)}</a>
            <label class="small">Dernière séance <input type="date" data-date="${t.id}" value="${s.date ?? ''}"></label>
            <input class="suivi-note" data-note="${t.id}" value="${esc(s.note ?? '')}" placeholder="Note…" aria-label="Note pour ${esc(t.titre)}" maxlength="200">
          </div>`;
        }).join('')}</div>`).join('')}`;

    $$('[data-c]', el).forEach(b => b.onclick = () => { cid = b.dataset.c!; rememberClasse(cid); render(); });
    $('#bilan', el).onclick = () => ouvrirBilan(cid, render);
    $$('[data-statut]', el).forEach(b => b.onclick = () => {
      const id = b.dataset.statut!;
      statutSuivant(c, id); render();
      $<HTMLButtonElement>(`[data-statut="${id}"]`, el)?.focus();
    });
    $$<HTMLInputElement>('[data-date]', el).forEach(i => i.onchange = () => { modifierSuivi(c, i.dataset.date!, s => { s.date = i.value || undefined; }); toast('Enregistré ✓'); });
    $$<HTMLInputElement>('[data-note]', el).forEach(i => i.onchange = () => { modifierSuivi(c, i.dataset.note!, s => { s.note = i.value.trim() || undefined; }); toast('Note enregistrée ✓'); });
  };
  render();
}

