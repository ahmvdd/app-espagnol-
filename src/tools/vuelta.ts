import type { Tool } from './index';
import { EQUIPOS, type Team } from '../games/engine';
import { ESPANA, AMERICA, type LonLat } from '../lib/geo';
import { confirmModal } from '../lib/modal';
import { chime, beep } from '../lib/sound';
import { $, $$, esc, toast } from '../lib/ui';

type Ruta = {
  id: string; nom: string;
  /** Contour simplifié (longitude, latitude). */
  contour: LonLat[];
  villes: [string, number, number][];
  proj: (p: LonLat) => [number, number];
  w: number; h: number;
};

const PTS_ETAPE = 5;

const RUTAS: Ruta[] = [
  {
    id: 'espana', nom: 'Vuelta a España', w: 620, h: 470,
    proj: ([lon, lat]) => [(lon + 9.8) * 46, (44.2 - lat) * 58],
    contour: ESPANA,
    villes: [['Madrid', -3.7, 40.42], ['Toledo', -4.02, 39.86], ['Córdoba', -4.78, 37.89], ['Sevilla', -5.98, 37.39], ['Granada', -3.6, 37.18],
      ['Valencia', -0.38, 39.47], ['Barcelona', 2.17, 41.39], ['Zaragoza', -0.89, 41.65], ['Bilbao', -2.93, 43.26], ['Santiago', -8.54, 42.88],
      ['Salamanca', -5.66, 40.97], ['¡Madrid, meta!', -3.7, 40.42]]
  },
  {
    id: 'america', nom: 'Vuelta a América Latina', w: 520, h: 560,
    proj: ([lon, lat]) => [(lon + 118) * 5.6, (33.5 - lat) * 6],
    contour: AMERICA,
    villes: [['Ciudad de México', -99.13, 19.43], ['Guatemala', -90.51, 14.64], ['La Habana', -82.37, 23.11], ['Bogotá', -74.07, 4.71],
      ['Caracas', -66.9, 10.48], ['Quito', -78.47, -0.18], ['Lima', -77.04, -12.05], ['La Paz', -68.15, -16.5], ['Santiago', -70.67, -33.45],
      ['Buenos Aires', -58.38, -34.6], ['¡Montevideo, meta!', -56.16, -34.9]]
  }
];

const KEY = 'rincon.vuelta';
type Etat = { ruta: string; teams: Team[] };

const lire = (): Etat => {
  try {
    const e = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (e?.teams?.length) return e;
  } catch { /* ignore */ }
  return { ruta: 'espana', teams: EQUIPOS.slice(0, 4).map(t => ({ ...t, score: 0 })) };
};

