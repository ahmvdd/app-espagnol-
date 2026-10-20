import type { View } from '../router';
import { NIVEAUX, AXES, COULEUR, CECRL, type Niveau } from '../lib/content';
import { DOCS, fichierPdf, type DocType } from '../lib/documents';
import { state } from '../lib/state';
import { suiviDe, statutInfo } from '../lib/suivi';
import { $, esc } from '../lib/ui';

const JEUX: [string, string][] = [['quiz', '❓ Quiz'], ['memory', '🃏 Memory'], ['rosco', '🔤 Rosco'], ['ahorcado', '🪢 Pendu'], ['taboo', '🚫 Taboo']];
const classeChoisie: Record<string, string> = {};

/** #/programme : les trois classes. #/programme/5e : tous les axes et chapitres de l'année, avec leurs ressources. */
export const programme: View = el => {
  const hashN = location.hash.split('/')[2] as Niveau | undefined;
  if (!hashN || !NIVEAUX.includes(hashN)) {
    el.innerHTML = `
      <h1>Programme</h1>
      <p class="muted">Programme officiel d’espagnol (LVB) : 6 axes par classe, l’axe 6 est obligatoire.</p>
      <div class="levels">${NIVEAUX.map(n => {
        const axes = AXES[n].filter(a => a.themes.length);
        return `<a class="panel level" href="#/programme/${n}" style="--niveau:${COULEUR[n]}">
          <span class="row"><span class="huge">${n}</span><span class="pill">${CECRL[n]}</span></span>
          <span><strong>${axes.length} axes · ${axes.reduce((s, a) => s + a.themes.length, 0)} chapitres</strong></span></a>`;
      }).join('')}</div>`;
    return;
  }

  const n = hashN;
  const classes = state.classes.filter(c => c.niveau === n);
  const render = () => {
    const c = classes.find(x => x.id === classeChoisie[n]) ?? classes[0];
    const axes = AXES[n].filter(a => a.themes.length);
    const chapitres = axes.flatMap(a => a.themes);
    const vus = c ? chapitres.filter(t => suiviDe(c, t.id).statut === 'vu').length : 0;
    el.style.setProperty('--niveau', COULEUR[n]);
    el.innerHTML = `
      <div class="row head niveau-head">
        <h1><span class="niveau-badge">${n}</span> Programme <span class="pill">🎯 ${CECRL[n]} · LVB</span></h1>
        <nav class="row wrap" aria-label="Classes">${NIVEAUX.map(x => `<a class="btn ghost sm" href="#/programme/${x}" aria-current="${x === n ? 'page' : 'false'}">${x}</a>`).join('')}</nav>
      </div>
      <section class="panel vue-ensemble">
        <p class="big">${axes.length} axes · ${chapitres.length} chapitres${c ? ` · ✅ ${vus} vu${vus > 1 ? 's' : ''} avec ${esc(c.nom || 'la classe')}` : ''}</p>
        ${c ? `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${chapitres.length}" aria-valuenow="${vus}" aria-label="Chapitres vus"><i style="width:${chapitres.length ? (vus / chapitres.length) * 100 : 0}%"></i></div>` : ''}
        ${classes.length > 1 ? `<label class="row small">Suivi de la classe <select id="classe">${classes.map(x => `<option value="${x.id}" ${x === c ? 'selected' : ''}>${esc(x.nom || 'Sans nom')}</option>`).join('')}</select></label>` : ''}
        ${!classes.length ? `<p class="muted small">Crée une classe de ${n} dans <a href="#/profe">Profe</a> pour suivre les chapitres vus.</p>` : `<p class="small"><a href="#/profe/suivi">Ouvrir le suivi détaillé</a></p>`}
      </section>
      ${axes.map(a => `
        <section class="prog-axe ${a.obligatoire ? 'oblig' : ''}">
          <h2><span class="axe-n">Axe ${a.n}</span> ${esc(a.titre)} ${a.obligatoire ? '<span class="pill oblig-pill">⭐ obligatoire</span>' : ''}</h2>
          <div class="prog-chapitres">${a.themes.map((t, i) => {
            const st = c ? statutInfo(suiviDe(c, t.id).statut) : null;
            return `
            <article class="panel prog-chapitre">
              <div class="row prog-chap-tete">
                <span class="pill">Chapitre ${i + 1}</span>${st ? `<span class="small">${st.icon} ${st.label}</span>` : ''}
              </div>
              <h3 lang="es"><a href="#/nivel/${n}/${t.id}">${esc(t.titre)}</a></h3>
              <p class="muted small">${esc(t.objet)}</p>
              <ul class="prog-ressources">
                ${(Object.keys(DOCS) as DocType[]).map(d => `<li><a href="pdf/${fichierPdf(n, a, t, d)}" download target="_blank" rel="noopener">${DOCS[d].icon} ${DOCS[d].label}${DOCS[d].eleve ? '' : ' (enseignante)'}</a></li>`).join('')}
                <li><a href="#/nivel/${n}/${t.id}#ressources">🧑‍🏫 Ressources pour l’enseignante</a></li>
              </ul>
              <p class="small prog-jeux">🎲 ${JEUX.map(([g, l]) => `<a href="#/juegos/${g}?n=${n}&t=${t.id}">${l}</a>`).join('')}</p>
            </article>`;
          }).join('')}</div>
        </section>`).join('')}`;
    $('#classe', el)?.addEventListener('change', e => { classeChoisie[n] = (e.target as HTMLSelectElement).value; render(); });
  };
  render();
  return () => el.style.removeProperty('--niveau');
};
