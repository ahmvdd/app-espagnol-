import { isMuted } from './sound';

export type Accent = 'es-ES' | 'es-MX';
let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();
const load = () => { voices = speechSynthesis.getVoices(); listeners.forEach(f => f()); };
if ('speechSynthesis' in window) { load(); speechSynthesis.onvoiceschanged = load; }

export const hasSpanishVoice = () => voices.some(v => v.lang.toLowerCase().startsWith('es'));

/** Prévient quand la liste des voix change (elle arrive en différé sur Chrome). */
export function onVoices(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Pour l'accent latino, accepte toute voix es-US, es-419, es-MX... avant de retomber sur l'Espagne. */
function pickVoice(accent: Accent): SpeechSynthesisVoice | undefined {
  const es = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
  const exact = es.find(v => v.lang === accent);
  if (exact) return exact;
  if (accent === 'es-MX') return es.find(v => !/es[-_]es/i.test(v.lang)) ?? es[0];
  return es.find(v => /es[-_]es/i.test(v.lang)) ?? es[0];
}

/** Prononce un texte en espagnol. Renvoie false si muet ou aucune voix espagnole. */
export function speak(text: string, accent: Accent = 'es-ES', rate = 0.9): boolean {
  if (isMuted() || !('speechSynthesis' in window)) return false;
  const voice = pickVoice(accent);
  if (!voice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice.lang; u.voice = voice; u.rate = rate;
  speechSynthesis.speak(u);
  return true;
}
