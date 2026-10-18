import type { Tool } from './index';
import { startTimer, type Timer } from '../lib/timer';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { chime } from '../lib/sound';
import { $, $$, esc } from '../lib/ui';

type Phase = { titre: string; es: string; consigne: string; min: number };
type Format = { id: string; nom: string; icon: string; desc: string; phases: () => Phase[] };

const FORMATS: Format[] = [
  {
    id: 'speed', nom: 'Speed meeting', icon: '🔁', desc: 'Interaction orale par deux, on change de partenaire à chaque tour.',
    phases: () => Array.from({ length: 5 }, (_, i) => ({
      titre: `Tour ${i + 1} / 5`, es: i ? '¡Cambiamos de pareja!' : '¡Empezamos!',
      consigne: 'Pose tes questions et réponds à ton partenaire, en espagnol.', min: 2
    }))
  },
  {
    id: 'cafe', nom: 'World café', icon: '☕', desc: 'Chaque table travaille une question ; les groupes changent de table.',
    phases: () => Array.from({ length: 4 }, (_, i) => ({
      titre: `Table ${i + 1} / 4`, es: i ? '¡Cambiamos de mesa!' : '¡Empezamos!',
      consigne: 'Lis ce que le groupe précédent a écrit, puis complète en espagnol.', min: 6
    }))
  },
  {
    id: 'puzzle', nom: 'Classe puzzle', icon: '🧩', desc: 'Chacun devient expert d’une partie, puis l’explique à son groupe.',
    phases: () => [
      { titre: '1. Travail individuel', es: 'Trabajo individual', consigne: 'Chacun lit ou écoute sa partie du document.', min: 5 },
      { titre: '2. Groupes d’experts', es: 'Grupos de expertos', consigne: 'Les experts d’une même partie mettent en commun et vérifient.', min: 10 },
      { titre: '3. Groupes puzzle', es: 'Grupos puzle', consigne: 'Chaque expert explique sa partie aux autres : ensemble, on reconstitue le tout.', min: 15 },
      { titre: '4. Mise en commun', es: 'Puesta en común', consigne: 'Un porte-parole par groupe présente le résultat à la classe.', min: 5 }
    ]
  }
];

const rotations: Tool = el => {
  let timer: Timer | null = null;

  const menu = () => {
    timer?.stop(); timer = null;
    el.innerHTML = `
      <p class="center muted">Travail de groupe minuté : le site annonce chaque changement (son et voix).</p>
      <div class="sos-grid">${FORMATS.map(f => `
        <section class="panel sos-col">
          <h2><span aria-hidden="true">${f.icon}</span> ${f.nom}</h2>
          <p>${f.desc}</p>
          <p class="muted small">${f.phases().map(p => `${p.titre} : ${p.min} min`).join(' · ')}</p>
          <label class="field">Minutes par tour <input type="number" min="1" max="30" value="${f.phases()[0].min}" data-min="${f.id}" ${f.id === 'puzzle' ? 'disabled' : ''}></label>
          <button class="btn bigbtn" data-f="${f.id}">▶ Lancer</button>
        </section>`).join('')}</div>`;
    $$('[data-f]', el).forEach(b => b.onclick = () => {
      const f = FORMATS.find(x => x.id === b.dataset.f)!;
      const min = Number($<HTMLInputElement>(`[data-min="${f.id}"]`, el).value) || undefined;
      lancer(f, f.id === 'puzzle' ? f.phases() : f.phases().map(p => ({ ...p, min: min ?? p.min })));
    });
  };

  const lancer = (f: Format, phases: Phase[]) => {
    let i = 0;
    const phase = () => {
      timer?.stop();
      if (i >= phases.length) {
        chime();
        el.innerHTML = `<div class="center"><div class="huge win">¡Terminado!</div><button class="btn bigbtn" id="back">Retour</button></div>`;
        $('#back', el).onclick = menu;
        return;
      }
      const p = phases[i];
      chime();
      speak(p.es, state.reglages.accent ?? 'es-ES');
      el.innerHTML = `
        <div class="center">
          <span class="pill">${f.icon} ${f.nom} · ${esc(p.titre)}</span>
          <div class="huge" lang="es" aria-live="assertive">${esc(p.es)}</div>
          <p class="big">${esc(p.consigne)}</p>
          <div class="clock small-clock" id="clock" role="timer">${p.min}:00</div>
          <div class="row wrap center-row">
            <button class="btn" id="next">Passer au tour suivant →</button>
            <button class="btn ghost" id="stop">Arrêter</button>
          </div>
        </div>`;
      $('#next', el).onclick = () => { i++; phase(); };
      $('#stop', el).onclick = menu;
      timer = startTimer(p.min * 60, () => { i++; phase(); }, l => {
        const c = $('#clock', el); if (c) c.textContent = `${Math.floor(l / 60)}:${String(l % 60).padStart(2, '0')}`;
      });
    };
    phase();
  };

  menu();
  return () => timer?.stop();
};

export default rotations;
