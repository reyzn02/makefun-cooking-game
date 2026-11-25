// Sizzle & Serve — keyboard and mouse input.
// One job: turn keys and clicks into "move here" and "use this station".

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    // Click-to-move target in canvas coordinates, or null.
    moveTarget: null,
    // Station id the player clicked and wants to use on arrival, or null.
    pendingStation: null,
    // Edge-triggered actions, consumed once per frame by the game loop.
    pressedInteract: false,
    pressedStart: false,
    pressedMute: false,
    pressedPause: false,
  };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  window.addEventListener('keydown', (event) => {
    if (KEYMAP[event.code]) {
      keys.add(KEYMAP[event.code]);
      state.moveTarget = null; // keys take over from click-to-move
      event.preventDefault();
    } else if (event.code === 'KeyE' || event.code === 'Space') {
      if (!event.repeat) state.pressedInteract = true;
      event.preventDefault();
    } else if (event.code === 'Enter') {
      if (!event.repeat) state.pressedStart = true;
    } else if (event.code === 'KeyM') {
      if (!event.repeat) state.pressedMute = true;
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      if (!event.repeat) state.pressedPause = true;
    }
  });
  window.addEventListener('keyup', (event) => {
    if (KEYMAP[event.code]) keys.delete(KEYMAP[event.code]);
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    state.moveTarget = { x, y };
    state.clickedPoint = { x, y };
  });

  return state;
}

// Movement direction from held keys (-1, 0 or 1 per axis), normalised.
export function keyDirection(input) {
  let x = 0, y = 0;
  if (input.keys.has('left')) x -= 1;
  if (input.keys.has('right')) x += 1;
  if (input.keys.has('up')) y -= 1;
  if (input.keys.has('down')) y += 1;
  if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
  return { x, y };
}
