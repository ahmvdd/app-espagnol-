import type { View } from '../router';
import type { Niveau } from '../content/types';
import { GAMES, gameCard } from '../games';
import { EQUIPOS, makeCtx, themeById, type Team } from '../games/engine';
import { NIVEAUX, THEMES, dernierTheme } from '../lib/content';
import { toggleFullscreen, exitFullscreen } from '../lib/fullscreen';
import { confirmModal } from '../lib/modal';
import { $, $$, esc } from '../lib/ui';

/** Réglages et scores gardés le temps de la séance, d'un jeu à l'autre. */
const session: { niveau: Niveau; themeId: string; nbEquipes: number; teams: Team[] } = {
  niveau: '5e', themeId: dernierTheme('5e').id, nbEquipes: 2, teams: []
};

const resetTeams = () => { session.teams = EQUIPOS.slice(0, session.nbEquipes).map(e => ({ ...e, score: 0 })); };
resetTeams();

export const juegos: View = el => {
  const id = location.hash.split('/')[2]?.split('?')[0];
  const game = GAMES.find(g => g.id === id);

  if (!game) {
    el.innerHTML = `<h1>Jeux <span class="es" lang="es">· Juegos</span></h1>
      <p class="muted">Choisis un jeu, puis le niveau, le thème et les équipes. Les scores sont gardés d’un jeu à l’autre pendant la séance.</p>
      <div class="tools">${GAMES.map(gameCard).join('')}</div>`;
    return;
  }

  let cleanup: void | (() => void);

  const setup = () => {
    if (typeof cleanup === 'function') cleanup();
    const themes = THEMES[session.niveau];
    if (session.themeId !== 'tous' && !themes.some(t => t.id === session.themeId)) session.themeId = themes[0].id;
    const minEq = game.needsTeams ? 2 : 0;
    if (session.nbEquipes < minEq) { session.nbEquipes = 2; resetTeams(); }
    el.innerHTML = `
      <div class="row head">
        <a class="btn ghost sm" href="#/juegos">← Jeux</a>
        <h1>${game.icon} ${esc(game.nom)} <span class="es" lang="es">· ${esc(game.es)}</span></h1>
        <span></span>
      </div>
      <section class="panel setup">
        <div class="field">Niveau
          <div class="row wrap" role="group" aria-label="Niveau">${NIVEAUX.map(n => `<button class="btn ghost" data-n="${n}" aria-pressed="${n === session.niveau}">${n}</button>`).join('')}</div>
        </div>
        <label class="field">Thème
          <select id="theme">
            ${themes.map(t => `<option value="${t.id}" ${t.id === session.themeId ? 'selected' : ''}>${esc(t.titre)} (${t.vocab.length} mots)</option>`).join('')}
            <option value="tous" ${session.themeId === 'tous' ? 'selected' : ''}>Tous les thèmes de ${session.niveau}</option>
          </select>
        </label>
        <div class="field">Équipes
          <div class="row wrap" role="group" aria-label="Nombre d'équipes">
            ${[0, 2, 3, 4].filter(n => n >= minEq).map(n => `<button class="btn ghost" data-e="${n}" aria-pressed="${n === session.nbEquipes}">${n ? `${n} équipes` : 'Toute la classe'}</button>`).join('')}
          </div>
        </div>
        ${session.teams.some(t => t.score) ? `<p class="muted">Scores en cours : ${session.teams.map(t => `${t.icon} ${esc(t.nom)} ${t.score}`).join(' · ')} <button class="btn ghost sm" id="zero">Remettre à zéro</button></p>` : ''}
        <button class="btn bigbtn" id="play">▶ ¡Jugar!</button>
      </section>`;

    $$('[data-n]', el).forEach(b => b.onclick = () => { session.niveau = b.dataset.n as Niveau; session.themeId = dernierTheme(session.niveau).id; setup(); });
    $<HTMLSelectElement>('#theme', el).onchange = e => { session.themeId = (e.target as HTMLSelectElement).value; };
    $$('[data-e]', el).forEach(b => b.onclick = () => { session.nbEquipes = Number(b.dataset.e); resetTeams(); setup(); });
    $('#zero', el)?.addEventListener('click', async () => {
      if (await confirmModal('Remettre les scores à zéro ?', 'Les points de toutes les équipes repartent à 0.', 'Remettre à zéro')) { resetTeams(); setup(); }
    });
    $('#play', el).onclick = play;
  };

  const play = () => {
    const theme = themeById(session.niveau, session.themeId);
    el.innerHTML = `
      <div class="row head">
        <button class="btn ghost sm" id="back">← Réglages</button>
        <h1>${game.icon} ${esc(game.nom)} <span class="es">· ${session.niveau} · ${esc(theme.titre)}</span></h1>
        <button class="btn ghost sm" id="fs">⛶ Plein écran</button>
      </div>
      <section class="panel stage game-stage" id="stage">
        <button class="btn ghost sm fs-exit" id="fs-exit">Quitter le plein écran</button>
        <div class="scores" id="board" aria-label="Scores"></div>
        <div id="game"></div>
      </section>`;
    const stage = $('#stage', el);
    $('#fs', el).onclick = () => toggleFullscreen(stage);
    $('#fs-exit', el).onclick = exitFullscreen;
    $('#back', el).onclick = setup;
    const ctx = makeCtx(session.niveau, theme, session.teams, $('#board', el));
    cleanup = game.run($('#game', el), ctx);
  };

  setup();
  return () => { if (typeof cleanup === 'function') cleanup(); exitFullscreen(); };
};
