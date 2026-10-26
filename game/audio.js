// Короткі ретрофутуристичні звуки через Web Audio API. Без зовнішніх файлів і фонової музики.

import { loadSoundEnabled, saveSoundEnabled } from './storage.js';

let ctx = null;
let enabled = loadSoundEnabled();
const MASTER = 0.5;

function audio() {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (e) {
    return null;
  }
}

function tone({ f = 440, f2 = null, type = 'square', dur = 0.08, vol = 0.05, delay = 0 }) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol * MASTER, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function click(vol = 0.18) {
  const a = audio();
  if (!a) return;
  const len = Math.floor(a.sampleRate * 0.03);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const src = a.createBufferSource();
  const hp = a.createBiquadFilter();
  const g = a.createGain();
  hp.type = 'highpass';
  hp.frequency.value = 1800;
  g.gain.value = vol * MASTER;
  src.buffer = buf;
  src.connect(hp).connect(g).connect(a.destination);
  src.start();
}

const last = {};
/** Захист від «залипання»: той самий звук не частіше ніж раз на gap мс. */
function once(name, gap, fn) {
  const t = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (last[name] && t - last[name] < gap) return;
  last[name] = t;
  fn();
}

const raw = {
  isEnabled: () => enabled,
  setEnabled(on) {
    enabled = !!on;
    saveSoundEnabled(enabled);
    if (enabled) tone({ f: 880, type: 'sine', dur: 0.07, vol: 0.05 });
  },
  /** Натискання механічної клавіші. */
  key() { click(); tone({ f: 140, f2: 90, type: 'triangle', dur: 0.05, vol: 0.08 }); },
  /** Увімкнення / вимкнення підсвічування (за станом натиснутої клавіші). */
  lightOn() { tone({ f: 620, f2: 940, type: 'sine', dur: 0.09, vol: 0.05, delay: 0.015 }); },
  lightOff() { tone({ f: 520, f2: 310, type: 'sine', dur: 0.09, vol: 0.045, delay: 0.015 }); },
  undo() { tone({ f: 760, f2: 430, type: 'triangle', dur: 0.12, vol: 0.06 }); },
  reset() { [660, 520, 400].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.07, vol: 0.05, delay: i * 0.06 })); },
  success() { [523, 659, 784, 1047].forEach((f, i) => tone({ f, type: 'square', dur: 0.11, vol: 0.035, delay: i * 0.075 })); },
  error() { tone({ f: 190, type: 'square', dur: 0.08, vol: 0.05 }); tone({ f: 150, type: 'square', dur: 0.1, vol: 0.05, delay: 0.1 }); },
  ui() { tone({ f: 980, type: 'sine', dur: 0.05, vol: 0.035 }); },
  final() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, type: 'square', dur: 0.14, vol: 0.035, delay: i * 0.09 }));
    tone({ f: 1568, type: 'sine', dur: 0.5, vol: 0.04, delay: 0.5 });
  },
};

export const sfx = {
  isEnabled: raw.isEnabled,
  setEnabled: raw.setEnabled,
  key: () => once('key', 40, raw.key),
  lightOn: () => once('lightOn', 40, raw.lightOn),
  lightOff: () => once('lightOff', 40, raw.lightOff),
  undo: () => once('undo', 80, raw.undo),
  reset: () => once('reset', 250, raw.reset),
  success: () => once('success', 600, raw.success),
  error: () => once('error', 400, raw.error),
  ui: () => once('ui', 60, raw.ui),
  final: () => once('final', 2000, raw.final),
};
