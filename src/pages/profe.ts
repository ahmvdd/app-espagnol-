import type { View } from '../router';
import type { Classe } from '../lib/storage';
import { exportBackup, readBackup, getSnapshots, restoreSnapshot, wipeAll } from '../lib/storage';
import { data, commit, replace, uid } from '../lib/store';
import { $, $$, esc, toast } from '../lib/ui';

const NIVEAUX = ['5e', '4e', '3e'] as const;

const save = () => toast(commit() ? 'Enregistré ✓' : 'Stockage plein ou bloqué : sauvegarde impossible');

const parsePrenoms = (txt: string, c: Classe) => {
  const old = new Map(c.eleves.map(e => [e.prenom, e.id]));
  const prenoms = [...new Set(txt.split('\n').map(s => s.trim()).filter(Boolean))];
  c.eleves = prenoms.map(prenom => ({ id: old.get(prenom) ?? uid(), prenom }));
  const ids = new Set(c.eleves.map(e => e.id));
  c.incompatibles = c.incompatibles.filter(([a, b]) => ids.has(a) && ids.has(b));
};

/** Bouton en deux temps : le premier clic arme, le second confirme. */
function confirmButton(btn: HTMLButtonElement, label: string, action: () => void) {
  const initial = btn.textContent!;
  let armed: number | undefined;
  btn.onclick = () => {
    if (armed) { clearTimeout(armed); armed = undefined; btn.textContent = initial; action(); return; }
    btn.textContent = label;
    armed = window.setTimeout(() => { armed = undefined; btn.textContent = initial; }, 4000);
  };
}

const classeHTML = (c: Classe) => `
  <section class="panel classe" data-id="${c.id}">
    <div class="row wrap">
      <label class="field grow">Nom de la classe
        <input name="nom" value="${esc(c.nom)}" placeholder="ex. 5e B" autocomplete="off" />
      </label>
      <label class="field">Niveau
        <select name="niveau">${NIVEAUX.map(n => `<option ${n === c.niveau ? 'selected' : ''}>${n}</option>`).join('')}</select>
      </label>
    </div>
    <label class="field">Prénoms — un par ligne <span class="muted" data-count>${c.eleves.length} élève${c.eleves.length > 1 ? 's' : ''}</span>
      <textarea name="eleves" rows="6" spellcheck="false">${esc(c.eleves.map(e => e.prenom).join('\n'))}</textarea>
    </label>
    <button class="btn ghost sm danger" data-del>Supprimer la classe</button>
  </section>`;

export const profe: View = el => {
  let pending: Awaited<ReturnType<typeof readBackup>> | null = null;

  const render = () => {
    const snaps = getSnapshots();
    el.innerHTML = `
      <h1>Profe</h1>
      <p class="muted">Tout reste sur cet appareil. Pense à sauvegarder dans un fichier de temps en temps.</p>

      <h2>Mes classes</h2>
      <div class="stack">
        ${data.classes.map(classeHTML).join('') || '<p class="panel muted">Aucune classe pour l’instant.</p>'}
        <button class="btn" id="add">+ Ajouter une classe</button>
      </div>

      <h2>Réglages</h2>
      <section class="panel">
        <label class="field">Ton prénom (affiché sur l’accueil)
          <input id="prenom" value="${esc(data.reglages.prenomProf)}" autocomplete="off" />
        </label>
      </section>

      <h2>Sauvegardes</h2>
      <section class="panel stack">
        <div class="row wrap">
          <button class="btn" id="export">💾 Sauvegarder dans un fichier</button>
          <label class="btn ghost">📂 Restaurer un fichier<input type="file" id="import" accept=".json,application/json" hidden /></label>
          <button class="btn ghost" id="undo" ${snaps.length ? '' : 'disabled'}>↩ Annuler la dernière modification</button>
        </div>
        ${pending ? `
          <div class="confirm">
            <p>Sauvegarde du <strong>${esc(pending.date)}</strong> : ${pending.classes} classe(s), ${pending.eleves} élève(s).<br>
            Elle remplacera les données actuelles (récupérables avec « Annuler »).</p>
            <div class="row"><button class="btn" id="imp-ok">Remplacer</button><button class="btn ghost" id="imp-no">Garder les données actuelles</button></div>
          </div>` : ''}
        ${snaps.length ? `
          <details><summary>Points de retour automatiques (${snaps.length})</summary>
            <ul class="snaps">${snaps.map((s, i) => `<li><span>${new Date(s.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <button class="btn ghost sm" data-snap="${i}">Revenir à cet état</button></li>`).join('')}</ul>
          </details>` : ''}
      </section>

      <h2>Zone sensible</h2>
      <section class="panel">
        <p>Efface toutes les classes, réglages et points de retour de cet appareil.</p>
        <button class="btn danger" id="wipe">Tout effacer</button>
      </section>`;

    $$('.classe', el).forEach(sec => {
      const c = data.classes.find(x => x.id === sec.dataset.id)!;
      const nom = $<HTMLInputElement>('[name=nom]', sec);
      const niv = $<HTMLSelectElement>('[name=niveau]', sec);
      const ta = $<HTMLTextAreaElement>('[name=eleves]', sec);
      nom.onchange = () => { c.nom = nom.value.trim() || 'Sans nom'; save(); };
      niv.onchange = () => { c.niveau = niv.value as Classe['niveau']; save(); };
      ta.onchange = () => {
        parsePrenoms(ta.value, c);
        ta.value = c.eleves.map(e => e.prenom).join('\n');
        $('[data-count]', sec).textContent = `${c.eleves.length} élève${c.eleves.length > 1 ? 's' : ''}`;
        save();
      };
      confirmButton($('[data-del]', sec), 'Confirmer la suppression ?', () => {
        data.classes = data.classes.filter(x => x !== c); save(); render();
      });
    });

    $('#add', el).onclick = () => {
      const c: Classe = { id: uid(), nom: '', niveau: '5e', eleves: [], incompatibles: [] };
      data.classes.push(c); save(); render();
      $<HTMLInputElement>(`[data-id="${c.id}"] [name=nom]`, el).focus();
    };

    const prenom = $<HTMLInputElement>('#prenom', el);
    prenom.onchange = () => { data.reglages.prenomProf = prenom.value.trim(); save(); };

    $('#export', el).onclick = () => { exportBackup(data); $('#backup-reminder').hidden = true; toast('Fichier téléchargé ✓'); };

    $<HTMLInputElement>('#import', el).onchange = async e => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      try { pending = await readBackup(f); render(); } catch (err) { toast((err as Error).message); }
    };
    if (pending) {
      $('#imp-ok', el).onclick = () => { replace(pending!.data); pending = null; toast('Sauvegarde restaurée ✓'); render(); };
      $('#imp-no', el).onclick = () => { pending = null; render(); };
    }

    const back = (i: number, pop = false) => {
      const d = restoreSnapshot(i, pop);
      if (!d) return;
      Object.assign(data, d);
      toast(pop ? 'Modification annulée ✓' : 'Retour effectué ✓'); render();
    };
    $('#undo', el).onclick = () => back(0, true);
    $$('[data-snap]', el).forEach(b => b.onclick = () => back(Number(b.dataset.snap)));

    confirmButton($('#wipe', el), 'Vraiment tout effacer ?', () => {
      wipeAll();
      location.reload();
    });
  };

  render();
};
