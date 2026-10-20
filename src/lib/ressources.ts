import type { Axe, Niveau, Theme } from '../content/types';
import { COULEUR, CECRL } from './content';
import { SITE_NOM } from './documents';
import { esc } from './ui';

/** Ressources pour l'enseignante : documents imprimables par chapitre et par axe (générés en PDF au build). */
export type RessChapitre = 'fiche-prof' | 'seance' | 'projeter' | 'cartes' | 'simplifiee' | 'difficile' | 'evaluation' | 'evaluation-corrige';
export type RessAxe = 'axe-vue' | 'axe-oral' | 'axe-taches';

export const RESS_CHAPITRE: Record<RessChapitre, { label: string; icon: string; paysage?: boolean }> = {
  'fiche-prof': { label: 'Fiche enseignante', icon: '🧑‍🏫' },
  seance: { label: 'Déroulé de séance', icon: '⏱' },
  projeter: { label: 'Supports à projeter', icon: '📽', paysage: true },
  cartes: { label: 'Cartes à imprimer', icon: '🃏' },
  simplifiee: { label: 'Fiche simplifiée', icon: '🟢' },
  difficile: { label: 'Fiche approfondie', icon: '🔴' },
  evaluation: { label: 'Évaluation', icon: '📋' },
  'evaluation-corrige': { label: 'Corrigé de l’évaluation', icon: '✅' }
};
export const RESS_AXE: Record<RessAxe, { label: string; icon: string }> = {
  'axe-vue': { label: 'Vue d’ensemble de l’axe', icon: '🗺' },
  'axe-oral': { label: 'Grille d’évaluation de l’oral', icon: '🗣' },
  'axe-taches': { label: 'Pistes de tâches finales', icon: '🏁' }
};

export const fichierRessource = (n: Niveau, axe: Axe, t: Theme, r: RessChapitre) =>
  `${n}_axe${axe.n}_chapitre${axe.themes.indexOf(t) + 1}_${r}.pdf`;
export const fichierAxe = (n: Niveau, axe: Axe, r: RessAxe) => `${n}_axe${axe.n}_${r.replace('axe-', '')}.pdf`;

