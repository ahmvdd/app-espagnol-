import QRCode from 'qrcode';
import jsQR from 'jsqr';
import type { Classe } from '../../lib/storage';
import { encodeClasse, lienImport, codeDepuis, MAX_QR } from '../../lib/transfert';
import { esc } from '../../lib/ui';

/** Fenêtre simple, fermée par Échap, le bouton ou un clic à côté. Renvoie la fonction de fermeture. */
function fenetre(titre: string, contenu: string, onClose: () => void = () => {}): { el: HTMLElement; close: () => void } {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-t">
    <h2 id="qr-t">${esc(titre)}</h2>${contenu}<button class="btn ghost" id="qr-close">Fermer</button></div>`;
  document.body.append(back);
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  const close = () => { back.remove(); removeEventListener('keydown', key); onClose(); };
  addEventListener('keydown', key);
  back.onclick = e => { if (e.target === back) close(); };
  back.querySelector<HTMLButtonElement>('#qr-close')!.onclick = close;
  back.querySelector<HTMLButtonElement>('#qr-close')!.focus();
  return { el: back, close };
}

export async function montrerQr(c: Classe): Promise<void> {
  const lien = lienImport(await encodeClasse(c));
  if (lien.length > MAX_QR) {
    fenetre('Classe trop grande pour un QR code', '<p>Utilise plutôt <strong>Sauvegarder dans un fichier</strong>, puis <strong>Restaurer</strong> sur l’autre appareil.</p>');
    return;
  }
  const svg = await QRCode.toString(lien, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 });
  fenetre(`Transférer « ${c.nom} »`, `
    <div class="qr-box">${svg}</div>
    <p>Sur l’autre appareil : scanne ce code avec l’appareil photo, ou ouvre <strong>Profe → Scanner un QR de classe</strong>.</p>
    <p class="muted small">${c.eleves.length} élève(s). Les prénoms passent directement d’un écran à l’autre : rien n’est envoyé sur Internet.</p>`);
}

/** Lecture à la webcam : le code trouvé ouvre la page d'import. */
export async function scanner(): Promise<void> {
  let stream: MediaStream | null = null, raf = 0;
  const f = fenetre('Scanner un QR de classe', `
    <p>Montre à la caméra le QR code affiché sur l’autre appareil.</p>
    <video id="qr-video" playsinline muted></video>
    <p class="muted small" id="qr-etat">Démarrage de la caméra…</p>`, () => { cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); });
  const video = f.el.querySelector<HTMLVideoElement>('#qr-video')!, etat = f.el.querySelector<HTMLElement>('#qr-etat')!;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  } catch {
    etat.textContent = 'Caméra indisponible ou refusée. Utilise plutôt le fichier de sauvegarde.';
    return;
  }
  video.srcObject = stream;
  await video.play();
  etat.textContent = 'Recherche d’un QR code…';
  const canvas = document.createElement('canvas'), g = canvas.getContext('2d', { willReadFrequently: true })!;
  const tick = () => {
    if (video.videoWidth) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      g.drawImage(video, 0, 0);
      const r = jsQR(g.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      if (r?.data) { f.close(); location.hash = '#/import/' + codeDepuis(r.data); return; }
    }
    raf = requestAnimationFrame(tick);
  };
  tick();
}
