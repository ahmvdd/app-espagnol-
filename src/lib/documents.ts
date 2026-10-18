import type { Axe, Niveau, Theme } from '../content/types';
import { COULEUR, CECRL, GRAMMAIRE } from './content';
import { esc } from './ui';

/** Hasard reproductible : la fiche et son corrigé tirent toujours les mêmes éléments. */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 3432918353), h = (h << 13) | (h >>> 19);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const melange = <T>(a: T[], r: () => number) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const entete = (n: Niveau, axe: Axe, t: Theme, type: string) => `
  <header class="doc-tete" style="--c:${COULEUR[n]}">
    <div><span class="doc-niv">${n} · ${CECRL[n]}</span> <span class="doc-type">${type}</span></div>
    <h1 lang="es">${esc(t.titre)}</h1>
    <p>Axe ${axe.n} · ${esc(axe.titre)} — ${esc(t.objet)}</p>
    <p class="doc-nom">Nombre : ______________________ &nbsp; Clase : ________ &nbsp; Fecha : ____________</p>
  </header>`;

export function cours(n: Niveau, axe: Axe, t: Theme): string {
  return `<article class="doc" style="--c:${COULEUR[n]}">
    ${entete(n, axe, t, 'Cours')}
    <section class="doc-bloc"><h2>🎯 Ce que j’apprends</h2><ul>${t.notions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
    <section class="doc-bloc"><h2 lang="es">📚 El vocabulario</h2>
      <table class="doc-vocab">${t.vocab.map(([es, fr]) => `<tr><td lang="es"><strong>${esc(es)}</strong></td><td>${esc(fr)}</td></tr>`).join('')}</table></section>
    <section class="doc-bloc"><h2 lang="es">💬 Frases útiles</h2><ul lang="es">${t.phrases.map(p => `<li>${esc(p)}</li>`).join('')}</ul></section>
    <section class="doc-bloc doc-culture"><h2 lang="es">🌎 Lo que aprendí sobre el mundo hispánico</h2><ul>${t.culture.map(c => `<li>${esc(c)}</li>`).join('')}</ul></section>
    <section class="doc-bloc"><h2 lang="es">🗣 ¡A hablar!</h2><ol lang="es">${t.parole.map(p => `<li>${esc(p)}</li>`).join('')}</ol></section>
    <section class="doc-bloc doc-gram"><h2>🔧 Grammaire de l’année (${n})</h2><ul>${GRAMMAIRE[n].map(g => `<li>${esc(g)}</li>`).join('')}</ul></section>
  </article>`;
}

/** Phrase à trous : on retire un mot du vocabulaire s'il y en a un, sinon le mot le plus long. */
function trou(phrase: string, vocab: [string, string][]): { texte: string; mot: string } {
  const mots = phrase.split(/\s+/);
  const nets = mots.map(m => m.replace(/[¡!¿?.,;:«»]/g, ''));
  const voc = new Set(vocab.flatMap(([es]) => es.toLowerCase().split(/\s+/)).filter(m => m.length > 3));
  let i = nets.findIndex(m => voc.has(m.toLowerCase()));
  if (i < 0) i = nets.reduce((best, m, k) => (m.length > nets[best].length ? k : best), 0);
  return { texte: mots.map((m, k) => (k === i ? m.replace(nets[k], '_'.repeat(Math.max(6, nets[k].length))) : m)).join(' '), mot: nets[i] };
}

type Exos = ReturnType<typeof exercices>;
function exercices(t: Theme) {
  const r = rng(t.id);
  const v = melange(t.vocab, r);
  const versEs = v.slice(0, 5), versFr = v.slice(5, 10);
  const relier = v.slice(10, 16).length >= 4 ? v.slice(10, 16) : v.slice(0, 6);
  const lettres = melange(relier.map((_, i) => i), r);
  const qcm = melange(t.quiz, r).slice(0, 4).map(q => { const ordre = melange(q.o.map((_, i) => i), r); return { q: q.q, o: ordre.map(i => q.o[i]), a: ordre.indexOf(q.a) }; });
  const trous = t.phrases.map(p => trou(p, t.vocab));
  const banque = melange(trous.map(x => x.mot), r);
  return { versEs, versFr, relier, lettres, qcm, trous, banque, sujet: t.parole[0] };
}

const L = 'ABCDEFGH';

