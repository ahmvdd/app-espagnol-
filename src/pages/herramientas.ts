import type { View } from '../router';
import { TOOLS, toolCard } from '../tools';
import { $, toast } from '../lib/ui';

export const herramientas: View = el => {
  const [id, query = ''] = (location.hash.split('/')[2] ?? '').split('?');
  const tool = TOOLS.find(t => t.id === id);

  if (!tool) {
    el.innerHTML = `<h1>Outils</h1><div class="tools">${TOOLS.map(t => toolCard(t)).join('')}</div>`;
    return;
  }

  el.innerHTML = `
    <div class="row head">
      <a class="btn ghost sm" href="#/herramientas">← Outils</a>
      <h1>${tool.icon} ${tool.nom}</h1>
      <button class="btn ghost sm" id="fs">⛶ Plein écran</button>
    </div>
    <section class="panel stage" id="stage">
      <button class="btn ghost sm fs-exit" id="fs-exit">Quitter le plein écran</button>
      <div id="tool"></div>
    </section>`;

  const stage = $('#stage', el);
  $('#fs', el).onclick = () => stage.requestFullscreen?.().catch(() => toast('Plein écran indisponible sur ce navigateur'));
  $('#fs-exit', el).onclick = () => void document.exitFullscreen?.();

  const stop = tool.run($('#tool', el), new URLSearchParams(query));
  return () => {
    if (typeof stop === 'function') stop();
    if (document.fullscreenElement) void document.exitFullscreen();
  };
};
