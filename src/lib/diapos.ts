/**
 * Diaporamas de chapitre, modifiables par l'enseignante :
 * - « Aperçu » (début de chapitre) : 5 à 8 diapos, très visuel, où va-t-on ?
 * - « Synthèse » (fin de chapitre) : 10 à 15 diapos, révision + mini-questions.
 * Les diapos d'origine sont générées depuis le contenu ; les versions modifiées sont gardées dans l'espace.
 */
import type { Axe, Niveau, Theme } from '../content/types';
import type { Diapo } from './storage';
import { state, update } from './state';
import { CECRL, COULEUR } from './content';
import { esc } from './ui';

export type TypeDiapo = 'apercu' | 'synthese';
export const DIAPOS: Record<TypeDiapo, { label: string; ico: string; moment: string; role: string }> = {
  apercu: { label: 'Aperçu', ico: '🚀', moment: 'Début de chapitre · première séance, 10 min', role: 'Montrer où l’on va : objectifs, mots clés, grammaire, tâche finale. 5 à 8 diapos, peu de texte.' },
  synthese: { label: 'Synthèse', ico: '🧠', moment: 'Fin de chapitre · avant l’évaluation ou pour réviser', role: 'Réviser et fixer : vocabulaire, règles, exemples, erreurs fréquentes, avec des mini-questions. 10 à 15 diapos.' }
};

export const cleDiapo = (n: Niveau, chapId: string, type: TypeDiapo) => `${n}:${chapId}:${type}`;

const ERREURS = ['Oublier l’accord en genre et en nombre.', 'Calquer le français (faux-amis).', 'Oublier ¿ ? et ¡ ! en début de phrase.'];
const mots = (l: [string, string][]) => l.map(([es, fr]) => `${es} — ${fr}`).join('\n');
/** La notion qui parle de grammaire (verbes, accords…), sinon la dernière. */
const notionGrammaire = (t: Theme) => t.notions.find(x => /verbe|présent|passé|imparfait|futur|accord|conjug|gérondif|impératif|pronom|ser|estar|hay|gustar|comparat|préposition|article/i.test(x)) ?? t.notions[t.notions.length - 1];

export function diaposDefaut(n: Niveau, axe: Axe, t: Theme, type: TypeDiapo): Diapo[] {
  const v = t.vocab, k = axe.themes.indexOf(t);
  const tache = axe.taches?.[k % (axe.taches.length || 1)] ?? 'Une production orale ou écrite qui réutilise le chapitre.';
  if (type === 'apercu') return [
    { ico: '🚀', titre: t.titre, corps: `${t.titreFr}\nAxe ${axe.n} · ${axe.titre}`, grand: true, note: 'Laisser les élèves deviner le thème à partir du titre en espagnol.' },
    { ico: '🎯', titre: '¿Adónde vamos?', corps: t.notions.slice(0, 4).join('\n'), note: 'Ce que les élèves sauront faire à la fin du chapitre.' },
    { ico: '🔑', titre: 'Palabras clave', corps: mots(v.slice(0, 6)), note: 'Lire chaque mot, le faire répéter en chœur.' },
    { ico: '🔧', titre: 'La gramática', corps: `${notionGrammaire(t)}\n${t.phrases[0] ?? ''}`, note: 'Juste une découverte : on reviendra sur la règle pendant le chapitre.' },
    { ico: '🌎', titre: 'Un poco de cultura', corps: t.culture[0] ?? '', note: 'Demander ce que les élèves savent déjà.' },
    { ico: '🗣', titre: '¡A hablar!', corps: t.parole.slice(0, 2).join('\n') },
    { ico: '🏁', titre: 'La tarea final', corps: tache, note: 'Présenter la production attendue à la fin du chapitre.' },
    { ico: '💪', titre: '¡Vamos!', corps: 'Hoy empezamos el capítulo.\n¿Estáis listos?', grand: true }
  ];
  const moitie = Math.min(8, Math.ceil(v.length / 2));
  const q = t.quiz ?? [];
  const question = (i: number): Diapo | null => {
    const x = q[i];
    return x ? { ico: '❓', titre: 'Mini pregunta', corps: `${x.q}\n${x.o.map((o, j) => `${'ABCD'[j]}. ${o}`).join('\n')}`, reponse: `${'ABCD'[x.a]}. ${x.o[x.a]}` } : null;
  };
  const traduction = (i: number): Diapo | null => v[i] ? { ico: '❓', titre: 'Mini pregunta', corps: `¿Cómo se dice « ${v[i][1]} » en español?`, reponse: v[i][0] } : null;
  return [
    { ico: '🧠', titre: `Síntesis: ${t.titre}`, corps: `${t.titreFr}\n${n} · ${CECRL[n]}`, grand: true, note: 'On révise tout le chapitre avant l’évaluation.' },
    { ico: '📚', titre: 'El vocabulario (1)', corps: mots(v.slice(0, moitie)) },
    { ico: '📚', titre: 'El vocabulario (2)', corps: mots(v.slice(moitie, moitie * 2)) },
    traduction(Math.floor(moitie / 2)),
    { ico: '🔧', titre: 'Lo que hay que saber', corps: t.notions.join('\n') },
    { ico: '✍️', titre: 'Ejemplos', corps: t.phrases.slice(0, 4).join('\n') },
    question(0),
    { ico: '⚠️', titre: '¡Ojo! Errores frecuentes', corps: (t.erreurs?.length ? t.erreurs : ERREURS).slice(0, 4).join('\n'), note: 'Demander aux élèves de corriger chaque erreur à l’oral.' },
    question(1),
    { ico: '🌎', titre: 'La cultura', corps: t.culture.slice(0, 3).join('\n') },
    traduction(moitie + 1),
    { ico: '🗣', titre: '¡A hablar!', corps: t.parole.slice(0, 3).join('\n'), note: 'Deux ou trois élèves répondent à l’oral.' },
    question(2),
    { ico: '✅', titre: 'Ya sé…', corps: t.notions.map(x => `☐ ${x}`).join('\n'), note: 'Chaque élève coche ce qu’il sait faire : ce qui reste est à réviser.' },
    { ico: '🍀', titre: '¡Listos para la evaluación!', corps: 'Repasa el vocabulario, la síntesis y el mapa mental.\n¡Mucha suerte!', grand: true }
  ].filter((d): d is Diapo => !!d && !!d.corps.trim());
}

