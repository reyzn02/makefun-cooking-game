// Sizzle & Serve — staged states for the entry screenshots.
// One job: put the real game into a photogenic moment for ?shot=<name>.
// Every shot is the game itself, rendered by the same code players see.

import { createWorld, say } from './world.js';
import { RECIPES } from './config.js';

function order(world, recipeId, patience, maxPatience) {
  world.orders.push({ id: world.orders.length + 1, recipeId, patience, maxPatience });
}

// Build a world frozen in the moment a screenshot name asks for.
export function stageShot(name, seed = 1) {
  const world = createWorld(seed);
  world.screen = 'playing';
  world.time = 45;
  world.timeLeft = 135;

  if (name === 'start') {
    world.screen = 'title';
    return world;
  }

  if (name === 'play') {
    // Kitchen mid-service: two orders on the board, a patty sizzling,
    // a dish half-built on the counter, chef at the grill.
    order(world, 'burger', 34, 50);
    order(world, 'salad', 22, 50);
    world.grill[0] = { kind: 'patty', t: 4.2, dinged: false, burnt: false };
    world.board.item = { kind: 'tomato', state: 'raw' };
    world.board.progress = 2 / 3;
    world.plate = ['bun', 'patty:cooked'];
    world.chef.x = 1010; world.chef.y = 290; world.chef.dir = 'up';
    world.chef.hand = { kind: 'lettuce', state: 'chopped' };
    world.score = 46; world.coins = 46; world.served = 4; world.combo = 2;
    return world;
  }

  if (name === 'serve') {
    // The payoff moment: a finished Sunny Burger in hand at the window,
    // the matching ticket about to be paid, coins and combo up.
    order(world, 'burger', 28, 50);
    order(world, 'melt', 40, 50);
    world.chef.x = 1120; world.chef.y = 390; world.chef.dir = 'right';
    world.chef.hand = { plate: ['bun', 'patty:cooked', 'lettuce:chopped', 'tomato:chopped'] };
    world.grill[0] = { kind: 'patty', t: 6.4, dinged: true, burnt: false };
    world.score = 88; world.coins = 88; world.served = 8; world.combo = 3;
    say(world, 'Sunny Burger served! +$17  Combo x3!', 'good', 999);
    return world;
  }

  if (name === 'end') {
    world.screen = 'over';
    world.timeLeft = 0;
    world.served = 15; world.missed = 2; world.coins = 187; world.score = 187;
    world.bestCombo = 4; world.stars = 3;
    return world;
  }

  // Unknown shot name: plain mid-game.
  order(world, 'burger', 40, 50);
  return world;
}

export { RECIPES };
