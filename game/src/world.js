// Sizzle & Serve — the kitchen itself: state, orders, stations, scoring.
// One job: what happens when the chef moves, grabs, chops, grills and serves.

import {
  FLOOR, INGREDIENTS, RECIPES, MENU_ORDER, STATIONS, TUNE,
  SHIFT_SECONDS, RUSH_AT, plateKey, displayName,
} from './config.js';
import { mulberry32, pick } from './random.js';
import { keyDirection } from './input.js';

let orderSeq = 0;

export function createWorld(seed = 1) {
  const rng = mulberry32(seed);
  return {
    seed, rng,
    screen: 'title', // title | playing | over
    paused: false,
    time: 0,
    timeLeft: SHIFT_SECONDS,
    rush: false, rushAnnounced: false,
    chef: { x: 640, y: 420, dir: 'down', hand: null, walk: 0, moving: false },
    orders: [],
    nextOrderIn: 2.5,
    board: { item: null, progress: 0 },
    grill: [null, null], // slots: { kind:'patty', t, done, burnt, dinged }
    plate: [], // plated item keys waiting on the counter
    score: 0, coins: 0, served: 0, missed: 0,
    combo: 0, bestCombo: 0,
    message: null, // { text, kind, ttl }
    stars: 0,
  };
}

export function say(world, text, kind = 'info', ttl = 2.2) {
  world.message = { text, kind, ttl };
}