export const estModifie = (n: Niveau, chapId: string, type: TypeDiapo) => !!state.diapos?.[cleDiapo(n, chapId, type)];
export const lireDiapos = (n: Niveau, axe: Axe, t: Theme, type: TypeDiapo): Diapo[] =>
  structuredClone(state.diapos?.[cleDiapo(n, t.id, type)] ?? diaposDefaut(n, axe, t, type));
export const ecrireDiapos = (n: Niveau, chapId: string, type: TypeDiapo, d: Diapo[] | null) =>
  update(s => { s.diapos ??= {}; if (d) s.diapos[cleDiapo(n, chapId, type)] = d; else delete s.diapos[cleDiapo(n, chapId, type)]; });

const lignes = (corps: string) => corps.split('\n').map(x => x.trim()).filter(Boolean);

/** Une diapo en HTML (présentation, aperçu et impression). */
export function diapoHtml(d: Diapo, n: Niveau, i: number, total: number, revele = false, impression = false): string {
  const l = lignes(d.corps);
  return `<section class="diapo diapo-cv ${d.grand ? 'diapo-grand' : ''}" style="--c:${COULEUR[n]}">
    ${d.ico ? `<span class="diapo-ico" aria-hidden="true">${esc(d.ico)}</span>` : ''}
    <h2 lang="es">${esc(d.titre)}</h2>
    ${d.grand ? l.map(x => `<p lang="es">${esc(x)}</p>`).join('') : l.length > 1 ? `<ul lang="es">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p lang="es">${esc(l[0] ?? '')}</p>`}
    ${d.reponse ? (revele || impression ? `<p class="diapo-rep">${impression ? 'Respuesta : ' : '✅ '}${esc(d.reponse)}</p>` : '<p class="diapo-rep cachee">Respuesta : espacio o clic</p>') : ''}
    <span class="diapo-pied">Clase Viva · ${n} · ${i + 1}/${total}</span>
  </section>`;
}

/** Tout le diaporama, une diapo par page A4 paysage (impression / PDF). */
export const diaposImpression = (d: Diapo[], n: Niveau) =>
  `<article class="doc doc-paysage" style="--c:${COULEUR[n]}">${d.map((x, i) => diapoHtml(x, n, i, d.length, false, true)).join('')}</article>`;

