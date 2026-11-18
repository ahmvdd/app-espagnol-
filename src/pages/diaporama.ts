import type { Axe, Niveau, Theme } from '../content/types';
import type { Diapo } from '../lib/storage';
import { DIAPOS, diapoHtml, diaposDefaut, diaposImpression, ecrireDiapos, estModifie, exporterPptx, lireDiapos, promptGemini, type TypeDiapo } from '../lib/diapos';
import { apercu } from '../lib/documents';
import { apresHistorique, ouvrirOverlay } from '../lib/overlay';
import { confirmModal } from '../lib/modal';
import { $, $$, esc, toast } from '../lib/ui';

/** Présentation plein écran : flèches, espace ou clic pour avancer ; la réponse des mini-questions s'affiche d'abord. */
export function presenter(n: Niveau, axe: Axe, t: Theme, type: TypeDiapo): void {
  const d = lireDiapos(n, axe, t, type);
  let i = 0, revele = false;
  const { zone } = ouvrirOverlay('diapo-presentation', `Diaporama ${DIAPOS[type].label}`, `
    <div class="diapo-scene" id="scene"></div>
    <nav class="diapo-nav" aria-label="Navigation du diaporama">
      <button class="btn ghost sm" data-prev aria-label="Diapo précédente">←</button>
      <span class="pill" id="compteur"></span>
      <button class="btn sm" data-next aria-label="Diapo suivante">→</button>
      <button class="btn ghost sm" data-fs>⛶ Plein écran</button>
    </nav>`, () => { removeEventListener('keydown', key); if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); });
  const scene = $('#scene', zone);
  const draw = () => {
    scene.innerHTML = diapoHtml(d[i], n, i, d.length, revele);
    $('#compteur', zone).textContent = `${i + 1} / ${d.length}`;
  };
  const suivant = () => {
    if (d[i].reponse && !revele) { revele = true; return draw(); }
    if (i < d.length - 1) { i++; revele = false; draw(); }
  };
  const precedent = () => { if (i > 0) { i--; revele = false; draw(); } };
  const key = (e: KeyboardEvent) => {
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); suivant(); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); precedent(); }
  };
  addEventListener('keydown', key);
  scene.onclick = suivant;
  $('[data-next]', zone).onclick = suivant;
  $('[data-prev]', zone).onclick = precedent;
  $('[data-fs]', zone).onclick = () => { document.fullscreenElement ? void document.exitFullscreen() : void zone.requestFullscreen?.().catch(() => {}); };
  draw();
  zone.requestFullscreen?.().catch(() => {});
}

