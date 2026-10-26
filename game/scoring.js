// Підрахунок балів і підготовка даних для фінального екрана / PNG.

import { CONFIG, TIMER_MS } from './config.js';
import { LEVELS } from './levels.js';
import { TEXTS } from './texts.js';
import { elapsedMs, formatMs } from './timer.js';

/** Бали рахуються лише за статусом «solved» — повторне нарахування неможливе. */
export function totalScore(levels) {
  if (!levels) return 0;
  const solved = levels.filter((l) => l.status === 'solved').length;
  return Math.min(LEVELS.length * CONFIG.pointsPerLevel, solved * CONFIG.pointsPerLevel);
}

export function solvedCount(levels) {
  return levels ? levels.filter((l) => l.status === 'solved').length : 0;
}

/** Кінцівка для рахунку: 0, 25, 50, 75 або 100. */
export function endingFor(score) {
  const key = Math.max(0, Math.min(100, Math.round(score / 25) * 25));
  return { key, ...TEXTS.endings[key] };
}

/** Статус рівня на фінальному екрані. */
export function levelOutcome(rec, finishReason) {
  if (rec.status === 'solved') return TEXTS.levelStatus.solved;
  if (rec.status === 'deferred') return TEXTS.levelStatus.deferred;
  if (rec.status === 'unvisited') return finishReason === 'timeout' ? TEXTS.levelStatus.timeout : TEXTS.levelStatus.unvisited;
  return finishReason === 'timeout' ? TEXTS.levelStatus.timeout : TEXTS.levelStatus.failed;
}

/** Єдине джерело даних для екрана результатів і PNG-експорту. */
export function resultsSummary(session, now) {
  const levels = session.levels || [];
  const score = totalScore(levels);
  const ending = endingFor(score);
  return {
    team: session.team,
    score,
    solved: solvedCount(levels),
    ending,
    complete: score === LEVELS.length * CONFIG.pointsPerLevel,
    note: TEXTS.resultsNote[session.finishReason] || '',
    finishReason: session.finishReason,
    totalTime: formatMs(elapsedMs(session, now)),
    totalLimit: formatMs(TIMER_MS),
    totalMoves: levels.reduce((a, l) => a + (l.totalMoves || 0), 0),
    totalAttempts: levels.reduce((a, l) => a + (l.attempts || 0), 0),
    levels: levels.map((rec, i) => {
      const out = levelOutcome(rec, session.finishReason);
      return {
        title: 'РІВЕНЬ ' + (i + 1),
        size: LEVELS[i].n + ' × ' + LEVELS[i].n,
        points: rec.status === 'solved' ? CONFIG.pointsPerLevel : 0,
        max: CONFIG.pointsPerLevel,
        status: out.label,
        color: out.color,
        icon: out.icon,
        time: rec.status === 'solved' ? formatMs(rec.timeMs) : '—',
        moves: rec.totalMoves || 0,
        attempts: rec.attempts || 0,
      };
    }),
    dateText: new Date(session.finishedAt || now).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }),
  };
}
