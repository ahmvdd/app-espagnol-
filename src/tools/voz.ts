import type { Tool } from './index';
import { $$, onKeys } from '../lib/ui';

const NIVELES = [
  { icon: '🤐', es: 'Silencio', fr: 'Silence total' },
  { icon: '🤫', es: 'Susurro', fr: 'On chuchote avec son voisin' },
  { icon: '👥', es: 'Voz de pareja', fr: 'On parle à deux, à voix basse' },
  { icon: '📢', es: 'Voz de clase', fr: 'Voix claire, pour toute la classe' }
];

let current = 0;

const voz: Tool = (el, params) => {
  const n = Number(params.get('n'));
  if (params.has('n') && n >= 0 && n <= 3) current = n;

  const render = () => {
    const v = NIVELES[current];
    el.innerHTML = `
      <div class="row wrap center-row" role="group" aria-label="Niveau de voix">
        ${NIVELES.map((x, i) => `<button class="btn ghost" data-n="${i}" aria-pressed="${i === current}">${i} · ${x.es}</button>`).join('')}
      </div>
      <div class="center voz" aria-live="polite">
        <div class="count">${v.icon}</div>
        <div class="meter" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= current ? 'on' : ''}"></i>`).join('')}</div>
        <div class="huge">${current} · ${v.es}</div>
        <p class="big">${v.fr}</p>
      </div>
      <p class="muted small center">Touches 0 à 3 pour changer de niveau</p>`;
    $$('[data-n]', el).forEach(b => b.onclick = () => { current = Number(b.dataset.n); render(); });
  };

  render();
  return onKeys(Object.fromEntries([0, 1, 2, 3].map(i => [String(i), () => { current = i; render(); }])));
};

export default voz;
