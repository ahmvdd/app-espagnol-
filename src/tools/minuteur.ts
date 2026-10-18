import type { Tool } from './index';
import { beep, chime } from '../lib/sound';
import { startTimer, type Timer } from '../lib/timer';
import { $, $$, onKeys, toast } from '../lib/ui';

const PRESETS = [30, 60, 120, 180, 300, 600];
const MAX = 3600;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const label = (s: number) => (s < 60 ? `${s} s` : `${s / 60} min`);

/** « 2:30 », « 2 », « 90s » → secondes. */
export function parseDuree(v: string): number | null {
  const s = v.trim().toLowerCase().replace(/\s/g, '');
  let m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  if ((m = s.match(/^(\d+)s$/))) return Number(m[1]);
  if ((m = s.match(/^(\d+)(min|m)?$/))) return Number(m[1]) * 60;
  return null;
}

const minuteur: Tool = (el, params) => {
  let total = Math.min(MAX, Number(params.get('t')) || 300);
  let left = total;
  let timer: Timer | null = null;

  el.innerHTML = `
    <div class="center minuteur" id="root">
      <div class="row wrap center-row" role="group" aria-label="Durée">
        ${PRESETS.map(s => `<button class="btn ghost sm" data-s="${s}">${label(s)}</button>`).join('')}
        <form class="row" id="free">
          <input id="free-in" placeholder="min:s" aria-label="Durée libre, par exemple 2:30" size="5" inputmode="numeric" />
          <button class="btn ghost sm">OK</button>
        </form>
      </div>
      <div class="clock" id="clock" role="timer" aria-live="off"></div>
      <p class="alerte-ico" id="ico" aria-hidden="true"></p>
      <p class="huge win" id="msg" aria-live="assertive"></p>
      <div class="row wrap center-row">
        <button class="btn ghost" id="minus">− 30 s</button>
        <button class="btn bigbtn" id="go"></button>
        <button class="btn ghost" id="plus">+ 30 s</button>
      </div>
      <button class="btn ghost sm" id="reset">Remettre à zéro</button>
      <p class="muted small">Touche Espace : démarrer / pause</p>
    </div>`;
  const root = $('#root', el), clock = $('#clock', el), msg = $('#msg', el), go = $('#go', el), ico = $('#ico', el);

  const running = () => !!timer?.running();
  const show = () => {
    const last = left <= 10 && left > 0 && !!timer;
    clock.textContent = fmt(left);
    root.classList.toggle('alerte', last);
    ico.textContent = last ? '⏳ Plus que quelques secondes' : '';
    clock.classList.toggle('done', left === 0);
    msg.textContent = left === 0 ? '¡Tiempo!' : '';
    go.textContent = running() ? 'Pause' : left === 0 ? 'Recommencer' : left < total ? 'Reprendre' : 'Démarrer';
  };
  const onTick = (l: number) => {
    if (l === 10 && left > 10) beep(520, 0.3);
    left = l; show();
  };
  const onEnd = () => { left = 0; chime(); show(); };

  const start = () => {
    if (timer && !timer.running() && left > 0) { timer.resume(); show(); return; }
    if (left === 0) left = total;
    timer?.stop();
    timer = startTimer(left, onEnd, onTick);
    show();
  };
  const pause = () => { timer?.pause(); show(); };
  const set = (s: number) => { timer?.stop(); timer = null; total = left = Math.min(MAX, Math.max(1, s)); show(); };
  const shift = (d: number) => {
    if (!timer || left === 0) return set(Math.max(10, left + d));
    timer.add(d);
    left = timer.left(); total = Math.max(total, left); show();
  };
  const toggle = () => (running() ? pause() : start());

  $$('[data-s]', el).forEach(b => b.onclick = () => set(Number(b.dataset.s)));
  $<HTMLFormElement>('#free', el).onsubmit = e => {
    e.preventDefault();
    const inp = $<HTMLInputElement>('#free-in', el);
    const s = parseDuree(inp.value);
    if (!s || s > MAX) return toast('Durée invalide : écris par exemple 2:30 ou 4');
    set(s); inp.value = ''; go.focus();
  };
  go.onclick = toggle;
  $('#minus', el).onclick = () => shift(-30);
  $('#plus', el).onclick = () => shift(30);
  $('#reset', el).onclick = () => set(total);
  const off = onKeys({ ' ': toggle });
  show();

  return () => { timer?.stop(); off(); };
};

export default minuteur;
