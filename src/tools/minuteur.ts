import type { Tool } from './index';
import { beep, chime } from '../lib/sound';
import { $, $$, timers, onKeys } from '../lib/ui';

const PRESETS = [30, 60, 120, 180, 300, 600];
const MAX = 3600;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const label = (s: number) => (s < 60 ? `${s} s` : `${s / 60} min`);

const minuteur: Tool = (el, params) => {
  const t = timers();
  let total = Math.min(MAX, Number(params.get('t')) || 300);
  let left = total, end = 0, running = false, warned = false;

  el.innerHTML = `
    <div class="center">
      <div class="row wrap center-row" role="group" aria-label="Durée">
        ${PRESETS.map(s => `<button class="btn ghost sm" data-s="${s}">${label(s)}</button>`).join('')}
      </div>
      <div class="clock" id="clock" role="timer"></div>
      <p class="huge win" id="msg" aria-live="assertive"></p>
      <div class="row wrap center-row">
        <button class="btn ghost" id="minus">− 30 s</button>
        <button class="btn bigbtn" id="go"></button>
        <button class="btn ghost" id="plus">+ 30 s</button>
      </div>
      <button class="btn ghost sm" id="reset">Remettre à zéro</button>
      <p class="muted small">Touche Espace : démarrer / pause</p>
    </div>`;
  const clock = $('#clock', el), msg = $('#msg', el), go = $('#go', el);

  const show = () => {
    clock.textContent = fmt(left);
    clock.classList.toggle('last', running && left <= 10);
    clock.classList.toggle('done', left === 0);
    msg.textContent = left === 0 ? '¡Tiempo!' : '';
    go.textContent = running ? 'Pause' : left === 0 ? 'Recommencer' : left < total ? 'Reprendre' : 'Démarrer';
  };
  const stop = () => { running = false; t.clear(); show(); };
  const tick = () => {
    left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    if (left > 10) warned = false;
    else if (!warned && left > 0) { warned = true; beep(520, 0.3); }
    if (left === 0) { stop(); chime(); }
    show();
  };
  const start = () => {
    if (left === 0) left = total;
    warned = left <= 10;
    end = Date.now() + left * 1000;
    running = true;
    t.every(tick, 200);
    show();
  };
  const set = (s: number) => { running = false; t.clear(); total = left = s; show(); };
  const shift = (d: number) => {
    if (!running) return set(Math.min(MAX, Math.max(10, left + d)));
    const now = Date.now();
    end = Math.min(now + MAX * 1000, Math.max(now + 1000, end + d * 1000));
    total = Math.max(total, Math.ceil((end - now) / 1000));
    tick();
  };
  const toggle = () => (running ? stop() : start());

  $$('[data-s]', el).forEach(b => b.onclick = () => set(Number(b.dataset.s)));
  go.onclick = toggle;
  $('#minus', el).onclick = () => shift(-30);
  $('#plus', el).onclick = () => shift(30);
  $('#reset', el).onclick = () => set(total);
  const off = onKeys({ ' ': toggle });
  show();

  return () => { t.clear(); off(); };
};

export default minuteur;