/** Hasard reproductible, pour que l'évaluation et son corrigé correspondent. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
}
const melange = <T>(a: T[], r: () => number) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const L = 'ABCDEFGH';

const tete = (n: Niveau, titre: string, sousTitre: string, type: string, nom = false) => `
  <header class="doc-tete" style="--c:${COULEUR[n]}">
    <div class="doc-ligne-haut"><span class="doc-site">${SITE_NOM}</span><span class="doc-niv">${n} · ${CECRL[n]}</span> <span class="doc-type">${type}</span></div>
    <h1 lang="es">${esc(titre)}</h1><p>${esc(sousTitre)}</p>
    ${nom ? '<p class="doc-nom">Nombre : ______________________ &nbsp; Clase : ________ &nbsp; Fecha : ____________</p>' : ''}
  </header>`;
const bloc = (titre: string, corps: string, cls = '') => `<section class="doc-bloc ${cls}"><h2>${titre}</h2>${corps}</section>`;
const liste = (l: string[], lang = '') => `<ul ${lang ? `lang="${lang}"` : ''}>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;

const ERREURS_PAR_DEFAUT = [
  'Oublier l’accord en genre et en nombre (los ojos azul → los ojos azules).',
  'Calquer l’ordre ou les mots du français (faux-amis).',
  'Oublier les signes ¿ ? et ¡ ! en début de phrase.'
];

function ficheProf(n: Niveau, axe: Axe, t: Theme): string {
  return `<article class="doc" style="--c:${COULEUR[n]}">${tete(n, t.titre, `Axe ${axe.n} · ${axe.titre} — ${t.objet}`, 'Fiche enseignante')}
    ${bloc('🎯 Objectifs du chapitre', `<p>À la fin du chapitre, l’élève sait réutiliser le vocabulaire et les structures ci-dessous pour comprendre, parler et écrire sur « ${esc(t.titre)} » (niveau visé : ${CECRL[n]}).</p>`)}
    ${bloc('📌 Notions à faire acquérir', liste(t.notions))}
    ${bloc('📚 Lexique (' + t.vocab.length + ' mots)', `<p lang="es">${t.vocab.map(v => esc(v[0])).join(' · ')}</p>`)}
    ${bloc('💬 Structures modèles', liste(t.phrases, 'es'))}
    ${bloc('⚠️ Erreurs fréquentes des élèves', liste(t.erreurs?.length ? t.erreurs : ERREURS_PAR_DEFAUT))}
    ${bloc('🌎 Repères culturels', liste(t.culture), 'doc-culture')}
    ${bloc('🗣 Sujets d’oral', liste(t.parole, 'es'))}
    ${bloc('🎲 Dans Clase Viva', '<p>Flashcards et audio sur la page du chapitre ; jeux conseillés : Quiz, Memory, Rosco, Pendu, Taboo ; documents élèves : cours, synthèse, 3 exercices, corrigés.</p>')}
  </article>`;
}

function seance(n: Niveau, axe: Axe, t: Theme): string {
  const etapes: [string, string, string][] = [
    ['5 min', 'Accueil', 'Rituel du jour (fecha y tiempo ou palabra del día). Annonce de l’objectif : « Hoy vamos a… ».'],
    ['15 min', 'Découverte', `Présentation du thème « ${t.titre} » : flashcards projetées avec l’audio, répétition chorale, puis lecture des phrases modèles.`],
    ['15 min', 'Entraînement', 'Exercices 1 et 2 de la fiche (compléter, relier), correction collective ; jeu de 5 min (Quiz ou Memory) avec les équipes.'],
    ['15 min', 'Production', `Par deux, préparer puis présenter un sujet d’oral : « ${t.parole[0] ?? ''} »`],
    ['5 min', 'Bilan', '« Lo que aprendí » : chaque élève écrit une chose apprise sur le monde hispanique. Mini-bilan de séance dans Profe.']
  ];
  return `<article class="doc" style="--c:${COULEUR[n]}">${tete(n, t.titre, `Séance type de 55 minutes · Axe ${axe.n} · ${axe.titre}`, 'Déroulé de séance')}
    <table class="doc-seance"><thead><tr><th>Durée</th><th>Étape</th><th>Déroulement</th></tr></thead>
      <tbody>${etapes.map(([d, e, x]) => `<tr><td><strong>${d}</strong></td><td><strong>${e}</strong></td><td>${esc(x)}</td></tr>`).join('')}</tbody></table>
    ${bloc('🧰 Matériel', '<ul><li>Vidéoprojecteur (page du chapitre dans Clase Viva)</li><li>Fiche d’exercices photocopiée</li><li>Ardoises pour le jeu</li></ul>')}
    ${bloc('🔁 Pour une deuxième séance', '<p>Exercice 3 (production écrite), synthèse à coller dans le cahier, puis évaluation du chapitre lors d’une séance suivante.</p>')}
  </article>`;
}

function projeter(n: Niveau, axe: Axe, t: Theme): string {
  const diapo = (contenu: string) => `<section class="diapo">${contenu}<span class="diapo-pied">${SITE_NOM} · ${n} · ${esc(t.titre)}</span></section>`;
  return `<article class="doc doc-paysage" style="--c:${COULEUR[n]}">
    ${diapo(`<p class="diapo-sur">Axe ${axe.n} · ${esc(axe.titre)}</p><h1 lang="es">${esc(t.titre)}</h1>`)}
    ${t.vocab.map(([es, fr]) => diapo(`<p class="diapo-mot" lang="es">${esc(es)}</p><p class="diapo-trad">${esc(fr)}</p>`)).join('')}
    ${diapo(`<h2 lang="es">Frases modelo</h2>${liste(t.phrases, 'es')}`)}
    ${t.parole.map(p => diapo(`<p class="diapo-sur" lang="es">¡A hablar!</p><p class="diapo-question" lang="es">${esc(p)}</p>`)).join('')}
  </article>`;
}

/** Recto : mots espagnols ; verso : traductions placées en miroir pour l'impression recto-verso. */
function cartes(n: Niveau, _axe: Axe, t: Theme): string {
  const pages: [string, string][][] = [];
  for (let i = 0; i < t.vocab.length; i += 8) pages.push(t.vocab.slice(i, i + 8));
  return `<article class="doc" style="--c:${COULEUR[n]}">${pages.map(p => {
    const verso = p.map((_, i) => p[i % 2 === 0 ? i + 1 : i - 1] ?? null);
    return `<section class="planche"><p class="planche-titre">${SITE_NOM} · ${esc(t.titre)} · recto (espagnol)</p>
      <div class="cartes">${p.map(([es]) => `<div class="carte-imp" lang="es">${esc(es)}</div>`).join('')}</div></section>
      <section class="planche"><p class="planche-titre">verso (français) — imprimer en recto-verso, bord long</p>
      <div class="cartes">${verso.map(v => `<div class="carte-imp verso">${v ? esc(v[1]) : ''}</div>`).join('')}</div></section>`;
  }).join('')}</article>`;
}

