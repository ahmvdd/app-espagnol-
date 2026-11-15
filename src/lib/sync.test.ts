// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Faux serveur reproduisant /api (mêmes règles que api/data.ts)
const SECRETS: Record<string, string> = { '1': 'sol', '2': 'luna' };
const db: Record<string, { data: any; updatedAt: string }> = {};
let t = 0;
let cookie: string | null = null;
function fakeFetch(url: string, init: any = {}) {
  const path = url.replace('/api/', ''), m = init.method ?? 'GET';
  const body = init.body ? JSON.parse(init.body) : null;
  const res = (s: number, b: any) => Promise.resolve({ status: s, json: async () => b });
  if (path === 'login') { const id = Object.keys(SECRETS).find(k => SECRETS[k] === body.secret); if (!id) return res(401, { erreur: 'Mot secret incorrect' }); cookie = id; return res(200, { id, nom: id === '1' ? 'Sol' : 'Luna' }); }
  if (path === 'logout') { cookie = null; return res(200, {}); }
  if (!cookie) return res(401, {});
  if (path === 'session') return res(200, { id: cookie });
  if (path === 'data' && m === 'GET') return res(200, db[cookie] ? { data: db[cookie].data, updatedAt: db[cookie].updatedAt } : { data: null, updatedAt: null });
  if (path === 'data' && m === 'PUT') {
    const row = db[cookie];
    if (row && body.base !== row.updatedAt) return res(409, { conflit: true, ...row });
    db[cookie] = { data: body.data, updatedAt: new Date(++t * 1000).toISOString() };
    return res(200, { updatedAt: db[cookie].updatedAt });
  }
  return res(404, {});
}

async function appareil(local: Record<string, string> = {}) {
  vi.resetModules();
  localStorage.clear();
  for (const [k, v] of Object.entries(local)) localStorage.setItem(k, v);
  document.body.innerHTML = '<div id="toast"></div>';
  const sync = await import('./sync');
  const st = await import('./state');
  await sync.demarrer();
  return { sync, st };
}
const classe = (nom: string) => ({ id: nom, nom, niveau: '5e', eleves: [{ id: 'e', prenom: 'Ana' }], incompatibles: [] });
const sauvegarde = () => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)!]));

beforeEach(() => { vi.useRealTimers(); (globalThis as any).fetch = fakeFetch; });

describe('synchronisation des espaces', () => {
  it('scénario complet : migration, envoi, 2e appareil, conflit, déconnexion', async () => {
    // Appareil A avec des données existantes (avant la mise à jour)
    let A = await appareil({ 'rincon.v1': JSON.stringify({ classes: [classe('5A')], plans: [], suivi: {}, seances: [], reglages: { muet: false, volume: .6, police: 'standard', prenomProf: '' } }) });
    expect(await A.sync.connecter('faux')).toBe('Mot secret incorrect');
    expect(await A.sync.connecter('sol')).toBeNull();
    expect(db['1'].data.classes[0].nom).toBe('5A'); // migration : rien perdu
    const memoireA = sauvegarde();

    // Modification sur A, envoyée après le délai
    A.st.update(s => { s.classes.push(classe('4B') as any); });
    await A.sync.envoyer();
    expect(db['1'].data.classes.map((c: any) => c.nom)).toEqual(['5A', '4B']);

    // Appareil B vierge : connexion -> retrouve tout
    let B = await appareil();
    expect(await B.sync.connecter('sol')).toBeNull();
    expect(B.st.state.classes.map(c => c.nom)).toEqual(['5A', '4B']);
    B.st.update(s => { s.classes.push(classe('3C') as any); });
    await B.sync.envoyer();
    const memoireB = sauvegarde();

    // Retour sur A (ancienne base) qui modifie aussi : conflit -> version en ligne gagne, la sienne en point de retour
    A = await appareil(memoireA);
    A.st.update(s => { s.classes.push(classe('XX') as any); });
    await A.sync.envoyer();
    // au démarrage A a déjà récupéré la version de B ; la modif XX part donc normalement
    expect(db['1'].data.classes.map((c: any) => c.nom)).toEqual(['5A', '4B', '3C', 'XX']);

    // B hors ligne modifie avec une base périmée -> 409 à l'envoi
    B = await appareil(memoireB);
    expect(B.st.state.classes.map(c => c.nom)).toEqual(['5A', '4B', '3C', 'XX']); // récupéré au démarrage

    // Déconnexion : l'appareil est vidé, le serveur garde tout
    expect(await B.sync.deconnecter()).toBeNull();
    expect(B.st.state.classes).toEqual([]);
    expect(localStorage.getItem('rincon.v1')).toBeNull();
    expect(localStorage.getItem('rincon.snapshots')).toBeNull();
    expect(db['1'].data.classes.length).toBe(4);

    // Autre espace sur le même appareil : aucune donnée de l'espace 1
    expect(await B.sync.connecter('luna')).toBeNull();
    expect(B.st.state.classes).toEqual([]);
    expect(db['2'].data.classes).toEqual([]);
  });

  it('conflit : la version en ligne gagne, la locale reste en point de retour', async () => {
    const A = await appareil();
    cookie = null; await A.sync.connecter('luna');
    A.st.update(s => { s.classes = [classe('LOCAL') as any]; });
    db['2'] = { data: { ...db['2'].data, classes: [classe('AILLEURS')] }, updatedAt: new Date(++t * 1000).toISOString() };
    await A.sync.envoyer();
    expect(A.st.state.classes.map(c => c.nom)).toEqual(['AILLEURS']);
    const snaps = JSON.parse(localStorage.getItem('rincon.snapshots')!);
    expect(snaps[0].data).toContain('LOCAL');
  });
});
