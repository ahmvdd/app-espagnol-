/** Outils communs aux jeux de plateau (La paga del mes, El misterio, Ruta por España). */
import type { Team } from './engine';
import { state } from '../lib/state';
import { speak } from '../lib/speech';
import { beep } from '../lib/sound';
import { esc, reducedMotion, toast } from '../lib/ui';

const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
  'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis',
  'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

/** Un nombre en toutes lettres, en espagnol (0 à 999 999). */
export function numero(n: number): string {
  n = Math.round(Math.abs(n));
  if (n < 30) return UNIDADES[n];
  if (n < 100) { const d = Math.floor(n / 10), u = n % 10; return DECENAS[d] + (u ? ` y ${UNIDADES[u]}` : ''); }
  if (n === 100) return 'cien';
  if (n < 1000) { const c = Math.floor(n / 100), r = n % 100; return CENTENAS[c] + (r ? ` ${numero(r)}` : ''); }
  const m = Math.floor(n / 1000), r = n % 1000;
  return (m === 1 ? 'mil' : `${numero(m).replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')} mil`) + (r ? ` ${numero(r)}` : '');
}

/** « veintiún euros », « un euro », « cien euros » : avec l'apocope devant le nom. */
export function euros(n: number): string {
  if (Math.abs(n) === 1) return 'un euro';
  const mots = numero(n).replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
  return `${mots} euros`;
}

/** Montant affiché : 1 250 €. */
export const prix = (n: number) => `${n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('fr-FR')} €`;

export const dire = (texte: string) => {
  if (!speak(texte, state.reglages.accent ?? 'es-ES')) toast(state.reglages.muet ? 'Son coupé' : 'Voix espagnole absente sur cet appareil');
};

export const de = () => 1 + Math.floor(Math.random() * 6);
const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/** Fait rouler le dé à l'écran puis appelle `fin` avec la valeur. */
export function lancerDe(zone: HTMLElement, fin: (v: number) => void): void {
  const v = de();
  if (reducedMotion()) { zone.textContent = FACES[v - 1]; fin(v); return; }
  let k = 0;
  const id = window.setInterval(() => {
    zone.textContent = FACES[Math.floor(Math.random() * 6)];
    beep(500 + Math.random() * 400, 0.03);
    if (++k >= 9) { clearInterval(id); zone.textContent = FACES[v - 1]; fin(v); }
  }, 70);
}

/** Bloc « à dire en espagnol » : la phrase modèle, l'audio, et la validation par l'enseignante. */
export function aDire(phrase: string, aide = 'L’équipe le dit à voix haute, sans lire si possible.'): string {
  return `
    <div class="a-dire">
      <p class="muted small">🗣 À dire en espagnol</p>
      <p class="big" lang="es">« ${esc(phrase)} »</p>
      <p class="muted small">${aide}</p>
      <div class="row wrap center-row">
        <button class="btn ghost sm" data-ecouter>🔊 Écouter</button>
        <button class="btn ok" data-bien>✓ Bien dit</button>
        <button class="btn warn" data-rate>✗ Pas encore</button>
      </div>
    </div>`;
}

/** Branche les boutons d'un bloc `aDire`. */
export function brancherADire(el: HTMLElement, phrase: string, bien: () => void, rate: () => void): void {
  el.querySelector<HTMLButtonElement>('[data-ecouter]')!.onclick = () => dire(phrase);
  el.querySelector<HTMLButtonElement>('[data-bien]')!.onclick = bien;
  el.querySelector<HTMLButtonElement>('[data-rate]')!.onclick = rate;
}

export const pion = (t: Team) => `<span class="pion" title="${esc(t.nom)}">${t.icon}</span>`;

/** Points de fin de partie : 3 au premier, 2 au deuxième, 1 au troisième (jamais de retrait). */
export function classement<T extends { equipe: number; total: number }>(lignes: T[], point: (team: number, n?: number) => void): T[] {
  const tri = [...lignes].sort((a, b) => b.total - a.total);
  tri.slice(0, 3).forEach((l, i) => point(l.equipe, 3 - i));
  return tri;
}
