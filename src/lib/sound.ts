let ctx: AudioContext | null = null;
let muted = false;
let volume = 0.6;

export const setMuted = (m: boolean) => { muted = m; if (m) speechSynthesis?.cancel(); };
export const isMuted = () => muted;
export const setVolume = (v: number) => { volume = Math.max(0, Math.min(1, v)); };

/** Son doux (jamais agressif : volume plafonné, attaque progressive). */
function tone(freq: number, dur: number, gain = 0.15, delay = 0): void {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain * volume, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0); o.stop(t0 + dur + 0.05);
  } catch { /* audio indisponible */ }
}

export const beep = (freq = 660, dur = 0.2) => tone(freq, dur);
export const chime = () => [523, 659, 784].forEach((f, i) => tone(f, 0.7, 0.15, i * 0.25));
export const gong = () => [110, 220, 331, 440, 554].forEach((f, i) => tone(f, 3, 0.22 / (i + 1)));
