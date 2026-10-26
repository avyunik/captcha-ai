// Точка входу модулів гри. Інтерфейс (CAPTCHA-AI.dc.html) імпортує лише цей файл.

export { CONFIG, TIMER_MS } from './config.js';
export { LEVELS, TRAINING } from './levels.js';
export { TEXTS } from './texts.js';
export * as puzzle from './puzzle.js';
export * as solver from './solver.js';
export * as state from './game-state.js';
export * as timer from './timer.js';
export * as scoring from './scoring.js';
export * as storage from './storage.js';
export { sfx } from './audio.js';
export * as exporter from './export.js';
