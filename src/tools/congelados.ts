import type { Tool } from './index';
import { beep, gong } from '../lib/sound';
import { $, timers, onKeys } from '../lib/ui';

const congelados: Tool = el => {
  const t = timers();
  let running = false;

  const idle = () => {
    running = false;
    el.innerHTML = `
      <div class="center">
        <p class="big">Compte à rebours, puis tout le monde s’arrête net.</p>
        <button class="btn bigbtn" id="go">❄ ¡Congelados!</button>
        <p class="muted small">Touche Espace pour lancer</p>
      </div>`;
    $('#go', el).onclick = run;
  };

  const run = () => {
    if (running) return;
    running = true;
    let n = 5;
    const step = () => {
      if (n > 0) {
        el.innerHTML = `<div class="center"><div class="count" aria-live="assertive">${n}</div></div>`;
        beep(440 + (5 - n) * 60, 0.15);
        n--;
        t.after(step, 1000);
        return;
      }
      gong();
      el.innerHTML = `
        <div class="center frozen">
          <div class="count" aria-hidden="true">❄</div>
          <div class="huge win" aria-live="assertive">¡Congelados!</div>
          <p class="big">Nadie se mueve.</p>
          <button class="btn ghost" id="back">Retour</button>
        </div>`;
      $('#back', el).onclick = idle;
    };
    step();
  };

  idle();
  const off = onKeys({ ' ': run });
  return () => { t.clear(); off(); };
};

export default congelados;