/** Éditeur : chaque diapo est modifiable (texte, ordre, ajout, suppression), enregistré tout seul. */
export function editer(n: Niveau, axe: Axe, t: Theme, type: TypeDiapo, apres: () => void): void {
  let d = lireDiapos(n, axe, t, type);
  let minuterie: number | undefined, sale = false;
  const { zone } = ouvrirOverlay('diapo-editeur', `Modifier le diaporama ${DIAPOS[type].label}`, `
    <div class="apercu-barre">
      <strong class="apercu-titre">${DIAPOS[type].ico} ${DIAPOS[type].label} · ${n} · ${esc(t.titreFr)}</strong>
      <div class="row wrap center-row">
        <button class="btn sm" data-pres>▶ Présenter</button>
        <button class="btn ghost sm" data-orig>↺ Version d’origine</button>
        <span class="muted small" id="etat" aria-live="polite">Les modifications sont enregistrées toutes seules.</span>
      </div>
    </div>
    <div class="ed-liste" id="liste"></div>`, () => { clearTimeout(minuterie); if (sale) ecrireDiapos(n, t.id, type, d); apres(); });

  const sauver = () => {
    sale = true;
    $('#etat', zone).textContent = 'Modification…';
    clearTimeout(minuterie);
    minuterie = window.setTimeout(() => { ecrireDiapos(n, t.id, type, d); sale = false; $('#etat', zone).textContent = 'Enregistré ✓'; }, 500);
  };
  const champ = (k: number, f: keyof Diapo, label: string, val: string, long = false, ph = '') => long
    ? `<label class="field">${label}<textarea data-k="${k}" data-f="${f}" rows="${f === 'note' ? 2 : 4}" placeholder="${esc(ph)}">${esc(val)}</textarea></label>`
    : `<label class="field ${f === 'ico' ? 'ed-ico' : ''}">${label}<input data-k="${k}" data-f="${f}" value="${esc(val)}" placeholder="${esc(ph)}"></label>`;

  const render = () => {
    $('#liste', zone).innerHTML = d.map((x, k) => `
      <section class="panel ed-diapo">
        <div class="ed-champs">
          <div class="row wrap ed-tete"><strong>Diapo ${k + 1}</strong>
            <span class="row wrap">
              <button class="btn ghost sm" data-up="${k}" ${k === 0 ? 'disabled' : ''} aria-label="Monter">↑</button>
              <button class="btn ghost sm" data-down="${k}" ${k === d.length - 1 ? 'disabled' : ''} aria-label="Descendre">↓</button>
              <button class="btn ghost sm" data-dup="${k}" aria-label="Dupliquer">⧉</button>
              <button class="btn ghost sm danger" data-del="${k}" aria-label="Supprimer">🗑</button>
            </span></div>
          <div class="row ed-ligne">${champ(k, 'ico', 'Icône', x.ico ?? '', false, '🌎')}${champ(k, 'titre', 'Titre', x.titre)}</div>
          ${champ(k, 'corps', 'Contenu (une ligne = une puce)', x.corps, true)}
          ${champ(k, 'reponse', 'Réponse cachée (mini-question)', x.reponse ?? '', false, 'Laisser vide si ce n’est pas une question')}
          ${champ(k, 'note', 'Note pour toi (non projetée)', x.note ?? '', true)}
          <label class="inline small"><input type="checkbox" data-k="${k}" data-f="grand" ${x.grand ? 'checked' : ''}> Grand titre centré</label>
        </div>
        <div class="ed-vue" id="vue${k}">${diapoHtml(x, n, k, d.length, true)}</div>
      </section>`).join('') + `
      <div class="row wrap center-row">
        <button class="btn" data-add="texte">+ Ajouter une diapo</button>
        <button class="btn ghost" data-add="question">+ Ajouter une mini-question</button>
      </div>`;

    $$<HTMLInputElement | HTMLTextAreaElement>('[data-f]', zone).forEach(inp => {
      const ev = inp.type === 'checkbox' ? 'change' : 'input';
      inp.addEventListener(ev, () => {
        const k = Number(inp.dataset.k), f = inp.dataset.f as keyof Diapo;
        const x = d[k] as Record<string, unknown>;
        if (inp.type === 'checkbox') x[f] = (inp as HTMLInputElement).checked;
        else if (inp.value.trim() || f === 'titre' || f === 'corps') x[f] = inp.value;
        else delete x[f];
        $(`#vue${k}`, zone).innerHTML = diapoHtml(d[k], n, k, d.length, true);
        sauver();
      });
    });
    const bouge = (k: number, j: number) => { [d[k], d[j]] = [d[j], d[k]]; sauver(); render(); };
    $$('[data-up]', zone).forEach(b => b.onclick = () => bouge(Number(b.dataset.up), Number(b.dataset.up) - 1));
    $$('[data-down]', zone).forEach(b => b.onclick = () => bouge(Number(b.dataset.down), Number(b.dataset.down) + 1));
    $$('[data-dup]', zone).forEach(b => b.onclick = () => { const k = Number(b.dataset.dup); d.splice(k + 1, 0, structuredClone(d[k])); sauver(); render(); });
    $$('[data-del]', zone).forEach(b => b.onclick = () => { if (d.length <= 1) return toast('Il faut garder au moins une diapo'); d.splice(Number(b.dataset.del), 1); sauver(); render(); });
    $$('[data-add]', zone).forEach(b => b.onclick = () => {
      d.push(b.dataset.add === 'question'
        ? { ico: '❓', titre: 'Mini pregunta', corps: '¿…?', reponse: '…' }
        : { ico: '✨', titre: 'Nueva diapositiva', corps: 'Primera idea\nSegunda idea' });
      sauver(); render();
      zone.querySelector('.ed-diapo:last-of-type')?.scrollIntoView({ behavior: 'smooth' });
    });
  };
  $('[data-pres]', zone).onclick = () => { if (sale) { clearTimeout(minuterie); ecrireDiapos(n, t.id, type, d); sale = false; } presenter(n, axe, t, type); };
  $('[data-orig]', zone).onclick = async () => {
    if (!(await confirmModal('Revenir à la version d’origine ?', 'Tes modifications de ce diaporama seront effacées.', 'Revenir à l’origine', { danger: true }))) return;
    clearTimeout(minuterie); sale = false;
    d = diaposDefaut(n, axe, t, type); ecrireDiapos(n, t.id, type, null); render();
    $('#etat', zone).textContent = 'Version d’origine rétablie ✓';
  };
  render();
}

