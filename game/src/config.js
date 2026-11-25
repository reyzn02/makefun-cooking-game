// Sizzle & Serve — configuration: recipes, ingredients, stations, tuning.
// One job: every number and name the rest of the game reads.

export const VIEW = { w: 1280, h: 720 };

// The walkable kitchen floor (below the order board, inside the walls).
export const FLOOR = { x: 160, y: 150, w: 1000, h: 500 };

// Shift length in seconds, and when the dinner rush kicks in.
export const SHIFT_SECONDS = 180;
export const RUSH_AT = 135;

// Ingredients. `prep` says what a raw item needs before it can be plated.
export const INGREDIENTS = {
  bun:     { name: 'Bun',     prep: 'none',  color: '#e8a94e' },
  patty:   { name: 'Patty',   prep: 'grill', color: '#8a5a33' },
  lettuce: { name: 'Lettuce', prep: 'chop',  color: '#69b455' },
  tomato:  { name: 'Tomato',  prep: 'chop',  color: '#e0524d' },
  cheese:  { name: 'Cheese',  prep: 'none',  color: '#f2c230' },
  onion:   { name: 'Onion',   prep: 'chop',  color: '#b388d9' },
};

// A plated item key is "bun", "patty:cooked", "lettuce:chopped", ...
export function plateKey(kind, state) {
  if (kind === 'patty') return state === 'cooked' ? 'patty:cooked' : 'patty';
  if (INGREDIENTS[kind].prep === 'chop') return state === 'chopped' ? `${kind}:chopped` : kind;
  return kind;
}

export function displayName(key) {
  const [kind, state] = key.split(':');
  if (state === 'cooked') return 'Grilled Patty';
  if (state === 'chopped') return `Chopped ${INGREDIENTS[kind].name}`;
  return INGREDIENTS[kind].name;
}

// Recipes: the dishes on the menu. `items` is the multiset a plate must hold.
export const RECIPES = {
  burger: {
    name: 'Sunny Burger', price: 12, color: '#e8a94e',
    items: ['bun', 'patty:cooked', 'lettuce:chopped', 'tomato:chopped'],
    blurb: 'The house classic',
  },
  salad: {
    name: 'Garden Salad', price: 9, color: '#69b455',
    items: ['lettuce:chopped', 'tomato:chopped', 'onion:chopped'],
    blurb: 'Crisp and quick',
  },
  melt: {
    name: 'Melt Stack', price: 11, color: '#f2c230',
    items: ['bun', 'patty:cooked', 'cheese'],
    blurb: 'Gooey and golden',
  },
  double: {
    name: 'Double Trouble', price: 18, color: '#c96a3b',
    items: ['bun', 'patty:cooked', 'patty:cooked', 'cheese', 'tomato:chopped'],
    blurb: 'Two patties, no mercy',
    rushOnly: true,
  },
};

export const MENU_ORDER = ['burger', 'salad', 'melt', 'double'];

// Tuning for the shift.
export const TUNE = {
  chefSpeed: 270,
  chefRadius: 22,
  interactRange: 96,
  chopSeconds: 2.2,
  grillSeconds: 6,
  burnSeconds: 13,
  orderPatience: 50,
  orderPatienceRush: 38,
  spawnEvery: 14,
  spawnEveryRush: 9,
  maxOrders: 3,
  wrongServePenalty: 5,
  comboStep: 0.1,
  comboCap: 2.0,
};

// Stations: where the chef works. `ix, iy` is where the chef stands to use it.
export const STATIONS = [
  { id: 'pantry-bun',     kind: 'pantry', item: 'bun',     label: 'Buns',    x: 24,  y: 168, w: 112, h: 62 },
  { id: 'pantry-patty',   kind: 'pantry', item: 'patty',   label: 'Patties', x: 24,  y: 238, w: 112, h: 62 },
  { id: 'pantry-lettuce', kind: 'pantry', item: 'lettuce', label: 'Lettuce', x: 24,  y: 308, w: 112, h: 62 },
  { id: 'pantry-tomato',  kind: 'pantry', item: 'tomato',  label: 'Tomato',  x: 24,  y: 378, w: 112, h: 62 },
  { id: 'pantry-cheese',  kind: 'pantry', item: 'cheese',  label: 'Cheese',  x: 24,  y: 448, w: 112, h: 62 },
  { id: 'pantry-onion',   kind: 'pantry', item: 'onion',   label: 'Onion',   x: 24,  y: 518, w: 112, h: 62 },
  { id: 'board',   kind: 'board',   label: 'Chopping Board', x: 200, y: 566, w: 170, h: 84 },
  { id: 'grill',   kind: 'grill',   label: 'Grill',          x: 880, y: 150, w: 280, h: 82, slots: 2 },
  { id: 'counter', kind: 'counter', label: 'Plating Counter', x: 480, y: 580, w: 320, h: 70 },
  { id: 'serve',   kind: 'serve',   label: 'Serve Window',   x: 1170, y: 300, w: 86, h: 180 },
  { id: 'trash',   kind: 'trash',   label: 'Trash',          x: 24,  y: 622, w: 112, h: 58 },
];