/** Consigne prête à coller dans Gemini (ou « Aide-moi à créer » dans Google Slides). */
export function promptGemini(n: Niveau, axe: Axe, t: Theme, type: TypeDiapo, d: Diapo[]): string {
  const info = DIAPOS[type];
  return [
    `Tu es professeur d'espagnol en collège en France (classe de ${n}, niveau ${CECRL[n]}).`,
    `Crée un diaporama « ${info.label} » pour le chapitre « ${t.titre} » (${t.titreFr}), axe ${axe.n} : ${axe.titre}.`,
    type === 'apercu'
      ? 'Rôle : diaporama de DÉBUT de chapitre. Montrer aux élèves où ils vont : objectifs, vocabulaire clé, grammaire, tâche finale. 5 à 8 diapositives, très visuelles (une image ou une icône par diapo), très peu de texte. Utilisation : première séance, 10 minutes maximum.'
      : 'Rôle : diaporama de FIN de chapitre. Réviser et fixer ce qui a été vu : vocabulaire, règles, exemples, erreurs fréquentes. 10 à 15 diapositives, avec 3 ou 4 mini-questions (réponse sur la diapo suivante) pour faire participer les élèves. Utilisation : dernière séance avant l’évaluation, ou support de révision.',
    'Les titres et le contenu pour les élèves sont en espagnol, simples et adaptés au niveau ; les notes de l’enseignante sont en français.',
    '',
    'Contenu du chapitre à utiliser :',
    `- Objectifs : ${t.notions.join(' ; ')}`,
    `- Vocabulaire : ${t.vocab.map(([es, fr]) => `${es} (${fr})`).join(', ')}`,
    `- Phrases modèles : ${t.phrases.join(' / ')}`,
    `- Culture : ${t.culture.join(' ')}`,
    `- Sujets d’oral : ${t.parole.join(' / ')}`,
    t.erreurs?.length ? `- Erreurs fréquentes : ${t.erreurs.join(' ; ')}` : '',
    axe.taches?.length ? `- Tâche finale possible : ${axe.taches[axe.themes.indexOf(t) % axe.taches.length]}` : '',
    '',
    'Voici le plan que j’ai déjà (tu peux l’améliorer) :',
    ...d.map((x, i) => `${i + 1}. ${x.titre} : ${lignes(x.corps).join(' · ')}${x.reponse ? ` (réponse : ${x.reponse})` : ''}`)
  ].filter(x => x !== '').join('\n');
}

/** Fichier PowerPoint modifiable (s'ouvre aussi dans Keynote et Google Slides). */
export async function exporterPptx(n: Niveau, t: Theme, type: TypeDiapo, d: Diapo[]): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = `${DIAPOS[type].label} · ${t.titre}`;
  const c = COULEUR[n].replace('#', '');
  d.forEach((x, i) => {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.25, fill: { color: c } });
    if (x.ico) s.addText(x.ico, { x: 0.5, y: 0.5, w: 1.2, h: 1.0, fontSize: 40 });
    s.addText(x.titre, { x: x.ico ? 1.7 : 0.6, y: 0.5, w: 11, h: 1.0, fontSize: x.grand ? 44 : 36, bold: true, color: c, fontFace: 'Arial' });
    const l = lignes(x.corps);
    if (l.length) s.addText(l.map(txt => ({ text: txt, options: { bullet: !x.grand && l.length > 1, breakLine: true } })), {
      x: 0.8, y: 1.8, w: 11.7, h: 4.6, fontSize: x.grand ? 30 : l.length > 6 ? 20 : 26, color: '16203B', fontFace: 'Arial', valign: 'top', align: x.grand ? 'center' : 'left'
    });
    if (x.reponse) s.addText(`Respuesta : ${x.reponse}`, { x: 0.8, y: 6.5, w: 11.7, h: 0.6, fontSize: 20, italic: true, color: '3F7A26' });
    s.addText(`Clase Viva · ${n} · ${i + 1}/${d.length}`, { x: 9.3, y: 7.0, w: 3.8, h: 0.4, fontSize: 11, color: '56607A', align: 'right' });
    if (x.note) s.addNotes(x.note);
  });
  await pptx.writeFile({ fileName: `${n}_${t.id}_diaporama-${type}.pptx` });
}
