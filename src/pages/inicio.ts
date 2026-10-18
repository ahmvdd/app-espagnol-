import type { View } from '../router';
import {
  NIVEAUX, COULEUR, CECRL, DUREES, axeDe, AMBIANCES, DEDICACE,
  palabraDelDia, refranDelDia, activitesPour, lienActivite, dernierTheme,
  type Ambiance, type Niveau
} from '../lib/content';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { TOOLS, toolCard } from '../tools';
import { $, $$, esc, toast } from '../lib/ui';

/** Choix « J'ai X minutes » : gardés le temps de la séance. */
const choix: { duree?: number; niveau?: Niveau; ambiance?: Ambiance; i: number } = { i: 0 };

const say = (t: string) => { if (!speak(t, state.reglages.accent ?? 'es-ES')) toast('Voix espagnole absente sur cet appareil'); };

function etapes(): string {
  const step = <T extends string | number>(titre: string, key: 'duree' | 'niveau' | 'ambiance', items: { v: T; label: string }[]) => `
    <div class="field">${titre}
      <div class="row wrap" role="group" aria-label="${titre}">
        ${items.map(it => `<button class="btn ghost" data-${key}="${it.v}" aria-pressed="${choix[key] === it.v}">${it.label}</button>`).join('')}
      </div>
    </div>`;

  let html = step('1. Combien de temps ?', 'duree', DUREES.map(d => ({ v: d, label: `${d} min` })));
  if (choix.duree) html += step('2. Quelle classe ?', 'niveau', NIVEAUX.map(n => ({ v: n, label: n })));
  if (choix.duree && choix.niveau) html += step('3. Quelle ambiance ?', 'ambiance', AMBIANCES.map(a => ({ v: a.id, label: `${a.icon} ${a.label}` })));
  if (choix.duree && choix.niveau && choix.ambiance) {
    const list = activitesPour(choix.duree, choix.niveau, choix.ambiance);
    const a = list[choix.i % list.length];
    const lien = lienActivite(a, choix.niveau);
    html += `
      <section class="panel activite" aria-live="polite">
        <div class="row wrap"><span class="pill">⏱ ${a.duree} min</span><span class="pill">${choix.niveau}</span>${a.materiel ? `<span class="pill">✏️ ${esc(a.materiel)}</span>` : ''}</div>
        <h3>${esc(a.titre)}</h3>
        <p>${esc(a.consigne)}</p>
        <div class="row wrap">
          ${lien ? `<a class="btn bigbtn" href="${lien}">▶ Lancer</a>` : ''}
          ${list.length > 1 ? `<button class="btn ghost" id="autre">Autre idée (${(choix.i % list.length) + 1}/${list.length})</button>` : ''}
          <button class="btn ghost sm" id="reset">Recommencer</button>
        </div>
      </section>`;
  }
  return html;
}

export const inicio: View = el => {
  const p = state.reglages.prenomProf;
  const w = palabraDelDia();
  const [refEs, refFr] = refranDelDia();
  const date = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const raccourcis = ['minuteur', 'ruleta', 'equipos'].map(id => TOOLS.find(t => t.id === id)!);

  el.innerHTML = `
    <section class="hero">
      <i class="azulejo band" aria-hidden="true"></i>
      <div>
        <p class="muted" lang="es">${esc(date)}</p>
        <h1 class="hello" lang="es">¡Hola${p ? `, ${esc(p)}` : ''}!</h1>
        ${DEDICACE ? `<p class="dedicace">${esc(DEDICACE)}</p>` : ''}
      </div>
    </section>

    <div class="levels">
      ${NIVEAUX.map(n => {
        const t = dernierTheme(n);
        return `<a class="panel level" href="#/nivel/${n}/${t.id}" style="--niveau:${COULEUR[n]}">
          <span class="row"><span class="huge">${n}</span><span class="pill">${CECRL[n]}</span></span>
          <span><strong>${esc(t.titre)}</strong></span>
          <span class="muted small">Axe ${axeDe(n, t.id)?.n} · ${esc(axeDe(n, t.id)?.titre)}</span></a>`;
      }).join('')}
    </div>

    <section class="panel star">
      <h2>⏱ J’ai… minutes</h2>
      <div id="etapes"></div>
    </section>

    <h2>Raccourcis</h2>
    <div class="tools">
      ${raccourcis.map(t => toolCard(t)).join('')}
      <a class="panel tool-card sos-card" href="#/sos"><span class="ico" aria-hidden="true">🆘</span><strong>SOS</strong><span class="es" lang="es">¡Socorro!</span><span class="muted small">Une idée tout de suite</span></a>
    </div>

    <h2>Rituels du jour</h2>
    <div class="idees">
      <section class="panel center">
        <h3>Palabra del día</h3>
        <span class="pill">${w.niveau} · ${esc(w.theme)}</span>
        <div class="big" lang="es">${esc(w.es)}</div>
        <p class="big win" id="trad" hidden>${esc(w.fr)}</p>
        <div class="row wrap center-row">
          <button class="btn ghost sm" id="say-w">🔊 Écouter</button>
          <button class="btn sm" id="reveal-w">Voir la traduction</button>
        </div>
      </section>
      <section class="panel center">
        <h3>Refrán del día</h3>
        <div class="big" lang="es">${esc(refEs)}</div>
        <p class="win" id="ref-fr" hidden>${esc(refFr)}</p>
        <div class="row wrap center-row">
          <button class="btn ghost sm" id="say-r">🔊 Écouter</button>
          <button class="btn sm" id="reveal-r">Révéler le sens</button>
        </div>
      </section>
    </div>

    <p class="home-foot muted small">
      <a href="#/aide">Aide</a> · <a href="#/aide/credits">Crédits</a> · <a href="#/profe">Tout effacer (dans Profe)</a>
    </p>`;

  const zone = $('#etapes', el);
  const draw = (focus?: string) => {
    zone.innerHTML = etapes();
    $$('[data-duree]', zone).forEach(b => b.onclick = () => { choix.duree = Number(b.dataset.duree); choix.i = 0; draw('[data-niveau]'); });
    $$('[data-niveau]', zone).forEach(b => b.onclick = () => { choix.niveau = b.dataset.niveau as Niveau; choix.i = 0; draw('[data-ambiance]'); });
    $$('[data-ambiance]', zone).forEach(b => b.onclick = () => { choix.ambiance = b.dataset.ambiance as Ambiance; choix.i = 0; draw('.activite a, #autre'); });
    const autre = $('#autre', zone);
    if (autre) autre.onclick = () => { choix.i++; draw('#autre'); };
    const reset = $('#reset', zone);
    if (reset) reset.onclick = () => { delete choix.duree; delete choix.niveau; delete choix.ambiance; choix.i = 0; draw('[data-duree]'); };
    if (focus) $<HTMLElement>(focus, zone)?.focus();
  };
  draw();

  $('#say-w', el).onclick = () => say(w.es);
  $('#reveal-w', el).onclick = () => { $('#trad', el).hidden = false; $('#reveal-w', el).hidden = true; };
  $('#say-r', el).onclick = () => say(refEs);
  $('#reveal-r', el).onclick = () => { $('#ref-fr', el).hidden = false; $('#reveal-r', el).hidden = true; };
};
