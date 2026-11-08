const KEY = 'cq-muted';
let muted = false;
try {
  muted = localStorage.getItem(KEY) === '1';
} catch {
  /* ignore */
}
export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(KEY, m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  try {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx ??= new C();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

type Note = { f: number; d: number; t?: OscillatorType; g?: number; slide?: number };
function play(notes: Note[]) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  let at = c.currentTime;
  for (const n of notes) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = n.t ?? 'square';
    o.frequency.setValueAtTime(n.f, at);
    if (n.slide) o.frequency.linearRampToValueAtTime(n.slide, at + n.d);
    const v = n.g ?? 0.08;
    g.gain.setValueAtTime(v, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + n.d);
    o.connect(g).connect(c.destination);
    o.start(at);
    o.stop(at + n.d + 0.02);
    at += n.d;
  }
}

export const sfx = {
  slash: () => play([{ f: 900, slide: 150, d: 0.12, t: 'sawtooth', g: 0.07 }, { f: 120, d: 0.08, t: 'square' }]),
  coin: () => play([{ f: 988, d: 0.07 }, { f: 1319, d: 0.2 }]),
  levelUp: () => play([523, 659, 784, 1047, 784, 1047].map((f, i) => ({ f, d: i > 4 ? 0.3 : 0.1 }))),
  chest: () => play([{ f: 220, d: 0.1, t: 'triangle' }, { f: 330, d: 0.1, t: 'triangle' }, { f: 523, d: 0.1 }, { f: 659, d: 0.1 }, { f: 784, d: 0.1 }, { f: 1047, d: 0.3 }]),
  click: () => play([{ f: 440, d: 0.04, g: 0.05 }]),
  error: () => play([{ f: 180, d: 0.12, t: 'sawtooth' }, { f: 120, d: 0.2, t: 'sawtooth' }]),
};

export function buzz(pattern: number | number[] = 30) {
  try {
    if (!muted) navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
