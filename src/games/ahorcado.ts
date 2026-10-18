import type { Game } from './engine';
import { sansAccent } from '../lib/questions';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { beep, chime } from '../lib/sound';
import { $, $$, esc, pick } from '../lib/ui';

const CLAVIER = 'abcdefghijklmnñopqrstuvwxyz'.split('');
const MAX = 7;

/** Potence dessinée en 7 étapes. */
const dessin = (e: number) => `
  <svg class="pendu" viewBox="0 0 120 140" role="img" aria-label="${e} erreur(s) sur ${MAX}">
    <g stroke="currentColor" stroke-width="5" stroke-linecap="round" fill="none">
      ${e > 0 ? '<path d="M10 130 H70"/>' : ''}
      ${e > 1 ? '<path d="M30 130 V10 H85 V25"/>' : ''}
      ${e > 2 ? '<circle cx="85" cy="38" r="13"/>' : ''}
      ${e > 3 ? '<path d="M85 51 V90"/>' : ''}
      ${e > 4 ? '<path d="M85 62 L68 78 M85 62 L102 78"/>' : ''}
      ${e > 5 ? '<path d="M85 90 L70 115"/>' : ''}
      ${e > 6 ? '<path d="M85 90 L100 115"/>' : ''}
    </g>
  </svg>`;

const ahorcado: Game = (el, ctx) => {
  let mot: [string, string], essais: Set<string>, erreurs: number, indice: boolean, fin: '' | 'gagne' | 'perdu';

  const nouveau = () => {
    const simples = ctx.theme.vocab.filter(([es]) => es.length <= 18);
    mot = pick(simples.length ? simples : ctx.theme.vocab);
    essais = new Set(); erreurs = 0; indice = false; fin = '';
    render();
  };
  const lettres = () => new Set([...sansAccent(mot[0].toLowerCase())].filter(ch => CLAVIER.includes(ch)));

  const jouer = (l: string) => {
    if (fin || essais.has(l)) return;
    essais.add(l);
    if (lettres().has(l)) beep(760, 0.08); else { erreurs++; beep(220, 0.15); }
    if ([...lettres()].every(x => essais.has(x))) { fin = 'gagne'; chime(); speak(mot[0], state.reglages.accent ?? 'es-ES'); }
    else if (erreurs >= MAX) fin = 'perdu';
    render();
  };

  const render = () => {
    const affiche = [...mot[0]].map(ch => {
      const n = sansAccent(ch.toLowerCase());
      if (!CLAVIER.includes(n)) return ch === ' ' ? '<span class="gap"></span>' : `<span class="sym">${esc(ch)}</span>`;
      return `<span class="case">${essais.has(n) || fin === 'perdu' ? esc(ch) : ''}</span>`;
    }).join('');
    el.innerHTML = `
      <div class="ahorcado">
        ${dessin(erreurs)}
        <div class="center">
          <div class="mot" lang="es" aria-label="Mot à deviner">${affiche}</div>
          <p class="muted">Erreurs : ${erreurs} / ${MAX}</p>
          ${indice || fin ? `<p class="big">« ${esc(mot[1])} »</p>` : '<button class="btn ghost sm" id="indice">💡 Indice (traduction)</button>'}
          ${fin === 'gagne' ? '<p class="huge win">¡Correcto!</p>' : ''}
          ${fin === 'perdu' ? `<p class="big">La palabra era : <strong lang="es">${esc(mot[0])}</strong></p>` : ''}
          ${fin === 'gagne' && ctx.teams.length ? `<div class="row wrap center-row">${ctx.teams.map((t, k) => `<button class="btn" data-t="${k}">+1 ${t.icon} ${esc(t.nom)}</button>`).join('')}</div>` : ''}
          ${fin ? '<button class="btn bigbtn" id="next">Otra palabra</button>' : ''}
        </div>
      </div>
      ${fin ? '' : `<div class="clavier" role="group" aria-label="Lettres">${CLAVIER.map(l =>
        `<button class="touche ${essais.has(l) ? (lettres().has(l) ? 'bonne' : 'fausse') : ''}" data-l="${l}" ${essais.has(l) ? 'disabled' : ''}
          aria-label="${l}${essais.has(l) ? (lettres().has(l) ? ', trouvée' : ', absente') : ''}">${l.toUpperCase()}</button>`).join('')}</div>
        <p class="muted small center">Tape les lettres au clavier ou clique dessus. Les accents comptent comme la lettre simple.</p>`}`;
    $$('[data-l]', el).forEach(b => b.onclick = () => jouer(b.dataset.l!));
    $('#indice', el)?.addEventListener('click', () => { indice = true; render(); });
    $('#next', el)?.addEventListener('click', nouveau);
    $$('[data-t]', el).forEach(b => b.onclick = () => { ctx.point(Number(b.dataset.t)); nouveau(); });
  };

  const key = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input,textarea,select') || e.ctrlKey || e.metaKey || e.altKey) return;
    const l = e.key.toLowerCase();
    if (CLAVIER.includes(l)) { e.preventDefault(); jouer(l); }
  };
  addEventListener('keydown', key);
  nouveau();
  return () => removeEventListener('keydown', key);
};

export default ahorcado;
