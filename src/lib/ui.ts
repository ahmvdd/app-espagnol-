export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export const shuffle = <T>(a: T[]) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = <T>(a: T[]) => a[(Math.random() * a.length) | 0];
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let t: number | undefined;
export function toast(msg: string): void {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(t); t = window.setTimeout(() => el.classList.remove('show'), 2400);
}

/** Minuteries regroupées pour être toutes arrêtées au nettoyage d'un outil. */
export function timers() {
  const ids = new Set<number>();
  return {
    after(fn: () => void, ms: number) { const id = window.setTimeout(() => { ids.delete(id); fn(); }, ms); ids.add(id); },
    every(fn: () => void, ms: number) { ids.add(window.setInterval(fn, ms)); },
    clear() { ids.forEach(id => clearTimeout(id)); ids.clear(); }
  };
}

/** Raccourcis clavier, ignorés pendant la saisie. Renvoie la fonction de retrait. */
export function onKeys(map: Record<string, () => void>): () => void {
  const h = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest?.('input,textarea,select') || e.ctrlKey || e.metaKey || e.altKey) return;
    const f = map[e.key];
    if (f) { e.preventDefault(); f(); }
  };
  addEventListener('keydown', h);
  return () => removeEventListener('keydown', h);
}
