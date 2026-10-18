import type { View } from '../router';
import FIESTAS from '../content/fiestas.json';
import FOTOS from '../content/fotos.json';
import mundo from '../tools/mundo';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { toggleFullscreen, exitFullscreen } from '../lib/fullscreen';
import { $, $$, esc, toast } from '../lib/ui';

type Fiesta = { id: string; nom: string; pays: string; quand: string; icon: string; texte: string[]; vocab: [string, string][]; activite: string; niveaux: string[] };
type Foto = { id: string; fichier: string; lieu: string; pays: string; quoi: string; preguntas: string[]; vocab: [string, string][]; credit: { auteur: string; licence: string; source: string } };

const ONGLETS = [
  { id: '', label: '🌎 El mundo hispano' },
  { id: 'fiestas', label: '🎉 Las fiestas' },
  { id: 'fotos', label: '📷 Fotos para describir' }
];
const AIDE_DESCRIPTION = ['En la foto hay…', 'En el centro / a la izquierda / a la derecha…', 'Al fondo se ve…', 'Me parece que…', 'Creo que es…'];

const dire = (t: string) => { if (!speak(t, state.reglages.accent ?? 'es-ES')) toast('Voix espagnole absente sur cet appareil'); };
const vocabListe = (v: [string, string][]) => `<ul class="mots-pays">${v.map(([es, fr], i) => `<li><button class="btn ghost sm" data-say="${i}" aria-label="Écouter ${esc(es)}">🔊</button> <strong lang="es">${esc(es)}</strong> · ${esc(fr)}</li>`).join('')}</ul>`;

export const cultura: View = el => {
  const [, , onglet = '', id] = location.hash.split('/');
  let stop: void | (() => void);
  el.innerHTML = `
    <h1>Culture <span class="es" lang="es">· Cultura</span></h1>
    <nav class="row wrap onglets" aria-label="Culture">
      ${ONGLETS.map(o => `<a class="btn ghost sm" href="#/cultura${o.id ? '/' + o.id : ''}" aria-current="${o.id === onglet ? 'page' : 'false'}">${o.label}</a>`).join('')}
    </nav>
    <div id="zone"></div>`;
  const zone = $('#zone', el);

  if (onglet === 'fiestas') {
    const f = (FIESTAS as Fiesta[]).find(x => x.id === id);
    if (!f) {
      zone.innerHTML = `<div class="tools">${(FIESTAS as Fiesta[]).map(x => `
        <a class="panel tool-card" href="#/cultura/fiestas/${x.id}"><span class="ico" aria-hidden="true">${x.icon}</span>
          <strong lang="es">${esc(x.nom)}</strong><span class="es" lang="es">${esc(x.quand)}</span><span class="muted small">${esc(x.pays)} · ${x.niveaux.join(', ')}</span></a>`).join('')}</div>`;
    } else {
      zone.innerHTML = `
        <a class="btn ghost sm" href="#/cultura/fiestas">← Toutes les fêtes</a>
        <section class="panel stage fiesta" id="stage">
          <button class="btn ghost sm fs-exit" id="fs-exit">Quitter le plein écran</button>
          <div class="fiesta-tete"><span class="count" aria-hidden="true">${f.icon}</span>
            <div><h2 lang="es">${esc(f.nom)}</h2><p class="big" lang="es">${esc(f.pays)} · ${esc(f.quand)}</p></div></div>
          <ul class="fiesta-texte">${f.texte.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <h3 lang="es">Vocabulario</h3>${vocabListe(f.vocab)}
          <p class="confirm"><strong>💡 En classe :</strong> ${esc(f.activite)}</p>
          <button class="btn ghost sm" id="fs">⛶ Projeter</button>
        </section>`;
      $$('[data-say]', zone).forEach(b => b.onclick = () => dire(f.vocab[Number(b.dataset.say)][0]));
      $('#fs', zone).onclick = () => toggleFullscreen($('#stage', zone));
      $('#fs-exit', zone).onclick = exitFullscreen;
    }
  } else if (onglet === 'fotos') {
    const p = (FOTOS as Foto[]).find(x => x.id === id);
    if (!p) {
      zone.innerHTML = `
        <p class="muted">Une photo projetée, des questions en espagnol : les élèves décrivent à l’oral ou à l’écrit.</p>
        <div class="fotos">${(FOTOS as Foto[]).map(x => `
          <a class="foto-vignette" href="#/cultura/fotos/${x.id}"><img src="${x.fichier}" alt="Photo à décrire n° ${(FOTOS as Foto[]).indexOf(x) + 1}" loading="lazy"><span>Foto ${(FOTOS as Foto[]).indexOf(x) + 1}</span></a>`).join('')}</div>`;
    } else {
      let aide = false, lieu = false;
      zone.innerHTML = `<a class="btn ghost sm" href="#/cultura/fotos">← Toutes les photos</a><section class="panel stage foto-stage" id="stage"></section>`;
      const stage = $('#stage', zone);
      const draw = () => {
        stage.innerHTML = `
            <button class="btn ghost sm fs-exit" id="fs-exit">Quitter le plein écran</button>
            <figure class="foto-grande">
              <img src="${p.fichier}" alt="Photo à décrire${lieu ? ' : ' + esc(p.lieu) : ''}">
              <figcaption class="credit">Photo : ${esc(p.credit.auteur)} · ${esc(p.credit.licence)} · Wikimedia Commons</figcaption>
            </figure>
            <div class="foto-cote">
              <h2 lang="es">Describe la foto</h2>
              <ol class="phrases" lang="es">${p.preguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>
              ${aide ? `<div class="panel"><h3 lang="es">Ayuda</h3>${vocabListe(p.vocab)}<p class="small" lang="es">${AIDE_DESCRIPTION.map(esc).join(' · ')}</p></div>` : ''}
              ${lieu ? `<p class="confirm"><strong lang="es">📍 ${esc(p.lieu)}</strong> (${esc(p.pays)})<br>${esc(p.quoi)}</p>` : ''}
              <div class="row wrap">
                <button class="btn ghost sm" id="aide">${aide ? 'Cacher' : 'Afficher'} l’aide</button>
                <button class="btn sm" id="lieu">${lieu ? 'Cacher' : '📍 Révéler'} le lieu</button>
                <button class="btn ghost sm" id="fs">⛶ Projeter</button>
              </div>
            </div>`;
        $$('[data-say]', zone).forEach(b => b.onclick = () => dire(p.vocab[Number(b.dataset.say)][0]));
        $('#aide', zone).onclick = () => { aide = !aide; draw(); };
        $('#lieu', zone).onclick = () => { lieu = !lieu; draw(); };
        $('#fs', zone).onclick = () => toggleFullscreen(stage);
        $('#fs-exit', zone).onclick = exitFullscreen;
      };
      draw();
    }
  } else {
    stop = mundo(zone, new URLSearchParams());
  }
  return () => { if (typeof stop === 'function') stop(); exitFullscreen(); };
};

export const CREDITS_PHOTOS = (FOTOS as Foto[]).map(p => p.credit && { ...p.credit, lieu: p.lieu });
