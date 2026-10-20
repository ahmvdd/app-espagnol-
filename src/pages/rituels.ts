import { NIVEAUX, RITUELS, dayIndex, palabraDelDia, type Niveau } from '../lib/content';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { beep } from '../lib/sound';
import { $, $$, esc, toast } from '../lib/ui';

/** État du jour (météo, votes, question) : local à l'appareil, remis à zéro chaque jour, sans aucun nom d'élève. */
const KEY = 'rincon.rituels';
type Jour = { jour: number; fecha: string; meteo: number[]; votes: number[]; niveau: Niveau; q: number; trad: boolean };

function lire(): Jour {
  const neuf: Jour = { jour: dayIndex(), fecha: '', meteo: [], votes: RITUELS.emociones.map(() => 0), niveau: '5e', q: 0, trad: false };
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null') as Jour | null;
    if (j && j.jour === dayIndex()) return { ...neuf, ...j };
    if (j) neuf.niveau = j.niveau;
  } catch { /* ignore */ }
  return neuf;
}
const ecrire = (j: Jour) => { try { localStorage.setItem(KEY, JSON.stringify(j)); } catch { /* ignore */ } };

const dire = (t: string) => { if (!speak(t, state.reglages.accent ?? 'es-ES')) toast('Voix espagnole absente sur cet appareil'); };

type Rituel = { id: string; titre: string; draw: (el: HTMLElement, grand: boolean, maj: () => void) => void };

function rituels(j: Jour): Rituel[] {
  const w = palabraDelDia();
  return [
    {
      id: 'palabra', titre: 'Palabra del día',
      draw: (el, grand, maj) => {
        el.innerHTML = `
          <span class="pill">${w.niveau} · ${esc(w.theme)}</span>
          <div class="${grand ? 'huge' : 'big'}" lang="es">${esc(w.es)}</div>
          ${j.trad ? `<p class="big win">${esc(w.fr)}</p>` : ''}
          <div class="row wrap center-row">
            <button class="btn ghost sm" data-act="say">🔊 Escuchar</button>
            <button class="btn sm" data-act="trad">${j.trad ? 'Cacher' : 'Révéler'} la traduction</button>
          </div>`;
        $('[data-act="say"]', el).onclick = () => dire(w.es);
        $('[data-act="trad"]', el).onclick = () => { j.trad = !j.trad; ecrire(j); maj(); };
      }
    },
    {
      id: 'fecha', titre: 'La fecha y el tiempo',
      draw: (el, grand, maj) => {
        const tiempo = j.meteo.map(i => RITUELS.meteo[i][1]).join(' y ').toLowerCase();
        const phraseTiempo = tiempo ? `${tiempo[0].toUpperCase()}${tiempo.slice(1)}.` : '';
        el.innerHTML = `
          <label class="${grand ? 'huge' : 'big'} fecha" lang="es">Hoy es <input data-fecha value="${esc(j.fecha)}" placeholder="…" maxlength="60" autocomplete="off" spellcheck="false" aria-label="La fecha, à compléter avec les élèves"></label>
          ${phraseTiempo ? `<p class="${grand ? 'big' : ''}" lang="es">${esc(phraseTiempo)}</p>` : ''}
          <p class="muted small">Demandez la date aux élèves, puis écrivez-la. Cliquez sur le temps qu’il fait.</p>
          <div class="row wrap center-row meteo" role="group" aria-label="El tiempo">
            ${RITUELS.meteo.map(([ico, txt], i) => `<button class="btn ghost ${grand ? '' : 'sm'}" data-m="${i}" aria-pressed="${j.meteo.includes(i)}" lang="es"><span aria-hidden="true">${ico}</span> ${esc(txt)}</button>`).join('')}
          </div>
          <button class="btn ghost sm" data-act="say">🔊 Escuchar</button>`;
        const champ = $<HTMLInputElement>('[data-fecha]', el);
        const taille = () => { champ.style.width = `${Math.max(3, champ.value.length * 0.55 + 0.8)}em`; };
        taille();
        champ.oninput = () => { j.fecha = champ.value; ecrire(j); taille(); };
        $$('[data-m]', el).forEach(b => b.onclick = () => {
          const i = Number(b.dataset.m);
          j.meteo = j.meteo.includes(i) ? j.meteo.filter(x => x !== i) : [...j.meteo, i].slice(-2);
          ecrire(j); maj();
        });
        $('[data-act="say"]', el).onclick = () => {
          const frase = [j.fecha.trim() && `Hoy es ${j.fecha.trim()}.`, phraseTiempo].filter(Boolean).join(' ');
          if (frase) dire(frase); else toast('Écrivez d’abord la date ou choisissez le temps');
        };
      }
    },
    {
      id: 'quetal', titre: '¿Qué tal? ¿Cómo estás?',
      draw: (el, grand, maj) => {
        const total = j.votes.reduce((a, b) => a + b, 0), max = Math.max(1, ...j.votes);
        el.innerHTML = `
          <p class="${grand ? 'big' : ''}" lang="es"><strong>¿Cómo estás hoy?</strong> Toca tu emoción.</p>
          <div class="emociones ${grand ? 'grand' : ''}">
            ${RITUELS.emociones.map(([ico, txt], i) => `
              <button class="emocion" data-e="${i}" aria-label="${esc(txt)} : ${j.votes[i]} voto(s)">
                <span class="ico" aria-hidden="true">${ico}</span><span lang="es">${esc(txt)}</span>
                <span class="barre-vote" aria-hidden="true"><i style="width:${(j.votes[i] / max) * 100}%"></i></span><b>${j.votes[i]}</b>
              </button>`).join('')}
          </div>
          <div class="row wrap center-row"><span class="muted small">${total} voto(s) · anonyme</span><button class="btn ghost sm" data-act="zero">Remettre à zéro</button></div>`;
        $$('[data-e]', el).forEach(b => b.onclick = () => { j.votes[Number(b.dataset.e)]++; beep(760, 0.06); ecrire(j); maj(); });
        $('[data-act="zero"]', el).onclick = () => { j.votes = j.votes.map(() => 0); ecrire(j); maj(); };
      }
    },
    {
      id: 'pregunta', titre: 'La pregunta del día',
      draw: (el, grand, maj) => {
        const liste = RITUELS.preguntas[j.niveau];
        const q = liste[(dayIndex() + j.q) % liste.length];
        el.innerHTML = `
          <div class="row wrap center-row" role="group" aria-label="Niveau">${NIVEAUX.map(n => `<button class="btn ghost sm" data-n="${n}" aria-pressed="${n === j.niveau}">${n}</button>`).join('')}</div>
          <p class="${grand ? 'huge' : 'big'}" lang="es">${esc(q)}</p>
          <div class="row wrap center-row">
            <button class="btn ghost sm" data-act="say">🔊 Escuchar</button>
            <button class="btn sm" data-act="otra">Otra pregunta</button>
          </div>`;
        $$('[data-n]', el).forEach(b => b.onclick = () => { j.niveau = b.dataset.n as Niveau; j.q = 0; ecrire(j); maj(); });
        $('[data-act="say"]', el).onclick = () => dire(q);
        $('[data-act="otra"]', el).onclick = () => { j.q++; ecrire(j); maj(); };
      }
    }
  ];
}

