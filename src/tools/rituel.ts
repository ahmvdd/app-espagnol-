import type { Tool } from './index';
import { NIVEAUX, THEMES, dernierTheme, palabraDelDia, type Niveau } from '../lib/content';
import { startTimer, type Timer } from '../lib/timer';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { chime } from '../lib/sound';
import { $, $$, esc, pick } from '../lib/ui';

const CONSIGNES = [
  'Buenos días. Siéntate, saca tu cuaderno y escribe la fecha.',
  'Hola a todos. Sacad el cuaderno y copiad la fecha en español.',
  'Entramos en silencio, nos sentamos y sacamos las cosas.'
];

/** Mini-défis tirés au sort à partir du thème du niveau. */
function defi(n: Niveau): string {
  const t = dernierTheme(n);
  const [es, fr] = pick(t.vocab);
  return pick([
    `Traduce al español : « ${fr} »`,
    `¿Qué significa « ${es} » ?`,
    `Escribe tres palabras del tema « ${t.titre} ».`,
    `Escribe una frase con « ${es} ».`,
    t.parole.length ? pick(t.parole) : `Escribe dos palabras del tema « ${t.titre} ».`
  ]);
}

let niveau: Niveau = '5e';

const rituel: Tool = el => {
  let timer: Timer | null = null;
  const consigne = pick(CONSIGNES);
  const fecha = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let texteDefi = defi(niveau);

  const render = (left = 180) => {
    el.innerHTML = `
      <div class="center">
        <div class="row wrap center-row" role="group" aria-label="Niveau">
          ${NIVEAUX.map(n => `<button class="btn ghost sm" data-n="${n}" aria-pressed="${n === niveau}">${n} · ${esc(THEMES[n][0] && dernierTheme(n).titre)}</button>`).join('')}
        </div>
        <p class="big" lang="es">${esc(consigne)}</p>
        <p class="pill" lang="es">${esc(fecha)}</p>
        <div class="clock small-clock" id="clock" role="timer">${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</div>
        <section class="panel defi">
          <p class="muted">Mini-reto</p>
          <p class="big" lang="es">${esc(texteDefi)}</p>
          <button class="btn ghost sm" id="autre">Otro reto</button>
        </section>
        <div class="row wrap center-row">
          <button class="btn bigbtn" id="go">${timer ? 'Recommencer' : '▶ Lancer les 3 minutes'}</button>
          <button class="btn ghost" id="say">🔊 Lire la consigne</button>
        </div>
        <p class="muted small">Palabra del día : <strong lang="es">${esc(palabraDelDia().es)}</strong></p>
      </div>`;
    $$('[data-n]', el).forEach(b => b.onclick = () => { niveau = b.dataset.n as Niveau; texteDefi = defi(niveau); render(); });
    $('#autre', el).onclick = () => { texteDefi = defi(niveau); render(timer?.left() ?? 180); };
    $('#say', el).onclick = () => speak(consigne, state.reglages.accent ?? 'es-ES');
    $('#go', el).onclick = () => {
      timer?.stop();
      timer = startTimer(180, () => { chime(); const c = $('#clock', el); if (c) c.textContent = '¡Empezamos!'; }, l => {
        const c = $('#clock', el); if (c) c.textContent = `${Math.floor(l / 60)}:${String(l % 60).padStart(2, '0')}`;
      });
      render(180);
    };
  };

  render();
  return () => timer?.stop();
};

export default rituel;
