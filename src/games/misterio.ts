import type { Game } from './engine';
import { aDire, brancherADire, dire } from './plateau';
import { beep, chime, gong } from '../lib/sound';
import { $, $$, esc, pick, shuffle } from '../lib/ui';

/**
 * El misterio de la clase : un Cluedo d'enquête.
 * L'appli garde l'enveloppe secrète (qui, avec quoi, où). Chaque équipe formule une hypothèse
 * EN ESPAGNOL (validée par l'enseignante), puis l'appli la contredit avec une phrase en espagnol.
 * 5e : présent (Creo que es…). 4e/3e : passé (Creo que fue…, estaba…).
 */
type Carte = { es: string; ico: string; fr: string };
type Escenario = { id: string; titre: string; lieuFr: string; intro: [string, string]; intro5: [string, string]; quien: Carte[]; que: Carte[]; donde: Carte[]; otrosSitios: string[] };

const ESCENARIOS: Escenario[] = [
  {
    id: 'colegio', titre: 'El trofeo del colegio', lieuFr: 'Au collège',
    intro: ['Ayer por la tarde, alguien robó el trofeo de fútbol del colegio. ¿Quién fue? ¿Con qué objeto? ¿Dónde estaba?', 'Hier après-midi, quelqu’un a volé le trophée de foot du collège. Qui ? Avec quel objet ? Où était-il ?'],
    intro5: ['¡Alguien quiere robar el trofeo de fútbol del colegio! ¿Quién es? ¿Qué objeto tiene? ¿Dónde está?', 'Quelqu’un veut voler le trophée de foot du collège ! Qui est-ce ? Quel objet a-t-il ? Où est-il ?'],
    quien: [
      { es: 'el profesor de música', ico: '🎻', fr: 'le professeur de musique' },
      { es: 'el director', ico: '👔', fr: 'le principal' },
      { es: 'la conserje', ico: '🔑', fr: 'la gardienne' },
      { es: 'el alumno travieso', ico: '😜', fr: 'l’élève farceur' },
      { es: 'la cocinera', ico: '👩‍🍳', fr: 'la cuisinière' },
      { es: 'la profesora de gimnasia', ico: '🏃‍♀️', fr: 'la professeure d’EPS' }
    ],
    que: [
      { es: 'un bolígrafo rojo', ico: '🖊', fr: 'un stylo rouge' },
      { es: 'un libro de español', ico: '📕', fr: 'un livre d’espagnol' },
      { es: 'unas gafas de sol', ico: '🕶', fr: 'des lunettes de soleil' },
      { es: 'un teléfono móvil', ico: '📱', fr: 'un téléphone portable' },
      { es: 'una mochila', ico: '🎒', fr: 'un sac à dos' },
      { es: 'un balón de fútbol', ico: '⚽', fr: 'un ballon de foot' }
    ],
    donde: [
      { es: 'la biblioteca', ico: '📚', fr: 'le CDI' },
      { es: 'el comedor', ico: '🍽', fr: 'la cantine' },
      { es: 'el patio', ico: '🌳', fr: 'la cour' },
      { es: 'la clase de español', ico: '🇪🇸', fr: 'la salle d’espagnol' },
      { es: 'el gimnasio', ico: '🏀', fr: 'le gymnase' },
      { es: 'la sala de profesores', ico: '☕', fr: 'la salle des profs' }
    ],
    otrosSitios: ['el aparcamiento', 'la secretaría', 'el laboratorio', 'la enfermería']
  },
  {
    id: 'madrid', titre: 'El misterio de Madrid', lieuFr: 'À Madrid',
    intro: ['Anoche, alguien robó el famoso abanico de la Reina en Madrid. ¿Quién fue? ¿Con qué objeto? ¿En qué lugar de Madrid?', 'Cette nuit, quelqu’un a volé le célèbre éventail de la Reine à Madrid. Qui ? Avec quel objet ? Dans quel lieu de Madrid ?'],
    intro5: ['¡Alguien quiere robar el famoso abanico de la Reina en Madrid! ¿Quién es? ¿Qué objeto tiene? ¿Dónde está?', 'Quelqu’un veut voler le célèbre éventail de la Reine à Madrid ! Qui ? Quel objet ? Où ?'],
    quien: [
      { es: 'la guía del museo', ico: '🧭', fr: 'la guide du musée' },
      { es: 'el turista francés', ico: '📸', fr: 'le touriste français' },
      { es: 'el guardia de seguridad', ico: '💂', fr: 'le gardien' },
      { es: 'la pintora', ico: '🎨', fr: 'la peintre' },
      { es: 'el vendedor de churros', ico: '🍩', fr: 'le vendeur de churros' },
      { es: 'la futbolista', ico: '⚽', fr: 'la footballeuse' }
    ],
    que: [
      { es: 'un paraguas', ico: '☂️', fr: 'un parapluie' },
      { es: 'una cámara de fotos', ico: '📷', fr: 'un appareil photo' },
      { es: 'un mapa de Madrid', ico: '🗺', fr: 'un plan de Madrid' },
      { es: 'una linterna', ico: '🔦', fr: 'une lampe de poche' },
      { es: 'una llave antigua', ico: '🗝', fr: 'une vieille clé' },
      { es: 'un sombrero', ico: '👒', fr: 'un chapeau' }
    ],
    donde: [
      { es: 'la Puerta del Sol', ico: '🕰', fr: 'la Puerta del Sol' },
      { es: 'el Parque del Retiro', ico: '🌳', fr: 'le parc du Retiro' },
      { es: 'la Plaza Mayor', ico: '🏛', fr: 'la Plaza Mayor' },
      { es: 'el Museo del Prado', ico: '🖼', fr: 'le musée du Prado' },
      { es: 'el Palacio Real', ico: '👑', fr: 'le Palais royal' },
      { es: 'el estadio Santiago Bernabéu', ico: '🏟', fr: 'le stade Santiago Bernabéu' }
    ],
    otrosSitios: ['la estación de Atocha', 'el Rastro', 'el templo de Debod', 'la Gran Vía']
  }
];

