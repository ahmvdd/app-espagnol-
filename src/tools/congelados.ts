import type { Tool } from './index';
import { beep, gong } from '../lib/sound';
import { speak } from '../lib/speech';
import { state } from '../lib/state';
import { exitFullscreen } from '../lib/fullscreen';
import { $, timers, onKeys } from '../lib/ui';

const NUMEROS = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco'];

const STATUE = `
  <div class="statue" aria-hidden="true">
    <i class="head"></i><i class="body"></i><i class="arm l"></i><i class="arm r"></i><i class="leg l"></i><i class="leg r"></i>
    ${Array.from({ length: 12 }, (_, i) => `<b class="flake" style="--x:${(i * 37) % 100}%;--d:${(i % 5) * 0.7}s">❄</b>`).join('')}
  </div>`;

const congelados: Tool = el => {
  const t = timers();
  let phase: 'idle' | 'count' | 'frozen' = 'idle';
  const stage = el.closest<HTMLElement>('.stage') ?? el;

  const idle = () => {
    t.clear();
    phase = 'idle';
    stage.classList.remove('cong-full');
    exitFullscreen();
    el.innerHTML = `
      <div class="center">
        <p class="big">Compte à rebours, puis tout le monde s’arrête net.</p>
        <button class="btn bigbtn" id="go">❄ ¡Congelados!</button>
        <p class="muted small">Touche Espace pour lancer · Échap ou un clic pour sortir</p>
      </div>`;
    $('#go', el).onclick = run;
  };

  const run = () => {
    if (phase !== 'idle') return;
    phase = 'count';
    stage.classList.add('cong-full');
    stage.requestFullscreen?.().catch(() => {});
    let n = 5;
    const step = () => {
      if (phase !== 'count') return;
      if (n > 0) {
        el.innerHTML = `<div class="center"><div class="count" aria-live="assertive">${n}</div><p class="big">${NUMEROS[n]}</p></div>`;
        if (!speak(NUMEROS[n], state.reglages.accent ?? 'es-ES', 1)) beep(440 + (5 - n) * 60, 0.15);
        n--;
        t.after(step, 1000);
        return;
      }
      phase = 'frozen';
      gong();
      el.innerHTML = `
        <div class="center frozen">
          ${STATUE}
          <div class="huge" aria-live="assertive">¡Congelados!</div>
          <p class="big">Nadie se mueve.</p>
          <p class="muted small">Un clic ou Échap pour reprendre</p>
        </div>`;
    };
    step();
  };

  const onClick = (e: MouseEvent) => { if (phase !== 'idle' && !(e.target as HTMLElement).closest('.fs-exit, #go')) idle(); };
  const onFs = () => { if (!document.fullscreenElement && phase !== 'idle') idle(); };
  stage.addEventListener('click', onClick);
  document.addEventListener('fullscreenchange', onFs);

  idle();
  const off = onKeys({ ' ': run, Escape: () => { if (phase !== 'idle') idle(); } });
  return () => {
    t.clear(); off();
    stage.classList.remove('cong-full');
    stage.removeEventListener('click', onClick);
    document.removeEventListener('fullscreenchange', onFs);
  };
};

export default congelados;
