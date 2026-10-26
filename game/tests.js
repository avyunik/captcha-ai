// Автоматичні тести логіки гри. Запуск: відкрийте «Тести.dc.html».
// Перевіряються головоломка, рівні, бали, пропуски, таймер, кінцівки й ім'я PNG.

import { CONFIG, TIMER_MS } from './config.js';
import { LEVELS, TRAINING } from './levels.js';
import { TEXTS } from './texts.js';
import * as P from './puzzle.js';
import * as SOL from './solver.js';
import * as S from './game-state.js';
import * as SC from './scoring.js';
import * as TM from './timer.js';
import { pngFileName } from './export.js';

const L = P.LETTERS;
const idx = (c) => L.indexOf(c);

function solveLevel(s, t) {
  const lv = LEVELS[s.current];
  for (const c of lv.solution) s = S.pressCell(s, idx(c), (t += 1000)).s;
  return s;
}

function mainSession(team = 'Тест', t0 = 1_000_000) {
  let s = S.startTraining(team);
  for (const c of TRAINING.solution) s = S.pressCell(s, idx(c), t0).s;
  return S.startMain(s, t0);
}

export function runTests() {
  const out = [];
  const test = (group, name, fn) => {
    try {
      const r = fn();
      out.push({ group, name, ok: r === true || (r && r.ok), detail: r && r.detail ? r.detail : '' });
    } catch (e) {
      out.push({ group, name, ok: false, detail: String(e && e.message) });
    }
  };
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // ── Головоломка
  test('Логіка', 'Центр 3×3 перемикає себе й 4 сусідів', () => eq(P.press(Array(9).fill(0), 3, 4), [0, 1, 0, 1, 1, 1, 0, 1, 0]));
  test('Логіка', 'Діагональні клітинки не змінюються', () => { const b = P.press(Array(9).fill(0), 3, 4); return [0, 2, 6, 8].every((i) => b[i] === 0); });
  test('Логіка', 'Кутова клавіша A змінює лише 3 клітинки', () => eq(P.press(Array(9).fill(0), 3, 0), [1, 1, 0, 1, 0, 0, 0, 0, 0]));
  test('Логіка', 'Крайова клавіша B (3×3) змінює 4 клітинки', () => P.press(Array(9).fill(0), 3, 1).reduce((a, b) => a + b) === 4);
  test('Логіка', 'Кут 5×5 (Y) змінює 3 клітинки', () => P.press(Array(25).fill(0), 5, 24).reduce((a, b) => a + b) === 3);
  test('Логіка', 'Повторне натискання скасовує ефект', () => { const b = P.parseBoard('0010010110100100'); return eq(P.press(P.press(b, 4, 6), 4, 6), b); });
  test('Логіка', 'Перемога лише при повному збігу зі зразком', () => P.isSolved([1, 0, 1], '101') && !P.isSolved([1, 1, 1], '101') && P.matchCount([1, 1, 1], '101') === 2);
  test('Логіка', 'Літери: 3×3 A–I, 4×4 A–P, 5×5 A–Y', () => P.labels(3).join('') === 'ABCDEFGHI' && P.labels(4).join('') === 'ABCDEFGHIJKLMNOP' && P.labels(5).join('') === L);

  // ── Рівні
  test('Рівні', 'Тренування: смуга → діагональний хрест за 2 натискання (D, F), рішення єдине', () => { const r = SOL.solve(3, P.parseBoard(TRAINING.start), P.parseBoard(TRAINING.target)); return r.min === 2 && r.minSolutions.length === 1 && r.minSolutions[0] === TRAINING.solution && P.isSolved(P.applyPresses(P.parseBoard(TRAINING.start), 3, 'DF'), TRAINING.target); });
  test('Рівні', 'Тренування не розв\u2019язується одним натисканням', () => P.labels(3).every((_, i) => !P.isSolved(P.press(P.parseBoard(TRAINING.start), 3, i), TRAINING.target)));
  const v = SOL.verifyLevels(LEVELS, P.parseBoard);
  v.reports.forEach((r) => test('Рівні', `Рівень ${r.id}: розв\u2019язний, мінімум ${r.min}, розв\u2019язків мінімальної ваги: ${r.minSolutions.length}`, () => ({ ok: r.solvable && r.issues.length === 0, detail: r.issues.join('; ') })));
  LEVELS.forEach((lv) => test('Рівні', `Рівень ${lv.id} «${lv.name}»: ліміт ${lv.limit} = мінімум ${lv.min} + ${lv.limit - lv.min} запасу`, () => lv.limit - lv.min >= 2 && lv.limit - lv.min <= 3));
  LEVELS.forEach((lv) => test('Рівні', `Рівень ${lv.id}: мета — візерунок, а не повністю засвічене поле`, () => lv.target.includes('0') && lv.target.includes('1') && lv.start !== lv.target));
  test('Рівні', 'Сумарний мінімум ходів посильний для 15 хв (≤ 20)', () => LEVELS.reduce((a, l) => a + l.min, 0) <= 20);
  LEVELS.forEach((lv) => test('Рівні', `Рівень ${lv.id}: контрольна відповідь ${lv.solution} розв\u2019язує поле`, () => P.isSolved(P.applyPresses(P.parseBoard(lv.start), lv.n, lv.solution), lv.target)));
  test('Рівні', 'Розміри полів: 3, 4, 4, 5', () => eq(LEVELS.map((l) => l.n), [3, 4, 4, 5]));
  test('Рівні', 'Складність рівна: мінімум 3–4 ходи на кожен рівень', () => LEVELS.every((l) => l.min >= 3 && l.min <= 4));
  LEVELS.forEach((lv) => test('Рівні', `Рівень ${lv.id}: різниця «старт/зразок» 7–11 клітинок, перетин зон натискань ≤ 3`, () => {
    const cnt = new Array(lv.n * lv.n).fill(0);
    for (const c of lv.solution) for (const j of P.affected(lv.n, idx(c))) cnt[j]++;
    const diff = cnt.filter((c) => c % 2).length;
    const over = cnt.filter((c) => c >= 2).length;
    return { ok: diff >= 7 && diff <= 11 && over <= 3, detail: `різниця ${diff}, перетин ${over}` };
  }));

  // ── Хід гри
  test('Гра', 'Таймер не запускається на тренуванні', () => { const s = S.startTraining('A'); return s.deadline === null && s.startedAt === null; });
  test('Гра', '«До основної гри» недоступна до перемоги в тренуванні', () => { const s = S.startTraining('A'); return S.startMain(s, 5) === s; });
  test('Гра', 'Перехід до основної гри запускає таймер на ' + CONFIG.timerMinutes + ' хв', () => { const s = mainSession('A', 1000); return s.stage === 'main' && s.deadline - s.startedAt === TIMER_MS && s.current === 0; });
  test('Гра', 'Undo відновлює поле й повертає хід', () => {
    let s = mainSession(); const before = s.levels[0].board;
    s = S.pressCell(s, 0, 2e6).s; s = S.pressCell(s, 1, 2e6).s;
    s = S.undo(S.undo(s));
    return eq(s.levels[0].board, before) && s.levels[0].movesUsed === 0 && s.levels[0].history.length === 0;
  });
  test('Гра', 'Undo з порожньою історією нічого не робить', () => { const s = mainSession(); return S.undo(s) === s; });
  test('Гра', 'Reset відновлює початкове поле, лічить спробу, не чіпає таймер', () => {
    let s = mainSession(); const dl = s.deadline;
    s = S.pressCell(s, 0, 2e6).s; s = S.resetLevel(s);
    return s.levels[0].board.join('') === LEVELS[0].start && s.levels[0].movesUsed === 0 && s.levels[0].attempts === 2 && s.deadline === dl;
  });
  test('Гра', 'Після вичерпання ліміту нові натискання заборонені, undo доступне', () => {
    let s = mainSession();
    for (let i = 0; i < LEVELS[0].limit; i++) s = S.pressCell(s, 0, 2e6 + i).s;
    const r = S.pressCell(s, 1, 3e6);
    const u = S.undo(s);
    return r.result === 'exhausted' && r.s === s && u.levels[0].movesUsed === LEVELS[0].limit - 1;
  });
  test('Гра', 'Бали нараховуються до попапа та лише один раз', () => {
    let s = mainSession(); s = solveLevel(s, 2e6);
    const once = SC.totalScore(s.levels);
    const again = S.pressCell(s, 0, 3e6);
    return s.modal === 'success' && once === 25 && again.result === 'blocked' && SC.totalScore(again.s.levels) === 25;
  });
  test('Гра', 'Повне проходження дає рівно 100 і результати', () => {
    let s = mainSession(); let t = 2e6;
    for (let k = 0; k < 4; k++) { s = solveLevel(s, t); t += 1e5; s = S.advance(s, t); }
    return s.stage === 'results' && s.score === 100 && s.finishReason === 'complete' && SC.totalScore(s.levels) <= 100;
  });

  // ── Пропуски
  test('Пропуск', 'Пропуск → «Відкладено» → наступний рівень', () => {
    let s = mainSession(); s = S.requestSkip(s);
    const m = s.modal; s = S.confirmSkip(s, 2e6);
    return m === 'confirmSkip' && s.levels[0].status === 'deferred' && s.current === 1;
  });
  test('Пропуск', 'Сценарій 1✓ 2→ 3✓ 4✓ → повернення до 2 → 100/100', () => {
    let s = mainSession(); let t = 2e6;
    s = solveLevel(s, t); s = S.advance(s, (t += 1e5));
    s = S.confirmSkip(S.requestSkip(s), (t += 1e5));
    s = solveLevel(s, t); s = S.advance(s, (t += 1e5));
    s = solveLevel(s, t); s = S.advance(s, (t += 1e5));
    const back = s.current === 1 && s.modal === 'returnDeferred';
    s = S.closeModal(s); s = solveLevel(s, t); s = S.advance(s, (t += 1e5));
    return back && s.score === 100 && s.stage === 'results';
  });
  test('Пропуск', 'Немає нескінченного циклу: останній невирішений → підтвердження завершення', () => {
    let s = mainSession(); let t = 2e6;
    for (let k = 0; k < 3; k++) { s = solveLevel(s, t); s = S.advance(s, (t += 1e5)); }
    s = S.requestSkip(s);
    const fin = s.modal === 'confirmFinish';
    s = S.finishEarly(S.closeModal(s), (t += 1e5));
    return fin && s.stage === 'results' && s.score === 75 && s.finishReason === 'early';
  });
  test('Пропуск', 'Кілька відкладених рівнів обходяться по колу', () => {
    let s = mainSession(); let t = 2e6;
    for (let k = 0; k < 4; k++) s = S.confirmSkip(S.requestSkip(s), (t += 1e5));
    // усі чотири пропущено → гра повернулась до рівня 1, далі 2, 3 ...
    const a = s.current; s = S.closeModal(s); s = S.confirmSkip(S.requestSkip(s), (t += 1e5));
    return a === 0 && s.current === 1 && s.levels[0].status === 'deferred';
  });

  // ── Таймер
  test('Таймер', 'Залишок обчислюється від дедлайну', () => { const s = mainSession('A', 0); return TM.remainingMs(s, 60000) === TIMER_MS - 60000; });
  test('Таймер', 'Формат mm:ss', () => TM.formatMs(TIMER_MS) === String(CONFIG.timerMinutes).padStart(2, '0') + ':00' && TM.formatMs(61000) === '01:01' && TM.formatMs(-5) === '00:00');
  test('Таймер', 'Попап успіху ставить таймер на паузу', () => { let s = mainSession('A', 0); s = solveLevel(s, 0); const at = s.pausedAt; return s.modal === 'success' && at != null && TM.remainingMs(s, at + 120000) === TM.remainingMs(s, at); });
  test('Таймер', 'Після закриття попапа таймер продовжує з того ж значення', () => { let s = mainSession('A', 0); s = solveLevel(s, 0); const left = TM.remainingMs(s, s.pausedAt); s = S.advance(s, s.pausedAt + 300000); return s.pausedAt == null && TM.remainingMs(s, s.enteredAt) === left && TM.remainingMs(s, s.enteredAt + 1000) === left - 1000; });
  test('Таймер', 'Підтвердження пропуску й скидання теж ставлять паузу', () => { let s = mainSession('A', 0); const a = S.requestSkip(s, 10000); const b = S.openModal(s, 'confirmReset', 10000); const c = S.closeModal(a, 70000); return a.pausedAt === 10000 && b.pausedAt === 10000 && c.pausedAt == null && TM.remainingMs(c, 70000) === TIMER_MS - 10000; });
  test('Таймер', 'Під час паузи час не може вичерпатися', () => { let s = mainSession('A', 0); s = S.requestSkip(s, 1000); return S.checkTimeout(s, TIMER_MS * 3, true) === s; });
  test('Таймер', 'Пауза не враховується в загальний час і час рівня', () => { let s = mainSession('A', 0); s = solveLevel(s, 0); const solvedAt = s.pausedAt; s = S.advance(s, solvedAt + 600000); s = S.finishEarly(s, s.enteredAt + 30000); const d = SC.resultsSummary(s, s.finishedAt); return d.totalTime === TM.formatMs(solvedAt + 30000) && s.levels[0].timeMs === solvedAt; });
  test('Таймер', 'На 00:00 гра завершується попапом часу', () => { const s = S.checkTimeout(mainSession('A', 0), TIMER_MS, true); return s.finished && s.modal === 'timeout' && s.finishReason === 'timeout'; });
  test('Таймер', 'Після F5 із минулим дедлайном — одразу результати', () => { const s = S.restore(JSON.parse(JSON.stringify(mainSession('A', 0))), TIMER_MS + 5000); return s.stage === 'results' && s.finished; });
  test('Таймер', 'Після F5 до дедлайну — гра продовжується з тим самим дедлайном', () => { const s0 = mainSession('A', 0); const s = S.restore(JSON.parse(JSON.stringify(s0)), 300000); return s.stage === 'main' && s.deadline === s0.deadline && TM.remainingMs(s, 300000) === TIMER_MS - 300000; });
  test('Таймер', 'Час вийшов на рівні 3 при відкладеному рівні 2 → 25/100', () => {
    let s = mainSession('A', 0); let t = 0;
    s = solveLevel(s, t); s = S.advance(s, (t += 60000));
    t += 60000; s = S.confirmSkip(S.requestSkip(s, t), t);
    s = S.pressCell(s, 0, (t += 1000)).s;
    const end = s.deadline + 10;
    s = S.toResults(S.checkTimeout(s, end, true));
    const d = SC.resultsSummary(s, end);
    return s.score === 25 && d.levels[1].status === 'Відкладено' && d.levels[2].status === 'Не встигли' && d.levels[3].status === 'Не встигли' && d.totalTime === TM.formatMs(TIMER_MS) && d.ending.key === 25;
  });
  test('Таймер', 'Після F5 із відкритим попапом пауза зберігається', () => {
    let s = mainSession('A', 0); s = solveLevel(s, 0);
    const r = S.restore(JSON.parse(JSON.stringify(s)), TIMER_MS * 2);
    return r.stage === 'main' && r.modal === 'success' && TM.remainingMs(r, TIMER_MS * 2) === TM.remainingMs(s, s.pausedAt);
  });

  // ── Підсумки
  [0, 25, 50, 75, 100].forEach((score) => test('Підсумки', `Кінцівка ${score}/100`, () => {
    const e = SC.endingFor(score);
    const unlocked = /розблоковано/i.test(e.status);
    return e.key === score && !!e.ai && !!e.pose && (score === 100 ? unlocked && e.title === 'ЛЮДИНУ ПІДТВЕРДЖЕНО!' : !unlocked);
  }));
  test('Підсумки', 'Різні емоції робота для кожної кінцівки', () => new Set([0, 25, 50, 75, 100].map((k) => TEXTS.endings[k].pose)).size === 5);
  test('Підсумки', 'Ім\u2019я PNG: CAPTCHA_AI_109-K_75-100.png', () => pngFileName('109-K', 75) === 'CAPTCHA_AI_109-K_75-100.png' && pngFileName('Кмітливі котики', 100) === 'CAPTCHA_AI_Кмітливі_котики_100-100.png');

  // ── Назва команди
  test('Команда', 'Пробіли, HTML і довжина обробляються', () => S.sanitizeTeam('   109   К  ') === '109 К' && S.sanitizeTeam('<script>x</script>Котики') === 'xКотики' && S.sanitizeTeam('a'.repeat(80)).length === CONFIG.teamNameMax && S.sanitizeTeam('   ') === '');

  return out;
}
