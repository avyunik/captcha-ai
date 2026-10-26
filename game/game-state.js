// Стани ігрової сесії та переходи між ними.
// Усі функції чисті: приймають сесію й повертають НОВУ сесію (вихідна не змінюється).
//
// stage: 'intro' → 'training' → 'main' → 'results'
// Статус рівня: 'unvisited' | 'active' | 'deferred' | 'solved'
//
// Пауза таймера: поки відкрите будь-яке вікно (попап успіху, підтвердження, повернення
// до відкладеного), s.pausedAt містить момент відкриття. При закритті дедлайн
// зсувається на тривалість паузи — таймер продовжує з того самого значення.

import { CONFIG, TIMER_MS } from './config.js';
import { LEVELS, TRAINING } from './levels.js';
import { parseBoard, press, isSolved } from './puzzle.js';
import { TEXTS } from './texts.js';
import { totalScore } from './scoring.js';
import { SESSION_VERSION } from './storage.js';

const clone = (o) => JSON.parse(JSON.stringify(o));

/** Очищення назви команди: без HTML, керівних символів і зайвих пробілів, обмежена довжина. */
export function sanitizeTeam(raw) {
  return String(raw ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001f\u007f<>&"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CONFIG.teamNameMax)
    .trim();
}

export function createIntro(team = '') {
  return { v: SESSION_VERSION, stage: 'intro', team, modal: null };
}

function freshLevel(lv) {
  return { id: lv.id, status: 'unvisited', board: parseBoard(lv.start), history: [], movesUsed: 0, totalMoves: 0, attempts: 0, timeMs: 0, points: 0, solvedAt: null };
}

/** Нова сесія з тренуванням (таймер ще не запущено). */
export function startTraining(team) {
  return {
    v: SESSION_VERSION,
    stage: 'training',
    team: sanitizeTeam(team),
    training: { board: parseBoard(TRAINING.start), history: [], moves: 0, solved: false, passed: false },
    levels: LEVELS.map(freshLevel),
    current: null,
    startedAt: null,
    deadline: null,
    durationMs: null,
    pausedAt: null,
    pausedTotal: 0,
    enteredAt: null,
    finished: false,
    finishedAt: null,
    finishReason: null,
    modal: null,
    msg: TEXTS.training.start,
  };
}

// ── Пауза таймера ────────────────────────────────────────────────────────

function pause(s, now) {
  if (s.stage === 'main' && !s.finished && s.deadline != null && s.pausedAt == null) s.pausedAt = now;
}

function resume(s, now) {
  if (s.pausedAt == null) return;
  const d = Math.max(0, now - s.pausedAt);
  s.deadline += d;
  if (s.enteredAt != null) s.enteredAt += d;
  s.pausedTotal = (s.pausedTotal || 0) + d;
  s.pausedAt = null;
}

function setModal(s, kind, now) {
  s.modal = kind;
  pause(s, now);
}

function clearModalMut(s, now) {
  s.modal = null;
  resume(s, now);
}

export function isPaused(s) {
  return !!s && s.pausedAt != null;
}

// ── Поле ─────────────────────────────────────────────────────────────────

/** Активне поле поточної стадії: {n, rec, limit, start, target, name}. */
export function activeBoard(s) {
  if (s.stage === 'training') return { n: TRAINING.n, rec: s.training, limit: null, start: TRAINING.start, target: TRAINING.target, name: TRAINING.name };
  if (s.stage === 'main' && s.current != null) {
    const lv = LEVELS[s.current];
    return { n: lv.n, rec: s.levels[s.current], limit: lv.limit, start: lv.start, target: lv.target, name: lv.name };
  }
  return null;
}

/**
 * Натискання клавіші idx.
 * result: 'toggle' | 'solved' | 'blocked' (недоступно) | 'exhausted' (ліміт вичерпано)
 */
export function pressCell(s0, idx, now) {
  if (s0.modal || s0.finished) return { s: s0, result: 'blocked' };
  const s = clone(s0);
  if (s.stage === 'training') {
    const t = s.training;
    if (t.solved) return { s: s0, result: 'blocked' };
    t.board = press(t.board, TRAINING.n, idx);
    t.history.push(idx);
    t.moves++;
    if (isSolved(t.board, TRAINING.target)) {
      t.solved = true;
      t.passed = true;
      s.msg = TEXTS.training.solved;
      return { s, result: 'solved' };
    }
    if (t.moves === 1) s.msg = TEXTS.training.first;
    else if (t.moves === 4) s.msg = TEXTS.training.hint;
    return { s, result: 'toggle' };
  }
  if (s.stage === 'main') {
    const lv = LEVELS[s.current];
    const r = s.levels[s.current];
    if (r.status === 'solved') return { s: s0, result: 'blocked' };
    if (r.movesUsed >= lv.limit) return { s: s0, result: 'exhausted' };
    r.board = press(r.board, lv.n, idx);
    r.history.push(idx);
    r.movesUsed++;
    r.totalMoves++;
    if (isSolved(r.board, lv.target)) {
      solveCurrent(s, now);
      return { s, result: 'solved' };
    }
    const left = lv.limit - r.movesUsed;
    if (left === 0) s.msg = TEXTS.exhausted;
    else if (left <= 2) s.msg = TEXTS.movesLow(left);
    return { s, result: 'toggle' };
  }
  return { s: s0, result: 'blocked' };
}

/** Зарахування рівня. Бали фіксуються одразу, таймер стає на паузу разом із попапом. */
function solveCurrent(s, now) {
  const r = s.levels[s.current];
  if (r.status === 'solved') return;
  r.status = 'solved';
  r.points = CONFIG.pointsPerLevel;
  r.timeMs += Math.max(0, Math.min(now, s.deadline) - s.enteredAt);
  r.solvedAt = now;
  s.enteredAt = now;
  s.msg = { text: TEXTS.success[s.current % TEXTS.success.length], mood: 'celebrating' };
  setModal(s, 'success', now);
}

/** Скасувати останній хід: повторне натискання тієї ж клавіші відновлює попередній стан. */
export function undo(s0) {
  if (s0.modal || s0.finished) return s0;
  const ab = activeBoard(s0);
  if (!ab || !ab.rec.history.length) return s0;
  if (s0.stage === 'training' && s0.training.solved) return s0;
  if (s0.stage === 'main' && ab.rec.status === 'solved') return s0;
  const s = clone(s0);
  const rec = activeBoard(s).rec;
  const last = rec.history.pop();
  rec.board = press(rec.board, ab.n, last);
  if (s.stage === 'training') { rec.moves--; s.msg = TEXTS.training.undo; }
  else { rec.movesUsed--; s.msg = TEXTS.undo; }
  return s;
}

/** Скинути поточний рівень до початкового стану. Бали не змінюються; вікно підтвердження закривається. */
export function resetLevel(s0, now = Date.now()) {
  const ab = activeBoard(s0);
  if (!ab || s0.finished) return s0;
  const s = clone(s0);
  clearModalMut(s, now);
  const rec = activeBoard(s).rec;
  rec.board = parseBoard(ab.start);
  rec.history = [];
  if (s.stage === 'training') {
    rec.moves = 0;
    rec.solved = false;
    s.msg = TEXTS.training.reset;
  } else {
    if (rec.status === 'solved') return s0;
    rec.movesUsed = 0;
    rec.attempts++;
    s.msg = TEXTS.reset(rec.attempts);
  }
  return s;
}

/** Перехід від тренування до основної гри: запуск загального таймера. */
export function startMain(s0, now) {
  if (s0.stage !== 'training' || !s0.training.passed) return s0;
  const s = clone(s0);
  s.stage = 'main';
  s.durationMs = TIMER_MS;
  s.startedAt = now;
  s.deadline = now + TIMER_MS;
  s.pausedAt = null;
  s.pausedTotal = 0;
  s.modal = null;
  enterLevel(s, 0, now);
  return s;
}

function enterLevel(s, i, now) {
  const r = s.levels[i];
  const wasDeferred = r.status === 'deferred';
  if (r.status === 'unvisited') r.attempts = 1;
  r.status = 'active';
  if (wasDeferred) r.wasDeferred = true;
  s.current = i;
  s.enteredAt = now;
  if (wasDeferred) {
    s.msg = TEXTS.returned(i + 1);
    setModal(s, 'returnDeferred', now);
  } else {
    s.msg = TEXTS.levelIntro[i];
  }
}

function leaveLevel(s, now) {
  if (s.current == null) return;
  const r = s.levels[s.current];
  if (r.status !== 'solved') r.timeMs += Math.max(0, Math.min(now, s.deadline) - s.enteredAt);
  s.enteredAt = now;
}

/**
 * Наступний рівень після from:
 * 1) ще не відвідані рівні (спершу після поточного);
 * 2) потім відкладені — по колу, починаючи з наступного після from;
 * 3) null, якщо інших невирішених рівнів немає (поточний не враховується).
 */
export function pickNext(levels, from) {
  for (let i = from + 1; i < levels.length; i++) if (levels[i].status === 'unvisited') return i;
  for (let i = 0; i < levels.length; i++) if (levels[i].status === 'unvisited' && i !== from) return i;
  for (let k = 1; k < levels.length; k++) {
    const j = (from + k) % levels.length;
    if (levels[j].status === 'deferred') return j;
  }
  return null;
}

export function allSolved(s) {
  return !!s.levels && s.levels.every((l) => l.status === 'solved');
}

/** Кнопка «Наступний рівень» у попапі успіху. */
export function advance(s0, now) {
  if (s0.stage !== 'main' || s0.finished || s0.modal !== 'success') return s0;
  const s = clone(s0);
  clearModalMut(s, now);
  if (allSolved(s)) return finish(s, 'complete', now);
  const next = pickNext(s.levels, s.current);
  if (next == null) return finish(s, 'early', now);
  enterLevel(s, next, now);
  return s;
}

/** Кнопка «Пропустити рівень»: підтвердження пропуску або (якщо пропускати нікуди) дострокового завершення. */
export function requestSkip(s0, now = Date.now()) {
  if (s0.stage !== 'main' || s0.modal || s0.finished) return s0;
  const s = clone(s0);
  setModal(s, pickNext(s.levels, s.current) == null ? 'confirmFinish' : 'confirmSkip', now);
  return s;
}

export function confirmSkip(s0, now) {
  if (s0.stage !== 'main' || s0.finished) return s0;
  const s = clone(s0);
  clearModalMut(s, now);
  const next = pickNext(s.levels, s.current);
  if (next == null) { setModal(s, 'confirmFinish', now); return s; }
  leaveLevel(s, now);
  s.levels[s.current].status = 'deferred';
  enterLevel(s, next, now);
  return s;
}

export function finishEarly(s0, now) {
  return finish(clone(s0), 'early', now);
}

/** Завершення гри. Для таймауту показується попап «Час вичерпано», інакше — одразу результати. */
function finish(s, reason, now, showTimeoutModal = true) {
  if (s.finished) return s;
  clearModalMut(s, now);
  const end = reason === 'timeout' ? s.deadline : Math.min(now, s.deadline);
  leaveLevel(s, end);
  s.finished = true;
  s.finishedAt = end;
  s.finishReason = reason;
  s.score = totalScore(s.levels);
  if (reason === 'timeout' && showTimeoutModal) {
    s.modal = 'timeout';
  } else {
    s.stage = 'results';
    s.modal = null;
  }
  return s;
}

/** Перевірка дедлайну (під час паузи час не спливає). live=false — після перезавантаження (одразу результати). */
export function checkTimeout(s0, now, live = true) {
  if (s0.stage !== 'main' || s0.finished || s0.deadline == null || s0.pausedAt != null || now < s0.deadline) return s0;
  return finish(clone(s0), 'timeout', now, live);
}

export function toResults(s0) {
  if (!s0.finished) return s0;
  const s = clone(s0);
  s.stage = 'results';
  s.modal = null;
  return s;
}

export function openModal(s0, kind, now = Date.now()) {
  if (s0.modal) return s0;
  const s = clone(s0);
  setModal(s, kind, now);
  return s;
}

export function closeModal(s0, now = Date.now()) {
  const s = clone(s0);
  clearModalMut(s, now);
  return s;
}

/** Відновлення після перезавантаження сторінки. */
export function restore(saved, now) {
  if (!saved) return createIntro();
  let s = saved;
  if (s.stage === 'main') {
    s = checkTimeout(s, now, false);
    if (s.finished && s.stage === 'main') s = toResults(s);
  }
  // Підтвердження не переживають перезавантаження; інформаційні попапи (і пауза) — так.
  if (s.modal && String(s.modal).startsWith('confirm')) s = closeModal(s, now);
  return s;
}