/** Bloc « Diaporamas » de la page chapitre. */
export function blocDiaporamas(n: Niveau, axe: Axe, t: Theme): string {
  return `<div class="diapo-cartes">${(['apercu', 'synthese'] as TypeDiapo[]).map(type => {
    const info = DIAPOS[type], nb = lireDiapos(n, axe, t, type).length;
    return `<div class="diapo-carte">
      <h3>${info.ico} Diaporama « ${info.label} » ${estModifie(n, t.id, type) ? '<span class="pill">✏️ modifié</span>' : ''}</h3>
      <p class="small"><strong>${info.moment}</strong><br>${info.role}</p>
      <p class="muted small">${nb} diapos</p>
      <div class="row wrap">
        <button class="btn sm" data-diapo="${type}" data-a="pres">▶ Présenter</button>
        <button class="btn ghost sm" data-diapo="${type}" data-a="edit">✏️ Modifier</button>
        <button class="btn ghost sm" data-diapo="${type}" data-a="print">🖨 Imprimer / PDF</button>
        <button class="btn ghost sm" data-diapo="${type}" data-a="pptx">⬇️ PowerPoint</button>
        <button class="btn ghost sm" data-diapo="${type}" data-a="gemini">✨ Générer avec Gemini</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}

export function brancherDiaporamas(el: HTMLElement, n: Niveau, axe: Axe, t: Theme, rafraichir: () => void): void {
  $$('[data-diapo]', el).forEach(b => b.onclick = async () => {
    const type = b.dataset.diapo as TypeDiapo, d = lireDiapos(n, axe, t, type), info = DIAPOS[type];
    switch (b.dataset.a) {
      case 'pres': return presenter(n, axe, t, type);
      case 'edit': return editer(n, axe, t, type, rafraichir);
      case 'print': return apercu(`Diaporama ${info.label} · ${n} · ${t.titreFr}`, diaposImpression(d, n));
      case 'pptx':
        try { toast('Préparation du fichier…'); await exporterPptx(n, t, type, d); toast('Fichier PowerPoint téléchargé ✓'); }
        catch { toast('Téléchargement impossible : essaie dans Chrome, Safari ou Edge'); }
        return;
      case 'gemini': return genererGemini(n, axe, t, type, rafraichir);
    }
  });
}