function rectDistance(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

export function nearestStation(world) {
  const { x, y } = world.chef;
  let best = null, bestD = Infinity;
  for (const s of STATIONS) {
    const d = rectDistance(x, y, s);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD <= TUNE.interactRange ? { station: best, dist: bestD } : null;
}

function stationAtPoint(x, y) {
  for (const s of STATIONS) {
    if (x >= s.x - 8 && x <= s.x + s.w + 8 && y >= s.y - 8 && y <= s.y + s.h + 8) return s;
  }
  return null;
}

function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const sa = a.slice().sort().join('|');
  const sb = b.slice().sort().join('|');
  return sa === sb;
}

function spawnOrder(world) {
  const pool = world.rush ? MENU_ORDER : MENU_ORDER.filter((id) => !RECIPES[id].rushOnly);
  const recipeId = pick(world.rng, pool);
  const patience = world.rush ? TUNE.orderPatienceRush : TUNE.orderPatience;
  world.orders.push({ id: ++orderSeq, recipeId, patience, maxPatience: patience });
}

function endShift(world) {
  world.screen = 'over';
  world.stars = world.served >= 14 ? 3 : world.served >= 10 ? 2 : world.served >= 6 ? 1 : 0;
}

// --- Interactions -----------------------------------------------------------

export function interact(world, audio) {
  const near = nearestStation(world);
  if (!near) { say(world, 'Walk up to a station first!', 'warn'); return; }
  const s = near.station;
  const chef = world.chef;
  const hand = chef.hand;

  if (s.kind === 'pantry') {
    if (hand) { say(world, 'Hands full! Serve or trash it first.', 'warn'); audio.error(); return; }
    chef.hand = { kind: s.item, state: 'raw' };
    audio.pickup();
    say(world, `Picked up ${INGREDIENTS[s.item].name}.`, 'info', 1.2);
    return;
  }

  if (s.kind === 'board') {
    if (!world.board.item) {
      if (!hand || hand.plate) { say(world, 'Bring lettuce, tomato or onion to chop.', 'warn'); return; }
      if (INGREDIENTS[hand.kind].prep !== 'chop') {
        say(world, `${INGREDIENTS[hand.kind].name} does not need chopping.`, 'warn'); audio.error(); return;
      }
      world.board.item = hand; world.board.progress = 0; chef.hand = null;
      audio.pickup();
      return;
    }
    // Chop a chunk with each press; three chops finish it.
    world.board.progress += 1 / 3;
    audio.chop();
    if (world.board.progress >= 1) {
      chef.hand = { kind: world.board.item.kind, state: 'chopped' };
      world.board.item = null; world.board.progress = 0;
      audio.chopDone();
      say(world, `Chopped ${INGREDIENTS[chef.hand.kind].name}!`, 'good', 1.2);
    }
    return;
  }

  if (s.kind === 'grill') {
    if (hand && !hand.plate && hand.kind === 'patty' && hand.state === 'raw') {
      const slot = world.grill.findIndex((g) => g === null);
      if (slot === -1) { say(world, 'Grill is full!', 'warn'); audio.error(); return; }
      world.grill[slot] = { kind: 'patty', t: 0, dinged: false, burnt: false };
      chef.hand = null;
      audio.sizzle();
      return;
    }
    if (!hand) {
      const slot = world.grill.findIndex((g) => g && (g.t >= TUNE.grillSeconds));
      if (slot === -1) {
        say(world, world.grill.some(Boolean) ? 'Still sizzling… wait for the ding!' : 'Grill a raw patty first.', 'warn');
        return;
      }
      const g = world.grill[slot];
      world.grill[slot] = null;
      if (g.t >= TUNE.burnSeconds) {
        say(world, 'Burnt! That patty is charcoal.', 'bad'); audio.burn();
        return;
      }
      chef.hand = { kind: 'patty', state: 'cooked' };
      audio.pickup();
      say(world, 'Grilled patty — hot off the grill!', 'good', 1.2);
      return;
    }
    say(world, 'The grill only takes raw patties.', 'warn');
    return;
  }

  if (s.kind === 'counter') {
    if (hand && !hand.plate) {
      if (world.plate.length >= 5) { say(world, 'Plate is full!', 'warn'); audio.error(); return; }
      world.plate.push(plateKey(hand.kind, hand.state));
      chef.hand = null;
      audio.plate();
      return;
    }
    if (!hand && world.plate.length > 0) {
      chef.hand = { plate: world.plate.slice() };
      world.plate = [];
      audio.pickup();
      say(world, 'Plate in hand — to the serve window!', 'info', 1.4);
      return;
    }
    if (hand && hand.plate && world.plate.length === 0) {
      world.plate = hand.plate;
      chef.hand = null;
      audio.plate();
      return;
    }
    say(world, 'Bring ingredients here to build a dish.', 'warn');
    return;
  }

  if (s.kind === 'serve') {
    if (!hand || !hand.plate) { say(world, 'Bring a finished plate to serve.', 'warn'); return; }
    const plate = hand.plate;
    const match = world.orders.find((o) => sameMultiset(plate, RECIPES[o.recipeId].items));
    if (!match) {
      world.score = Math.max(0, world.score - TUNE.wrongServePenalty);
      world.combo = 0;
      chef.hand = null; // wrong dish goes in the bin
      audio.error();
      say(world, `No order wants that dish! −${TUNE.wrongServePenalty} pts.`, 'bad');
      return;
    }
    const recipe = RECIPES[match.recipeId];
    const patienceFrac = Math.max(0, match.patience / match.maxPatience);
    const tip = Math.round(recipe.price * 0.5 * patienceFrac);
    const mult = Math.min(TUNE.comboCap, 1 + world.combo * TUNE.comboStep);
    const earned = Math.round((recipe.price + tip) * mult);
    world.score += earned;
    world.coins += earned;
    world.served += 1;
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.orders = world.orders.filter((o) => o !== match);
    chef.hand = null;
    audio.serve();
    say(world, `${recipe.name} served! +$${earned}${world.combo > 1 ? `  Combo x${world.combo}!` : ''}`, 'good');
    return;
  }

  if (s.kind === 'trash') {
    if (!hand) { say(world, 'Nothing to throw away.', 'warn'); return; }
    chef.hand = null;
    audio.error();
    say(world, 'Tossed it.', 'info', 1.0);
  }
}

// --- Per-frame update -------------------------------------------------------

function collides(x, y) {
  if (x < FLOOR.x + TUNE.chefRadius || x > FLOOR.x + FLOOR.w - TUNE.chefRadius) return true;
  if (y < FLOOR.y + TUNE.chefRadius || y > FLOOR.y + FLOOR.h - TUNE.chefRadius) return true;
  for (const s of STATIONS) {
    const r = TUNE.chefRadius - 4;
    if (x > s.x - r && x < s.x + s.w + r && y > s.y - r && y < s.y + s.h + r) return true;
  }
  return false;
}

export function update(world, input, audio, dt) {
  if (world.message) {
    world.message.ttl -= dt;
    if (world.message.ttl <= 0) world.message = null;
  }
  if (world.screen !== 'playing' || world.paused) return;

  world.time += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.time);
  if (!world.rush && world.time >= RUSH_AT) {
    world.rush = true;
    audio.rush();
    say(world, 'DINNER RUSH! Orders are coming faster!', 'rush', 3);
  }
  if (world.timeLeft <= 0) { endShift(world); audio.stopMusic(); return; }

  // Orders arrive on a schedule.
  world.nextOrderIn -= dt;
  if (world.nextOrderIn <= 0 && world.orders.length < TUNE.maxOrders) {
    spawnOrder(world);
    audio.orderIn();
    world.nextOrderIn = world.rush ? TUNE.spawnEveryRush : TUNE.spawnEvery;
  }

  // Patience drains; an expired order walks out.
  for (const o of world.orders.slice()) {
    o.patience -= dt;
    if (o.patience <= 0) {
      world.orders = world.orders.filter((x) => x !== o);
      world.missed += 1;
      world.combo = 0;
      audio.error();
      say(world, `A customer left — ${RECIPES[o.recipeId].name} was too slow!`, 'bad');
    }
  }

  // Grill timers: done ding, then burn.
  for (const g of world.grill) {
    if (!g) continue;
    g.t += dt;
    if (!g.dinged && g.t >= TUNE.grillSeconds) { g.dinged = true; audio.grillDone(); }
    if (!g.burnt && g.t >= TUNE.burnSeconds) { g.burnt = true; audio.burn(); say(world, 'A patty burnt on the grill!', 'bad'); }
  }

  // --- Chef movement: keys, or click-to-move. ---
  const chef = world.chef;
  const dir = keyDirection(input);
  let mx = dir.x, my = dir.y;
  if (mx === 0 && my === 0 && input.moveTarget) {
    const dx = input.moveTarget.x - chef.x;
    const dy = input.moveTarget.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      input.moveTarget = null;
    } else {
      mx = dx / d; my = dy / d;
    }
  }
  if (mx !== 0 || my !== 0) {
    chef.moving = true;
    chef.walk += dt * 10;
    if (Math.abs(mx) > Math.abs(my)) chef.dir = mx > 0 ? 'right' : 'left';
    else chef.dir = my > 0 ? 'down' : 'up';
    const step = TUNE.chefSpeed * dt;
    const nx = chef.x + mx * step;
    if (!collides(nx, chef.y)) chef.x = nx;
    const ny = chef.y + my * step;
    if (!collides(chef.x, ny)) chef.y = ny;
  } else {
    chef.moving = false;
  }

  // Clicked a station? Use it once the chef arrives.
  if (input.clickedPoint) {
    const s = stationAtPoint(input.clickedPoint.x, input.clickedPoint.y);
    input.clickedPoint = null;
    if (s) input.pendingStation = s.id;
  }
  if (input.pendingStation) {
    const s = STATIONS.find((x) => x.id === input.pendingStation);
    if (s && rectDistance(chef.x, chef.y, s) <= TUNE.interactRange) {
      input.pendingStation = null;
      interact(world, audio);
    } else if (!s) {
      input.pendingStation = null;
    }
  }

  // E / Space pressed.
  if (input.pressedInteract) {
    input.pressedInteract = false;
    interact(world, audio);
  }
}

export { displayName, RECIPES };
