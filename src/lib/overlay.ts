/**
 * Fenêtre plein écran par-dessus la page (aperçu de document, diaporama…).
 * - une croix ✕ toujours visible en haut à droite ;
 * - Échap ferme ;
 * - le bouton « retour » du téléphone ou du navigateur ferme la fenêtre au lieu de quitter la page.
 */
export function ouvrirOverlay(classe: string, label: string, html: string, onClose: () => void = () => {}): { zone: HTMLElement; fermer: () => void } {
  const zone = document.createElement('div');
  zone.className = `overlay ${classe}`;
  zone.setAttribute('role', 'dialog');
  zone.setAttribute('aria-modal', 'true');
  zone.setAttribute('aria-label', label);
  zone.innerHTML = `<button class="overlay-x" data-x aria-label="Fermer et revenir">✕</button>${html}`;
  document.body.append(zone);
  document.documentElement.classList.add('overlay-ouvert');

  let ferme = false;
  const fermer = (depuisHistorique = false) => {
    if (ferme) return;
    ferme = true;
    zone.remove();
    removeEventListener('keydown', key, true);
    removeEventListener('popstate', pop);
    if (!document.querySelector('.overlay')) document.documentElement.classList.remove('overlay-ouvert');
    if (!depuisHistorique && history.state?.overlay) history.back();
    onClose();
  };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } };
  const pop = () => fermer(true);
  addEventListener('keydown', key, true);
  history.pushState({ overlay: true }, '', location.href);
  addEventListener('popstate', pop);
  zone.querySelector<HTMLButtonElement>('[data-x]')!.onclick = () => fermer();
  return { zone, fermer: () => fermer() };
}

/** Exécute `fn` une fois la fenêtre précédente vraiment fermée (le retour d'historique est asynchrone). */
export function apresHistorique(fn: () => void): void {
  let fait = false;
  const go = () => { if (fait) return; fait = true; removeEventListener('popstate', go); setTimeout(fn, 0); };
  addEventListener('popstate', go);
  setTimeout(go, 400);
}
