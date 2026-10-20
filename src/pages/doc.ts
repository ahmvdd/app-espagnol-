import type { View } from '../router';
import { NIVEAUX, THEMES, axeDe, type Niveau } from '../lib/content';
import { DOCS, docHtml, fichierPdf, type DocType } from '../lib/documents';

/** #/doc/5e/<chapitre>/<type> : le document seul, utilisé pour générer les PDF au build. */
export const doc: View = el => {
  const [, , n, id, type] = location.hash.split('/') as [string, string, Niveau, string, DocType];
  const t = NIVEAUX.includes(n) ? THEMES[n].find(x => x.id === id) : undefined;
  const axe = t && axeDe(n, t.id);
  if (!t || !axe || !(type in DOCS)) { el.innerHTML = '<p>Document introuvable.</p>'; return; }
  document.title = fichierPdf(n, axe, t, type);
  document.documentElement.classList.add('doc-seul');
  el.innerHTML = `<div class="print-area doc-ecran">${docHtml(type, n, axe, t)}</div>`;
  return () => { document.documentElement.classList.remove('doc-seul'); document.title = 'Clase Viva'; };
};
