import type { View } from '../router';
import { renderClasses } from './profe/classes';
import { renderReglages, renderSauvegardes } from './profe/sauvegardes';
import { renderSuivi } from './profe/suivi';
import { renderCarnet } from './profe/carnet';
import { renderSequences } from './profe/sequences';
import { $ } from '../lib/ui';
import { btnAide } from '../lib/aide';

const ONGLETS = [
  { id: '', label: '👥 Classes et sauvegardes' },
  { id: 'suivi', label: '📈 Suivi des chapitres' },
  { id: 'carnet', label: '📓 Carnet de bord' },
  { id: 'sequences', label: '🗂 Séquences' }
];

export const profe: View = el => {
  const onglet = location.hash.split('/')[2]?.split('?')[0] ?? '';
  el.innerHTML = `
    <h1>Profe ${btnAide('profe')}</h1>
    <nav class="row wrap onglets" aria-label="Espace Profe">
      ${ONGLETS.map(o => `<a class="btn ghost sm" href="#/profe${o.id ? '/' + o.id : ''}" aria-current="${o.id === onglet ? 'page' : 'false'}">${o.label}</a>`).join('')}
    </nav>
    <div id="onglet"></div>`;
  const zone = $('#onglet', el);

  if (onglet === 'suivi') return renderSuivi(zone);
  if (onglet === 'carnet') return renderCarnet(zone);
  if (onglet === 'sequences') return renderSequences(zone);

  zone.innerHTML = `
    <p class="muted">Tes données sont gardées sur cet appareil et sauvegardées automatiquement dans ton espace en ligne. Le fichier de sauvegarde reste possible en secours.</p>
    <h2>Mes classes</h2><div id="classes"></div>
    <h2>Réglages</h2><div id="reglages"></div>
    <h2>Sauvegardes</h2><div id="sauvegardes"></div>`;
  renderClasses($('#classes', zone));
  renderReglages($('#reglages', zone));
  renderSauvegardes($('#sauvegardes', zone));
};