function simplifiee(n: Niveau, axe: Axe, t: Theme): string {
  const r = rng(t.id + 's'), v = melange(t.vocab, r).slice(0, 5), lettres = melange(v.map((_, i) => i), r);
  const qcm = melange(t.quiz.filter(q => q.diff === 'bronce'), r).slice(0, 3);
  return `<article class="doc" style="--c:${COULEUR[n]}">${tete(n, t.titre, `Axe ${axe.n} — fiche simplifiée`, 'Ejercicios · nivel 🟢', true)}
    ${bloc('1. Relie le mot à sa traduction', `<div class="doc-relier"><ol>${v.map(([es]) => `<li lang="es">${esc(es)} •</li>`).join('')}</ol>
      <ul class="doc-lettres">${lettres.map((k, i) => `<li>• ${L[i]}. ${esc(v[k][1])}</li>`).join('')}</ul></div>`)}
    ${bloc('2. Complète avec la première lettre donnée', `<ol>${v.map(([es, fr]) => `<li>${esc(fr)} → <span lang="es">${esc(es[0])}${'_ '.repeat(Math.max(2, es.length - 1))}</span></li>`).join('')}</ol>`)}
    ${qcm.length ? bloc('3. Entoure la bonne réponse', `<ol>${qcm.map(q => `<li><p>${esc(q.q)}</p><p class="doc-qcm">${q.o.map((o, i) => `<span>${L[i]}. ${esc(o)}</span>`).join('')}</p></li>`).join('')}</ol>`) : ''}
    ${bloc('4. Recopie la phrase et dessine-la', `<p lang="es"><strong>${esc(t.phrases[0] ?? '')}</strong></p><div class="doc-lignes"><span></span><span></span></div><div class="doc-dessin"></div>`)}
  </article>`;
}

function difficile(n: Niveau, axe: Axe, t: Theme): string {
  const r = rng(t.id + 'd'), v = melange(t.vocab, r).slice(0, 8);
  return `<article class="doc" style="--c:${COULEUR[n]}">${tete(n, t.titre, `Axe ${axe.n} — fiche approfondie`, 'Ejercicios · nivel 🔴', true)}
    ${bloc('1. Traduis sans aide', `<ol class="doc-2col">${v.map(([, fr]) => `<li>${esc(fr)} → <span class="doc-ligne"></span></li>`).join('')}</ol>`)}
    ${bloc('2. Réécris ces phrases en changeant le sujet (yo → nosotros) ou le temps (présent → passé)', `<ol lang="es">${t.phrases.map(p => `<li>${esc(p)}<div class="doc-lignes"><span></span></div></li>`).join('')}</ol>`)}
    ${bloc('3. Rédige un texte de 8 à 10 lignes', `<p lang="es"><strong>${esc(t.parole[t.parole.length - 1] ?? '')}</strong></p><p class="small">Utilise au moins 6 mots du chapitre et 2 connecteurs (además, sin embargo, por eso, porque…).</p>
      <div class="doc-lignes">${'<span></span>'.repeat(9)}</div>`)}
  </article>`;
}

function evalData(t: Theme) {
  const r = rng(t.id + 'e');
  const v = melange(t.vocab, r).slice(0, 6);
  const qcm = melange(t.quiz, r).slice(0, 4).map(q => { const o = melange(q.o.map((_, i) => i), r); return { q: q.q, o: o.map(i => q.o[i]), a: o.indexOf(q.a) }; });
  return { v, qcm, sujet: t.parole[0] ?? '' };
}

function evaluation(n: Niveau, axe: Axe, t: Theme, corrige: boolean): string {
  const e = evalData(t);
  const rep = (x: string) => (corrige ? `<span class="doc-rep">${esc(x)}</span>` : '<span class="doc-ligne"></span>');
  return `<article class="doc" style="--c:${COULEUR[n]}">${tete(n, t.titre, `Axe ${axe.n} · évaluation de fin de chapitre — ${corrige ? 'corrigé et barème' : '/ 20 points'}`, corrige ? 'Corrigé · enseignante' : 'Evaluación', !corrige)}
    ${bloc('1. Vocabulaire — traduis en espagnol (6 points : 1 point par mot)', `<ol class="doc-2col">${e.v.map(([es, fr]) => `<li>${esc(fr)} → ${rep(es)}</li>`).join('')}</ol>`)}
    ${bloc('2. Entoure la bonne réponse (4 points : 1 point par question)', `<ol>${e.qcm.map(q => `<li><p>${esc(q.q)}</p><p class="doc-qcm">${q.o.map((o, i) => `<span class="${corrige && i === q.a ? 'doc-bon' : ''}">${L[i]}. ${esc(o)}</span>`).join('')}</p></li>`).join('')}</ol>`)}
    ${bloc('3. Expression écrite (10 points)', `<p lang="es"><strong>${esc(e.sujet)}</strong> — 5 phrases minimum.</p>
      ${corrige ? `<table class="doc-bareme"><tr><td>Respect de la consigne (5 phrases, sujet traité)</td><td>3 pts</td></tr><tr><td>Vocabulaire du chapitre réutilisé</td><td>3 pts</td></tr><tr><td>Correction de la langue (accords, conjugaison)</td><td>3 pts</td></tr><tr><td>Connecteurs et cohérence</td><td>1 pt</td></tr></table>`
        : `<div class="doc-lignes">${'<span></span>'.repeat(6)}</div>`}`)}
    ${corrige ? '' : '<p class="doc-total">Total : ______ / 20</p>'}
  </article>`;
}

