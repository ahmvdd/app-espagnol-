// Vérifie le contenu JSON avant le build : une erreur casse le build, jamais le site en classe.
import { readFileSync } from 'node:fs';

const dir = new URL('../src/content/', import.meta.url);
const errors = [];
const warnings = [];
const read = f => {
  try { return JSON.parse(readFileSync(new URL(f, dir), 'utf8')); }
  catch (e) { errors.push(`${f} : JSON invalide (${e.message})`); return null; }
};
const isStr = v => typeof v === 'string' && v.trim() !== '';
const check = (cond, msg) => { if (!cond) errors.push(msg); };

const NIVEAUX = ['5e', '4e', '3e'];
const DIFFS = ['bronce', 'plata', 'oro'];
const AMBIANCES = ['calme', 'normale', 'agitee'];
const DUREES = [5, 10, 15, 20, 30, 50];

for (const n of NIVEAUX) {
  const f = `${n}.json`, c = read(f);
  if (!c) continue;
  check(c.niveau === n, `${f} : "niveau" doit valoir "${n}"`);
  check(/^#[0-9a-f]{6}$/i.test(c.couleur), `${f} : "couleur" doit être une couleur #RRGGBB`);
  check(['A1', 'A1+', 'A2', 'A2+', 'B1'].includes(c.cecrl), `${f} : "cecrl" invalide`);
  check(Array.isArray(c.grammaire) && c.grammaire.every(isStr), `${f} : "grammaire" doit être une liste de textes`);
  check(Array.isArray(c.axes) && c.axes.length === 6, `${f} : 6 axes attendus (programme officiel)`);
  for (const [k, a] of (c.axes ?? []).entries()) {
    check(a.n === k + 1 && isStr(a.titre), `${f} › axe ${k + 1} : numéro ou titre invalide`);
    check(Array.isArray(a.objets) && a.objets.length && a.objets.every(isStr), `${f} › axe ${k + 1} : objets d'étude manquants`);
    check(Array.isArray(a.themes), `${f} › axe ${k + 1} : "themes" doit être une liste`);
  }
  const axe6 = c.axes?.[5];
  check(axe6?.obligatoire === true && axe6.themes.length > 0, `${f} : l'axe 6 est obligatoire et doit avoir au moins un thème`);
  c.themes = (c.axes ?? []).flatMap(a => a.themes ?? []);
  check(c.themes.length > 0, `${f} : au moins un thème`);
  const ids = new Set();
  for (const [i, t] of (c.themes ?? []).entries()) {
    const at = `${f} › thème ${i + 1} (${t.id ?? '?'})`;
    check(isStr(t.id) && /^[a-z0-9-]+$/.test(t.id), `${at} : "id" en minuscules et tirets`);
    check(!ids.has(t.id), `${at} : id en double`); ids.add(t.id);
    check(isStr(t.titre), `${at} : "titre" manquant`);
    check(isStr(t.objet), `${at} : "objet" (objet d'étude) manquant`);
    check(Array.isArray(t.culture) && t.culture.length > 0 && t.culture.every(isStr), `${at} : au moins un repère dans "culture"`);
    check(typeof t.relu === 'boolean', `${at} : "relu" doit valoir true ou false`);
    if (t.relu === false) warnings.push(`${at} : espagnol à relire`);
    check(Array.isArray(t.vocab) && t.vocab.length >= 4, `${at} : au moins 4 mots dans "vocab"`);
    for (const v of t.vocab ?? []) check(Array.isArray(v) && v.length === 2 && v.every(isStr), `${at} : paire de vocabulaire invalide ${JSON.stringify(v)}`);
    const es = (t.vocab ?? []).map(v => v[0]);
    check(new Set(es).size === es.length, `${at} : mot espagnol en double dans "vocab"`);
    check(Array.isArray(t.phrases) && t.phrases.every(isStr), `${at} : "phrases" doit être une liste de textes`);
    check(Array.isArray(t.parole) && t.parole.every(isStr), `${at} : "parole" doit être une liste de textes`);
    check(Array.isArray(t.quiz), `${at} : "quiz" doit être une liste`);
    for (const [k, q] of (t.quiz ?? []).entries()) {
      const aq = `${at} › question ${k + 1}`;
      check(isStr(q.q), `${aq} : "q" manquant`);
      check(Array.isArray(q.o) && q.o.length === 4 && q.o.every(isStr), `${aq} : 4 options attendues`);
      check(new Set(q.o).size === q.o?.length, `${aq} : options en double`);
      check(Number.isInteger(q.a) && q.a >= 0 && q.a < (q.o?.length ?? 0), `${aq} : "a" doit être l'index de la bonne réponse`);
      check(DIFFS.includes(q.diff), `${aq} : "diff" vaut bronce, plata ou oro`);
    }
  }
}

const acts = read('activites.json') ?? [];
const actIds = new Set();
for (const a of acts) {
  const at = `activites.json › ${a.id ?? '?'}`;
  check(isStr(a.id) && !actIds.has(a.id), `${at} : id manquant ou en double`); actIds.add(a.id);
  check(isStr(a.titre) && isStr(a.consigne), `${at} : titre et consigne obligatoires`);
  check(DUREES.includes(a.duree), `${at} : "duree" parmi ${DUREES.join(', ')}`);
  check(Array.isArray(a.niveaux) && a.niveaux.length && a.niveaux.every(n => NIVEAUX.includes(n)), `${at} : "niveaux" invalide`);
  check(AMBIANCES.includes(a.ambiance), `${at} : "ambiance" vaut calme, normale ou agitee`);
  check(a.outil === undefined || /^#\//.test(a.outil), `${at} : "outil" doit être une route #/...`);
}
check(acts.length >= 15, `activites.json : au moins 15 activités (${acts.length})`);
for (const d of DUREES) for (const n of NIVEAUX) for (const amb of AMBIANCES)
  check(acts.some(a => a.duree <= d && a.niveaux?.includes(n) && a.ambiance === amb), `activites.json : aucune activité pour ${d} min · ${n} · ${amb}`);

const sos = read('sos.json') ?? [];
check(sos.length === 3, 'sos.json : 3 situations attendues');
for (const s of sos) {
  check(isStr(s.titre) && Array.isArray(s.idees) && s.idees.length >= 3, `sos.json › ${s.titre} : au moins 3 idées`);
  for (const i of s.idees ?? []) check(isStr(i.texte) && /^#\//.test(i.lien) && isStr(i.action), `sos.json › ${s.titre} : idée invalide`);
}

const ref = read('refranes.json') ?? [];
check(ref.length >= 7 && ref.every(r => Array.isArray(r) && r.length === 2 && r.every(isStr)), 'refranes.json : liste de paires [espagnol, français]');
const paises = read('paises.json') ?? [];
check(paises.length >= 8 && paises.every(p => isStr(p.nom) && isStr(p.drapeau)), 'paises.json : 8 pays avec nom et drapeau');
const site = read('site.json');
check(site && typeof site.dedicace === 'string', 'site.json : "dedicace" doit être un texte (vide possible)');

if (warnings.length) console.warn(`⚠ ${warnings.length} thème(s) à faire relire :\n  ` + warnings.join('\n  '));
if (errors.length) {
  console.error(`✖ Contenu invalide (${errors.length}) :\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('✓ Contenu valide');
