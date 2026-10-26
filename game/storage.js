// Збереження сесії в localStorage. Усі помилки (приватний режим, переповнення) не ламають гру.

import { CONFIG } from './config.js';

export const SESSION_VERSION = 1;

export function loadSession() {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== SESSION_VERSION || typeof s.stage !== 'string') return null;
    return s;
  } catch (e) {
    console.warn('CAPTCHA AI: не вдалося прочитати збережену сесію', e);
    return null;
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(session));
  } catch (e) {
    console.warn('CAPTCHA AI: не вдалося зберегти сесію', e);
  }
}

export function clearSession() {
  try { localStorage.removeItem(CONFIG.storageKey); } catch (e) { /* ignore */ }
}

export function loadSoundEnabled() {
  try { return localStorage.getItem(CONFIG.soundKey) !== 'off'; } catch (e) { return true; }
}

export function saveSoundEnabled(on) {
  try { localStorage.setItem(CONFIG.soundKey, on ? 'on' : 'off'); } catch (e) { /* ignore */ }
}
