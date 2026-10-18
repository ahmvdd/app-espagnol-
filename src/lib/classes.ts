import { state, update } from './state';
import { esc } from './ui';

const LAST = 'rincon.derniereClasse';

/** Dernière classe utilisée dans un outil (hors données sauvegardées : simple confort). */
export function currentClasseId(): string {
  let id = '';
  try { id = localStorage.getItem(LAST) ?? ''; } catch { /* ignore */ }
  return state.classes.some(c => c.id === id) ? id : state.classes[0]?.id ?? '';
}

export const rememberClasse = (id: string) => { try { localStorage.setItem(LAST, id); } catch { /* ignore */ } };

export const classeOptions = (sel: string, numbers = false) =>
  (numbers ? `<option value="" ${sel === '' ? 'selected' : ''}>Numéros (sans liste)</option>` : '') +
  state.classes.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.nom || 'Sans nom')} · ${c.eleves.length} élèves</option>`).join('');
