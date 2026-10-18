export type Timer = {
  left: () => number;
  running: () => boolean;
  pause: () => void;
  resume: () => void;
  add: (sec: number) => void;
  stop: () => void;
};

/**
 * Compte à rebours sans dérive : compare Date.now() à une échéance,
 * reste juste quand l'onglet passe en arrière-plan.
 */
export function startTimer(sec: number, onEnd: () => void, onTick: (left: number) => void = () => {}): Timer {
  let end = Date.now() + sec * 1000;
  let paused: number | null = null;
  let id: number | undefined;
  let last = -1;

  const left = () => Math.max(0, Math.ceil(((paused ?? end) - (paused === null ? Date.now() : 0)) / 1000));
  const tick = () => {
    const l = left();
    if (l !== last) { last = l; onTick(l); }
    if (l === 0) { clearInterval(id); id = undefined; onEnd(); }
  };
  const run = () => { clearInterval(id); id = window.setInterval(tick, 200); tick(); };

  run();
  return {
    left,
    running: () => id !== undefined && paused === null,
    pause() { if (paused !== null || id === undefined) return; paused = end - Date.now(); clearInterval(id); id = undefined; },
    resume() { if (paused === null) return; end = Date.now() + paused; paused = null; run(); },
    add(s) {
      if (paused !== null) paused = Math.max(1000, paused + s * 1000);
      else end = Math.max(Date.now() + 1000, end + s * 1000);
      last = -1; tick();
    },
    stop() { clearInterval(id); id = undefined; }
  };
}
