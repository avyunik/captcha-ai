// Експорт фінального результату в PNG 1920×1080.
// Композиція малюється на <canvas> з тих самих локальних асетів, що й екран результатів
// (координати збігаються з версткою екрана). Інтернет і сторонні бібліотеки не потрібні.

import { CONFIG } from './config.js';

const W = 1920;
const H = 1080;
const FONT = 'Terminal, "DejaVu Sans", Arial, sans-serif';
const C = { ink: '#e6f4ff', muted: '#9eb7d2', cyan: '#00cfff', title: '#21dfff', gold: '#ffd56d', green: '#36efa6', orange: '#ffa531', red: '#ff5269' };

const cache = new Map();
function img(path) {
  const src = new URL(CONFIG.assets + path, document.baseURI).href;
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
export async function renderResultsCanvas(d) {
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

export function pngFileName(team, score) {
  const safe = String(team || 'team').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'team';
  return `CAPTCHA_AI_${safe}_${score}-100.png`;
}

export async function resultsPngBlob(d) {
  const cv = await renderResultsCanvas(d);
  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('PNG не створено'))), 'image/png'));
}

/** Створює PNG і запускає завантаження на пристрій. Повертає Blob (для перевірки). */
export async function downloadResultsPng(d) {
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
