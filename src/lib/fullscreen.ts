import { toast } from './ui';

export const isFullscreen = () => !!document.fullscreenElement;

/** Bascule le plein écran sur `el`. Renvoie false si le navigateur refuse. */
export async function toggleFullscreen(el: HTMLElement): Promise<boolean> {
  try {
    if (document.fullscreenElement) { await document.exitFullscreen(); return true; }
    if (!el.requestFullscreen) throw new Error();
    await el.requestFullscreen();
    return true;
  } catch {
    toast('Plein écran indisponible sur ce navigateur');
    return false;
  }
}

export const exitFullscreen = () => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); };
