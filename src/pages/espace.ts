import type { View } from '../router';
import { $, esc, toast } from '../lib/ui';
import { connecter, deconnecter, envoyer, espaceActif, getStatut, onStatut, recuperer, type Statut } from '../lib/sync';

export const LIBELLES: Record<Statut, string> = {
  ok: '✓ Enregistré en ligne',
  envoi: '⟳ Enregistrement…',
  'hors-ligne': '⚠ Hors ligne : enregistré sur l’appareil, envoi au retour du réseau',
  erreur: '⚠ Erreur d’enregistrement en ligne : réessaie plus tard',
  deconnecte: 'Non connecté'
};

export const espace: View = el => {
  const actif = espaceActif();
  if (actif && getStatut() !== 'deconnecte') {
    el.innerHTML = `
      <h1>Mon espace</h1>
      <section class="panel" style="max-width:560px">
        <h2>${esc(actif.nom)}</h2>
        <p id="etat" aria-live="polite"></p>
        <p class="muted small">Tes classes, ton suivi et ton carnet sont gardés sur cet appareil et sauvegardés en ligne dans ton espace. Tu les retrouves sur n’importe quel appareil avec ton mot secret.</p>
        <div class="row wrap">
          <button class="btn" id="sync">Synchroniser maintenant</button>
          <button class="btn ghost" id="out">Se déconnecter de cet appareil</button>
        </div>
      </section>`;
    const off = onStatut(s => { $('#etat', el).textContent = LIBELLES[s]; });
    $('#sync', el).onclick = async () => { await recuperer(); await envoyer(); };
    $('#out', el).onclick = async () => {
      const err = await deconnecter();
      if (err) return toast(err);
      location.hash = '#/espace';
      dispatchEvent(new HashChangeEvent('hashchange'));
    };
    return () => { off(); };
  }

  el.innerHTML = `
    <h1>Bienvenue dans Clase Viva</h1>
    <section class="panel" style="max-width:480px">
      <form id="f">
        <label for="secret">Mot secret</label>
        <input id="secret" type="password" autocomplete="current-password" required autofocus style="width:100%;margin:.3rem 0 1rem">
        <button class="btn" id="go">Entrer</button>
        <p id="err" class="small" role="alert" style="color:var(--pink);font-weight:700"></p>
      </form>
    </section>`;

  const go = $<HTMLButtonElement>('#go', el), err = $('#err', el), champ = $<HTMLInputElement>('#secret', el);
  champ.focus();
  $<HTMLFormElement>('#f', el).onsubmit = async e => {
    e.preventDefault();
    go.disabled = true; err.textContent = '';
    const msg = await connecter(champ.value);
    go.disabled = false;
    if (msg) { err.textContent = msg; champ.select(); return; }
    toast(`Bienvenue dans ${espaceActif()?.nom ?? 'ton espace'} ✓`);
    location.hash = '#/';
  };
};
