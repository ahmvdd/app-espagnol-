import type { View } from '../router';
import { NIVEAUX, AXES, THEMES, axeDe, type Niveau } from '../lib/content';
import { DOCS, docHtml, fichierPdf, type DocType } from '../lib/documents';
import { RESS_AXE, RESS_CHAPITRE, fichierAxe, fichierRessource, ressourceAxeHtml, ressourceHtml, type RessAxe, type RessChapitre } from '../lib/ressources';

/**
 * Le document seul, utilisé pour générer les PDF au build :
 * #/doc/5e/<chapitre>/<type> (documents élèves et ressources) ou #/doc/5e/axe2/<ressource d'axe>.
 */
export const doc: View = el => {
  const [, , n, id, type] = location.hash.split('/') as [string, string, Niveau, string, string];
  if (!NIVEAUX.includes(n)) { el.innerHTML = '<p>Document introuvable.</p>'; return; }
  let html = '', nom = '';
  const axeN = /^axe(\d)$/.exec(id);
  if (axeN) {
    const axe = AXES[n].find(a => a.n === Number(axeN[1]));
    if (axe && type in RESS_AXE) { html = ressourceAxeHtml(type as RessAxe, n, axe); nom = fichierAxe(n, axe, type as RessAxe); }
  } else {
    const t = THEMES[n].find(x => x.id === id);
    const axe = t && axeDe(n, t.id);
    if (t && axe && type in DOCS) { html = docHtml(type as DocType, n, axe, t); nom = fichierPdf(n, axe, t, type as DocType); }
    if (t && axe && type in RESS_CHAPITRE) { html = ressourceHtml(type as RessChapitre, n, axe, t); nom = fichierRessource(n, axe, t, type as RessChapitre); }
  }
  if (!html) { el.innerHTML = '<p>Document introuvable.</p>'; return; }
  document.title = nom;
  document.documentElement.classList.add('doc-seul');
  el.innerHTML = `<div class="print-area doc-ecran">${html}</div>`;
  return () => { document.documentElement.classList.remove('doc-seul'); document.title = 'Clase Viva'; };
};
