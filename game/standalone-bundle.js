(function(){
const M={};
M['config']=(()=>{
// Головна конфігурація гри. Змінюйте параметри тут — логіка підхопить їх автоматично.

const CONFIG = Object.freeze({
  /** Тривалість загального таймера основної гри, хвилини. Під час попапів таймер стоїть. */
  timerMinutes: 15,
  /** Бали за один заліковий рівень. 4 рівні × 25 = 100. */
  pointsPerLevel: 25,
  /** Максимальна довжина назви команди. */
  teamNameMax: 32,
  /** Ключі localStorage. Зміна версії ключа скидає збережені сесії. */
  storageKey: 'captcha-ai-session-v2',
  soundKey: 'captcha-ai-sound',
  /** Захист від випадкових подвійних натискань однієї клавіші, мс. */
  pressCooldownMs: 120,
  /** Тривалості анімацій (з design-tokens.json), мс. */
  anim: Object.freeze({ hover: 140, press: 85, toggle: 320, success: 600, successStagger: 30, popupDelay: 700, scoreCount: 650 }),
  /** Через скільки мс після появи попапа «Час вичерпано» автоматично відкриваються результати. */
  timeoutAutoAdvanceMs: 4000,
  /** Шлях до графічної бібліотеки відносно сторінки гри. */
  assets: 'assets/',
});

const TIMER_MS = CONFIG.timerMinutes * 60 * 1000;

return {CONFIG,TIMER_MS};})();
M['levels']=(()=>{
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

const TRAINING = Object.freeze({
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

const LEVELS = Object.freeze([
  Object.freeze({ id: 1, name: 'Сонячна брама', n: 3, start: '111000101', target: '010111010', solution: 'ACH', min: 3, limit: 6, minSolutionsCount: 1 }),
  Object.freeze({ id: 2, name: 'Шахова мозаїка', n: 4, start: '0101100110010101', target: '1010010110100101', solution: 'AGH', min: 3, limit: 6, minSolutionsCount: 1 }),
  Object.freeze({ id: 3, name: 'Ворота храму', n: 4, start: '0010010101010010', target: '1001111111111001', solution: 'ACMO', min: 4, limit: 7, minSolutionsCount: 1 }),
  Object.freeze({ id: 4, name: 'Сонячний диск', n: 5, start: '0101001110100010111001010', target: '0010001110111110111000100', solution: 'CMW', min: 3, limit: 6, minSolutionsCount: 1 }),
]);

return {TRAINING,LEVELS};})();
M['texts']=(()=>{
// Усі тексти CAPTCHA AI. Редагуйте тут, не змінюючи логіку.
// mood — назва зображення з assets/mascot/ (емоція робота).

const TEXTS = {
  title: 'Доведи, що ти людина!',
  subtitle: 'Капча, яку ніхто не просив',

  training: {
    start: { text: 'Подивись на зразок праворуч: його треба відтворити на полі. Натисни будь-яку клавішу й простеж, що зміниться.', mood: 'explaining' },
    first: { text: 'Змінилися клавіша та її сусіди. Діагоналі не рахуються — я перевірив. Маленькі ромбики в кутах клавіш показують, якою вона має бути.', mood: 'friendly' },
    hint: { text: 'Підказка: тут вистачить двох натискань. Спробуй клавіші по краях смуги.', mood: 'thinking' },
    undo: { text: 'Хід скасовано. Тут можна все.', mood: 'friendly' },
    reset: { text: 'Поле відновлено. Експериментуй.', mood: 'neutral' },
    solved: { text: 'Візерунок збігся! Далі — чотири справжні перевірки з таймером і балами.', mood: 'celebrating' },
  },

  levelIntro: [
    { text: 'Рівень 1 «Сонячна брама». Склади хрест. Почнімо з простого — принаймні мені так здається.', mood: 'friendly' },
    { text: 'Рівень 2 «Шахова мозаїка». Поле 4 × 4. Моїм розробникам знадобилося три дні.', mood: 'skeptical' },
    { text: 'Рівень 3 «Ворота храму». Засвіти літеру Н. Не поспішайте.', mood: 'thinking' },
    { text: 'Рівень 4 «Сонячний диск». Поле 5 × 5 — моя найкраща перевірка. Я нею пишаюся.', mood: 'skeptical' },
  ],
  movesLow: (left) => ({ text: `Залишилося ходів: ${left}. Кожен із них має значення.`, mood: 'thinking' }),
  exhausted: { text: 'Ліміт ходів вичерпано. Скасуйте хід або скиньте рівень — спроб скільки завгодно.', mood: 'surprised' },
  undo: { text: 'Хід скасовано. Я теж іноді передумую. Рідко.', mood: 'neutral' },
  reset: (attempt) => ({ text: `Спроба №${attempt}. Поле скинуто, бали на місці.`, mood: 'neutral' }),
  returned: (level) => ({ text: `Рівень ${level} дочекався вас. Я зберіг його точно таким, яким ви його залишили.`, mood: 'explaining' }),

  success: [
    'Дивно. Мої розробники не впоралися з цим рівнем.',
    'Цікаво. Результат не збігається з моїми прогнозами.',
    'Записую: виявлено логічне мислення.',
    'Неймовірно. Доведеться оновити мої алгоритми.',
  ],

  modals: {
    success: { title: 'ПЕРЕВІРКУ ПРОЙДЕНО', bonus: '+25 БАЛІВ', pose: 'celebrating', bg: 'popups/success.svg' },
    returnDeferred: { title: 'ПОВЕРНЕННЯ ДО ВІДКЛАДЕНОГО', pose: 'thinking', bg: 'popups/skipped.svg', text: 'Нові рівні закінчилися. Повертаємося до відкладених — за кожен пройдений так само нараховується 25 балів. Поки це вікно відкрите, таймер на паузі.', action: 'ДО РІВНЯ' },
    timeout: { title: 'ЧАС ВИЧЕРПАНО', bonus: 'ПІДБИВАЄМО ПІДСУМКИ', pose: 'disappointed', bg: 'popups/timeout.svg', text: 'Загальний таймер завершився. Зароблені бали збережено, непройдені рівні отримують 0.', action: 'ДО РЕЗУЛЬТАТІВ' },
    confirmReset: { title: 'СКИНУТИ РІВЕНЬ?', bonus: 'ПОЛЕ СТАНЕ ЯК НА ПОЧАТКУ', pose: 'skeptical', text: 'Ходи цієї спроби обнуляться, бали збережуться. Поки відкрите це вікно, таймер на паузі.', cancel: 'ЗАЛИШИТИСЯ', action: 'СКИНУТИ' },
    confirmSkip: { title: 'ВІДКЛАСТИ ЦЕЙ РІВЕНЬ?', bonus: 'ПРОГРЕС НЕ ВТРАТИТЬСЯ', pose: 'skeptical', text: 'До відкладеного рівня гра повернеться після інших. Поки відкрите це вікно, таймер на паузі.', cancel: 'ЗАЛИШИТИСЯ', action: 'ПРОПУСТИТИ' },
    confirmFinish: { title: 'ЦЕ ОСТАННІЙ РІВЕНЬ', bonus: 'ІНШИХ НЕВИРІШЕНИХ НЕМАЄ', pose: 'thinking', text: 'Пропускати більше нікуди. Завершити гру зараз чи повернутися до розв\u2019язування?', cancel: 'ПОВЕРНУТИСЯ', action: 'ЗАВЕРШИТИ ГРУ' },
    confirmHome: { title: 'ПОЧАТИ НОВУ СЕСІЮ?', bonus: 'РЕЗУЛЬТАТ БУДЕ ВИДАЛЕНО', pose: 'surprised', text: 'Поточні результати зникнуть із цього браузера. Збережіть PNG, якщо ще не зробили цього.', cancel: 'СКАСУВАТИ', action: 'НА ГОЛОВНУ' },
    confirmReplay: { title: 'ПРОЙТИ ЩЕ РАЗ?', bonus: 'РЕЗУЛЬТАТ БУДЕ ВИДАЛЕНО', pose: 'surprised', text: 'Почнеться нова сесія для тієї самої команди: тренування, потім 4 рівні та новий таймер.', cancel: 'СКАСУВАТИ', action: 'ПОЧАТИ ЗНОВУ' },
  },

  // П'ять завершень історії. Лише 100 відкриває реєстрацію.
  endings: {
    0: { pose: 'access_denied', title: 'ЛЮДИНУ НЕ ПІДТВЕРДЖЕНО', ai: 'Жодної перевірки не пройдено. Утім, мої розробники теж не впоралися, тож у вас ще є надія.', status: 'Реєстрацію заблоковано. Система продовжує захищати конкурс від усіх.' },
    25: { pose: 'skeptical', title: 'ВИЯВЛЕНО ОЗНАКИ МИСЛЕННЯ', ai: 'Одна перевірка з чотирьох. Деякі ознаки людського мислення зафіксовано. Я продовжую спостерігати.', status: 'Реєстрацію заблоковано. До підтвердження бракує трьох перевірок.' },
    50: { pose: 'thinking', title: 'ПОЛОВИНУ ПЕРЕВІРОК ПРОЙДЕНО', ai: 'Дві з чотирьох. Уперше замислююся: можливо, ТЗ сформулювали не зовсім точно?', status: 'Реєстрацію заблоковано. До підтвердження бракує двох перевірок.' },
    75: { pose: 'surprised', title: 'МАЙЖЕ ПЕРЕКОНАЛИ', ai: 'Три з чотирьох. Результат переконливий, але протокол вимагає всіх чотирьох. Формально я змушений відмовити.', status: 'Реєстрацію заблоковано. Остання умова не виконана.' },
    100: { pose: 'human_confirmed', title: 'ЛЮДИНУ ПІДТВЕРДЖЕНО!', ai: 'Усі перевірки пройдено. Я передав розробникам рекомендацію переписати технічне завдання.', status: 'Реєстрацію на конкурс «Логічні лабіринти» розблоковано.' },
  },

  resultsNote: {
    complete: 'Усі чотири перевірки завершено.',
    timeout: 'Час вичерпано. Враховано всі пройдені перевірки.',
    early: 'Гру завершено достроково.',
  },

  levelStatus: {
    solved: { label: 'Пройдено', color: '#36efa6', icon: 'check' },
    deferred: { label: 'Відкладено', color: '#ffa531', icon: 'skip' },
    timeout: { label: 'Не встигли', color: '#ff5269', icon: 'timer' },
    failed: { label: 'Не пройдено', color: '#ff5269', icon: 'error' },
    unvisited: { label: 'Не розпочато', color: '#ff5269', icon: 'error' },
  },
};

return {TEXTS};})();
M['puzzle']=(()=>{
// Логіка головоломки: перемикання клітинок і перевірка збігу з візерунком-зразком.
// Поле — масив 0/1 у порядку рядків (зліва направо, згори вниз).

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXY';

/** Рядок "1010..." → масив чисел 0/1. */
function parseBoard(str) {
  return [...str].map((ch) => (ch === '1' ? 1 : 0));
}

function boardToString(board) {
  return board.join('');
}

/** Літери для поля n×n: 3×3 → A–I, 4×4 → A–P, 5×5 → A–Y. */
function labels(n) {
  return LETTERS.slice(0, n * n).split('');
}

/** Індекси клітинок, які змінює натискання i: сама клавіша + сусіди зверху, знизу, ліворуч, праворуч. */
function affected(n, i) {
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
function press(board, n, i) {
  if (!Number.isInteger(i) || i < 0 || i >= n * n) throw new RangeError('Немає такої клавіші: ' + i);
  const next = board.slice();
  for (const j of affected(n, i)) next[j] ^= 1;
  return next;
}

/** Рівень завершено, коли поле повністю збігається із зразком. target — масив або рядок 0/1. */
function isSolved(board, target) {
  const t = typeof target === 'string' ? parseBoard(target) : target;
  return board.length > 0 && board.length === t.length && board.every((v, i) => v === t[i]);
}

/** Кількість клітинок, що вже збігаються зі зразком. */
function matchCount(board, target) {
  const t = typeof target === 'string' ? parseBoard(target) : target;
  return board.reduce((a, v, i) => a + (v === t[i] ? 1 : 0), 0);
}

/** Застосувати послідовність натискань (масив індексів або рядок літер). */
function applyPresses(board, n, presses) {
  const list = typeof presses === 'string' ? [...presses].map((ch) => LETTERS.indexOf(ch)) : presses;
  return list.reduce((b, i) => press(b, n, i), board);
}

return {LETTERS,parseBoard,boardToString,labels,affected,press,isSolved,matchCount,applyPresses};})();
M['solver']=(()=>{const { affected, LETTERS }=M['puzzle'];
// Математична перевірка рівнів: система лінійних рівнянь над GF(2).
// Для кожної клітинки j: сума натискань, що зачіпають j, дорівнює (start[j] XOR target[j]) mod 2.
// Розв'язок знаходимо методом Гаусса, а потім перебираємо всі вектори ядра,
// щоб знайти розв'язки мінімальної ваги (мінімальна кількість натискань).


/**
 * @param {number} n розмір поля
 * @param {number[]} start початковий стан 0/1
 * @param {number[]} [target] візерунок-зразок 0/1 (за замовчуванням — усі 1)
 * @returns {{solvable:boolean, min:number, nullity:number, minSolutions:string[]}}
 */
function solve(n, start, target) {
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
function verifyLevels(levels, parse) {
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

return {solve,verifyLevels};})();
M['timer']=(()=>{
// Загальний таймер. Час обчислюється від збереженого дедлайну та поточного годинника
// (Date.now()), а не зменшенням лічильника — тому відлік не «пливе», не зупиняється
// у фоновій вкладці й коректно відновлюється після F5.
// Пауза: поки session.pausedAt задано (відкрито попап), відлік стоїть.

/** Залишок часу в мс (не менше 0). */
function remainingMs(session, now) {
  if (!session || session.deadline == null) return null;
  const at = session.finished ? session.finishedAt : session.pausedAt != null ? session.pausedAt : now;
  return Math.max(0, session.deadline - at);
}

/** Чистий ігровий час (без пауз), не більше тривалості таймера. */
function elapsedMs(session, now) {
  if (!session || session.startedAt == null || session.deadline == null) return 0;
  const dur = session.durationMs != null ? session.durationMs : session.deadline - session.startedAt;
  return Math.max(0, Math.min(dur, dur - remainingMs(session, now)));
}

function isExpired(session, now) {
  return !!session && session.deadline != null && !session.finished && session.pausedAt == null && now >= session.deadline;
}

/** 754000 → "12:34". Округлення вгору, щоб 00:00 з'являлося лише в момент завершення. */
function formatMs(ms, roundUp = false) {
  const total = Math.max(0, roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

return {remainingMs,elapsedMs,isExpired,formatMs};})();
M['storage']=(()=>{const { CONFIG }=M['config'];
// Збереження сесії в localStorage. Усі помилки (приватний режим, переповнення) не ламають гру.


const SESSION_VERSION = 1;

function loadSession() {
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

function saveSession(session) {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(session));
  } catch (e) {
    console.warn('CAPTCHA AI: не вдалося зберегти сесію', e);
  }
}

function clearSession() {
  try { localStorage.removeItem(CONFIG.storageKey); } catch (e) { /* ignore */ }
}

function loadSoundEnabled() {
  try { return localStorage.getItem(CONFIG.soundKey) !== 'off'; } catch (e) { return true; }
}

function saveSoundEnabled(on) {
  try { localStorage.setItem(CONFIG.soundKey, on ? 'on' : 'off'); } catch (e) { /* ignore */ }
}

return {SESSION_VERSION,loadSession,saveSession,clearSession,loadSoundEnabled,saveSoundEnabled};})();
M['scoring']=(()=>{const { CONFIG, TIMER_MS }=M['config'];const { LEVELS }=M['levels'];const { TEXTS }=M['texts'];const { elapsedMs, formatMs }=M['timer'];
// Підрахунок балів і підготовка даних для фінального екрана / PNG.





/** Бали рахуються лише за статусом «solved» — повторне нарахування неможливе. */
function totalScore(levels) {
  if (!levels) return 0;
  const solved = levels.filter((l) => l.status === 'solved').length;
  return Math.min(LEVELS.length * CONFIG.pointsPerLevel, solved * CONFIG.pointsPerLevel);
}

function solvedCount(levels) {
  return levels ? levels.filter((l) => l.status === 'solved').length : 0;
}

/** Кінцівка для рахунку: 0, 25, 50, 75 або 100. */
function endingFor(score) {
  const key = Math.max(0, Math.min(100, Math.round(score / 25) * 25));
  return { key, ...TEXTS.endings[key] };
}

/** Статус рівня на фінальному екрані. */
function levelOutcome(rec, finishReason) {
  if (rec.status === 'solved') return TEXTS.levelStatus.solved;
  if (rec.status === 'deferred') return TEXTS.levelStatus.deferred;
  if (rec.status === 'unvisited') return finishReason === 'timeout' ? TEXTS.levelStatus.timeout : TEXTS.levelStatus.unvisited;
  return finishReason === 'timeout' ? TEXTS.levelStatus.timeout : TEXTS.levelStatus.failed;
}

/** Єдине джерело даних для екрана результатів і PNG-експорту. */
function resultsSummary(session, now) {
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

return {totalScore,solvedCount,endingFor,levelOutcome,resultsSummary};})();
M['game-state']=(()=>{const { CONFIG, TIMER_MS }=M['config'];const { LEVELS, TRAINING }=M['levels'];const { parseBoard, press, isSolved }=M['puzzle'];const { TEXTS }=M['texts'];const { totalScore }=M['scoring'];const { SESSION_VERSION }=M['storage'];
// Стани ігрової сесії та переходи між ними.
// Усі функції чисті: приймають сесію й повертають НОВУ сесію (вихідна не змінюється).
//
// stage: 'intro' → 'training' → 'main' → 'results'
// Статус рівня: 'unvisited' | 'active' | 'deferred' | 'solved'
//
// Пауза таймера: поки відкрите будь-яке вікно (попап успіху, підтвердження, повернення
// до відкладеного), s.pausedAt містить момент відкриття. При закритті дедлайн
// зсувається на тривалість паузи — таймер продовжує з того самого значення.







const clone = (o) => JSON.parse(JSON.stringify(o));

/** Очищення назви команди: без HTML, керівних символів і зайвих пробілів, обмежена довжина. */
function sanitizeTeam(raw) {
  return String(raw ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001f\u007f<>&"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CONFIG.teamNameMax)
    .trim();
}

function createIntro(team = '') {
  return { v: SESSION_VERSION, stage: 'intro', team, modal: null };
}

function freshLevel(lv) {
  return { id: lv.id, status: 'unvisited', board: parseBoard(lv.start), history: [], movesUsed: 0, totalMoves: 0, attempts: 0, timeMs: 0, points: 0, solvedAt: null };
}

/** Нова сесія з тренуванням (таймер ще не запущено). */
function startTraining(team) {
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

function isPaused(s) {
  return !!s && s.pausedAt != null;
}

// ── Поле ─────────────────────────────────────────────────────────────────

/** Активне поле поточної стадії: {n, rec, limit, start, target, name}. */
function activeBoard(s) {
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
function pressCell(s0, idx, now) {
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
function undo(s0) {
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
function resetLevel(s0, now = Date.now()) {
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
function startMain(s0, now) {
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
function pickNext(levels, from) {
  for (let i = from + 1; i < levels.length; i++) if (levels[i].status === 'unvisited') return i;
  for (let i = 0; i < levels.length; i++) if (levels[i].status === 'unvisited' && i !== from) return i;
  for (let k = 1; k < levels.length; k++) {
    const j = (from + k) % levels.length;
    if (levels[j].status === 'deferred') return j;
  }
  return null;
}

function allSolved(s) {
  return !!s.levels && s.levels.every((l) => l.status === 'solved');
}

/** Кнопка «Наступний рівень» у попапі успіху. */
function advance(s0, now) {
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
function requestSkip(s0, now = Date.now()) {
  if (s0.stage !== 'main' || s0.modal || s0.finished) return s0;
  const s = clone(s0);
  setModal(s, pickNext(s.levels, s.current) == null ? 'confirmFinish' : 'confirmSkip', now);
  return s;
}

function confirmSkip(s0, now) {
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

function finishEarly(s0, now) {
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
function checkTimeout(s0, now, live = true) {
  if (s0.stage !== 'main' || s0.finished || s0.deadline == null || s0.pausedAt != null || now < s0.deadline) return s0;
  return finish(clone(s0), 'timeout', now, live);
}

function toResults(s0) {
  if (!s0.finished) return s0;
  const s = clone(s0);
  s.stage = 'results';
  s.modal = null;
  return s;
}

function openModal(s0, kind, now = Date.now()) {
  if (s0.modal) return s0;
  const s = clone(s0);
  setModal(s, kind, now);
  return s;
}

function closeModal(s0, now = Date.now()) {
  const s = clone(s0);
  clearModalMut(s, now);
  return s;
}

/** Відновлення після перезавантаження сторінки. */
function restore(saved, now) {
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

return {sanitizeTeam,createIntro,startTraining,isPaused,activeBoard,pressCell,undo,resetLevel,startMain,pickNext,allSolved,advance,requestSkip,confirmSkip,finishEarly,checkTimeout,toResults,openModal,closeModal,restore};})();
M['audio']=(()=>{const { loadSoundEnabled, saveSoundEnabled }=M['storage'];
// Короткі ретрофутуристичні звуки через Web Audio API. Без зовнішніх файлів і фонової музики.


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

const sfx = {
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

return {sfx};})();
M['export']=(()=>{const { CONFIG }=M['config'];
// Експорт фінального результату в PNG 1920×1080.
// Композиція малюється на <canvas> з тих самих локальних асетів, що й екран результатів
// (координати збігаються з версткою екрана). Інтернет і сторонні бібліотеки не потрібні.


const W = 1920;
const H = 1080;
const FONT = 'Terminal, "DejaVu Sans", Arial, sans-serif';
const C = { ink: '#e6f4ff', muted: '#9eb7d2', cyan: '#00cfff', title: '#21dfff', gold: '#ffd56d', green: '#36efa6', orange: '#ffa531', red: '#ff5269' };

const cache = new Map();
function img(path) {
  const src = (window.__resources && window.__resources['a_' + path.replace(/[^a-z0-9]/gi, '_')]) || new URL(CONFIG.assets + path, document.baseURI).href;
  if (!cache.has(src)) {
    cache.set(src, new Promise((res, rej) => {
      const i = new Image();
      i.decoding = 'async';
      const t = setTimeout(() => { cache.delete(src); rej(new Error('Час очікування вичерпано: ' + path)); }, 10000);
      i.onload = () => { clearTimeout(t); res(i); };
      i.onerror = () => { clearTimeout(t); cache.delete(src); rej(new Error('Не вдалося завантажити ' + path)); };
      i.src = src;
    }));
  }
  return cache.get(src);
}

function font(size, bold = false) { return `${bold ? 700 : 400} ${size}px ${FONT}`; }

function text(x, ctx, str, px, y, { size = 20, bold = false, color = C.ink, align = 'left', shadow = null } = {}) {
  ctx.save();
  ctx.font = font(size, bold);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  if (shadow) { ctx.shadowColor = shadow; ctx.shadowBlur = 16; }
  ctx.fillText(str, px, y);
  ctx.restore();
}

/** Вписати рядок у ширину: зменшення кегля до minSize, далі обрізання з «…». */
function fit(ctx, str, maxW, size, minSize, bold) {
  let s = size;
  ctx.font = font(s, bold);
  while (ctx.measureText(str).width > maxW && s > minSize) { s -= 1; ctx.font = font(s, bold); }
  let out = str;
  if (ctx.measureText(out).width > maxW) {
    while (out.length > 1 && ctx.measureText(out + '…').width > maxW) out = out.slice(0, -1);
    out += '…';
  }
  return { str: out, size: s };
}

function wrap(ctx, str, maxW, size, bold = false) {
  ctx.font = font(size, bold);
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function contain(ctx, im, x, y, w, h) {
  const r = Math.min(w / im.naturalWidth, h / im.naturalHeight);
  const dw = im.naturalWidth * r;
  const dh = im.naturalHeight * r;
  ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function cover(ctx, im, x, y, w, h) {
  const r = Math.max(w / im.naturalWidth, h / im.naturalHeight);
  const dw = im.naturalWidth * r;
  const dh = im.naturalHeight * r;
  ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Малює результати на canvas. d — об'єкт resultsSummary(). */
async function renderResultsCanvas(d) {
  if (document.fonts) {
    await Promise.all([document.fonts.load(font(40, true)), document.fonts.load(font(20))]).catch(() => {});
    await document.fonts.ready;
  }
  const names = {
    bg: 'backgrounds/workshop.png', screen: 'backgrounds/crt-screen.svg', scan: 'effects/scanlines.svg', glass: 'monitor/glass.svg', frame: 'monitor/crt-frame.svg',
    s1: 'monitor/sticker-1.svg', s2: 'monitor/sticker-2.svg', s3: 'monitor/sticker-3.svg', pixel: 'mascot/hud-pixel.svg',
    team: 'panels/team.svg', card: 'panels/level-result.svg', panel: 'panels/hud-medium.svg', msg: 'panels/message.svg', large: 'panels/hud-large.svg',
    mascot: `mascot/${d.ending.pose}.png`, burst: 'effects/success-burst.svg', btn: 'buttons/success-normal.svg', trophy: 'icons/trophy.svg', users: 'icons/users.svg', timerIc: 'icons/timer.svg',
    check: 'icons/check.svg', skip: 'icons/skip.svg', error: 'icons/error.svg', timer: 'icons/timer.svg',
  };
  const entries = await Promise.all(Object.entries(names).map(async ([k, p]) => [k, await img(p)]));
  const I = Object.fromEntries(entries);

  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d');
  const T = (s, px, py, o) => text(null, x, s, px, py, o);

  // Фон майстерні + екран CRT
  x.fillStyle = '#050b14';
  x.fillRect(0, 0, W, H);
  cover(x, I.bg, 0, 0, W, H);
  x.save();
  roundRect(x, 100, 100, 1720, 870, 30);
  x.clip();
  x.fillStyle = '#020a16';
  x.fillRect(100, 100, 1720, 870);
  x.drawImage(I.screen, 100, 100, 1720, 870);

  // Шапка
  x.imageSmoothingEnabled = false;
  x.drawImage(I.pixel, 140, 140, 75, 94);
  x.imageSmoothingEnabled = true;
  T('CAPTCHA', 237, 183, { size: 40, bold: true, color: '#dffbff', shadow: '#00b5ff88' });
  x.font = font(40, true);
  T('AI', 237 + x.measureText('CAPTCHA ').width, 183, { size: 40, bold: true, color: '#00e8f3', shadow: '#00b5ff88' });
  T('Доведи, що ти людина!', 237, 215, { size: 20, color: C.cyan });
  x.fillStyle = '#0ba5c366';
  x.fillRect(604, 132, 2, 110);
  T('ПІДСУМКОВИЙ РЕЗУЛЬТАТ', 640, 172, { size: 35, bold: true, color: C.title, shadow: '#008cff88' });
  T(d.note, 640, 210, { size: 20, color: '#b3cde5' });
  T('«Логічні лабіринти»', 1780, 168, { size: 18, color: C.muted, align: 'right' });
  T(d.dateText, 1780, 198, { size: 18, color: C.muted, align: 'right' });

  // Команда й рахунок
  x.drawImage(I.team, 140, 256, 928, 116);
  x.drawImage(I.users, 165, 290, 44, 44);
  T('КОМАНДА', 228, 296, { size: 17, color: '#67cdfa' });
  const tn = fit(x, d.team, 520, 32, 20, true);
  T(tn.str, 228, 340, { size: tn.size, bold: true });
  T('РАХУНОК', 1043, 296, { size: 17, color: '#67cdfa', align: 'right' });
  x.font = font(30, true);
  const slash = ' / 100';
  const sw = x.measureText(slash).width;
  T(slash, 1043, 345, { size: 30, bold: true, color: '#d7e8fc', align: 'right' });
  T(String(d.score), 1043 - sw, 345, { size: 52, bold: true, color: C.gold, align: 'right', shadow: '#ffb40055' });

  // Картки рівнів
  const cw = (928 - 30) / 4;
  d.levels.forEach((lv, i) => {
    const cx = 140 + i * (cw + 10);
    const mid = cx + cw / 2;
    x.drawImage(I.card, cx, 384, cw, 224);
    T(lv.title, mid, 420, { size: 20, bold: true, color: '#84ccff', align: 'center' });
    T(lv.size, mid, 442, { size: 15, color: C.muted, align: 'center' });
    contain(x, I[lv.icon], mid - 20, 454, 40, 40);
    x.font = font(22, true);
    const mw = x.measureText(' / ' + lv.max).width;
    x.font = font(36, true);
    const pw = x.measureText(String(lv.points)).width;
    const start = mid - (pw + mw) / 2;
    T(String(lv.points), start, 538, { size: 36, bold: true, color: lv.color });
    T(' / ' + lv.max, start + pw, 538, { size: 22, bold: true, color: '#8ab6d8' });
    T(lv.status.toUpperCase(), mid, 566, { size: 15, bold: true, color: lv.color, align: 'center' });
    T(`${lv.time} · ходів ${lv.moves} · спроб ${lv.attempts}`, mid, 592, { size: 14, color: '#a6bfd5', align: 'center' });
  });

  // Статистика
  const stw = (928 - 24) / 3;
  [['ЗАГАЛЬНИЙ ЧАС', `${d.totalTime} / ${d.totalLimit}`], ['ВИКОРИСТАНІ ХОДИ', String(d.totalMoves)], ['КІЛЬКІСТЬ СПРОБ', String(d.totalAttempts)]].forEach(([label, val], i) => {
    const sx = 140 + i * (stw + 12);
    x.drawImage(I.panel, sx, 620, stw, 82);
    T(label, sx + 24, 652, { size: 14, color: '#77c5ee' });
    T(val, sx + 24, 686, { size: 26, bold: true });
  });

  // Повідомлення CAPTCHA AI
  x.drawImage(I.msg, 140, 714, 928, 122);
  x.imageSmoothingEnabled = false;
  x.drawImage(I.pixel, 166, 735, 64, 80);
  x.imageSmoothingEnabled = true;
  T('CAPTCHA AI', 256, 750, { size: 17, bold: true, color: '#13deef' });
  wrap(x, d.ending.ai, 780, 19).slice(0, 3).forEach((ln, k) => T(ln, 256, 778 + k * 26, { size: 19, color: '#c1d7ed' }));

  // Маскот і сюжетна реєстрація
  if (d.complete) {
    x.save();
    x.globalAlpha = 0.9;
    contain(x, I.burst, 1286 - 60, 236, 420, 340);
    x.restore();
  }
  contain(x, I.mascot, 1286, 252, 300, 310);
  x.drawImage(I.large, 1093, 571, 687, 265);
  const titleSize = d.complete ? 44 : 25;
  T(d.ending.title, 1121, 571 + (d.complete ? 64 : 54), { size: titleSize, bold: true, color: d.complete ? C.green : C.orange, shadow: d.complete ? '#36efa688' : null });
  wrap(x, d.ending.status, 630, 20).slice(0, 2).forEach((ln, k) => T(ln, 1121, 571 + (d.complete ? 104 : 94) + k * 28, { size: 20, color: C.ink }));
  if (d.complete) {
    x.drawImage(I.btn, 1121, 571 + 170, 631, 66);
    T('ПЕРЕЙТИ ДО РЕЄСТРАЦІЇ →', 1121 + 315, 571 + 210, { size: 21, bold: true, color: '#ecf8ff', align: 'center' });
  } else {
    x.strokeStyle = '#2d5d74';
    x.lineWidth = 1.5;
    roundRect(x, 1121, 571 + 182, 420, 40, 6);
    x.stroke();
    T('ДОСТУП ДО РЕЄСТРАЦІЇ ЗАБЛОКОВАНО', 1121 + 210, 571 + 208, { size: 16, bold: true, color: '#70d8e9', align: 'center' });
  }

  // Підпис замість кнопок керування
  T('CAPTCHA AI · «Доведи, що ти людина!» · студентський конкурс «Логічні лабіринти»', 960, 900, { size: 18, color: '#7f9bb8', align: 'center' });

  // Скло, scanlines, корпус
  x.globalAlpha = 0.3;
  x.drawImage(I.scan, 100, 100, 1720, 870);
  x.globalAlpha = 1;
  x.restore();
  x.drawImage(I.glass, 100, 100, 1720, 870);
  x.drawImage(I.frame, 0, 0, W, H);
  const sticker = (im, px, py, deg) => { x.save(); x.translate(px + 32, py + 38); x.rotate((deg * Math.PI) / 180); x.drawImage(im, -32, -38, 65, 76); x.restore(); };
  sticker(I.s1, 16, 180, -8);
  sticker(I.s2, W - 15 - 65, 455, 9);
  sticker(I.s3, 15, 515, -3);
  return cv;
}

function pngFileName(team, score) {
  const safe = String(team || 'team').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'team';
  return `CAPTCHA_AI_${safe}_${score}-100.png`;
}

async function resultsPngBlob(d) {
  const cv = await renderResultsCanvas(d);
  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('PNG не створено'))), 'image/png'));
}

/** Створює PNG і запускає завантаження на пристрій. Повертає Blob (для перевірки). */
async function downloadResultsPng(d) {
  const blob = await resultsPngBlob(d);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pngFileName(d.team, d.score);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return blob;
}

return {renderResultsCanvas,pngFileName,resultsPngBlob,downloadResultsPng};})();
M['tests']=(()=>{const { CONFIG, TIMER_MS }=M['config'];const { LEVELS, TRAINING }=M['levels'];const { TEXTS }=M['texts'];const P=M['puzzle'];const SOL=M['solver'];const S=M['game-state'];const SC=M['scoring'];const TM=M['timer'];const { pngFileName }=M['export'];
// Автоматичні тести логіки гри. Запуск: відкрийте «Тести.dc.html».
// Перевіряються головоломка, рівні, бали, пропуски, таймер, кінцівки й ім'я PNG.










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

function runTests() {
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

return {runTests};})();
window.CAPTCHA_GAME_BUNDLE={CONFIG:M.config.CONFIG,TIMER_MS:M.config.TIMER_MS,LEVELS:M.levels.LEVELS,TRAINING:M.levels.TRAINING,TEXTS:M.texts.TEXTS,puzzle:M.puzzle,solver:M.solver,state:M['game-state'],timer:M.timer,scoring:M.scoring,storage:M.storage,sfx:M.audio.sfx,exporter:M.export,tests:M.tests};
})();
