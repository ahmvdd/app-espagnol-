import type { Tool } from './index';
import PAISES from '../content/mundo.json';
import { AMERICA, ESPANA, CUBA, LA_ESPANOLA, PUERTO_RICO, BIOKO, RIO_MUNI, type LonLat } from '../lib/geo';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { beep } from '../lib/sound';
import { $, $$, esc, pick, shuffle } from '../lib/ui';

type Pais = { id: string; nom: string; capitale: string; lon: number; lat: number; fete: string; accent: string; mots: [string, string][]; drapeau: string };
const LISTE = PAISES as Pais[];

/** Trois zones sur une même carte : les Amériques, et deux encarts (Espagne, Guinée équatoriale). */
const ZONES = {
  america: ([lon, lat]: LonLat): [number, number] => [(lon + 118) * 5.6 + 10, (33.5 - lat) * 6 + 10],
  espana: ([lon, lat]: LonLat): [number, number] => [(lon + 9.8) * 22 + 565, (44.2 - lat) * 28 + 45],
  guinea: ([lon, lat]: LonLat): [number, number] => [(lon - 8.1) * 60 + 640, (4.1 - lat) * 60 + 380]
};
const zoneDe = (p: Pais) => (p.id === 'espana' ? ZONES.espana : p.id === 'guinea-ecuatorial' ? ZONES.guinea : ZONES.america);
const poly = (pts: LonLat[], f: (p: LonLat) => [number, number]) => `<polygon class="terre" points="${pts.map(p => f(p).join(',')).join(' ')}"/>`;

let actuel = '';
const PETITS = new Set(['guatemala', 'honduras', 'el-salvador', 'nicaragua', 'costa-rica', 'panama', 'republica-dominicana', 'puerto-rico', 'uruguay']);

const mundo: Tool = el => {
  const quiz = (p: Pais) => {
    const autres = shuffle(LISTE.filter(x => x !== p)).slice(0, 3);
    const o1 = shuffle([p, ...autres]).map(x => x.capitale);
    const mot = pick(p.mots);
    const faux = shuffle([...new Set(LISTE.flatMap(x => x.mots).map(m => m[1]).filter(f => f !== mot[1]))]).slice(0, 3);
    const o2 = shuffle([mot[1], ...faux]);
    return [
      { q: `¿Cuál es la capital de ${p.nom}?`, o: o1, a: o1.indexOf(p.capitale) },
      { q: `« ${mot[0]} » (${p.nom}) veut dire…`, o: o2, a: o2.indexOf(mot[1]) }
    ];
  };

  const fiche = () => {
    const p = LISTE.find(x => x.id === actuel);
    const zone = $('#fiche', el);
    if (!p) { zone.innerHTML = '<p class="muted center">Clique sur un pays (un point de la carte ou un nom de la liste).</p>'; return; }
    const qs = quiz(p);
    zone.innerHTML = `
      <div class="row"><i class="flag grand" style="background:${p.drapeau}" aria-hidden="true"></i><h2 lang="es">${esc(p.nom)}</h2></div>
      <dl class="fiche-pays">
        <dt>Capitale</dt><dd lang="es">${esc(p.capitale)}</dd>
        <dt>Fête nationale</dt><dd lang="es">${esc(p.fete)}</dd>
        <dt>L’accent</dt><dd>${esc(p.accent)}</dd>
      </dl>
      <h3>3 mots d’ici</h3>
      <ul class="mots-pays">${p.mots.map(([es, fr], i) => `<li><button class="btn ghost sm" data-say="${i}" aria-label="Écouter ${esc(es)}">🔊</button> <strong lang="es">${esc(es)}</strong> · ${esc(fr)}</li>`).join('')}</ul>
      <h3>Mini-quiz</h3>
      ${qs.map((q, k) => `
        <div class="mini-q" data-q="${k}">
          <p lang="es">${esc(q.q)}</p>
          <div class="row wrap">${q.o.map((o, i) => `<button class="btn ghost sm" data-a="${i}">${esc(o)}</button>`).join('')}</div>
        </div>`).join('')}`;
    $$('[data-say]', zone).forEach(b => b.onclick = () => speak(p.mots[Number(b.dataset.say)][0], p.id === 'espana' ? 'es-ES' : 'es-MX'));
    $$('.mini-q', zone).forEach(div => {
      const q = qs[Number(div.dataset.q)];
      $$('[data-a]', div).forEach(b => b.onclick = () => {
        const ok = Number(b.dataset.a) === q.a;
        b.textContent = (ok ? '✓ ' : '✗ ') + b.textContent!.replace(/^[✓✗] /, '');
        b.classList.add(ok ? 'bon' : 'mauvais');
        beep(ok ? 880 : 220, 0.15);
        if (ok) $$<HTMLButtonElement>('[data-a]', div).forEach(x => (x.disabled = true));
      });
    });
  };

  const choisir = (id: string) => {
    actuel = id;
    $$('[data-pays]', el).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.pays === id)));
    $$('.pin', el).forEach(x => x.classList.toggle('actif', x.dataset.pin === id));
    fiche();
    if (id) speak(LISTE.find(x => x.id === id)!.nom, state.reglages.accent ?? 'es-ES');
  };

  el.innerHTML = `
    <div class="mundo">
      <div>
        <svg viewBox="0 0 900 620" class="map" role="img" aria-label="Carte des 21 pays et territoires hispanophones">
          ${poly(AMERICA, ZONES.america)}${poly(CUBA, ZONES.america)}${poly(LA_ESPANOLA, ZONES.america)}${poly(PUERTO_RICO, ZONES.america)}
          <rect x="545" y="20" width="335" height="290" rx="10" class="encart"/><text x="555" y="40" class="encart-t">Europa</text>
          ${poly(ESPANA, ZONES.espana)}
          <rect x="600" y="340" width="280" height="240" rx="10" class="encart"/><text x="610" y="360" class="encart-t">África</text>
          ${poly(BIOKO, ZONES.guinea)}${poly(RIO_MUNI, ZONES.guinea)}
          ${LISTE.map(p => { const [x, y] = zoneDe(p)([p.lon, p.lat]); return `<g class="pin ${p.id === actuel ? 'actif' : ''} ${PETITS.has(p.id) ? 'petit' : ''}" data-pin="${p.id}"><circle cx="${x}" cy="${y}" r="7"/><text x="${x + 10}" y="${y + 4}">${esc(p.nom)}</text></g>`; }).join('')}
        </svg>
        <div class="chips" role="group" aria-label="Pays">${LISTE.map(p => `<button class="chip pays" data-pays="${p.id}" aria-pressed="${p.id === actuel}">${esc(p.nom)}</button>`).join('')}</div>
      </div>
      <section class="panel" id="fiche" aria-live="polite" aria-label="Fiche du pays"></section>
    </div>`;

  $$('.pin', el).forEach(g => g.addEventListener('click', () => choisir(g.dataset.pin!)));
  $$('[data-pays]', el).forEach(b => b.onclick = () => choisir(b.dataset.pays!));
  fiche();
};

export default mundo;
