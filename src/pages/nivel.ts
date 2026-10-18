import type { View } from '../router';
import { NIVEAUX, THEMES, COULEUR, dernierTheme, rememberTheme, type Niveau } from '../lib/content';
import { flashcards } from '../tools/flashcards';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { $, $$, esc, toast } from '../lib/ui';

export const nivel: View = el => {
  const [, , hashN, hashT] = location.hash.split('/');
  const n: Niveau = NIVEAUX.includes(hashN as Niveau) ? (hashN as Niveau) : '5e';
  const themes = THEMES[n];
  const theme = themes.find(t => t.id === hashT) ?? dernierTheme(n);
  rememberTheme(n, theme.id);
  el.style.setProperty('--niveau', COULEUR[n]);

  el.innerHTML = `
    <div class="row head niveau-head">
      <h1><span class="niveau-badge">${n}</span> ${esc(theme.titre)}</h1>
      <nav class="row wrap" aria-label="Niveaux">
        ${NIVEAUX.map(x => `<a class="btn ghost sm" href="#/nivel/${x}" aria-current="${x === n ? 'page' : 'false'}">${x}</a>`).join('')}
      </nav>
    </div>

    <div class="theme-list" role="list">
      ${themes.map(t => `<a role="listitem" class="panel theme-card" href="#/nivel/${n}/${t.id}" aria-current="${t === theme ? 'true' : 'false'}">
        <strong>${esc(t.titre)}</strong><span class="muted small">${t.vocab.length} mots · ${t.quiz.length} questions</span></a>`).join('')}
    </div>

    <section class="panel stage" id="flash"></section>

    <h2>Tout le vocabulaire</h2>
    <div class="table-wrap"><table class="vocab">
      <thead><tr><th scope="col">Espagnol</th><th scope="col">Français</th><th scope="col"><span class="sr-only">Écouter</span></th></tr></thead>
      <tbody>${theme.vocab.map(([e, f], k) => `<tr><td lang="es"><strong>${esc(e)}</strong></td><td>${esc(f)}</td>
        <td><button class="btn ghost sm" data-say="${k}" aria-label="Écouter ${esc(e)}">🔊</button></td></tr>`).join('')}</tbody>
    </table></div>

    ${theme.phrases.length ? `<h2>Phrases modèles</h2><ul class="phrases">${theme.phrases.map(p => `<li lang="es">${esc(p)}</li>`).join('')}</ul>` : ''}
    ${theme.parole.length ? `<h2>Sujets d’oral</h2><ul class="phrases">${theme.parole.map(p => `<li lang="es">${esc(p)}</li>`).join('')}</ul>` : ''}`;

  $$('[data-say]', el).forEach(b => b.onclick = () => {
    if (!speak(theme.vocab[Number(b.dataset.say)][0], state.reglages.accent ?? 'es-ES')) toast('Voix espagnole absente sur cet appareil');
  });
  const stop = flashcards($('#flash', el), theme.vocab);
  return () => { stop(); el.style.removeProperty('--niveau'); };
};
