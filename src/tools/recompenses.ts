import type { Tool } from './index';
import { state } from '../lib/state';
import { accueilPerso } from '../lib/content';
import { apercu } from '../lib/documents';
import { $, $$, esc, toast } from '../lib/ui';

/** Titres valorisant l'effort, la participation et la progression : [masculin, féminin, pour quoi]. */
const TITRES: [string, string, string][] = [
  ['Valiente del Oral', 'Valiente del Oral', 'pour celui ou celle qui ose parler'],
  ['Estrella de la Semana', 'Estrella de la Semana', 'pour l’effort de la semaine'],
  ['Maestro del Pretérito', 'Maestra del Pretérito', 'pour la maîtrise du passé'],
  ['Rey de la Conjugación', 'Reina de la Conjugación', 'pour la conjugaison'],
  ['Explorador de Latinoamérica', 'Exploradora de Latinoamérica', 'pour la culture'],
  ['Campeón del Esfuerzo', 'Campeona del Esfuerzo', 'pour les progrès'],
  ['Héroe del Vocabulario', 'Heroína del Vocabulario', 'pour le vocabulaire'],
  ['Compañero Solidario', 'Compañera Solidaria', 'pour l’entraide']
];

const fechaHoy = () => new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const firma = () => { const p = accueilPerso(state.reglages).prenom; return p ? `La profesora ${p}` : 'La profesora'; };

export function diplome(prenom: string, titre: string, motif: string): string {
  return `<article class="doc diplome">
    <div class="dip-cadre">
      <p class="dip-sur" lang="es">Diploma</p>
      <p class="dip-otorga" lang="es">Se otorga a</p>
      <p class="dip-nom">${esc(prenom || '______________________')}</p>
      <p class="dip-otorga" lang="es">el título de</p>
      <p class="dip-titre" lang="es">🏅 ${esc(titre)}</p>
      ${motif ? `<p class="dip-motif" lang="es">${esc(motif)}</p>` : ''}
      <div class="dip-pied"><span lang="es">${fechaHoy()}</span><span lang="es">${esc(firma())}<br><i>Firma : ____________</i></span></div>
    </div>
  </article>`;
}

export function felicitations(prenom: string): string {
  const carte = `<div class="felic"><p class="felic-titre" lang="es">¡Enhorabuena${prenom ? `, ${esc(prenom)}` : ''}!</p><p lang="es">Has hecho un gran trabajo.</p><p class="felic-sig" lang="es">${esc(firma())} · ${fechaHoy()}</p></div>`;
  return `<article class="doc felic-page">${carte.repeat(8)}</article>`;
}

/** Affiche de classe pour La Vuelta. */
export function afficheTrophee(equipe: string, ville: string, meta: boolean): string {
  return `<article class="doc diplome trophee-affiche">
    <div class="dip-cadre">
      <p class="trophee-ico" aria-hidden="true">${meta ? '🏆' : '🥇'}</p>
      <p class="dip-sur" lang="es">${meta ? '¡Campeones de La Vuelta!' : '¡Etapa conseguida!'}</p>
      <p class="dip-nom" lang="es">Equipo ${esc(equipe)}</p>
      <p class="dip-titre" lang="es">${meta ? 'ha llegado a la meta' : `ha llegado a ${esc(ville)}`}</p>
      <p class="dip-motif" lang="es">¡Enhorabuena, clase! Juntos llegamos más lejos.</p>
      <div class="dip-pied"><span lang="es">${fechaHoy()}</span><span lang="es">${esc(firma())}</span></div>
    </div>
  </article>`;
}

const recompenses: Tool = el => {
  let genre: 0 | 1 = 0;
  el.innerHTML = `
    <div class="recomp">
      <section class="panel stack">
        <h2 class="h3">🎓 Diplôme</h2>
        <label class="field">Prénom de l’élève <input id="prenom" autocomplete="off" maxlength="40" placeholder="Il n’est pas enregistré"></label>
        <div class="field">Accord
          <div class="row" role="group" aria-label="Accord du titre"><button class="btn ghost sm" data-g="0" aria-pressed="true">él</button><button class="btn ghost sm" data-g="1" aria-pressed="false">ella</button></div>
        </div>
        <fieldset class="field"><legend>Titre</legend><div class="titres" id="titres"></div></fieldset>
        <label class="field">Pourquoi (facultatif, en espagnol) <input id="motif" maxlength="90" placeholder="Por su esfuerzo en clase de español"></label>
        <button class="btn" id="dip">Aperçu du diplôme</button>
      </section>
      <section class="panel stack">
        <h2 class="h3">💌 Mot de félicitations</h2>
        <p>Huit petites cartes « ¡Enhorabuena! Has hecho un gran trabajo » par page, à découper et à coller dans le cahier.</p>
        <button class="btn" id="felic">Aperçu des cartes</button>
        <h2 class="h3">🏆 Trophée de classe</h2>
        <p>Dans <a href="#/herramientas/vuelta">La Vuelta</a>, un trophée s’affiche à chaque étape atteinte, avec une affiche à imprimer pour la classe.</p>
        <p class="muted small">Les récompenses valorisent l’effort et la participation. Aucun prénom n’est enregistré, aucun classement n’est affiché.</p>
      </section>
    </div>`;

  const titres = () => {
    $('#titres', el).innerHTML = TITRES.map((t, i) => `<label class="row titre-choix"><input type="radio" name="titre" value="${i}" ${i === 0 ? 'checked' : ''}> <span lang="es">${esc(t[genre])}</span> <span class="muted small">· ${t[2]}</span></label>`).join('');
  };
  titres();
  $$('[data-g]', el).forEach(b => b.onclick = () => {
    const sel = $<HTMLInputElement>('[name=titre]:checked', el)?.value;
    genre = Number(b.dataset.g) as 0 | 1;
    $$('[data-g]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    titres();
    if (sel) $<HTMLInputElement>(`[name=titre][value="${sel}"]`, el).checked = true;
  });
  $('#dip', el).onclick = () => {
    const prenom = $<HTMLInputElement>('#prenom', el).value.trim();
    const t = TITRES[Number($<HTMLInputElement>('[name=titre]:checked', el).value)][genre];
    if (!prenom) toast('Diplôme sans prénom : une ligne est laissée pour l’écrire à la main');
    apercu('Diplôme', diplome(prenom, t, $<HTMLInputElement>('#motif', el).value.trim()));
  };
  $('#felic', el).onclick = () => apercu('Mots de félicitations', felicitations($<HTMLInputElement>('#prenom', el).value.trim()));

  return () => { const p = $<HTMLInputElement>('#prenom', el); if (p) p.value = ''; };
};

export default recompenses;
