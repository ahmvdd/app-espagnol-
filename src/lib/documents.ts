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

export const SITE_NOM = 'Clase Viva';

export type DocType = 'cours' | 'synthese' | 'exercices' | 'corriges';
export const DOCS: Record<DocType, { label: string; icon: string; eleve: boolean }> = {
  cours: { label: 'Cours', icon: '📖', eleve: true },
  synthese: { label: 'Synthèse', icon: '📝', eleve: true },
  exercices: { label: 'Exercices', icon: '✏️', eleve: true },
  corriges: { label: 'Corrigés', icon: '✅', eleve: false }
};

/** Nom de fichier stable : 5e_axe2_chapitre1_exercices.pdf (l'ordre des chapitres vient du programme). */
export const fichierPdf = (n: Niveau, axe: Axe, t: Theme, type: DocType) =>
  `${n}_axe${axe.n}_chapitre${axe.themes.indexOf(t) + 1}_${type}.pdf`;

const entete = (n: Niveau, axe: Axe, t: Theme, type: string, nom = true) => `
  <header class="doc-tete" style="--c:${COULEUR[n]}">
    <div class="doc-ligne-haut"><span class="doc-site">${SITE_NOM}</span><span class="doc-niv">${n} · ${CECRL[n]}</span> <span class="doc-type">${type}</span></div>
    <h1 lang="es">${esc(t.titre)}</h1>
    <p>Axe ${axe.n} · ${esc(axe.titre)} — ${esc(t.objet)}</p>
    ${nom ? '<p class="doc-nom">Nombre : ______________________ &nbsp; Clase : ________ &nbsp; Fecha : ____________</p>' : ''}
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

/** Synthèse élève : tout le chapitre sur une feuille recto-verso au maximum. */
export function synthese(n: Niveau, axe: Axe, t: Theme): string {
  return `<article class="doc doc-synthese" style="--c:${COULEUR[n]}">
    ${entete(n, axe, t, 'Synthèse', false)}
    <section class="doc-bloc"><h2>🎯 Les notions du chapitre</h2><ul>${t.notions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
    <section class="doc-bloc"><h2 lang="es">📚 Vocabulario esencial</h2>
      <div class="doc-vocab-grille">${t.vocab.map(([es, fr]) => `<div><strong lang="es">${esc(es)}</strong> · ${esc(fr)}</div>`).join('')}</div></section>
    <section class="doc-bloc"><h2>💬 Exemples à connaître</h2><ul lang="es">${t.phrases.map(p => `<li>${esc(p)}</li>`).join('')}</ul></section>
    <section class="doc-bloc doc-culture"><h2>🌎 À retenir sur le monde hispanique</h2><ul>${t.culture.map(c => `<li>${esc(c)}</li>`).join('')}</ul></section>
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
  const trous = t.phrases.slice(0, 5).map(p => trou(p, t.vocab));
  const banque = melange(trous.map(x => x.mot), r);
  const v = melange(t.vocab, r);
  const relier = v.slice(0, 6);
  const lettres = melange(relier.map((_, i) => i), r);
  const motsProd = v.slice(6, 9).map(([es]) => es);
  return { trous, banque, relier, lettres, motsProd, sujet: t.parole[0] ?? '', modeles: t.phrases };
}

const L = 'ABCDEFGH';

