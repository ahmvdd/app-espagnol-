import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource-variable/bricolage-grotesque';
import './styles/tokens.css';
import './styles/base.css';

import { registerSW } from 'virtual:pwa-register';
import { route, start } from './router';
import { requestPersistence, shouldRemindBackup } from './lib/storage';
import { data, commit } from './lib/store';
import { setMuted, setVolume } from './lib/sound';
import { $ } from './lib/ui';

import { inicio } from './pages/inicio';
import { herramientas } from './pages/herramientas';
import { juegos } from './pages/juegos';
import { profe } from './pages/profe';
import { sos } from './pages/sos';
import { nivel } from './pages/nivel';

registerSW({ immediate: true });
requestPersistence();

setMuted(data.reglages.muet);
setVolume(data.reglages.volume);

// Bouton muet toujours visible
const mute = $('#btn-mute');
const syncMute = () => {
  mute.setAttribute('aria-pressed', String(data.reglages.muet));
  mute.textContent = data.reglages.muet ? '🔇 Muet' : '🔊 Son';
};
mute.onclick = () => { data.reglages.muet = !data.reglages.muet; setMuted(data.reglages.muet); commit(); syncMute(); };
syncMute();

// Mode projection
const proj = $('#btn-proj');
proj.onclick = () => {
  const on = document.documentElement.dataset.proj !== 'on';
  document.documentElement.dataset.proj = on ? 'on' : 'off';
  proj.setAttribute('aria-pressed', String(on));
};

// Rappel de sauvegarde (> 7 jours)
if (shouldRemindBackup(data)) {
  const r = $('#backup-reminder');
  r.hidden = false;
  r.innerHTML = 'Pense à sauvegarder tes classes 💾 <a href="#/profe">Sauvegarder maintenant</a>';
}

route('/', inicio);
route('/herramientas', herramientas);
route('/juegos', juegos);
route('/profe', profe);
route('/sos', sos);
route('/nivel', nivel); // #/nivel/5e, #/nivel/4e, #/nivel/3e
start($('#app'));