export function ressourceHtml(r: RessChapitre, n: Niveau, axe: Axe, t: Theme): string {
  switch (r) {
    case 'fiche-prof': return ficheProf(n, axe, t);
    case 'seance': return seance(n, axe, t);
    case 'projeter': return projeter(n, axe, t);
    case 'cartes': return cartes(n, axe, t);
    case 'simplifiee': return simplifiee(n, axe, t);
    case 'difficile': return difficile(n, axe, t);
    case 'evaluation': return evaluation(n, axe, t, false);
    case 'evaluation-corrige': return evaluation(n, axe, t, true);
  }
}

const CRITERES_ORAL: [string, string[]][] = [
  ['Prononciation et intonation', ['Difficile à comprendre', 'Compréhensible avec effort', 'Claire', 'Claire et expressive']],
  ['Vocabulaire de l’axe', ['Très limité', 'Quelques mots du chapitre', 'Vocabulaire adapté', 'Riche et précis']],
  ['Correction de la langue', ['Nombreuses erreurs gênantes', 'Erreurs fréquentes', 'Quelques erreurs', 'Très peu d’erreurs']],
  ['Aisance et fluidité', ['Lit ou s’arrête souvent', 'Hésitations nombreuses', 'Assez fluide', 'Fluide, peu de pauses']],
  ['Contenu et organisation', ['Hors sujet ou très court', 'Idées juxtaposées', 'Idées organisées', 'Organisé, avec connecteurs']]
];

export function ressourceAxeHtml(r: RessAxe, n: Niveau, axe: Axe): string {
  const t0 = `Axe ${axe.n} · ${axe.titre}`;
  if (r === 'axe-vue') return `<article class="doc" style="--c:${COULEUR[n]}">${tete(n, t0, `Programme ${n} · ${axe.obligatoire ? 'axe obligatoire' : '5 axes sur 6 à traiter dans l’année'}`, 'Vue d’ensemble')}
    ${bloc('🎯 Objectif de l’axe', `<p>${esc(axe.intro ?? '')}</p>`)}
    ${bloc('📚 Suite des chapitres', `<ol>${axe.themes.map(t => `<li><strong lang="es">${esc(t.titre)}</strong> — ${esc(t.objet)}<br><span class="small">${esc(t.notions.join(' · '))}</span></li>`).join('')}</ol>`)}
    ${bloc('📅 Progression conseillée', `<ul><li>Environ 2 à 3 séances par chapitre, soit ${axe.themes.length * 2} à ${axe.themes.length * 3} séances pour l’axe.</li><li>Ordre conseillé : celui des chapitres ci-dessus, du plus concret au plus culturel.</li><li>Évaluation de fin de chapitre, puis tâche finale de l’axe (voir « Pistes de tâches finales »).</li></ul>`)}
  </article>`;
  if (r === 'axe-oral') return `<article class="doc" style="--c:${COULEUR[n]}">${tete(n, t0, 'Grille d’évaluation de l’oral — une ligne par critère, entourer le niveau atteint', 'Grille d’oral', true)}
    <table class="doc-grille"><thead><tr><th>Critère</th><th>1</th><th>2</th><th>3</th><th>4</th></tr></thead>
      <tbody>${CRITERES_ORAL.map(([c, niv]) => `<tr><td><strong>${esc(c)}</strong></td>${niv.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <p class="doc-total">Total : ______ / 20</p>
    ${bloc('🗣 Sujets d’oral de l’axe', `<ul lang="es">${axe.themes.flatMap(t => t.parole).map(p => `<li>${esc(p)}</li>`).join('')}</ul>`)}
  </article>`;
  return `<article class="doc" style="--c:${COULEUR[n]}">${tete(n, t0, 'Idées de projet ou de tâche finale pour clôturer l’axe', 'Tâches finales')}
    ${bloc('🏁 Pistes', `<ol>${(axe.taches ?? []).map(x => `<li>${esc(x)}</li>`).join('')}</ol>`)}
    ${bloc('✅ Critères communs', '<ul><li>Réutiliser le vocabulaire et les structures des chapitres de l’axe.</li><li>Intégrer au moins un repère culturel du monde hispanique.</li><li>Évaluer l’oral avec la grille de l’axe.</li></ul>')}
  </article>`;
}
