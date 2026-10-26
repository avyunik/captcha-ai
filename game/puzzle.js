// Логіка головоломки: перемикання клітинок і перевірка збігу з візерунком-зразком.
// Поле — масив 0/1 у порядку рядків (зліва направо, згори вниз).

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXY';

/** Рядок "1010..." → масив чисел 0/1. */
export function parseBoard(str) {
  return [...str].map((ch) => (ch === '1' ? 1 : 0));
}

export function boardToString(board) {
  return board.join('');
}

/** Літери для поля n×n: 3×3 → A–I, 4×4 → A–P, 5×5 → A–Y. */
export function labels(n) {
  return LETTERS.slice(0, n * n).split('');
}

/** Індекси клітинок, які змінює натискання i: сама клавіша + сусіди зверху, знизу, ліворуч, праворуч. */
export function affected(n, i) {
  const r = Math.floor(i / n);
  const c = i % n;
  const out = [i];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
}

/** Повертає НОВЕ поле після натискання клавіші i. Вихідний масив не змінюється. */
export function press(board, n, i) {
  if (!Number.isInteger(i) || i < 0 || i >= n * n) throw new RangeError('Немає такої клавіші: ' + i);
  const next = board.slice();
  for (const j of affected(n, i)) next[j] ^= 1;
  return next;
}

/** Рівень завершено, коли поле повністю збігається із зразком. target — масив або рядок 0/1. */
export function isSolved(board, target) {
  const t = typeof target === 'string' ? parseBoard(target) : target;
  return board.length > 0 && board.length === t.length && board.every((v, i) => v === t[i]);
}

/** Кількість клітинок, що вже збігаються зі зразком. */
export function matchCount(board, target) {
  const t = typeof target === 'string' ? parseBoard(target) : target;
  return board.reduce((a, v, i) => a + (v === t[i] ? 1 : 0), 0);
}

/** Застосувати послідовність натискань (масив індексів або рядок літер). */
export function applyPresses(board, n, presses) {
  const list = typeof presses === 'string' ? [...presses].map((ch) => LETTERS.indexOf(ch)) : presses;
  return list.reduce((b, i) => press(b, n, i), board);
}
