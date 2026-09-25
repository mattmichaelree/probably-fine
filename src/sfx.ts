// Tiny synthesized blips: no audio files, nothing to license. Mute persists like reduced motion.
const readMute = () => { try { return localStorage.getItem('pf-mute') === '1'; } catch { return false; } };
export let muted = readMute();
export function setMuted(on: boolean) {
  muted = on;
  try { localStorage.setItem('pf-mute', on ? '1' : '0'); } catch { /* private mode: setting lasts this session */ }
}

type Sfx = 'tap' | 'good' | 'bad';
// [frequency Hz, start s, length s] per note.
const NOTES: Record<Sfx, [number, number, number][]> = {
  tap: [[660, 0, 0.06]],
  good: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.2]],
  bad: [[220, 0, 0.18], [165, 0.16, 0.32]],
};

let ctx: AudioContext | undefined;
export function sfx(kind: Sfx) {
  if (muted) return;
  try {
    ctx ??= new AudioContext(); // first call happens inside a tap, which unlocks audio on phones
    const t0 = ctx.currentTime;
    for (const [f, at, len] of NOTES[kind]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = kind === 'bad' ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, t0 + at);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + at + len);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + at);
      o.stop(t0 + at + len);
    }
  } catch { /* no audio available: stay silent */ }
}