/** Génération avec Gemini, directement dans le site (la clé reste sur le serveur). */
export function genererGemini(n: Niveau, axe: Axe, t: Theme, type: TypeDiapo, apres: () => void): void {
  const info = DIAPOS[type];
  let resultat: Diapo[] | null = null, enCours = false;
  const { zone, fermer } = ouvrirOverlay('diapo-editeur', `Générer le diaporama ${info.label} avec Gemini`, `
    <div class="apercu-barre"><strong class="apercu-titre">✨ ${info.ico} ${info.label} avec Gemini · ${n} · ${esc(t.titreFr)}</strong></div>
    <div class="ed-liste gem" id="gem"></div>`, apres);
  const z = $('#gem', zone);

  const formulaire = (erreur = '', sansCle = false) => {
    z.innerHTML = `
      <section class="panel gem-form">
        <p><strong>${info.moment}.</strong> ${info.role}</p>
        <label class="field">Une demande en plus ? <span class="muted small">(facultatif)</span>
          <textarea id="envie" rows="3" placeholder="Ex. : plus d’images, une diapo sur Frida Kahlo, des phrases plus simples…"></textarea></label>
        <p class="muted small">Gemini part du contenu du chapitre. Le résultat s’affiche ici : tu choisis de l’utiliser ou non, puis tu peux tout modifier.</p>
        ${erreur ? `<p class="gem-erreur" role="alert">${esc(erreur)}</p>` : ''}
        ${sansCle ? `<p class="small">En attendant, tu peux copier la consigne et l’utiliser toi-même : <button class="btn ghost sm" id="copier">📋 Copier la consigne</button></p>` : ''}
        <button class="btn bigbtn" id="generer">✨ Générer</button>
      </section>`;
    $('#generer', z).onclick = () => lancer($<HTMLTextAreaElement>('#envie', z).value.trim());
    $('#copier', z)?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(promptGemini(n, axe, t, type, lireDiapos(n, axe, t, type))); toast('Consigne copiée ✓'); }
      catch { toast('Copie impossible sur cet appareil'); }
    });
  };

  const lancer = async (envie: string) => {
    if (enCours) return;
    enCours = true;
    z.innerHTML = `<section class="panel center gem-attente"><div class="gem-spin" aria-hidden="true">✨</div>
      <p class="big">Gemini prépare ton diaporama…</p><p class="muted">Cela prend en général 10 à 30 secondes.</p></section>`;
    const consigne = promptGemini(n, axe, t, type, diaposDefaut(n, axe, t, type)) + (envie ? `\n\nDemande particulière de l’enseignante : ${envie}` : '');
    try {
      const r = await fetch('/api/diapo', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, consigne }) });
      const b = await r.json().catch(() => ({}));
      enCours = false;
      if (!r.ok) return formulaire(b.erreur ?? 'La génération a échoué.', b.code === 'sans-cle');
      resultat = b.diapos as Diapo[];
      apercuResultat(envie);
    } catch {
      enCours = false;
      formulaire('Pas de connexion Internet : la génération a besoin du réseau.');
    }
  };

  const apercuResultat = (envie: string) => {
    const d = resultat!;
    z.innerHTML = `
      <section class="panel gem-choix">
        <p class="big">✓ ${d.length} diapos proposées par Gemini</p>
        <div class="row wrap center-row">
          <button class="btn" id="utiliser">✓ Utiliser ce diaporama</button>
          <button class="btn ghost" id="regen">↻ Régénérer</button>
          <button class="btn ghost" id="annuler">Garder mon diaporama actuel</button>
        </div>
        <p class="muted small">« Utiliser » remplace le diaporama ${info.label} de ce chapitre ; il s’ouvre ensuite dans l’éditeur pour que tu puisses tout retoucher.</p>
      </section>
      <div class="gem-grille">${d.map((x, i) => `<div class="ed-vue">${diapoHtml(x, n, i, d.length, true)}</div>`).join('')}</div>`;
    $('#utiliser', z).onclick = () => { ecrireDiapos(n, t.id, type, d); toast('Diaporama enregistré ✓'); fermer(); apresHistorique(() => editer(n, axe, t, type, apres)); };
    $('#regen', z).onclick = () => lancer(envie);
    $('#annuler', z).onclick = () => fermer();
  };

  formulaire();
}
