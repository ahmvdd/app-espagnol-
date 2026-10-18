import type { Game } from './engine';
import { winnerText } from './engine';
import { sansAccent } from '../lib/questions';
import { beep, chime } from '../lib/sound';
import { $, esc, onKeys, shuffle } from '../lib/ui';

const ABC = 'ABCDEFGHIJLMNÑOPQRSTUVXYZ'.split('');
const ARTICLES = /^(el|la|los|las|un|una|unos|unas)\s+/i;

type Etat = 'attente' | 'ok' | 'ko' | 'pasa';
type Case = { l: string; es: string; fr: string; mode: 'Empieza' | 'Contiene'; etat: Etat };

const ICON: Record<Etat, string> = { attente: '', ok: '✓', ko: '✗', pasa: '⏭' };

/** Une entrée par lettre : d'abord un mot qui commence par la lettre, sinon un mot qui la contient. */
function buildRosco(vocab: [string, string][]): Case[] {
  const pool = shuffle(vocab);
  const used = new Set<string>();
  return ABC.flatMap<Case>(l => {
    const low = l.toLowerCase();
    const norm = (es: string) => sansAccent(es.toLowerCase().replace(ARTICLES, ''));
    const start = pool.find(([es]) => !used.has(es) && norm(es).startsWith(low));
    const cont = start ?? pool.find(([es]) => !used.has(es) && norm(es).includes(low));
    if (!cont) return [];
    used.add(cont[0]);
    return [{ l, es: cont[0], fr: cont[1], mode: start ? 'Empieza' : 'Contiene', etat: 'attente' }];
  });
}

const rosco: Game = (el, ctx) => {
  let cases = buildRosco(ctx.theme.vocab), i = 0, montre = false;

  const suivante = () => {
    const n = cases.length;
    for (let k = 1; k <= n; k++) {
      const j = (i + k) % n;
      if (cases[j].etat === 'attente' || cases[j].etat === 'pasa') { i = j; montre = false; return true; }
    }
    return false;
  };
  const fini = () => !cases.some(c => c.etat === 'attente' || c.etat === 'pasa');

  const marquer = (etat: Etat) => {
    const c = cases[i];
    c.etat = etat;
    if (etat === 'ok') { ctx.turn() >= 0 && ctx.point(ctx.turn()); beep(880, 0.15); }
    else { beep(etat === 'ko' ? 220 : 520, 0.15); ctx.nextTurn(); }
    if (etat === 'ko') { montre = true; render(); return; }
    if (!suivante()) return render();
    render();
  };

  const render = () => {
    const ok = cases.filter(c => c.etat === 'ok').length, ko = cases.filter(c => c.etat === 'ko').length;
    if (fini() && !montre) {
      chime();
      el.innerHTML = `
        <div class="center">
          <div class="huge win">${esc(winnerText(ctx.teams))}</div>
          <p class="big">✓ ${ok} aciertos · ✗ ${ko} fallos</p>
          <button class="btn bigbtn" id="again">Nouveau rosco</button>
        </div>`;
      $('#again', el).onclick = () => { cases = buildRosco(ctx.theme.vocab); i = 0; render(); };
      return;
    }
    const c = cases[i];
    const n = cases.length;
    el.innerHTML = `
      <div class="rosco-wrap">
        <div class="rosco" style="--n:${n}">
          ${cases.map((x, k) => `<span class="letra ${x.etat} ${k === i ? 'actual' : ''}" style="--k:${k}" title="${x.l}">${x.l}<small>${ICON[x.etat]}</small></span>`).join('')}
          <div class="rosco-centro">
            <p class="pill">${c.mode === 'Empieza' ? 'Empieza por' : 'Contiene la'} ${c.l}</p>
            <p class="big">« ${esc(c.fr)} »</p>
            ${montre || c.etat === 'ko' ? `<p class="big win" lang="es">${esc(c.es)}</p>` : ''}
            <p class="muted small">✓ ${ok} · ✗ ${ko}</p>
          </div>
        </div>
        <div class="row wrap center-row">
          ${c.etat === 'ko' ? '<button class="btn bigbtn" id="go">Continuer →</button>' : `
            <button class="btn ok" id="ok">✓ Correcto</button>
            <button class="btn ghost" id="pasa">⏭ Pasapalabra</button>
            <button class="btn warn" id="ko">✗ Error</button>`}
        </div>
        <p class="muted small center">Dire le mot espagnol qui correspond · touches C (correct), P (pasapalabra), E (erreur)</p>
      </div>`;
    $('#ok', el)?.addEventListener('click', () => marquer('ok'));
    $('#pasa', el)?.addEventListener('click', () => marquer('pasa'));
    $('#ko', el)?.addEventListener('click', () => marquer('ko'));
    $('#go', el)?.addEventListener('click', () => { montre = false; suivante(); render(); });
  };

  if (!cases.length) { el.innerHTML = '<p class="center big">Pas assez de vocabulaire pour un rosco.</p>'; return; }
  render();
  return onKeys({
    c: () => $('#ok', el)?.click(), p: () => $('#pasa', el)?.click(), e: () => $('#ko', el)?.click(),
    ' ': () => $('#go', el)?.click()
  });
};

export default rosco;
