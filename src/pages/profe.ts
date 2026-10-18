import type { View } from '../router';
import { renderClasses } from './profe/classes';
import { renderReglages, renderSauvegardes } from './profe/sauvegardes';
import { $ } from '../lib/ui';

export const profe: View = el => {
  el.innerHTML = `
    <h1>Profe</h1>
    <p class="muted">Tout reste sur cet appareil. Pense à sauvegarder dans un fichier de temps en temps.</p>
    <h2>Mes classes</h2><div id="classes"></div>
    <h2>Réglages</h2><div id="reglages"></div>
    <h2>Sauvegardes</h2><div id="sauvegardes"></div>`;
  renderClasses($('#classes', el));
  renderReglages($('#reglages', el));
  renderSauvegardes($('#sauvegardes', el));
};