type Cat = 'quien' | 'que' | 'donde';
const CATS: { id: Cat; es: string; fr: string }[] = [
  { id: 'quien', es: '¿Quién?', fr: 'Qui ?' }, { id: 'que', es: '¿Con qué?', fr: 'Avec quoi ?' }, { id: 'donde', es: '¿Dónde?', fr: 'Où ?' }
];

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** « el director » → « al director » après « a ». */
const aPersona = (s: string) => s.replace(/^el /, 'al ').replace(/^la /, 'a la ');
/** « en el patio » / « en la biblioteca ». */
const enLugar = (s: string) => `en ${s}`;

const misterio: Game = (el, ctx) => {
  const pasado = ctx.niveau !== '5e';
  let E = ESCENARIOS[0];
  let secreto: Record<Cat, number> = { quien: 0, que: 0, donde: 0 };
  let elimine: Record<Cat, Set<number>> = { quien: new Set(), que: new Set(), donde: new Set() };
  let choix: Partial<Record<Cat, number>> = {};
  let sansAccusation: Set<number> = new Set();
  let phase: 'intro' | 'tour' | 'fin' = 'intro', gagnant = -1, mode: 'hipotesis' | 'acusacion' = 'hipotesis';

  const nouveau = () => {
    secreto = { quien: Math.floor(Math.random() * 6), que: Math.floor(Math.random() * 6), donde: Math.floor(Math.random() * 6) };
    elimine = { quien: new Set(), que: new Set(), donde: new Set() };
    sansAccusation = new Set(); choix = {}; gagnant = -1; mode = 'hipotesis'; phase = 'tour';
  };

  const phraseHypothese = (c: Record<Cat, number>, acusar: boolean) => {
    const q = E.quien[c.quien].es, o = E.que[c.que].es, l = E.donde[c.donde].es;
    if (acusar) return pasado ? `Acuso ${aPersona(q)}: fue con ${o}, ${enLugar(l)}.` : `Acuso ${aPersona(q)}: tiene ${o} y está ${enLugar(l)}.`;
    return pasado ? `Creo que fue ${q}, con ${o}, y pienso que estaba ${enLugar(l)}.` : `Creo que es ${q}, con ${o}, y pienso que está ${enLugar(l)}.`;
  };

  /** La réponse de l'appli : contredit UN élément faux de l'hypothèse, en espagnol. */
  const refuter = (c: Record<Cat, number>): { es: string; fr: string; cat?: Cat; idx?: number } => {
    const faux = CATS.map(x => x.id).filter(cat => c[cat] !== secreto[cat]);
    if (!faux.length) return pasado
      ? { es: 'Nadie puede contradecirte… ¿Te atreves a acusar?', fr: 'Personne ne peut te contredire… Oses-tu accuser ?' }
      : { es: 'Nadie dice que no… ¿Quieres acusar?', fr: 'Personne ne dit non… Tu veux accuser ?' };
    const nouveaux = faux.filter(cat => !elimine[cat].has(c[cat]));
    const cat = pick(nouveaux.length ? nouveaux : faux), idx = c[cat];
    const autre = pick(E.otrosSitios);
    if (cat === 'quien') {
      const p = E.quien[idx];
      return pasado
        ? { es: `No fue ${p.es}: a esa hora estaba ${enLugar(autre)}, hay testigos.`, fr: `Ce n’était pas ${p.fr} : à cette heure-là, il/elle était ailleurs, il y a des témoins.`, cat, idx }
        : { es: `No es ${p.es}: ahora está ${enLugar(autre)} con otras personas.`, fr: `Ce n’est pas ${p.fr} : il/elle est ailleurs avec d’autres personnes.`, cat, idx };
    }
    if (cat === 'que') {
      const o = E.que[idx];
      return pasado
        ? { es: `Nadie tenía ${o.es} en la mano en el momento del robo.`, fr: `Personne n’avait ${o.fr} à la main au moment du vol.`, cat, idx }
        : { es: `Nadie tiene ${o.es} en la mano.`, fr: `Personne n’a ${o.fr} à la main.`, cat, idx };
    }
    const l = E.donde[idx];
    return pasado
      ? { es: `El robo no fue ${enLugar(l.es)}: nadie vio nada raro allí en toda la tarde.`, fr: `Le vol n’a pas eu lieu là (${l.fr}) : personne n’y a rien vu de bizarre de tout l’après-midi.`, cat, idx }
      : { es: `El ladrón no está ${enLugar(l.es)}: allí no hay nadie sospechoso.`, fr: `Le voleur n’est pas là (${l.fr}) : il n’y a personne de suspect.`, cat, idx };
  };

  const suivant = () => { choix = {}; mode = 'hipotesis'; ctx.nextTurn(); render(); };

  const carnet = () => `
    <div class="mist-carnet">${CATS.map(c => `
      <section class="mist-col"><h3 lang="es">${c.es} <small>${c.fr}</small></h3>
        ${E[c.id].map((x, i) => `<button class="mist-carte ${elimine[c.id].has(i) ? 'elimine' : ''}" data-cat="${c.id}" data-i="${i}" aria-pressed="${choix[c.id] === i}" ${elimine[c.id].has(i) ? 'aria-label="' + esc(x.es) + ' (innocent)"' : ''}>
          <span aria-hidden="true">${x.ico}</span><span lang="es">${esc(cap(x.es))}</span></button>`).join('')}
      </section>`).join('')}</div>`;

  const modeles = () => `
    <details class="mist-aide"><summary>📝 Phrases pour enquêter</summary><ul lang="es">${(pasado
      ? ['Creo que fue… / Pienso que estaba en…', 'Puede que fuera… / Seguramente fue…', 'No fue… porque estaba en…', 'Estoy seguro/a de que…', '¡Acuso a…!']
      : ['Creo que es… / Pienso que está en…', 'Tal vez es… / Puede ser…', 'No es… porque está en…', 'Estoy seguro/a de que…', '¡Acuso a…!']).map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`;

  const render = () => {
    if (phase === 'intro') {
      const [es, fr] = pasado ? E.intro : E.intro5;
      el.innerHTML = `
        <div class="center plateau-regles">
          <div class="count" aria-hidden="true">🕵️</div>
          <div class="huge" lang="es">El misterio de la clase</div>
          <div class="row wrap center-row" role="group" aria-label="Scénario">${ESCENARIOS.map(s => `<button class="btn ghost" data-s="${s.id}" aria-pressed="${s === E}">${s.lieuFr} : <span lang="es">${esc(s.titre)}</span></button>`).join('')}</div>
          <p class="big" lang="es">${esc(es)}</p>
          <details><summary>Traduction</summary><p>${esc(fr)}</p></details>
          <button class="btn ghost sm" id="lire">🔊 Écouter</button>
          <ul class="regles">
            <li>🤫 L’appli cache dans une enveloppe : le coupable, l’objet et le lieu.</li>
            <li>🗣 À son tour, l’équipe choisit 3 cartes et dit son hypothèse <b>en espagnol</b>. Bien dite : +1 point.</li>
            <li>🔎 L’appli répond en espagnol et élimine une carte pour tout le monde (elle devient barrée).</li>
            <li>⚖️ Une équipe sûre d’elle peut <b lang="es">acusar</b> : juste = +5 points et la partie est gagnée ; fausse = elle ne peut plus accuser.</li>
          </ul>
          <button class="btn bigbtn" id="go">¡Empieza la investigación!</button>
        </div>`;
      $$('[data-s]', el).forEach(b => b.onclick = () => { E = ESCENARIOS.find(s => s.id === b.dataset.s)!; render(); });
      $('#lire', el).onclick = () => dire(es);
      $('#go', el).onclick = () => { nouveau(); render(); };
      return;
    }
    if (phase === 'fin') {
      const q = E.quien[secreto.quien], o = E.que[secreto.que], l = E.donde[secreto.donde];
      const es = pasado ? `Fue ${q.es}, con ${o.es}, ${enLugar(l.es)}.` : `Es ${q.es}, con ${o.es}, ${enLugar(l.es)}.`;
      el.innerHTML = `
        <div class="center">
          <div class="count" aria-hidden="true">${gagnant >= 0 ? '🏆' : '📂'}</div>
          <div class="huge ${gagnant >= 0 ? 'win' : ''}" lang="es">${gagnant >= 0 ? `¡Caso resuelto por ${ctx.teams[gagnant].icon} ${esc(ctx.teams[gagnant].nom)}!` : 'Caso cerrado'}</div>
          <p class="big" lang="es">${q.ico} ${o.ico} ${l.ico} ${esc(cap(es))}</p>
          <button class="btn ghost sm" id="lire">🔊 Écouter</button>
          <button class="btn bigbtn" id="again">Nuevo misterio</button>
        </div>`;
      $('#lire', el).onclick = () => dire(es);
      $('#again', el).onclick = () => { phase = 'intro'; render(); };
      return;
    }
    const t = ctx.turn(), e = ctx.teams[t];
    const complet = CATS.every(c => choix[c.id] !== undefined);
    const peutAccuser = !sansAccusation.has(t);
    el.innerHTML = `
      <div class="mist">
        <div class="row head"><p class="pill">${e.icon} ${esc(e.nom)} : ${mode === 'acusacion' ? '⚖️ accusation' : '🔎 hypothèse'}</p>${modeles()}</div>
        ${carnet()}
        <section class="panel mist-action" id="action" aria-live="polite">
          ${complet ? `<div id="dire"></div>` : `<p class="big">Choisissez une carte dans chaque colonne (${CATS.filter(c => choix[c.id] !== undefined).length}/3).</p>`}
          <div class="row wrap center-row">
            ${mode === 'hipotesis' && peutAccuser ? '<button class="btn warn" id="acusar" lang="es">⚖️ ¡Acusar!</button>' : ''}
            ${mode === 'acusacion' ? '<button class="btn ghost sm" id="annuler">Revenir à une hypothèse</button>' : ''}
            ${!peutAccuser ? '<span class="muted small">Cette équipe ne peut plus accuser.</span>' : ''}
            <button class="btn ghost sm" id="passer">Passer le tour</button>
          </div>
        </section>
      </div>`;
    $$('[data-cat]', el).forEach(b => b.onclick = () => { choix[b.dataset.cat as Cat] = Number(b.dataset.i); render(); });
    $('#acusar', el)?.addEventListener('click', () => { mode = 'acusacion'; render(); });
    $('#annuler', el)?.addEventListener('click', () => { mode = 'hipotesis'; render(); });
    $('#passer', el).onclick = suivant;
    if (!complet) return;
    const c = choix as Record<Cat, number>, phrase = phraseHypothese(c, mode === 'acusacion');
    const dz = $('#dire', el);
    dz.innerHTML = aDire(phrase, 'L’équipe dit la phrase, puis l’appli répond.');
    const repondre = (bienDit: boolean) => {
      if (bienDit) ctx.point(t, 1);
      if (mode === 'acusacion') {
        const juste = CATS.every(x => c[x.id] === secreto[x.id]);
        if (juste) { gagnant = t; ctx.point(t, 5); chime(); phase = 'fin'; render(); return; }
        gong(); sansAccusation.add(t);
        const reste = ctx.teams.some((_, i) => !sansAccusation.has(i));
        dz.innerHTML = `<p class="huge" lang="es">¡No! Te has equivocado.</p><p>${e.icon} ${esc(e.nom)} ne peut plus accuser, mais continue d’enquêter.</p>
          <button class="btn bigbtn" id="sig" lang="es">${reste ? 'Siguiente equipo' : 'Ver la solución'}</button>`;
        $('#sig', dz).onclick = () => { if (reste) suivant(); else { phase = 'fin'; render(); } };
        return;
      }
      const r = refuter(c);
      if (r.cat !== undefined) elimine[r.cat].add(r.idx!);
      beep(r.cat ? 520 : 880, 0.2);
      dire(r.es);
      dz.innerHTML = `
        <p class="muted small">🔎 La respuesta</p>
        <p class="big mist-reponse" lang="es">« ${esc(r.es)} »</p>
        <details><summary>Traduction</summary><p>${esc(r.fr)}</p></details>
        <div class="row wrap center-row"><button class="btn ghost sm" id="relire">🔊 Réécouter</button><button class="btn bigbtn" id="sig" lang="es">Siguiente equipo</button></div>`;
      $('#relire', dz).onclick = () => dire(r.es);
      $('#sig', dz).onclick = suivant;
      // Le carnet se met à jour pour tout le monde
      const carte = r.cat !== undefined && el.querySelector<HTMLElement>(`[data-cat="${r.cat}"][data-i="${r.idx}"]`);
      if (carte) carte.classList.add('elimine');
      $$('[data-cat]', el).forEach(b => (b as HTMLButtonElement).disabled = true);
    };
    brancherADire(dz, phrase, () => repondre(true), () => repondre(false));
  };

  render();
};

export default misterio;