function corpsFiche(e: Exos, corrige: boolean): string {
  const rep = (s: string) => (corrige ? `<span class="doc-rep">${esc(s)}</span>` : '<span class="doc-ligne"></span>');
  return `
    <section class="doc-bloc"><h2>1. Traduis en espagnol</h2>
      <ol>${e.versEs.map(([es, fr]) => `<li>${esc(fr)} → ${rep(es)}</li>`).join('')}</ol></section>
    <section class="doc-bloc"><h2>2. Traduis en français</h2>
      <ol>${e.versFr.map(([es, fr]) => `<li lang="es"><strong>${esc(es)}</strong> → ${rep(fr)}</li>`).join('')}</ol></section>
    <section class="doc-bloc"><h2>3. Relie le mot espagnol à sa traduction</h2>
      <div class="doc-relier">
        <ol>${e.relier.map(([es]) => `<li lang="es">${esc(es)}${corrige ? ` <span class="doc-rep">→ ${L[e.lettres.indexOf(e.relier.findIndex(x => x[0] === es))]}</span>` : ' •'}</li>`).join('')}</ol>
        <ul class="doc-lettres">${e.lettres.map((k, i) => `<li>• ${L[i]}. ${esc(e.relier[k][1])}</li>`).join('')}</ul>
      </div></section>
    ${e.qcm.length ? `<section class="doc-bloc"><h2>4. Entoure la bonne réponse</h2>
      <ol>${e.qcm.map(q => `<li><p>${esc(q.q)}</p><p class="doc-qcm">${q.o.map((o, i) => `<span class="${corrige && i === q.a ? 'doc-bon' : ''}">${L[i]}. ${esc(o)}</span>`).join('')}</p></li>`).join('')}</ol></section>` : ''}
    ${e.trous.length ? `<section class="doc-bloc"><h2>5. Complète les phrases</h2>
      <p class="doc-banque" lang="es">Banque de mots : ${e.banque.map(esc).join(' · ')}</p>
      <ol lang="es">${e.trous.map(x => `<li>${esc(x.texte)}${corrige ? ` <span class="doc-rep">(${esc(x.mot)})</span>` : ''}</li>`).join('')}</ol></section>` : ''}
    ${e.sujet ? `<section class="doc-bloc"><h2>6. À toi ! Réponds en 3 phrases</h2><p lang="es"><strong>${esc(e.sujet)}</strong></p>
      ${corrige ? '<p class="doc-rep">Réponse libre : vérifier l’utilisation du vocabulaire du chapitre.</p>' : '<div class="doc-lignes"><span></span><span></span><span></span></div>'}</section>` : ''}`;
}

export const fiche = (n: Niveau, axe: Axe, t: Theme) =>
  `<article class="doc" style="--c:${COULEUR[n]}">${entete(n, axe, t, 'Ejercicios')}${corpsFiche(exercices(t), false)}</article>`;

export const corrige = (n: Niveau, axe: Axe, t: Theme) =>
  `<article class="doc" style="--c:${COULEUR[n]}">${entete(n, axe, t, 'Corrigé')}${corpsFiche(exercices(t), true)}</article>`;

/** Ouvre la boîte d'impression avec le document (l'enseignante peut choisir « Enregistrer en PDF »). */
export function imprimer(html: string): void {
  const zone = document.createElement('div');
  zone.className = 'print-area';
  zone.innerHTML = html;
  document.body.append(zone);
  const nettoyer = () => zone.remove();
  addEventListener('afterprint', nettoyer, { once: true });
  print();
  setTimeout(() => { if (zone.isConnected) nettoyer(); }, 60_000);
}

/** Aperçu à l'écran avant impression. */
export function apercu(titre: string, html: string): void {
  const zone = document.createElement('div');
  zone.className = 'rituel-plein apercu';
  zone.setAttribute('role', 'dialog');
  zone.setAttribute('aria-modal', 'true');
  zone.setAttribute('aria-label', titre);
  zone.innerHTML = `
    <div class="row wrap apercu-barre"><strong>${esc(titre)}</strong>
      <button class="btn" data-print>🖨 Imprimer / enregistrer en PDF</button>
      <button class="btn ghost" data-close>✕ Fermer</button></div>
    <div class="apercu-page">${html}</div>`;
  document.body.append(zone);
  const fermer = () => { zone.remove(); removeEventListener('keydown', key, true); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } };
  addEventListener('keydown', key, true);
  zone.querySelector<HTMLButtonElement>('[data-close]')!.onclick = fermer;
  const p = zone.querySelector<HTMLButtonElement>('[data-print]')!;
  p.onclick = () => imprimer(html);
  p.focus();
}
