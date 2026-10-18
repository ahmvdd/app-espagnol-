import { exportBackup, readBackup, getSnapshots, restoreSnapshot, wipeAll, type BackupPreview } from '../../lib/storage';
import { state, update, replaceState } from '../../lib/state';
import { confirmModal } from '../../lib/modal';
import { beep } from '../../lib/sound';
import { $, $$, esc, toast } from '../../lib/ui';
import { scanner } from './qr';

export function renderReglages(el: HTMLElement): void {
  const r = state.reglages;
  el.innerHTML = `
    <section class="panel">
      <label class="field">Ton prénom (affiché sur l’accueil)
        <input id="prenom" value="${esc(r.prenomProf)}" autocomplete="off" /></label>
      <fieldset class="field">
        <legend>Police</legend>
        <label class="row"><input type="radio" name="police" value="standard" ${r.police !== 'dyslexie' ? 'checked' : ''}> Standard (Atkinson Hyperlegible)</label>
        <label class="row dys-sample"><input type="radio" name="police" value="dyslexie" ${r.police === 'dyslexie' ? 'checked' : ''}> Adaptée à la dyslexie (OpenDyslexic)</label>
      </fieldset>
      <label class="field">Volume des sons
        <span class="row"><input type="range" id="vol" min="0" max="1" step="0.1" value="${r.volume}"> <button class="btn ghost sm" id="test">🔊 Tester</button></span></label>
    </section>`;

  const prenom = $<HTMLInputElement>('#prenom', el);
  prenom.onchange = () => { update(s => { s.reglages.prenomProf = prenom.value.trim(); }); toast('Enregistré ✓'); };
  $$<HTMLInputElement>('[name=police]', el).forEach(i => i.onchange = () => update(s => { s.reglages.police = i.value as 'standard' | 'dyslexie'; }));
  const vol = $<HTMLInputElement>('#vol', el);
  vol.onchange = () => { update(s => { s.reglages.volume = Number(vol.value); }); beep(); };
  $('#test', el).onclick = () => beep();
}

export function renderSauvegardes(el: HTMLElement): void {
  let pending: BackupPreview | null = null;

  const render = () => {
    const snaps = getSnapshots();
    el.innerHTML = `
      <section class="panel stack">
        <div class="row wrap">
          <button class="btn" id="export">💾 Sauvegarder dans un fichier</button>
          <label class="btn ghost" tabindex="0" id="import-l">📂 Restaurer un fichier<input type="file" id="import" accept=".json,application/json" hidden /></label>
          <button class="btn ghost" id="undo" ${snaps.length ? '' : 'disabled'}>↩ Annuler la dernière modification</button>
          <button class="btn ghost" id="scan">📷 Scanner un QR de classe</button>
        </div>
        ${pending ? `
          <div class="confirm" role="alert">
            <p>Sauvegarde du <strong>${esc(pending.date)}</strong> : ${pending.classes} classe(s), ${pending.eleves} élève(s).<br>
            Elle remplacera les données actuelles. L’état actuel est gardé comme point de retour.</p>
            <div class="row"><button class="btn" id="imp-ok">Remplacer</button><button class="btn ghost" id="imp-no">Garder les données actuelles</button></div>
          </div>` : ''}
        ${snaps.length ? `
          <details><summary>Points de retour automatiques (${snaps.length})</summary>
            <ul class="snaps">${snaps.map((s, i) => `<li><span>${new Date(s.date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</span>
              <button class="btn ghost sm" data-snap="${i}">Revenir à cet état</button></li>`).join('')}</ul>
          </details>` : ''}
      </section>

      <h2>Zone sensible</h2>
      <section class="panel">
        <p>Efface toutes les classes, réglages et points de retour de cet appareil. Sauvegarde d’abord dans un fichier.</p>
        <button class="btn danger" id="wipe">Tout effacer</button>
      </section>`;

    $('#export', el).onclick = () => { exportBackup(state); $('#backup-reminder').hidden = true; toast('Fichier téléchargé ✓'); };
    const input = $<HTMLInputElement>('#import', el);
    $('#import-l', el).onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try { pending = await readBackup(f); render(); $('#imp-ok', el).focus(); } catch (err) { toast((err as Error).message); }
    };
    if (pending) {
      $('#imp-ok', el).onclick = () => { replaceState(pending!.data); pending = null; toast('Sauvegarde restaurée ✓'); dispatchEvent(new HashChangeEvent('hashchange')); };
      $('#imp-no', el).onclick = () => { pending = null; render(); };
    }

    const back = (i: number, pop = false) => {
      const d = restoreSnapshot(i, pop);
      if (!d) return;
      replaceState(d);
      toast(pop ? 'Modification annulée ✓' : 'Retour effectué ✓');
      dispatchEvent(new HashChangeEvent('hashchange'));
    };
    $('#undo', el).onclick = () => back(0, true);
    $('#scan', el).onclick = () => scanner();
    $$('[data-snap]', el).forEach(b => b.onclick = () => back(Number(b.dataset.snap)));

    $('#wipe', el).onclick = async () => {
      const ok = await confirmModal('Tout effacer ?',
        'Toutes les classes, les réglages et les points de retour de cet appareil seront supprimés. Seul un fichier de sauvegarde permettra de les récupérer.',
        'Tout effacer', { danger: true, typeToConfirm: 'EFFACER' });
      if (!ok) return;
      wipeAll();
      location.reload();
    };
  };
  render();
}
