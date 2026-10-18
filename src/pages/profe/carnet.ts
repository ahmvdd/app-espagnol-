import { state, update } from '../../lib/state';
import { THEMES } from '../../lib/content';
import { confirmModal } from '../../lib/modal';
import { dateFr } from '../../lib/suivi';
import { ouvrirBilan, HUMEUR_ICON, OBJECTIF_LABEL } from './bilan';
import { $, $$, esc } from '../../lib/ui';

let filtre = '';

/** Historique des séances, par classe. Inclus dans « Sauvegarder dans un fichier ». */
export function renderCarnet(el: HTMLElement): void {
  const render = () => {
    const titre = (niv: string, id: string) => THEMES[niv as '5e']?.find(t => t.id === id)?.titre ?? id;
    const seances = state.seances
      .filter(s => !filtre || s.classeId === filtre)
      .sort((a, b) => b.date.localeCompare(a.date));
    el.innerHTML = `
      <div class="row wrap plan-barre">
        <div class="row wrap" role="group" aria-label="Classe">
          <button class="btn ghost sm" data-f="" aria-pressed="${!filtre}">Toutes</button>
          ${state.classes.map(c => `<button class="btn ghost sm" data-f="${c.id}" aria-pressed="${filtre === c.id}">${esc(c.nom || 'Sans nom')}</button>`).join('')}
        </div>
        <button class="btn" id="bilan">📝 Nouveau bilan</button>
      </div>
      <p class="muted small">${seances.length} séance(s). Le carnet est inclus dans « Sauvegarder dans un fichier » (onglet Classes) et revient avec « Restaurer ».</p>
      ${seances.length ? `<ol class="carnet">${seances.map(s => {
        const c = state.classes.find(x => x.id === s.classeId);
        return `<li class="panel seance">
          <div class="row wrap seance-tete">
            <strong>${dateFr(s.date)}</strong><span class="pill">${esc(c?.nom ?? 'Classe supprimée')}</span>
            <span>${esc(c ? titre(c.niveau, s.chapId) : s.chapId)}</span>
            <span class="seance-bilan" aria-label="Séance : ${['bien', 'moyenne', 'difficile'][s.humeur]}, objectif : ${OBJECTIF_LABEL[s.objectif]}">${HUMEUR_ICON[s.humeur]} · objectif : ${OBJECTIF_LABEL[s.objectif]}</span>
            ${s.revoir ? '<span class="pill">🔁 à revoir</span>' : ''}
            <button class="btn ghost sm" data-del="${s.id}" aria-label="Supprimer cette séance">✕</button>
          </div>
          ${s.fait ? `<p><strong>Fait :</strong> ${esc(s.fait)}</p>` : ''}
          ${s.bien ? `<p><strong>👍 Bien marché :</strong> ${esc(s.bien)}</p>` : ''}
          ${s.ameliorer ? `<p><strong>🔧 À améliorer :</strong> ${esc(s.ameliorer)}</p>` : ''}
        </li>`;
      }).join('')}</ol>` : '<p class="panel muted">Aucune séance pour l’instant. Le bouton « Bilan de séance » crée la première entrée.</p>'}`;

    $$('[data-f]', el).forEach(b => b.onclick = () => { filtre = b.dataset.f!; render(); });
    $('#bilan', el).onclick = () => ouvrirBilan(filtre || undefined, render);
    $$('[data-del]', el).forEach(b => b.onclick = async () => {
      if (!(await confirmModal('Supprimer cette séance du carnet ?', 'Le suivi des chapitres n’est pas modifié.', 'Supprimer', { danger: true }))) return;
      update(d => { d.seances = d.seances.filter(s => s.id !== b.dataset.del); });
      render();
    });
  };
  render();
}
