import { isMuted } from './sound';

export type Accent = 'es-ES' | 'es-MX';
let voices: SpeechSynthesisVoice[] = [];
const load = () => { voices = speechSynthesis.getVoices(); };
if ('speechSynthesis' in window) { load(); speechSynthesis.onvoiceschanged = load; }

export const hasSpanishVoice = () => voices.some(v => v.lang.toLowerCase().startsWith('es'));

/** Prononce un mot en espagnol. Renvoie false si aucune voix n'est dispo (prévoir un fichier audio en repli). */
export function speak(text: string, accent: Accent = 'es-ES', rate = 0.9): boolean {
  if (isMuted() || !('speechSynthesis' in window)) return false;
  const voice = voices.find(v => v.lang === accent) ?? voices.find(v => v.lang.startsWith('es'));
  if (!voice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = accent; u.voice = voice; u.rate = rate;
  speechSynthesis.speak(u);
  return true;
}
