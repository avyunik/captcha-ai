// Фіксовані, математично перевірені рівні з візерунками (механіка Aztec Trial Tiles).
// start  — початковий стан поля (1 — світиться, 0 — погашена) у порядку рядків.
// target — візерунок-зразок, який треба відтворити.
// solution — контрольна мінімальна відповідь (літери; порядок натискань неважливий).
// min — мінімальна кількість натискань (solver.js: GF(2) + перебір ядра).
// limit — ліміт ходів на одну спробу: точний мінімум + 3 ходи запасу.
// Складність вирівняна: мінімум 3–4 натискання, різниця «старт/зразок» 8–10 клітинок,
// зони натискань перетинаються лише у 2 клітинках, мінімальний розв'язок єдиний.
// minSolutionsCount — скільки різних мінімальних розв'язків існує.
//
// Перевірка: відкрийте «Тести.dc.html» — він перераховує все наново.

export const TRAINING = Object.freeze({
  id: 'training',
  name: 'Хрест-навхрест',
  n: 3,
  start: '000111000',   // горизонтальна смуга
  target: '101010101',  // діагональний хрест
  solution: 'DF',
  min: 2,
  limit: null,
  minSolutionsCount: 1,
});

export const LEVELS = Object.freeze([
  Object.freeze({ id: 1, name: 'Сонячна брама', n: 3, start: '111000101', target: '010111010', solution: 'ACH', min: 3, limit: 6, minSolutionsCount: 1 }),
  Object.freeze({ id: 2, name: 'Шахова мозаїка', n: 4, start: '0101100110010101', target: '1010010110100101', solution: 'AGH', min: 3, limit: 6, minSolutionsCount: 1 }),
  Object.freeze({ id: 3, name: 'Ворота храму', n: 4, start: '0010010101010010', target: '1001111111111001', solution: 'ACMO', min: 4, limit: 7, minSolutionsCount: 1 }),
  Object.freeze({ id: 4, name: 'Сонячний диск', n: 5, start: '0101001110100010111001010', target: '0010001110111110111000100', solution: 'CMW', min: 3, limit: 6, minSolutionsCount: 1 }),
]);
