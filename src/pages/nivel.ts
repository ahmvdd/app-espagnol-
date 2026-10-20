import type { View } from '../router';
import { NIVEAUX, COULEUR, CECRL, GRAMMAIRE, axeDe, dernierTheme, rememberTheme, THEMES, type Niveau } from '../lib/content';
import { flashcards } from '../tools/flashcards';
import { apercu, docHtml, fichierPdf, DOCS, type DocType } from '../lib/documents';
import { RESS_AXE, RESS_CHAPITRE, fichierAxe, fichierRessource, ressourceAxeHtml, ressourceHtml, type RessAxe, type RessChapitre } from '../lib/ressources';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { $, $$, esc, toast } from '../lib/ui';

const JEUX: [string, string][] = [['quiz', '❓ Quiz'], ['memory', '🃏 Memory'], ['rosco', '🔤 Rosco'], ['ahorcado', '🪢 Pendu'], ['bomba', '💣 La bomba'], ['taboo', '🚫 Taboo'], ['loteria', '🎴 Lotería']];

/** Page d'un chapitre, dans l'ordre demandé : vocabulaire → phrases → oral → culture → documents → ressources → jeux. */
export const nivel: View = el => {
  const [route, ancre] = location.hash.slice(1).split('#');
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
      <h1><span class="niveau-badge">${n}</span> <span lang="es">${esc(theme.titre)}</span></h1>
      <span class="pill" title="Niveau visé en fin d'année (LVB)">🎯 ${CECRL[n]} · LVB</span>
    </div>
    <section class="theme-head">
      <p class="muted">Axe ${axe.n} · ${esc(axe.titre)}${axe.obligatoire ? ' · ⭐ obligatoire' : ''} — chapitre ${num} sur ${axe.themes.length}</p>
      <p class="small">Objet d’étude : ${esc(theme.objet)}</p>
      <ul class="notions">${theme.notions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="row wrap small">${axe.themes.map((t, i) => `<a class="btn ${t === theme ? '' : 'ghost'} sm" href="#/nivel/${n}/${t.id}" ${t === theme ? 'aria-current="true"' : ''}>${i + 1}. ${esc(t.titre)}</a>`).join('')}</p>
    </section>

    <h2>1 · Vocabulaire</h2>
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
      <h2>4 · <span lang="es">🌎 Lo que aprendí sobre el mundo hispánico</span></h2>
      <ul>${theme.culture.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    </section>

    <section class="panel docs-eleves">
      <h2>5 à 8 · Documents à imprimer</h2>
      <div class="row wrap">${(Object.keys(DOCS) as DocType[]).map(btnDoc).join('')}</div>
      <p class="muted small">Cours, synthèse (une feuille), 3 exercices et leurs corrigés (fichier séparé, pour l’enseignante). Aperçu, puis « Imprimer » ou « Enregistrer en PDF ».</p>
    </section>

    <section class="panel ressources" id="ressources">
      <h2>9 · 🧑‍🏫 Ressources pour l’enseignante</h2>
      <h3>Ce chapitre</h3>
      <div class="row wrap">${(Object.keys(RESS_CHAPITRE) as RessChapitre[]).map(btnRess).join('')}</div>
      <h3>L’axe ${axe.n}</h3>
      <div class="row wrap">${(Object.keys(RESS_AXE) as RessAxe[]).map(btnAxe).join('')}</div>
      <details class="grammaire"><summary><strong>Grammaire du programme en ${n}</strong>&nbsp;· ${CECRL[n]}</summary>
        <ul>${GRAMMAIRE[n].map(g => `<li>${esc(g)}</li>`).join('')}</ul></details>
    </section>

    <section class="panel jouer">
      <h2>10 · 🎲 Jouer avec ce chapitre</h2>
      <div class="row wrap">${JEUX.map(([g, l]) => `<a class="btn sm" href="#/juegos/${g}?n=${n}&t=${theme.id}">${l}</a>`).join('')}</div>
    </section>`;

  $$('[data-say]', el).forEach(b => b.onclick = () => {
    if (!speak(theme.vocab[Number(b.dataset.say)][0], state.reglages.accent ?? 'es-ES')) toast('Voix espagnole absente sur cet appareil');
  });
  $$('[data-doc]', el).forEach(b => b.onclick = () => {
    const d = b.dataset.doc as DocType;
    apercu(`${DOCS[d].label} · ${n} · ${theme.titre}`, docHtml(d, n, axe, theme), fichierPdf(n, axe, theme, d));
  });
  $$('[data-ress]', el).forEach(b => b.onclick = () => {
    const r = b.dataset.ress as RessChapitre;
    apercu(`${RESS_CHAPITRE[r].label} · ${n} · ${theme.titre}`, ressourceHtml(r, n, axe, theme), fichierRessource(n, axe, theme, r));
  });
  $$('[data-axe]', el).forEach(b => b.onclick = () => {
    const r = b.dataset.axe as RessAxe;
    apercu(`${RESS_AXE[r].label} · ${n} · axe ${axe.n}`, ressourceAxeHtml(r, n, axe), fichierAxe(n, axe, r));
  });
  const stop = flashcards($('#flash', el), theme.vocab);
  if (ancre) requestAnimationFrame(() => document.getElementById(ancre)?.scrollIntoView());
  return () => { stop(); el.style.removeProperty('--niveau'); };
};
