// Sizzle & Serve — everything the player sees, drawn on one canvas.
// One job: the kitchen, the food, the chef, the order board and the screens.

import { VIEW, FLOOR, INGREDIENTS, RECIPES, STATIONS, TUNE, SHIFT_SECONDS } from './config.js';
import { displayName } from './world.js';

const FONT = (px, bold = false) => `${bold ? '700 ' : ''}${px}px "Trebuchet MS", "Segoe UI", sans-serif`;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, px, color, align = 'center', bold = false) {
  ctx.font = FONT(px, bold);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- Food -------------------------------------------------------------------

export function drawIngredient(ctx, key, x, y, s) {
  const [kind, state] = key.split(':');
  ctx.save();
  ctx.translate(x, y);
  const u = s / 40; // unit scale
  if (kind === 'bun') {
    ctx.fillStyle = '#d98f35';
    rr(ctx, -18 * u, -2 * u, 36 * u, 12 * u, 5 * u); ctx.fill();
    ctx.fillStyle = '#f0b45c';
    ctx.beginPath(); ctx.arc(0, -2 * u, 18 * u, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-9, -12], [0, -16], [9, -12], [-4, -8], [5, -8]]) {
      ctx.beginPath(); ctx.ellipse(sx * u, sy * u, 2.2 * u, 1.4 * u, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'patty') {
    const cooked = state === 'cooked';
    ctx.fillStyle = cooked ? '#6b3f1d' : '#c98a7a';
    rr(ctx, -19 * u, -8 * u, 38 * u, 16 * u, 8 * u); ctx.fill();
    if (cooked) {
      ctx.strokeStyle = '#4a2a12'; ctx.lineWidth = 2 * u;
      for (const gx of [-10, 0, 10]) {
        ctx.beginPath(); ctx.moveTo(gx * u, -7 * u); ctx.lineTo(gx * u, 7 * u); ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#e8a0a0';
      for (const [sx, sy] of [[-8, -3], [4, 2], [10, -4]]) {
        ctx.beginPath(); ctx.arc(sx * u, sy * u, 2.5 * u, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = '#4d9c3f';
    for (const [lx, ly, r] of [[-12, 0, 9], [0, -4, 10], [12, 0, 9], [0, 4, 10]]) {
      ctx.beginPath(); ctx.arc(lx * u, ly * u, r * u, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#8ed07f'; ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.moveTo(-14 * u, 0); ctx.quadraticCurveTo(0, -8 * u, 14 * u, 0); ctx.stroke();
  } else if (kind === 'tomato') {
    ctx.fillStyle = '#d63a34';
    ctx.beginPath(); ctx.arc(0, 0, 16 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f08078';
    ctx.beginPath(); ctx.arc(0, 0, 11 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd9a0';
    for (const [sx, sy] of [[-5, -3], [5, -3], [0, 5]]) {
      ctx.beginPath(); ctx.ellipse(sx * u, sy * u, 2 * u, 3.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f2c230';
    ctx.save(); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-12 * u, -12 * u, 24 * u, 24 * u);
    ctx.restore();
    ctx.fillStyle = '#d9a41f';
    for (const [hx, hy] of [[-6, -4], [6, 3], [0, -8]]) {
      ctx.beginPath(); ctx.arc(hx * u, hy * u, 2.4 * u, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'onion') {
    ctx.strokeStyle = '#b388d9'; ctx.lineWidth = 4 * u;
    for (const r of [6, 11, 15]) {
      ctx.beginPath(); ctx.arc(0, 0, r * u, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#e8d5f5';
    ctx.beginPath(); ctx.arc(0, 0, 4 * u, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath(); ctx.ellipse(0, 0, 34 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c8ccd2'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, 34 * s, 12 * s, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#dfe3e8';
  ctx.beginPath(); ctx.ellipse(0, -2, 24 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
  // Stack the dish: bottom item first, each one a little higher.
  items.forEach((key, i) => {
    drawIngredient(ctx, key, 0, -6 - i * 9 * s, 26 * s);
  });
  ctx.restore();
}

// --- Kitchen ----------------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = '#3a2e26';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  // Checkerboard tile floor.
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 14; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#c9a37e' : '#b78f68';
      ctx.fillRect(FLOOR.x + tx * 72, FLOOR.y + ty * 63, 72, 63);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  for (let tx = 0; tx <= 14; tx++) {
    ctx.beginPath(); ctx.moveTo(FLOOR.x + tx * 72, FLOOR.y); ctx.lineTo(FLOOR.x + tx * 72, FLOOR.y + FLOOR.h); ctx.stroke();
  }
  // Wall band above the floor.
  ctx.fillStyle = '#7c4a2d';
  ctx.fillRect(0, 140, VIEW.w, 10);
  ctx.fillStyle = '#5d3a22';
  ctx.fillRect(0, 128, VIEW.w, 12);
}

function drawStations(ctx, world) {
  for (const s of STATIONS) {
    const near = world.nearest && world.nearest.station === s;
    ctx.save();
    if (s.kind === 'pantry') {
      ctx.fillStyle = near ? '#8a6d4b' : '#6b4f33';
      rr(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
      ctx.fillStyle = '#3d2b1a';
      rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 30, 6); ctx.fill();
      drawIngredient(ctx, s.item, s.x + s.w / 2, s.y + 22, 30);
      text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 10, 12, '#ffe9c4', 'center', true);
    } else if (s.kind === 'board') {
      ctx.fillStyle = near ? '#a97e4f' : '#8a6a42';
      rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
      ctx.fillStyle = '#e8c795';
      rr(ctx, s.x + 12, s.y + 12, s.w - 24, s.h - 34, 6); ctx.fill();
      if (world.board.item) {
        drawIngredient(ctx, world.board.item.kind, s.x + s.w / 2, s.y + 34, 34);
        if (world.board.progress > 0) {
          ctx.fillStyle = '#2b2b2b';
          rr(ctx, s.x + 30, s.y + s.h - 27, s.w - 60, 8, 4); ctx.fill();
          ctx.fillStyle = '#69b455';
          rr(ctx, s.x + 30, s.y + s.h - 27, (s.w - 60) * world.board.progress, 8, 4); ctx.fill();
        }
      } else {
        text(ctx, '🔪 chop here', s.x + s.w / 2, s.y + 30, 14, '#7a5a34');
      }
      text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 9, 12, '#ffe9c4', 'center', true);
    } else if (s.kind === 'grill') {
      ctx.fillStyle = near ? '#4a4f57' : '#33373e';
      rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
      ctx.fillStyle = '#1d1f23';
      rr(ctx, s.x + 10, s.y + 10, s.w - 20, s.h - 34, 6); ctx.fill();
      // Two grill slots.
      world.grill.forEach((g, i) => {
        const gx = s.x + 70 + i * 140;
        const gy = s.y + 34;
        ctx.strokeStyle = '#555b64'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(gx, gy, 26, 0, Math.PI * 2); ctx.stroke();
        if (g) {
          const frac = Math.min(1, g.t / TUNE.grillSeconds);
          const burnt = g.t >= TUNE.burnSeconds;
          drawIngredient(ctx, burnt ? 'patty' : 'patty', gx, gy, 34);
          if (burnt) { ctx.fillStyle = 'rgba(20,10,0,0.55)'; ctx.beginPath(); ctx.arc(gx, gy, 26, 0, Math.PI * 2); ctx.fill(); }
          ctx.strokeStyle = burnt ? '#e0524d' : frac >= 1 ? '#7ed07f' : '#f2c230';
          ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(gx, gy, 31, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, g.t / TUNE.burnSeconds)); ctx.stroke();
          if (frac >= 1 && !burnt) text(ctx, 'READY!', gx, s.y + s.h - 24, 12, '#7ed07f', 'center', true);
          if (burnt) text(ctx, 'BURNT!', gx, s.y + s.h - 24, 12, '#ff7a6e', 'center', true);
        }
      });
      text(ctx, s.label + '  (raw patty → ding → grab)', s.x + s.w / 2, s.y + s.h - 9, 12, '#ffe9c4', 'center', true);
    } else if (s.kind === 'counter') {
      ctx.fillStyle = near ? '#9c7a52' : '#7d6240';
      rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
      ctx.fillStyle = '#e8dcc8';
      rr(ctx, s.x + 8, s.y + 8, s.w - 16, 26, 6); ctx.fill();
      if (world.plate.length > 0) drawPlate(ctx, world.plate, s.x + s.w / 2, s.y + 44, 1.1);
      else text(ctx, 'build your dish here', s.x + s.w / 2, s.y + 44, 13, '#8a7a5f');
      text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 9, 12, '#ffe9c4', 'center', true);
    } else if (s.kind === 'serve') {
      ctx.fillStyle = near ? '#b3542e' : '#8f3f22';
      rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
      ctx.fillStyle = '#ffd9a0';
      rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 8); ctx.fill();
      text(ctx, 'SERVE', s.x + s.w / 2, s.y + 30, 16, '#8f3f22', 'center', true);
      text(ctx, '🔔', s.x + s.w / 2, s.y + 62, 26, '#8f3f22');
      text(ctx, 'window', s.x + s.w / 2, s.y + s.h - 26, 12, '#5d2a16', 'center', true);
      text(ctx, 'bring plate', s.x + s.w / 2, s.y + s.h - 12, 11, '#5d2a16');
    } else if (s.kind === 'trash') {
      ctx.fillStyle = near ? '#5a636e' : '#454d57';
      rr(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
      text(ctx, '🗑', s.x + s.w / 2, s.y + 22, 24, '#fff');
      text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 10, 12, '#dfe3e8', 'center', true);
    }
    if (near) {
      ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
      rr(ctx, s.x - 4, s.y - 4, s.w + 8, s.h + 8, 12); ctx.stroke();
      text(ctx, 'E — use', s.x + s.w / 2, s.y - 12, 13, '#ffd94d', 'center', true);
    }
    ctx.restore();
  }
}

function drawChef(ctx, chef) {
  const bob = chef.moving ? Math.sin(chef.walk) * 3 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body (white apron over striped shirt).
  ctx.fillStyle = '#3f6fb5';
  rr(ctx, -18, -6, 36, 26, 10); ctx.fill();
  ctx.fillStyle = '#f4f6f8';
  rr(ctx, -13, -2, 26, 22, 8); ctx.fill();
  ctx.fillStyle = '#e0524d';
  ctx.fillRect(-13, 8, 26, 3);
  // Head.
  ctx.fillStyle = '#f2c09a';
  ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -29, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-11, -28, 22, 7);
  // Face looks toward movement.
  const look = chef.dir === 'left' ? -4 : chef.dir === 'right' ? 4 : 0;
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath(); ctx.arc(-4 + look, -16, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4 + look, -16, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(look, -12, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Held item floats above the hand.
  if (chef.hand) {
    const hx = chef.dir === 'left' ? -24 : chef.dir === 'right' ? 24 : 0;
    const hy = chef.dir === 'up' ? -30 : 4;
    if (chef.hand.plate) drawPlate(ctx, chef.hand.plate, hx, hy, 0.9);
    else drawIngredient(ctx, `${chef.hand.kind}${chef.hand.state === 'cooked' ? ':cooked' : chef.hand.state === 'chopped' ? ':chopped' : ''}`, hx, hy, 34);
  }
  ctx.restore();
}

// --- Order board and HUD ----------------------------------------------------

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = RECIPES[order.recipeId];
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.save();
  ctx.fillStyle = '#fff8ea';
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = frac < 0.3 ? '#e0524d' : '#d9c49a';
  ctx.lineWidth = frac < 0.3 ? 3 : 2;
  rr(ctx, x, y, w, h, 10); ctx.stroke();
  text(ctx, `#${order.id} ${recipe.name}`, x + 12, y + 16, 14, '#5d3a22', 'left', true);
  text(ctx, `$${recipe.price}`, x + w - 10, y + 16, 14, '#2e7d32', 'right', true);
  recipe.items.forEach((key, i) => drawIngredient(ctx, key, x + 26 + i * 34, y + 46, 26));
  // Patience bar.
  ctx.fillStyle = '#e8dcc8';
  rr(ctx, x + 10, y + h - 16, w - 20, 9, 4); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#69b455' : frac > 0.25 ? '#f2a230' : '#e0524d';
  if (frac > 0) rr(ctx, x + 10, y + h - 16, (w - 20) * frac, 9, 4); ctx.fill();
  ctx.restore();
}

function drawHud(ctx, world) {
  // Top bar.
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 0, VIEW.w, 140);
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(0, 136, VIEW.w, 4);
  text(ctx, '🍳 SIZZLE & SERVE', 16, 24, 18, '#ffd94d', 'left', true);
  text(ctx, 'orders', 16, 46, 12, '#c9a37e', 'left');

  // Order tickets.
  world.orders.forEach((o, i) => drawOrderTicket(ctx, o, 200 + i * 242, 12, 232, 112));
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet — first customer is coming…', 300, 68, 15, '#c9a37e', 'left');
  }

  // Shift timer, centre-right.
  const mins = Math.floor(world.timeLeft / 60);
  const secs = Math.floor(world.timeLeft % 60);
  const timerText = `${mins}:${String(secs).padStart(2, '0')}`;
  const urgent = world.timeLeft <= 30 || world.rush;
  ctx.fillStyle = urgent ? '#e0524d' : '#fff8ea';
  rr(ctx, 940, 14, 130, 52, 10); ctx.fill();
  text(ctx, world.rush ? '🔥 RUSH' : '⏱ SHIFT', 1005, 28, 12, urgent ? '#fff' : '#5d3a22', 'center', true);
  text(ctx, timerText, 1005, 50, 22, urgent ? '#fff' : '#2b2b2b', 'center', true);
  // Timer bar.
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  rr(ctx, 940, 72, 130, 8, 4); ctx.fill();
  ctx.fillStyle = urgent ? '#ff8a7a' : '#7ed07f';
  rr(ctx, 940, 72, 130 * (world.timeLeft / SHIFT_SECONDS), 8, 4); ctx.fill();

  // Score and coins.
  text(ctx, `SCORE  ${world.score}`, 1092, 30, 20, '#ffffff', 'left', true);
  text(ctx, `💰 $${world.coins}   🍽 ${world.served} served`, 1092, 56, 14, '#ffd94d', 'left');
  text(ctx, world.combo > 1 ? `COMBO x${world.combo} 🔥` : 'combo —', 1092, 80, 14, world.combo > 1 ? '#ff9a3d' : '#c9a37e', 'left', true);
  text(ctx, `missed ${world.missed}  •  M mute  •  P pause`, 1092, 104, 11, '#c9a37e', 'left');

  // Toast message.
  if (world.message) {
    const colors = { info: '#2e2118', good: '#2e7d32', warn: '#8a6d1f', bad: '#b3261e', rush: '#b3261e' };
    ctx.globalAlpha = Math.min(1, world.message.ttl);
    ctx.fillStyle = colors[world.message.kind] || colors.info;
    const w = ctx.measureText(world.message.text).width + 36;
    rr(ctx, VIEW.w / 2 - 260, 660, 520, 36, 18); ctx.fill();
    text(ctx, world.message.text, VIEW.w / 2, 678, 15, '#ffffff', 'center', true);
    ctx.globalAlpha = 1;
  }
}

// --- Screens ----------------------------------------------------------------

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(30,18,10,0.82)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, '🍳', 640, 120, 64, '#fff');
  text(ctx, 'SIZZLE & SERVE', 640, 185, 56, '#ffd94d', 'center', true);
  text(ctx, 'A tiny kitchen. A full house. One very busy chef — you.', 640, 228, 20, '#ffe9c4');
  const lines = [
    'Take orders from the board, then run the kitchen:',
    '🥬  Grab ingredients from the pantry  •  🔪  Chop on the board (press E 3×)',
    '🔥  Grill patties until the ding — don’t let them burn!',
    '🍽  Build the dish on the plating counter, carry the plate, serve at the window.',
    '⏱  Serve fast: happy customers tip. Slow ones walk out.',
  ];
  lines.forEach((l, i) => text(ctx, l, 640, 285 + i * 30, 17, '#ffffff'));
  text(ctx, 'Move: WASD / arrows or click  •  Use station: E  •  Mute: M  •  Pause: P', 640, 470, 16, '#c9a37e');
  text(ctx, '▶  Press ENTER or CLICK to start the shift  ◀', 640, 530, 22, '#ffd94d', 'center', true);
  text(ctx, '3-minute shift  •  4 recipes  •  dinner rush at the end', 640, 570, 15, '#c9a37e');
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(30,18,10,0.85)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'SHIFT OVER!', 640, 150, 48, '#ffd94d', 'center', true);
  const stars = '★'.repeat(world.stars) + '☆'.repeat(3 - world.stars);
  text(ctx, stars, 640, 215, 44, '#ffd94d');
  text(ctx, `You served ${world.served} dishes and earned $${world.coins}`, 640, 275, 22, '#ffffff');
  text(ctx, `${world.missed} customers walked out   •   best combo x${world.bestCombo}`, 640, 310, 17, '#c9a37e');
  const verdict = world.stars === 3 ? 'Head-chef material! The whole street is talking about your kitchen.'
    : world.stars === 2 ? 'A solid shift — the regulars will be back.'
    : world.stars === 1 ? 'You kept the kitchen standing. Barely. Practice those patties!'
    : 'Rough night in the kitchen… the grill forgives, the customers don’t.';
  text(ctx, verdict, 640, 350, 18, '#ffe9c4');
  text(ctx, `Final score: ${world.score}`, 640, 400, 24, '#ffffff', 'center', true);
  text(ctx, 'Press ENTER to play again', 640, 470, 20, '#ffd94d', 'center', true);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(30,18,10,0.6)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'PAUSED', 640, 340, 48, '#ffffff', 'center', true);
  text(ctx, 'Press P to keep cooking', 640, 395, 18, '#ffe9c4');
}

// --- Main entry ---------------------------------------------------------------

export function render(ctx, world, input) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawFloor(ctx);
  drawStations(ctx, world);
  if (world.screen !== 'title') drawChef(ctx, world.chef);
  drawHud(ctx, world);
  if (world.screen === 'title') drawTitle(ctx);
  else if (world.screen === 'over') drawGameOver(ctx, world);
  else if (world.paused) drawPaused(ctx);
}
