// Загальний таймер. Час обчислюється від збереженого дедлайну та поточного годинника
// (Date.now()), а не зменшенням лічильника — тому відлік не «пливе», не зупиняється
// у фоновій вкладці й коректно відновлюється після F5.
// Пауза: поки session.pausedAt задано (відкрито попап), відлік стоїть.

/** Залишок часу в мс (не менше 0). */
export function remainingMs(session, now) {
  if (!session || session.deadline == null) return null;
  const at = session.finished ? session.finishedAt : session.pausedAt != null ? session.pausedAt : now;
  return Math.max(0, session.deadline - at);
}

/** Чистий ігровий час (без пауз), не більше тривалості таймера. */
export function elapsedMs(session, now) {
  if (!session || session.startedAt == null || session.deadline == null) return 0;
  const dur = session.durationMs != null ? session.durationMs : session.deadline - session.startedAt;
  return Math.max(0, Math.min(dur, dur - remainingMs(session, now)));
}

export function isExpired(session, now) {
  return !!session && session.deadline != null && !session.finished && session.pausedAt == null && now >= session.deadline;
}

/** 754000 → "12:34". Округлення вгору, щоб 00:00 з'являлося лише в момент завершення. */
export function formatMs(ms, roundUp = false) {
  const total = Math.max(0, roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