const vuelta: Tool = el => {
  const etat = lire();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(etat)); } catch { toast('Impossible d’enregistrer les scores'); } };

  const ruta = () => RUTAS.find(r => r.id === etat.ruta) ?? RUTAS[0];
  const total = () => (ruta().villes.length - 1) * PTS_ETAPE;
  const etape = (score: number) => Math.min(ruta().villes.length - 1, Math.floor(score / PTS_ETAPE));

  /** Position sur le parcours (interpolée entre deux villes). */
  const position = (score: number, k: number): [number, number] => {
    const r = ruta(), pts = r.villes.map(([, lon, lat]) => r.proj([lon, lat]));
    const s = Math.min(score, total()), i = Math.min(pts.length - 2, Math.floor(s / PTS_ETAPE)), f = (s - i * PTS_ETAPE) / PTS_ETAPE;
    const [x1, y1] = pts[i], [x2, y2] = pts[Math.min(i + 1, pts.length - 1)];
    const off = [[-9, -9], [9, -9], [-9, 9], [9, 9]][k];
    return [x1 + (x2 - x1) * f + off[0], y1 + (y2 - y1) * f + off[1]];
  };

  const render = (flash?: number) => {
    const r = ruta();
    const pts = r.villes.map(([, lon, lat]) => r.proj([lon, lat]));
    el.innerHTML = `
      <div class="row wrap center-row">
        <div class="row wrap" role="group" aria-label="Parcours">${RUTAS.map(x => `<button class="btn ghost sm" data-r="${x.id}" aria-pressed="${x.id === r.id}">${x.nom}</button>`).join('')}</div>
        <div class="row wrap" role="group" aria-label="Nombre d'équipes">${[2, 3, 4].map(n => `<button class="btn ghost sm" data-n="${n}" aria-pressed="${n === etat.teams.length}">${n} équipes</button>`).join('')}</div>
        <button class="btn ghost sm" id="reset">Remettre à zéro</button>
      </div>
      <div class="vuelta">
        <svg viewBox="0 0 ${r.w} ${r.h}" class="map" role="img" aria-label="${esc(r.nom)} : ${etat.teams.map(t => `${t.nom} étape ${etape(t.score) + 1}`).join(', ')}">
          <polygon points="${r.contour.map(p => r.proj(p).join(',')).join(' ')}" class="terre"/>
          <polyline points="${pts.map(p => p.join(',')).join(' ')}" class="parcours"/>
          ${pts.map(([x, y], i) => `<g class="ville ${i === flash ? 'flash' : ''}"><circle cx="${x}" cy="${y}" r="${i === pts.length - 1 ? 8 : 5}"/>
            <text x="${x + 9}" y="${y - 8}">${i + 1}. ${esc(r.villes[i][0])}</text></g>`).join('')}
          ${etat.teams.map((t, k) => { const [x, y] = position(t.score, k); return `<text x="${x}" y="${y}" class="pion" text-anchor="middle" dominant-baseline="central">${t.icon}</text>`; }).join('')}
        </svg>
        <div class="vuelta-equipes">
          ${etat.teams.map((t, k) => {
            const e = etape(t.score), fini = t.score >= total();
            return `<section class="panel equipe-v">
              <h3>${t.icon} Equipo ${esc(t.nom)} <b>${t.score}</b> pts</h3>
              <p class="small">${fini ? '🏁 ¡Llegada!' : `Étape ${e + 1} → <strong>${esc(r.villes[e + 1][0])}</strong> (${PTS_ETAPE - (t.score % PTS_ETAPE)} pts)`}</p>
              <div class="row"><button class="btn sm" data-t="${k}" data-p="1">+1</button><button class="btn sm" data-t="${k}" data-p="5">+5</button></div>
            </section>`;
          }).join('')}
        </div>
      </div>`;

    $$('[data-r]', el).forEach(b => b.onclick = async () => {
      if (b.dataset.r === etat.ruta) return;
      if (etat.teams.some(t => t.score) && !(await confirmModal('Changer de parcours ?', 'Les scores de la course en cours repartent à zéro.', 'Changer'))) return;
      etat.ruta = b.dataset.r!; etat.teams.forEach(t => (t.score = 0)); save(); render();
    });
    $$('[data-n]', el).forEach(b => b.onclick = async () => {
      const n = Number(b.dataset.n);
      if (n === etat.teams.length) return;
      if (etat.teams.some(t => t.score) && !(await confirmModal('Changer le nombre d’équipes ?', 'Les scores repartent à zéro.', 'Changer'))) return;
      etat.teams = EQUIPOS.slice(0, n).map(t => ({ ...t, score: 0 })); save(); render();
    });
    $('#reset', el).onclick = async () => {
      if (!(await confirmModal('Remettre la course à zéro ?', 'Toutes les équipes repartent du départ.', 'Remettre à zéro', { danger: true }))) return;
      etat.teams.forEach(t => (t.score = 0)); save(); render();
    };
    $$('[data-t]', el).forEach(b => b.onclick = () => {
      const t = etat.teams[Number(b.dataset.t)], avant = etape(t.score);
      if (t.score >= total()) return toast('Cette équipe est déjà arrivée !');
      t.score = Math.min(total(), t.score + Number(b.dataset.p));
      save();
      const apres = etape(t.score);
      if (apres > avant) {
        chime();
        toast(apres === ruta().villes.length - 1 ? `🏁 ¡Equipo ${t.nom} llega a la meta!` : `¡Equipo ${t.nom} llega a ${ruta().villes[apres][0]}!`);
        render(apres);
      } else { beep(880, 0.1); render(); }
    });
  };

  render();
};

export default vuelta;
