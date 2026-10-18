import type { View } from '../router';
import { NIVEAUX, AXES, COULEUR, CECRL, GRAMMAIRE, axeDe, dernierTheme, rememberTheme, THEMES, type Niveau } from '../lib/content';
import { flashcards } from '../tools/flashcards';
import { apercu, cours, fiche, corrige } from '../lib/documents';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { $, $$, esc, toast } from '../lib/ui';

export const nivel: View = el => {
  const [, , hashN, hashT] = location.hash.split('/');
  const n: Niveau = NIVEAUX.includes(hashN as Niveau) ? (hashN as Niveau) : '5e';
  const theme = THEMES[n].find(t => t.id === hashT) ?? dernierTheme(n);
  const axe = axeDe(n, theme.id)!;
  rememberTheme(n, theme.id);
  el.style.setProperty('--niveau', COULEUR[n]);

  el.innerHTML = `
    <div class="row head niveau-head">
      <h1><span class="niveau-badge">${n}</span> Espagnol <span class="pill" title="Niveau visé en fin d'année (LVB)">🎯 ${CECRL[n]} · LVB</span></h1>
      <nav class="row wrap" aria-label="Niveaux">
        ${NIVEAUX.map(x => `<a class="btn ghost sm" href="#/nivel/${x}" aria-current="${x === n ? 'page' : 'false'}">${x}</a>`).join('')}
      </nav>
    </div>

    <details class="axes-details" ${hashT ? '' : 'open'}>
      <summary>📋 Programme de l’année : 6 axes, ${THEMES[n].length} chapitres · 5 axes à traiter, dont l’axe 6</summary>
      <ol class="axes">
        ${AXES[n].map(a => `
          <li class="panel axe ${a === axe ? 'actif' : ''} ${a.obligatoire ? 'oblig' : ''}">
            <p class="axe-titre"><span class="axe-n">Axe ${a.n}</span> ${esc(a.titre)} ${a.obligatoire ? '<span class="pill oblig-pill">⭐ obligatoire</span>' : ''}</p>
            <ul class="objets">${a.objets.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
            ${a.themes.length
              ? `<div class="row wrap">${a.themes.map(t => `<a class="btn ${t === theme ? '' : 'ghost'} sm" href="#/nivel/${n}/${t.id}" ${t === theme ? 'aria-current="true"' : ''}>${esc(t.titre)}</a>`).join('')}</div>`
              : '<p class="muted small">Contenu à venir.</p>'}
          </li>`).join('')}
      </ol>
    </details>

    <section class="theme-head">
      <p class="muted">Axe ${axe.n} · ${esc(axe.titre)}</p>
      <h2>${esc(theme.titre)}</h2>
      <p class="small">Objet d’étude : ${esc(theme.objet)}</p>
      <ul class="notions">${theme.notions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    </section>

    <div class="idees chapitre-outils">
      <section class="panel">
        <h3>🖨 Documents à imprimer</h3>
        <div class="row wrap">
          <button class="btn sm" data-doc="cours">📖 Cours</button>
          <button class="btn sm" data-doc="fiche">✏️ Fiche d’exercices</button>
          <button class="btn ghost sm" data-doc="corrige">✅ Corrigé</button>
        </div>
        <p class="muted small">Aperçu, puis « Imprimer » ou « Enregistrer en PDF ».</p>
      </section>
      <section class="panel">
        <h3>🎲 Jouer avec ce chapitre</h3>
        <div class="row wrap">
          ${[['quiz', '❓ Quiz'], ['memory', '🃏 Memory'], ['rosco', '🔤 Rosco'], ['ahorcado', '🪢 Pendu'], ['bomba', '💣 La bomba'], ['taboo', '🚫 Taboo'], ['loteria', '🎴 Lotería']]
            .map(([g, l]) => `<a class="btn ghost sm" href="#/juegos/${g}?n=${n}&t=${theme.id}">${l}</a>`).join('')}
        </div>
      </section>
    </div>

    <section class="panel stage" id="flash"></section>

    <section class="panel culture">
      <h2 lang="es">🌎 Lo que aprendí sobre el mundo hispánico</h2>
      <ul>${theme.culture.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    </section>

    <h2>Tout le vocabulaire</h2>
    <div class="table-wrap"><table class="vocab">
      <thead><tr><th scope="col">Espagnol</th><th scope="col">Français</th><th scope="col"><span class="sr-only">Écouter</span></th></tr></thead>
      <tbody>${theme.vocab.map(([e, f], k) => `<tr><td lang="es"><strong>${esc(e)}</strong></td><td>${esc(f)}</td>
        <td><button class="btn ghost sm" data-say="${k}" aria-label="Écouter ${esc(e)}">🔊</button></td></tr>`).join('')}</tbody>
    </table></div>

    <div class="idees">
      ${theme.phrases.length ? `<section class="panel"><h2>Phrases modèles</h2><ul class="phrases">${theme.phrases.map(p => `<li lang="es">${esc(p)}</li>`).join('')}</ul></section>` : ''}
      ${theme.parole.length ? `<section class="panel"><h2>Sujets d’oral</h2><ul class="phrases">${theme.parole.map(p => `<li lang="es">${esc(p)}</li>`).join('')}</ul></section>` : ''}
    </div>

    <details class="panel grammaire">
      <summary><strong>Grammaire du programme en ${n}</strong>&nbsp;· ${CECRL[n]}</summary>
      <ul>${GRAMMAIRE[n].map(g => `<li>${esc(g)}</li>`).join('')}</ul>
    </details>

    `;

  $$('[data-say]', el).forEach(b => b.onclick = () => {
    if (!speak(theme.vocab[Number(b.dataset.say)][0], state.reglages.accent ?? 'es-ES')) toast('Voix espagnole absente sur cet appareil');
  });
  const docs = { cours: ['Cours', cours], fiche: ['Fiche d’exercices', fiche], corrige: ['Corrigé', corrige] } as const;
  $$('[data-doc]', el).forEach(b => b.onclick = () => {
    const [nom, f] = docs[b.dataset.doc as keyof typeof docs];
    apercu(`${nom} · ${n} · ${theme.titre}`, f(n, axe, theme));
  });
  const stop = flashcards($('#flash', el), theme.vocab);
  return () => { stop(); el.style.removeProperty('--niveau'); };
};
