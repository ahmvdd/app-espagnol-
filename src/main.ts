import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/opendyslexic/400.css';
import '@fontsource/opendyslexic/700.css';
import './styles/tokens.css';
import './styles/base.css';

import { registerSW } from 'virtual:pwa-register';
import { route, start } from './router';
import { requestPersistence, shouldRemindBackup } from './lib/storage';
import { state, update, subscribe } from './lib/state';
import { setMuted, setVolume } from './lib/sound';
import { $ } from './lib/ui';
import { activerAides } from './lib/aide';

import { inicio } from './pages/inicio';
import { herramientas } from './pages/herramientas';
import { juegos } from './pages/juegos';
import { profe } from './pages/profe';
import { sos } from './pages/sos';
import { nivel } from './pages/nivel';
import { aide } from './pages/aide';
import { importer } from './pages/importer';
import { cultura } from './pages/cultura';
import { doc } from './pages/doc';
import { programme } from './pages/programme';
import { espace, LIBELLES } from './pages/espace';
import { demarrer, espaceActif, getStatut, onStatut } from './lib/sync';

registerSW({ immediate: true });
activerAides();
requestPersistence();

// Bouton muet toujours visible
const mute = $('#btn-mute');
const applyReglages = () => {
  const r = state.reglages;
  setMuted(r.muet);
  setVolume(r.volume);
  document.documentElement.dataset.font = r.police === 'dyslexie' ? 'dys' : 'std';
  mute.setAttribute('aria-pressed', String(r.muet));
  mute.textContent = r.muet ? '🔇 Muet' : '🔊 Son';
};
mute.onclick = () => update(s => { s.reglages.muet = !s.reglages.muet; });
subscribe(applyReglages);
applyReglages();

// Mode projection
const proj = $('#btn-proj');
proj.onclick = () => {
  const on = document.documentElement.dataset.proj !== 'on';
  document.documentElement.dataset.proj = on ? 'on' : 'off';
  proj.setAttribute('aria-pressed', String(on));
};

// Espace connecté : pastille d'état dans l'en-tête
const chip = $<HTMLAnchorElement>('#btn-espace');
onStatut(s => {
  const e = espaceActif();
  chip.hidden = !e;
  if (!e) return;
  chip.textContent = (s === 'ok' ? '☁️ ' : s === 'envoi' ? '⟳ ' : '⚠️ ') + e.nom;
  chip.title = LIBELLES[s];
  if (s === 'deconnecte' && !location.hash.startsWith('#/espace')) location.hash = '#/espace';
});
demarrer();

// Rappel de sauvegarde fichier (> 7 jours), inutile quand l'espace est sauvegardé en ligne
if (!espaceActif() && shouldRemindBackup(state)) {
  const r = $('#backup-reminder');
  r.hidden = false;
  r.innerHTML = 'Pense à sauvegarder tes classes 💾 <a href="#/profe">Sauvegarder maintenant</a>';
}

route('/', inicio);
route('/herramientas', herramientas);
route('/juegos', juegos);
route('/profe', profe);
route('/sos', sos);
route('/aide', aide);
route('/import', importer);
route('/cultura', cultura);
route('/doc', doc);
route('/programme', programme);
route('/espace', espace);
route('/nivel', nivel); // #/nivel/5e, #/nivel/4e, #/nivel/3e
// Accès réservé : sans espace connecté, seules l'aide et la page de connexion sont ouvertes
start($('#app'), path => {
  // /doc : documents de cours (aucune donnée d'élève), ouverts aussi pour la génération des PDF
  if (path.startsWith('/espace') || path.startsWith('/aide') || path.startsWith('/doc')) return null;
  return !espaceActif() || getStatut() === 'deconnecte' ? '/espace' : null;
});