function corpsFiche(e: Exos, corrige: boolean): string {
  return `
    <section class="doc-bloc"><h2>Exercice 1 · Complète les phrases</h2>
      <p class="doc-banque" lang="es">Banque de mots : ${e.banque.map(esc).join(' · ')}</p>
      <ol lang="es">${e.trous.map(x => `<li>${esc(x.texte)}${corrige ? ` <span class="doc-rep">→ ${esc(x.mot)}</span>` : ''}</li>`).join('')}</ol></section>
    <section class="doc-bloc"><h2>Exercice 2 · Relie le mot espagnol à sa traduction</h2>
      <div class="doc-relier">
        <ol>${e.relier.map(([es], j) => `<li lang="es">${esc(es)}${corrige ? ` <span class="doc-rep">→ ${L[e.lettres.indexOf(j)]}</span>` : ' •'}</li>`).join('')}</ol>
        <ul class="doc-lettres">${e.lettres.map((k, i) => `<li>• ${L[i]}. ${esc(e.relier[k][1])}</li>`).join('')}</ul>
      </div></section>
    <section class="doc-bloc"><h2>Exercice 3 · Produis des phrases</h2>
      <p>a) Écris une phrase en espagnol avec chacun de ces mots : <strong lang="es">${e.motsProd.map(esc).join(' · ')}</strong></p>
      ${corrige ? `<p class="doc-rep">Réponses libres. Vérifier le sens et les accords. Exemples du chapitre :</p><ul lang="es">${e.modeles.map(m => `<li class="doc-rep">${esc(m)}</li>`).join('')}</ul>`
        : '<div class="doc-lignes"><span></span><span></span><span></span></div>'}
      ${e.sujet ? `<p>b) Réponds en 3 phrases : <strong lang="es">${esc(e.sujet)}</strong></p>
        ${corrige ? '<p class="doc-rep">Réponse libre : 3 phrases correctes qui réutilisent le vocabulaire et les notions du chapitre.</p>' : '<div class="doc-lignes"><span></span><span></span><span></span></div>'}` : ''}
    </section>`;
}

export const fiche = (n: Niveau, axe: Axe, t: Theme) =>
  `<article class="doc" style="--c:${COULEUR[n]}">${entete(n, axe, t, 'Ejercicios')}${corpsFiche(exercices(t), false)}</article>`;

export const corrige = (n: Niveau, axe: Axe, t: Theme) =>
  `<article class="doc" style="--c:${COULEUR[n]}">${entete(n, axe, t, 'Corrigés · enseignante', false)}${corpsFiche(exercices(t), true)}</article>`;

export function docHtml(type: DocType, n: Niveau, axe: Axe, t: Theme): string {
  return { cours, synthese, exercices: fiche, corriges: corrige }[type](n, axe, t);
}

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

/** Aperçu à l'écran : « Imprimer » (boîte d'impression) et « Enregistrer en PDF » (vrai fichier). */
export function apercu(titre: string, html: string, pdf?: string): void {
  const zone = document.createElement('div');
  zone.className = 'rituel-plein apercu';
  zone.setAttribute('role', 'dialog');
  zone.setAttribute('aria-modal', 'true');
  zone.setAttribute('aria-label', titre);
  zone.innerHTML = `
    <div class="apercu-barre">
      <div class="row wrap"><strong>${esc(titre)}</strong>
        <button class="btn" data-print>🖨 Imprimer</button>
        ${pdf ? `<a class="btn" data-pdf href="pdf/${pdf}" download="${pdf}" target="_blank" rel="noopener">⬇️ Enregistrer en PDF</a>` : ''}
        <button class="btn ghost" data-close>✕ Fermer</button></div>
      <p class="small apercu-aide" data-aide>Rien ne s’ouvre ? Certaines applications (WhatsApp, Messenger…) et le site installé sur iPhone bloquent l’impression :
        ouvre le site dans Chrome, Safari ou Edge, ou utilise « Enregistrer en PDF » puis imprime le fichier.</p>
    </div>
    <div class="apercu-page">${html}</div>`;
  document.body.append(zone);
  const fermer = () => { zone.remove(); removeEventListener('keydown', key, true); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } };
  addEventListener('keydown', key, true);
  zone.querySelector<HTMLButtonElement>('[data-close]')!.onclick = fermer;
  const p = zone.querySelector<HTMLButtonElement>('[data-print]')!;
  p.onclick = () => imprimer(html);
  const lien = zone.querySelector<HTMLAnchorElement>('[data-pdf]');
  if (lien) fetch(lien.href, { method: 'HEAD' }).then(r => {
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('pdf')) throw new Error();
  }).catch(() => {
    lien.removeAttribute('href');
    lien.classList.add('desactive');
    lien.setAttribute('aria-disabled', 'true');
    lien.textContent = '⬇️ PDF indisponible hors ligne';
    zone.querySelector<HTMLElement>('[data-aide]')!.textContent = 'Le fichier PDF se télécharge seulement avec Internet. Hors ligne : « Imprimer », puis choisis « Enregistrer au format PDF » comme imprimante.';
  });
  p.focus();
}
