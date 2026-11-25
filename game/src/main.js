// Sizzle & Serve — boot, game loop and screen flow.
// One job: own the animation frame, feed input to the world, draw the frame.

import { VIEW } from './config.js';
import { createWorld, update, nearestStation, say } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.w;
canvas.height = VIEW.h;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const input = createInput(canvas);
const audio = createAudio();

let world = shotName ? stageShot(shotName, seed) : createWorld(seed);

function startShift() {
  world = createWorld(seed);
  world.screen = 'playing';
  audio.unlock();
  audio.startMusic();
  say(world, 'First orders coming in — good luck, chef!', 'info', 3);
}

function restart() {
  startShift();
}

// Screenshot mode: draw one frozen frame and stop — no timers, no audio.
if (shotName) {
  world.nearest = nearestStation(world);
  render(ctx, world, input);
} else {
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (input.pressedMute) {
      input.pressedMute = false;
      const muted = audio.toggleMute();
      say(world, muted ? 'Sound off.' : 'Sound on.', 'info', 1);
    }
    if (input.pressedPause) {
      input.pressedPause = false;
      if (world.screen === 'playing') world.paused = !world.paused;
    }
    if (input.pressedStart) {
      input.pressedStart = false;
      audio.unlock();
      if (world.screen === 'title' || world.screen === 'over') restart();
    }
    if (input.moveTarget && world.screen === 'title') {
      input.moveTarget = null;
      startShift();
    }

    world.nearest = world.screen === 'playing' && !world.paused ? nearestStation(world) : null;
    update(world, input, audio, dt);
    // Consume a stray interact press on the title/over screens.
    input.pressedInteract = false;
    render(ctx, world, input);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
