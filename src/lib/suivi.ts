import type { Classe, Seance, Statut, SuiviChapitre } from './storage';
import { THEMES } from './content';
import { state, update, uid } from './state';

export const STATUTS: { id: Statut; label: string; icon: string }[] = [
  { id: 'pas-vu', label: 'Pas vu', icon: '⚪' },
  { id: 'en-cours', label: 'En cours', icon: '🔵' },
  { id: 'vu', label: 'Vu', icon: '✅' },
  { id: 'a-revoir', label: 'À revoir', icon: '🔁' }
];
export const statutInfo = (s: Statut) => STATUTS.find(x => x.id === s)!;

export const aujourdhui = () => new Date().toLocaleDateString('fr-CA');
export const dateFr = (iso: string) => new Date(iso + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

/** Les chapitres d'une classe sont ceux de son niveau (identifiants stables des thèmes). */
export const chapitres = (c: Classe) => THEMES[c.niveau];

export function suiviDe(c: Classe, chapId: string): SuiviChapitre {
  return state.suivi[c.id]?.[chapId] ?? { statut: 'pas-vu' };
}

export function modifierSuivi(c: Classe, chapId: string, f: (s: SuiviChapitre) => void): void {
  update(s => {
    s.suivi[c.id] ??= {};
    const cur = s.suivi[c.id][chapId] ?? { statut: 'pas-vu' };
    f(cur);
    s.suivi[c.id][chapId] = cur;
  });
}

/** Un clic fait tourner le statut : Pas vu → En cours → Vu → À revoir → Pas vu. */
export function statutSuivant(c: Classe, chapId: string): Statut {
  const ordre = STATUTS.map(x => x.id);
  const next = ordre[(ordre.indexOf(suiviDe(c, chapId).statut) + 1) % ordre.length];
  modifierSuivi(c, chapId, s => { s.statut = next; if (next !== 'pas-vu') s.date ??= aujourdhui(); });
  return next;
}

export function progression(c: Classe) {
  const ch = chapitres(c);
  const par = (st: Statut) => ch.filter(t => suiviDe(c, t.id).statut === st);
  return { total: ch.length, vus: par('vu').length, enCours: par('en-cours'), aRevoir: par('a-revoir'), pasVus: par('pas-vu') };
}

/** Chapitre proposé par défaut pour le bilan : celui en cours, sinon le dernier travaillé. */
export function chapitreCourant(c: Classe): string {
  const ch = chapitres(c);
  const enCours = ch.find(t => suiviDe(c, t.id).statut === 'en-cours');
  if (enCours) return enCours.id;
  const derniere = [...state.seances].reverse().find(s => s.classeId === c.id);
  return derniere?.chapId ?? ch[0]?.id ?? '';
}

/** Enregistre la séance au carnet et met à jour le suivi du chapitre. */
export function enregistrerSeance(s: Omit<Seance, 'id'>): void {
  update(d => {
    d.seances.push({ id: uid(), ...s });
    d.suivi[s.classeId] ??= {};
    const cur = d.suivi[s.classeId][s.chapId] ?? { statut: 'pas-vu' };
    cur.date = s.date;
    if (s.revoir) cur.statut = 'a-revoir';
    else if (cur.statut === 'pas-vu') cur.statut = 'en-cours';
    d.suivi[s.classeId][s.chapId] = cur;
  });
}
