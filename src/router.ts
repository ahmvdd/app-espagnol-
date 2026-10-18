export type View = (el: HTMLElement) => void | (() => void); // une vue peut renvoyer une fonction de nettoyage

const routes = new Map<string, View>();
let cleanup: void | (() => void);

export const route = (path: string, view: View) => routes.set(path, view);

export function start(app: HTMLElement): void {
  const go = () => {
    if (typeof cleanup === 'function') cleanup();
    const path = location.hash.replace(/^#/, '') || '/';
    const base = '/' + (path.split('/')[1] ?? '').split('?')[0];
    const view = routes.get(path) ?? routes.get(base) ?? routes.get('/')!;
    const courant = '#' + path.split('?')[0];
    document.querySelectorAll('header nav a').forEach(a => {
      const href = a.getAttribute('href')!;
      const actif = href === '#' + base || (href !== '#/' && courant.startsWith(href));
      a.setAttribute('aria-current', actif ? 'page' : 'false');
    });
    app.innerHTML = '';
    cleanup = view(app);
    window.scrollTo(0, 0);
  };
  addEventListener('hashchange', go);
  go();
}
