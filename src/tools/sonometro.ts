import type { Tool } from './index';
import { chime } from '../lib/sound';
import { $ } from '../lib/ui';

const PREFS = 'rincon.sonometre';
type Seuils = { orange: number; rouge: number };

const lireSeuils = (): Seuils => {
  try { return { orange: 45, rouge: 70, ...JSON.parse(localStorage.getItem(PREFS) || '{}') }; } catch { return { orange: 45, rouge: 70 }; }
};
const FEUX = {
  vert: { icon: '🟢', label: 'Bien, on continue', es: 'Bien' },
  orange: { icon: '🟠', label: 'Un peu fort', es: 'Más bajo' },
  rouge: { icon: '🔴', label: 'Trop fort !', es: '¡Demasiado ruido!' }
};

const sonometro: Tool = el => {
  const seuils = lireSeuils();
  let stream: MediaStream | null = null, ctx: AudioContext | null = null, raf = 0;
  let niveau = 0, depuisRouge = 0, derniereAlerte = 0;

  const intro = () => {
    el.innerHTML = `
      <div class="center">
        <div class="count" aria-hidden="true">🎙</div>
        <p class="big">Le sonomètre écoute le bruit de la classe avec le micro.</p>
        <p>Rien n’est enregistré ni envoyé : le volume est mesuré en direct sur cet appareil, puis oublié.</p>
        <button class="btn bigbtn" id="go">Activer le micro</button>
        <p class="muted small">Le navigateur va demander l’autorisation.</p>
      </div>`;
    $('#go', el).onclick = demarrer;
  };

  const refus = (msg: string) => {
    el.innerHTML = `
      <div class="center">
        <p class="big">🎙✕ ${msg}</p>
        <p>Pas de souci : le <strong>niveau de voix</strong> fait le même travail, sans micro.</p>
        <a class="btn bigbtn" href="#/herramientas/voz">Ouvrir le niveau de voix</a>
        <button class="btn ghost" id="retry">Réessayer</button>
      </div>`;
    $('#retry', el).onclick = demarrer;
  };

  const demarrer = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return refus('Le micro n’est pas disponible sur ce navigateur.');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) {
      const nom = (e as DOMException).name;
      return refus(nom === 'NotAllowedError' ? 'L’accès au micro a été refusé.' : nom === 'NotFoundError' ? 'Aucun micro détecté sur cet ordinateur.' : 'Le micro n’a pas pu démarrer.');
    }
    ctx = new AudioContext();
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Float32Array(an.fftSize);
    vue();
    const loop = () => {
      an.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      const db = 20 * Math.log10(Math.sqrt(sum / buf.length) || 1e-8);
      const cible = Math.max(0, Math.min(100, ((db + 70) / 60) * 100));
      niveau += (cible - niveau) * (cible > niveau ? 0.3 : 0.06);
      maj();
      raf = requestAnimationFrame(loop);
    };
    loop();
  };

  const vue = () => {
    el.innerHTML = `
      <div class="sono">
        <div class="feu" aria-hidden="true"><i class="l-rouge">🔴</i><i class="l-orange">🟠</i><i class="l-vert">🟢</i></div>
        <div class="center">
          <div class="huge" id="etat" aria-live="polite"></div>
          <p class="big" id="etat-es" lang="es"></p>
          <div class="jauge" role="meter" aria-label="Volume de la classe" aria-valuemin="0" aria-valuemax="100" id="jauge">
            <i id="barre"></i><b class="seuil" id="s-o"></b><b class="seuil" id="s-r"></b>
          </div>
          <details class="reglages-sono">
            <summary>Régler les seuils</summary>
            <label class="field">Seuil orange <input type="range" id="r-o" min="10" max="90" value="${seuils.orange}"></label>
            <label class="field">Seuil rouge <input type="range" id="r-r" min="20" max="100" value="${seuils.rouge}"></label>
          </details>
        </div>
      </div>`;
    const sync = () => {
      $('#s-o', el).style.left = seuils.orange + '%';
      $('#s-r', el).style.left = seuils.rouge + '%';
      try { localStorage.setItem(PREFS, JSON.stringify(seuils)); } catch { /* ignore */ }
    };
    const ro = $<HTMLInputElement>('#r-o', el), rr = $<HTMLInputElement>('#r-r', el);
    ro.oninput = () => { seuils.orange = Math.min(Number(ro.value), seuils.rouge - 5); ro.value = String(seuils.orange); sync(); };
    rr.oninput = () => { seuils.rouge = Math.max(Number(rr.value), seuils.orange + 5); rr.value = String(seuils.rouge); sync(); };
    sync();
  };

  let etatAff = '';
  const maj = () => {
    const etat = niveau >= seuils.rouge ? 'rouge' : niveau >= seuils.orange ? 'orange' : 'vert';
    const barre = $('#barre', el);
    if (!barre) return;
    barre.style.width = niveau.toFixed(1) + '%';
    barre.className = etat;
    $('#jauge', el).setAttribute('aria-valuenow', String(Math.round(niveau)));
    if (etat !== etatAff) {
      etatAff = etat;
      const f = FEUX[etat];
      $('#etat', el).textContent = `${f.icon} ${f.label}`;
      $('#etat-es', el).textContent = f.es;
      el.querySelector('.sono')!.className = `sono ${etat}`;
    }
    const now = performance.now();
    if (etat === 'rouge') {
      depuisRouge ||= now;
      if (now - depuisRouge > 1500 && now - derniereAlerte > 8000) { chime(); derniereAlerte = now; }
    } else depuisRouge = 0;
  };

  intro();
  return () => {
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach(t => t.stop());
    void ctx?.close();
  };
};

export default sonometro;
