// Головна конфігурація гри. Змінюйте параметри тут — логіка підхопить їх автоматично.

export const CONFIG = Object.freeze({
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

export const TIMER_MS = CONFIG.timerMinutes * 60 * 1000;
