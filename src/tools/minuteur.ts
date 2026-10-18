import type { Tool } from './index';
import { beep, chime } from '../lib/sound';
import { startTimer, type Timer } from '../lib/timer';
import { $, $$, onKeys, toast } from '../lib/ui';

const PRESETS = [30, 60, 120, 180, 300, 600];
const MAX = 3600;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const label = (s: number) => (s < 60 ? `${s} s` : `${s / 60} min`);

const THEMES = [
  { id: 'chiffres', label: '🔢 Chiffres' }, { id: 'sablier', label: '⏳ Sablier' },
  { id: 'meche', label: '🧨 Mèche' }, { id: 'tortilla', label: '🥘 Tortilla' }, { id: 'fusee', label: '🚀 Fusée' }
] as const;
type Visuel = typeof THEMES[number]['id'];
const PREF = 'rincon.minuteurTheme';
let visuel: Visuel = (() => { try { return (localStorage.getItem(PREF) as Visuel) || 'chiffres'; } catch { return 'chiffres'; } })();

/** Représentation du temps restant (frac de 1 à 0). */
function dessin(v: Visuel, frac: number): string {
  const f = Math.max(0, Math.min(1, frac));
  switch (v) {
    case 'sablier': return `
      <svg viewBox="0 0 100 140" class="vis-sablier" aria-hidden="true">
        <clipPath id="haut"><path d="M15 10 H85 L52 68 H48 Z"/></clipPath>
        <clipPath id="bas"><path d="M48 72 H52 L85 130 H15 Z"/></clipPath>
        <rect clip-path="url(#haut)" x="0" y="${10 + 58 * (1 - f)}" width="100" height="${58 * f + 1}" class="sable"/>
        <rect clip-path="url(#bas)" x="0" y="${130 - 58 * (1 - f)}" width="100" height="${58 * (1 - f) + 1}" class="sable"/>
        ${f > 0 && f < 1 ? '<rect x="49" y="66" width="2" height="62" class="sable"/>' : ''}
        <path d="M10 6 H90 M10 134 H90 M15 10 L48 68 V72 L15 130 M85 10 L52 68 V72 L85 130" class="verre"/>
      </svg>`;
    case 'meche': return `
      <div class="vis-meche" aria-hidden="true"><div class="fil" style="width:${f * 100}%"><span>${f > 0 ? '🔥' : ''}</span></div><b>${f > 0 ? '💣' : '💥'}</b></div>`;
    case 'tortilla': return `
      <div class="vis-tortilla" aria-hidden="true" style="--f:${f * 360}deg"><span>${f > 0 ? '' : '🍽'}</span></div>`;
    case 'fusee': return `
      <div class="vis-fusee" aria-hidden="true"><span style="bottom:${(1 - f) * 78}%">🚀</span><i>🌕</i></div>`;
    default: return '';
  }
}

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
      <div class="row wrap center-row" role="group" aria-label="Thème visuel">
        ${THEMES.map(t => `<button class="btn ghost sm" data-v="${t.id}" aria-pressed="${t.id === visuel}">${t.label}</button>`).join('')}
      </div>
      <div class="visuel" id="vis"></div>
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
  const vis = $('#vis', el), root = $('#root', el), clock = $('#clock', el), msg = $('#msg', el), go = $('#go', el), ico = $('#ico', el);

  const running = () => !!timer?.running();
  const show = () => {
    const last = left <= 10 && left > 0 && !!timer;
    clock.textContent = fmt(left);
    vis.innerHTML = dessin(visuel, total ? left / total : 0);
    root.classList.toggle('avec-visuel', visuel !== 'chiffres');
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
  $$('[data-v]', el).forEach(b => b.onclick = () => {
    visuel = b.dataset.v as Visuel;
    try { localStorage.setItem(PREF, visuel); } catch { /* ignore */ }
    $$('[data-v]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    show();
  });
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
