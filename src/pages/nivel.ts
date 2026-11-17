import type { View } from '../router';
import { NIVEAUX, COULEUR, CECRL, GRAMMAIRE, axeDe, dernierTheme, rememberTheme, THEMES, type Niveau } from '../lib/content';
import { flashcards } from '../tools/flashcards';
import { apercu, docHtml, fichierPdf, DOCS, type DocType } from '../lib/documents';
import { RESS_AXE, RESS_CHAPITRE, fichierAxe, fichierRessource, ressourceAxeHtml, ressourceHtml, type RessAxe, type RessChapitre } from '../lib/ressources';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { $, $$, esc, toast } from '../lib/ui';
import { btnAide } from '../lib/aide';
import { blocDiaporamas, brancherDiaporamas, presenter } from './diaporama';
import type { TypeDiapo } from '../lib/diapos';

const JEUX: [string, string][] = [['quiz', '❓ Quiz'], ['memory', '🃏 Memory'], ['rosco', '🔤 Rosco'], ['ahorcado', '🪢 Pendu'], ['bomba', '💣 La bomba'], ['taboo', '🚫 Taboo'], ['loteria', '🎴 Lotería']];

/** Page d'un chapitre, dans l'ordre demandé : vocabulaire → phrases → oral → culture → documents → ressources → jeux. */
export const nivel: View = el => {
  const [routeQ, ancre] = location.hash.slice(1).split('#');
  const [route, query = ''] = routeQ.split('?');
  const q = new URLSearchParams(query);
  const [, , hashN, hashT] = route.split('/');
  const n: Niveau = NIVEAUX.includes(hashN as Niveau) ? (hashN as Niveau) : '5e';
  const theme = THEMES[n].find(t => t.id === hashT) ?? dernierTheme(n);
  const axe = axeDe(n, theme.id)!;
  const num = axe.themes.indexOf(theme) + 1;
  rememberTheme(n, theme.id);
  el.style.setProperty('--niveau', COULEUR[n]);

  const btnDoc = (d: DocType) => `<button class="btn ${DOCS[d].eleve ? '' : 'ghost'} sm" data-doc="${d}">${DOCS[d].icon} ${DOCS[d].label}</button>`;
  const btnRess = (r: RessChapitre) => `<button class="btn ghost sm" data-ress="${r}">${RESS_CHAPITRE[r].icon} ${RESS_CHAPITRE[r].label}</button>`;
  const btnAxe = (r: RessAxe) => `<button class="btn ghost sm" data-axe="${r}">${RESS_AXE[r].icon} ${RESS_AXE[r].label}</button>`;

  el.innerHTML = `
    <nav class="fil small" aria-label="Fil d’Ariane"><a href="#/programme">Programme</a> › <a href="#/programme/${n}">${n}</a> › Axe ${axe.n} › Chapitre ${num}</nav>
    <div class="row head niveau-head">
      <h1><span class="niveau-badge">${n}</span> ${esc(theme.titreFr)}</h1>
      <p class="muted">Titre en espagnol : <span lang="es">${esc(theme.titre)}</span></p>
      <span class="pill" title="Niveau visé en fin d'année (LVB)">🎯 ${CECRL[n]} · LVB</span>
    </div>
    <section class="theme-head">
      <p class="muted">Axe ${axe.n} · ${esc(axe.titre)}${axe.obligatoire ? ' · ⭐ obligatoire' : ''} — chapitre ${num} sur ${axe.themes.length}</p>
      <p class="small">Objet d’étude : ${esc(theme.objet)}</p>
      <ul class="notions">${theme.notions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="row wrap small">${axe.themes.map((t, i) => `<a class="btn ${t === theme ? '' : 'ghost'} sm" href="#/nivel/${n}/${t.id}" ${t === theme ? 'aria-current="true"' : ''}>${i + 1}. ${esc(t.titreFr)}</a>`).join('')}</p>
    </section>

    <h2>1 · Vocabulaire ${btnAide('ch-vocab')}</h2>
    <section class="panel stage" id="flash"></section>
    <div class="table-wrap"><table class="vocab">
      <thead><tr><th scope="col">Espagnol</th><th scope="col">Français</th><th scope="col"><span class="sr-only">Écouter</span></th></tr></thead>
      <tbody>${theme.vocab.map(([e, f], k) => `<tr><td lang="es"><strong>${esc(e)}</strong></td><td>${esc(f)}</td>
        <td><button class="btn ghost sm" data-say="${k}" aria-label="Écouter ${esc(e)}">🔊</button></td></tr>`).join('')}</tbody>
    </table></div>

    <div class="idees">
      <section class="panel"><h2>2 · Phrases modèles</h2><ul class="phrases">${theme.phrases.map(p => `<li lang="es">${esc(p)}</li>`).join('')}</ul></section>
      <section class="panel"><h2>3 · Sujets d’oral</h2><ul class="phrases">${theme.parole.map(p => `<li lang="es">${esc(p)}</li>`).join('')}</ul></section>
    </div>

    <section class="panel culture">
      <h2>4 · 🌎 Ce que j’apprends sur le monde hispanique</h2>
      <ul>${theme.culture.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    </section>

    <section class="panel docs-eleves">
      <h2>5 à 8 · Documents à imprimer ${btnAide('ch-docs')}</h2>
      <div class="row wrap">${(Object.keys(DOCS) as DocType[]).map(btnDoc).join('')}</div>
      <div class="row wrap">${(['carte-mentale', 'carte-mentale-vierge'] as RessChapitre[]).map(btnRess).join('')}</div>
      <p class="muted small">Cours, synthèse (une feuille), 3 exercices et leurs corrigés (fichier séparé, pour l’enseignante), et la carte mentale de la séquence (complète ou à compléter, format paysage). Aperçu, puis « Imprimer » ou « PDF ».</p>
    </section>

    <section class="panel diaporamas" id="diaporamas">
      <h2>🎞 Diaporamas ${btnAide('ch-diapos')}</h2>
      <div id="bloc-diapos">${blocDiaporamas(n, axe, theme)}</div>
    </section>

    <section class="panel seq-cta">
      <h2>🗂 Préparer la séquence ${btnAide('sequence')}</h2>
      <p class="small">Le plan de ce chapitre séance par séance, en quelques clics : activités, liens vers les outils et documents, devoirs. Modifiable et imprimable.</p>
      <a class="btn" href="#/profe/sequences?n=${n}&t=${theme.id}">✨ Créer la séquence de ce chapitre</a>
    </section>

    <section class="panel ressources" id="ressources">
      <h2>9 · 🧑‍🏫 Ressources pour l’enseignante ${btnAide('ch-ress')}</h2>
      <h3>Ce chapitre</h3>
      <div class="row wrap">${(Object.keys(RESS_CHAPITRE) as RessChapitre[]).filter(r => !r.startsWith('carte-mentale')).map(btnRess).join('')}</div>
      <h3>L’axe ${axe.n}</h3>
      <div class="row wrap">${(Object.keys(RESS_AXE) as RessAxe[]).map(btnAxe).join('')}</div>
      <details class="grammaire"><summary><strong>Grammaire du programme en ${n}</strong>&nbsp;· ${CECRL[n]}</summary>
        <ul>${GRAMMAIRE[n].map(g => `<li>${esc(g)}</li>`).join('')}</ul></details>
    </section>

    <section class="panel jouer">
      <h2>10 · 🎲 Jouer avec ce chapitre ${btnAide('ch-jeux')}</h2>
      <div class="row wrap">${JEUX.map(([g, l]) => `<a class="btn sm" href="#/juegos/${g}?n=${n}&t=${theme.id}">${l}</a>`).join('')}</div>
    </section>`;

  $$('[data-say]', el).forEach(b => b.onclick = () => {
    if (!speak(theme.vocab[Number(b.dataset.say)][0], state.reglages.accent ?? 'es-ES')) toast('Voix espagnole absente sur cet appareil');
  });
  $$('[data-doc]', el).forEach(b => b.onclick = () => {
    const d = b.dataset.doc as DocType;
    apercu(`${DOCS[d].label} · ${n} · ${theme.titreFr}`, docHtml(d, n, axe, theme), fichierPdf(n, axe, theme, d));
  });
  $$('[data-ress]', el).forEach(b => b.onclick = () => {
    const r = b.dataset.ress as RessChapitre;
    apercu(`${RESS_CHAPITRE[r].label} · ${n} · ${theme.titreFr}`, ressourceHtml(r, n, axe, theme), fichierRessource(n, axe, theme, r));
  });
  $$('[data-axe]', el).forEach(b => b.onclick = () => {
    const r = b.dataset.axe as RessAxe;
    apercu(`${RESS_AXE[r].label} · ${n} · axe ${axe.n}`, ressourceAxeHtml(r, n, axe), fichierAxe(n, axe, r));
  });
  const rafraichirDiapos = () => {
    const z = $('#bloc-diapos', el);
    if (!z) return;
    z.innerHTML = blocDiaporamas(n, axe, theme);
    brancherDiaporamas(z, n, axe, theme, rafraichirDiapos);
  };
  rafraichirDiapos();
  // Liens directs (depuis une séquence) : ?doc=cours, ?ress=evaluation, ?diapo=apercu
  const dq = q.get('doc') as DocType | null, rq = q.get('ress') as RessChapitre | null, pq = q.get('diapo') as TypeDiapo | null;
  if (dq && dq in DOCS) $<HTMLButtonElement>(`[data-doc="${dq}"]`, el)?.click();
  else if (rq && rq in RESS_CHAPITRE) $<HTMLButtonElement>(`[data-ress="${rq}"]`, el)?.click();
  else if (rq && rq in RESS_AXE) $<HTMLButtonElement>(`[data-axe="${rq}"]`, el)?.click();
  else if (pq === 'apercu' || pq === 'synthese') presenter(n, axe, theme, pq);
  const stop = flashcards($('#flash', el), theme.vocab);
  if (ancre) requestAnimationFrame(() => document.getElementById(ancre)?.scrollIntoView());
  return () => { stop(); el.style.removeProperty('--niveau'); };
};
