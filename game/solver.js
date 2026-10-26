// Математична перевірка рівнів: система лінійних рівнянь над GF(2).
// Для кожної клітинки j: сума натискань, що зачіпають j, дорівнює (start[j] XOR target[j]) mod 2.
// Розв'язок знаходимо методом Гаусса, а потім перебираємо всі вектори ядра,
// щоб знайти розв'язки мінімальної ваги (мінімальна кількість натискань).

import { affected, LETTERS } from './puzzle.js';

/**
 * @param {number} n розмір поля
 * @param {number[]} start початковий стан 0/1
 * @param {number[]} [target] візерунок-зразок 0/1 (за замовчуванням — усі 1)
 * @returns {{solvable:boolean, min:number, nullity:number, minSolutions:string[]}}
 */
export function solve(n, start, target) {
  const N = n * n;
  const tgt = target || new Array(N).fill(1);
  // Рядок матриці: бітова маска натискань + права частина.
  const rows = [];
  for (let j = 0; j < N; j++) {
    let mask = 0;
    for (let i = 0; i < N; i++) if (affected(n, i).includes(j)) mask |= 1 << i;
    rows.push({ mask, rhs: start[j] ^ tgt[j] });
  }
  const pivotRowOfCol = new Array(N).fill(-1);
  let r = 0;
  for (let c = 0; c < N && r < N; c++) {
    let k = -1;
    for (let i = r; i < N; i++) if ((rows[i].mask >>> c) & 1) { k = i; break; }
    if (k < 0) continue;
    [rows[r], rows[k]] = [rows[k], rows[r]];
    for (let i = 0; i < N; i++) {
      if (i !== r && ((rows[i].mask >>> c) & 1)) {
        rows[i].mask ^= rows[r].mask;
        rows[i].rhs ^= rows[r].rhs;
      }
    }
    pivotRowOfCol[c] = r;
    r++;
  }
  for (let i = r; i < N; i++) if (rows[i].rhs) return { solvable: false, min: Infinity, nullity: N - r, minSolutions: [] };

  const free = [];
  for (let c = 0; c < N; c++) if (pivotRowOfCol[c] < 0) free.push(c);

  let min = Infinity;
  let minSolutions = [];
  for (let m = 0; m < (1 << free.length); m++) {
    const x = new Array(N).fill(0);
    free.forEach((f, k) => { x[f] = (m >>> k) & 1; });
    for (let c = 0; c < N; c++) {
      const pr = pivotRowOfCol[c];
      if (pr < 0) continue;
      let v = rows[pr].rhs;
      for (const f of free) if (x[f] && ((rows[pr].mask >>> f) & 1)) v ^= 1;
      x[c] = v;
    }
    const weight = x.reduce((a, b) => a + b, 0);
    const word = x.map((v, i) => (v ? LETTERS[i] : '')).join('');
    if (weight < min) { min = weight; minSolutions = [word]; }
    else if (weight === min) minSolutions.push(word);
  }
  return { solvable: true, min, nullity: free.length, minSolutions };
}

/** Повна перевірка набору рівнів. Повертає масив звітів і загальний прапорець ok. */
export function verifyLevels(levels, parse) {
  const reports = levels.map((lv) => {
    const res = solve(lv.n, parse(lv.start), parse(lv.target));
    const issues = [];
    if (!res.solvable) issues.push('нерозв\u2019язний');
    if (res.min !== lv.min) issues.push(`мінімум ${res.min}, а в конфігурації ${lv.min}`);
    if (lv.limit != null && res.min > lv.limit) issues.push('ліміт менший за мінімум');
    if (!res.minSolutions.includes(lv.solution)) issues.push('контрольна відповідь не мінімальна');
    if (lv.start === lv.target) issues.push('поле вже розв\u2019язане');
    if (lv.target.length !== lv.n * lv.n || lv.start.length !== lv.n * lv.n) issues.push('неправильна довжина поля');
    return { id: lv.id, ...res, issues };
  });
  // Унікальність малюнків і послідовностей рішення.
  for (let a = 0; a < levels.length; a++) {
    for (let b = a + 1; b < levels.length; b++) {
      if (levels[a].n === levels[b].n && (levels[a].start === levels[b].start || levels[a].target === levels[b].target)) reports[b].issues.push(`дублює малюнок рівня ${levels[a].id}`);
      if (levels[a].solution === levels[b].solution) reports[b].issues.push(`дублює рішення рівня ${levels[a].id}`);
    }
  }
  return { ok: reports.every((r) => r.issues.length === 0), reports };
}