/** Vue géante d'un rituel, par-dessus la page, en plein écran si possible. */
function agrandir(r: Rituel, apresFermeture: () => void) {
  const zone = document.createElement('div');
  zone.className = 'rituel-plein';
  zone.setAttribute('role', 'dialog');
  zone.setAttribute('aria-modal', 'true');
  zone.setAttribute('aria-label', r.titre);
  zone.innerHTML = `<button class="btn ghost sm fermer" aria-label="Fermer">✕ Fermer</button><h2 lang="es">${esc(r.titre)}</h2><div class="center corps"></div>`;
  document.body.append(zone);
  const corps = $('.corps', zone);
  const maj = () => r.draw(corps, true, maj);
  maj();
  const fermer = () => {
    zone.remove();
    removeEventListener('keydown', key, true);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    apresFermeture();
  };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } };
  addEventListener('keydown', key, true);
  $('.fermer', zone).onclick = fermer;
  $<HTMLButtonElement>('.fermer', zone).focus();
  zone.requestFullscreen?.().catch(() => {});
}

export function renderRituels(el: HTMLElement): void {
  const j = lire();
  const liste = rituels(j);
  el.innerHTML = `<div class="rituels">${liste.map(r => `
    <section class="panel rituel" data-r="${r.id}">
      <div class="row rituel-tete"><h3 lang="es">${esc(r.titre)}</h3><button class="btn ghost sm" data-big="${r.id}" aria-label="Agrandir ${esc(r.titre)}">⛶</button></div>
      <div class="center corps"></div>
    </section>`).join('')}</div>`;
  for (const r of liste) {
    const corps = $(`[data-r="${r.id}"] .corps`, el);
    const maj = () => r.draw(corps, false, maj);
    maj();
    $(`[data-big="${r.id}"]`, el).onclick = () => agrandir(r, () => renderRituels(el));
  }
}
