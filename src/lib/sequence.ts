/**
 * Séquences : le plan complet d'un chapitre, séance par séance, généré en un clic
 * à partir du contenu du chapitre, puis modifiable par l'enseignante.
 */
import type { Niveau, Theme, Axe } from '../content/types';
import type { Sequence, SeanceSeq, Etape } from './storage';
import { axeDe, THEMES } from './content';

export const NB_SEANCES = [3, 4, 5, 6, 7, 8];
export const DUREES_SEANCE = [45, 50, 55, 60];

type Ctx = { n: Niveau; t: Theme; axe: Axe; d: number };
const L = (c: Ctx) => ({
  chap: `#/nivel/${c.n}/${c.t.id}`,
  doc: (x: string) => `#/nivel/${c.n}/${c.t.id}?doc=${x}`,
  ress: (x: string) => `#/nivel/${c.n}/${c.t.id}?ress=${x}`,
  diapo: (x: 'apercu' | 'synthese') => `#/nivel/${c.n}/${c.t.id}?diapo=${x}`,
  jeu: (j: string) => `#/juegos/${j}?n=${c.n}&t=${c.t.id}`,
  outil: (o: string) => `#/herramientas/${o}`
});

const E = (min: number, texte: string, lien?: string): Etape => ({ min, texte, ...(lien ? { lien } : {}) });
const mots = (t: Theme, a: number, b: number) => t.vocab.slice(a, b).map(v => v[0]).join(', ');

/** Une séance « type » par rôle. Les durées sont ensuite ajustées à la durée réelle. */
const ROLES: Record<string, (c: Ctx, k: number) => SeanceSeq> = {
  decouverte: c => {
    const l = L(c);
    return {
      titre: 'Découverte du chapitre', objectif: `Entrer dans le chapitre « ${c.t.titreFr} » : savoir où l’on va et découvrir les premiers mots.`,
      etapes: [
        E(5, 'Rituel d’entrée : mot du jour, date et météo.', '#/'),
        E(10, 'Diaporama « Aperçu » : objectifs, mots clés, grammaire et tâche finale.', l.diapo('apercu')),
        E(15, `Découverte du vocabulaire en flashcards, écoute et répétition : ${mots(c.t, 0, 8)}.`, l.chap),
        E(10, 'Phrases modèles : écoute, répétition chorale, puis lecture à deux.', l.chap),
        E(10, 'Jeu de mémorisation : Memory par équipes.', l.jeu('memory')),
        E(5, 'Bilan : chaque élève redit un mot ou une phrase appris aujourd’hui.')
      ],
      devoirs: `Apprendre les 8 premiers mots du cours (${mots(c.t, 0, 8)}).`
    };
  },
  langue: (c, k) => {
    const l = L(c), notion = c.t.notions[(k + 1) % c.t.notions.length] ?? c.t.notions[0];
    return {
      titre: 'Vocabulaire et grammaire', objectif: `Fixer le vocabulaire et travailler : ${notion}.`,
      etapes: [
        E(5, 'Rituel : la pregunta del día, réponse à l’oral.', '#/'),
        E(10, 'Réactivation du vocabulaire : La bomba ou quiz rapide.', l.jeu('bomba')),
        E(15, `Point de langue : ${notion}. Lecture de la partie du cours, exemples au tableau.`, l.doc('cours')),
        E(15, 'Exercices d’application (fiche Exercices), correction collective.', l.doc('exercices')),
        E(5, `Oral en binômes : « ${c.t.parole[k % c.t.parole.length] ?? ''} »`),
        E(5, 'Bilan de séance et trace écrite dans le cahier.')
      ],
      devoirs: `Revoir le point de langue et apprendre les mots suivants (${mots(c.t, 8, 16) || mots(c.t, 0, 8)}).`
    };
  },
  culture: c => {
    const l = L(c);
    return {
      titre: 'Culture et expression orale', objectif: 'Découvrir un aspect du monde hispanique et prendre la parole en continu.',
      etapes: [
        E(5, 'Rituel d’entrée.', '#/'),
        E(15, `Repères culturels : ${c.t.culture.slice(0, 2).join(' / ')}`, l.chap),
        E(15, `Prise de parole : ${c.t.parole.slice(0, 2).join(' / ')} (préparation 5 min, puis passage de quelques élèves tirés au sort).`, l.outil('ruleta')),
        E(10, 'Carte mentale à compléter en binôme.', l.ress('carte-mentale-vierge')),
        E(5, 'Bilan : ce que j’ai appris sur le monde hispanique.')
      ],
      devoirs: 'Terminer la carte mentale et préparer 3 phrases sur le thème.'
    };
  },
  tache: c => {
    const l = L(c), tache = c.axe.taches?.[c.axe.themes.indexOf(c.t) % (c.axe.taches?.length || 1)] ?? 'Réaliser une production orale ou écrite qui réutilise le chapitre.';
    return {
      titre: 'Préparation de la tâche finale', objectif: `Préparer la tâche finale : ${tache}`,
      etapes: [
        E(5, 'Rituel d’entrée.', '#/'),
        E(10, 'Présentation de la tâche finale et des critères de réussite.', l.ress('axe-taches')),
        E(25, 'Travail en groupes : préparation de la production (brouillon, répétition).', l.outil('rotations')),
        E(10, 'Premiers passages ou relecture croisée.'),
        E(5, 'Bilan : ce qui reste à faire.')
      ],
      devoirs: 'Finaliser sa partie de la tâche finale.'
    };
  },
  oral: c => {
    const l = L(c);
    return {
      titre: 'Entraînement à l’oral', objectif: 'S’entraîner à parler en continu et en interaction avec le vocabulaire du chapitre.',
      etapes: [
        E(5, 'Rituel d’entrée.', '#/'),
        E(15, 'Jeu oral par équipes : Taboo avec le vocabulaire du chapitre.', l.jeu('taboo')),
        E(20, 'Passages à l’oral (tâche finale ou sujets d’oral), grille d’évaluation de l’oral.', l.ress('axe-oral')),
        E(10, 'Retours positifs et conseils de prononciation.'),
        E(5, 'Bilan.')
      ],
      devoirs: 'Revoir la synthèse du chapitre.'
    };
  },
  synthese: c => {
    const l = L(c);
    return {
      titre: 'Synthèse et révisions', objectif: 'Réviser et fixer tout le chapitre avant l’évaluation.',
      etapes: [
        E(5, 'Rituel d’entrée.', '#/'),
        E(20, 'Diaporama « Synthèse » : vocabulaire, règles, exemples, erreurs fréquentes et mini-questions.', l.diapo('synthese')),
        E(15, 'Quiz en direct par équipes sur tout le chapitre.', l.jeu('quiz')),
        E(10, 'Distribution et lecture de la fiche synthèse (une page).', l.doc('synthese')),
        E(5, 'Questions des élèves avant l’évaluation.')
      ],
      devoirs: 'Réviser avec la fiche synthèse et la carte mentale pour l’évaluation.'
    };
  },
  evaluation: c => {
    const l = L(c);
    return {
      titre: 'Évaluation', objectif: 'Évaluer les acquis du chapitre (compréhension, langue, expression).',
      etapes: [
        E(5, 'Installation, consignes de l’évaluation.'),
        E(40, 'Évaluation écrite du chapitre.', l.ress('evaluation')),
        E(10, 'Ouverture : annonce du prochain chapitre ou jeu calme (Pendu).', l.jeu('ahorcado'))
      ],
      devoirs: ''
    };
  }
};

