import type { View } from '../router';
import type { Classe } from '../lib/storage';
import { decodeClasse } from '../lib/transfert';
import { state, update, uid } from '../lib/state';
import { $, esc, toast } from '../lib/ui';

/** Arrivée d'un QR code de classe : aperçu, puis ajout seulement après confirmation. */
export const importer: View = el => {
  const code = location.hash.split('#/import/')[1] ?? '';
  el.innerHTML = '<h1>Importer une classe</h1><p class="muted">Lecture du QR code…</p>';

  decodeClasse(code).then(p => {
    const existe = state.classes.some(c => c.nom === p.n);
    el.innerHTML = `
      <h1>Importer une classe</h1>
      <section class="panel stack">
        <p class="big">${esc(p.n)} · ${p.v} · ${p.e.length} élève(s)</p>
        <p class="muted">${p.e.map(esc).join(', ')}</p>
        ${existe ? '<p class="confirm">⚠ Une classe porte déjà ce nom : la nouvelle sera ajoutée à côté, avec « (importée) ».</p>' : ''}
        <div class="row wrap">
          <button class="btn" id="ok">Ajouter cette classe</button>
          <a class="btn ghost" href="#/">Annuler</a>
        </div>
      </section>`;
    $('#ok', el).onclick = () => {
      const eleves = p.e.map(prenom => ({ id: uid(), prenom }));
      const c: Classe = {
        id: uid(), nom: existe ? `${p.n} (importée)` : p.n, niveau: p.v, eleves,
        incompatibles: p.i.filter(([a, b]) => eleves[a] && eleves[b]).map(([a, b]) => [eleves[a].id, eleves[b].id])
      };
      update(s => s.classes.push(c));
      toast('Classe ajoutée ✓');
      location.hash = '#/profe';
    };
  }).catch((e: Error) => {
    el.innerHTML = `<h1>Importer une classe</h1><p class="big">${esc(e.message)}</p><a class="btn" href="#/profe">Aller dans Profe</a>`;
  });
};
