import type { Question, Theme } from '../content/types';
import { pick, shuffle } from './ui';

export type QCM = { q: string; o: string[]; a: number; diff?: string };

/** Question de vocabulaire à 4 choix, dans un sens ou dans l'autre. */
export function qVocab(pair: [string, string], pool: [string, string][]): QCM {
  const toFr = Math.random() < 0.5, k = toFr ? 1 : 0;
  const others = shuffle([...new Set(pool.map(p => p[k]).filter(x => x !== pair[k]))]).slice(0, 3);
  const o = shuffle([pair[k], ...others]);
  return {
    q: toFr ? `Que veut dire « ${pair[0]} » ?` : `Comment dit-on « ${pair[1]} » en espagnol ?`,
    o, a: o.indexOf(pair[k])
  };
}

const shuffleQ = (q: Question): QCM => {
  const order = shuffle([0, 1, 2, 3].slice(0, q.o.length));
  return { q: q.q, o: order.map(i => q.o[i]), a: order.indexOf(q.a), diff: q.diff };
};

/** Mélange des quiz rédigés et de questions de vocabulaire générées. */
export function genQuestions(theme: Theme, n: number): QCM[] {
  const redigees = shuffle(theme.quiz);
  const pairs = shuffle(theme.vocab);
  const out: QCM[] = [];
  for (let i = 0; i < n; i++) {
    const useQuiz = redigees.length && (i % 2 === 0 || !pairs.length);
    if (useQuiz) out.push(shuffleQ(redigees.pop()!));
    else if (pairs.length) out.push(qVocab(pairs.pop()!, theme.vocab));
    else out.push(qVocab(pick(theme.vocab), theme.vocab));
  }
  return out;
}

/** Retire les accents pour comparer des lettres (á → a), sans toucher au ñ. */
export const sansAccent = (s: string) => s.replace(/ñ/g, '\u0000').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0000/g, 'ñ');