const PLAN: Record<number, string[]> = {
  3: ['decouverte', 'langue', 'synthese'],
  4: ['decouverte', 'langue', 'synthese', 'evaluation'],
  5: ['decouverte', 'langue', 'culture', 'synthese', 'evaluation'],
  6: ['decouverte', 'langue', 'culture', 'tache', 'synthese', 'evaluation'],
  7: ['decouverte', 'langue', 'langue', 'culture', 'tache', 'synthese', 'evaluation'],
  8: ['decouverte', 'langue', 'langue', 'culture', 'tache', 'oral', 'synthese', 'evaluation']
};

/** Ajuste les durées des étapes pour que la séance fasse exactement `d` minutes. */
function ajuster(s: SeanceSeq, d: number): SeanceSeq {
  const total = s.etapes.reduce((a, e) => a + e.min, 0);
  const k = d / total;
  const etapes = s.etapes.map(e => ({ ...e, min: Math.max(3, Math.round(e.min * k)) }));
  const ecart = d - etapes.reduce((a, e) => a + e.min, 0);
  const plusLong = etapes.reduce((m, e, i) => (e.min > etapes[m].min ? i : m), 0);
  etapes[plusLong].min += ecart;
  return { ...s, etapes };
}

export function creerSequence(n: Niveau, chapId: string, nb: number, duree: number, classeId?: string): Sequence | null {
  const t = THEMES[n].find(x => x.id === chapId), axe = t && axeDe(n, chapId);
  if (!t || !axe) return null;
  const c: Ctx = { n, t, axe, d: duree };
  let kLangue = 0;
  const seances = (PLAN[nb] ?? PLAN[5]).map(r => ajuster(ROLES[r](c, r === 'langue' ? kLangue++ : 0), duree));
  return {
    id: globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    creeLe: new Date().toISOString(), niveau: n, chapId, nbSeances: nb, duree, ...(classeId ? { classeId } : {}),
    titre: `${t.titreFr} (${n})`, seances, notes: ''
  };
}
