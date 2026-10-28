// Pixel art. One character per pixel; see each palette for what the letters mean.

import { C } from './svg.mjs';

export const GOAT = [
  '.......hhH........',
  '......h..hH.......',
  '..........hHWW....',
  '.......EEEWWWWWW..',
  '........E.WWWKWWW.',
  '..........WWWWWWWN',
  '...........WWWWWW.',
  '...........WWWWBB.',
  'WWWWWWWWWWWWWW.BB.',
  '.WWWWWWWWWWWWW..B.',
  '.WWWWWWWWWWWWW....',
  '.GGWWWWWWWWWGG....',
  '..WW.W.....WW.W...',
  '..WW.W.....WW.W...',
  '..KK.K.....KK.K...',
];
export const GOAT_EYE = { row: 4, col: 13 };
export const GOAT_TAIL = { row: 7, col: 0 };

export const GOAT_COLORS = {
  W: C.border,
  G: C.muted,
  E: C.muted,
  B: C.muted,
  h: '#c98a4b',
  H: C.yellow,
  K: C.dim,
  N: C.pink,
};

// Evolutions, drawn over the goat. Each unlocks at a level and stays.
export const EVOLUTIONS = [
  {
    level: 10,
    name: 'SCARF',
    rowOffset: 7,
    rows: ['...........RRRR...', '..............r...', '..............r...'],
  },
  {
    level: 20,
    name: 'WIZARD HAT',
    rowOffset: -4,
    rows: [
      '............P.....',
      '...........PP.....',
      '...........PPP....',
      '..........PPYP....',
      '..........PPPPP...',
      '.........YYYYYYY..',
    ],
  },
  {
    level: 30,
    name: 'CROWN',
    rowOffset: -2,
    rows: ['..........Y.Y.Y...', '..........YYYYY...', '..........YRYBY...'],
    replaces: 'WIZARD HAT',
  },
];
export const EVOLUTION_COLORS = { R: C.red, r: C.orange, P: C.purple, Y: C.yellow, B: C.blue };

// Tiny goat that grazes the contribution map.
export const MINI_GOAT = [
  '.......hH..',
  '.......WWW.',
  'W......WKWN',
  'WWWWWWWWWW.',
  '.WWWWWWWB..',
  '.W.W..W.W..',
  '.K.K..K.K..',
];

export const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];

export const PUMPKIN = [
  '....g.....',
  '...gg.....',
  '.oOOOOOOo.',
  'oOOOOOOOOo',
  'oOOYOOYOOo',
  'oOOOOOOOOo',
  'oOYOYYOYOo',
  '.oOOOOOOo.',
  '..oooooo..',
];
export const PUMPKIN_COLORS = { O: C.orange, o: '#c0582f', g: C.greenDark, Y: C.yellow };

export const MOON = [
  '...MMMM...',
  '.MMMMMMMM.',
  '.MMMmMMMM.',
  'MMMMMMMMMM',
  'MMMMMMmMMM',
  'MMmMMMMMMM',
  'MMMMMMMMMM',
  '.MMMMmMMM.',
  '.MMMMMMMM.',
  '...MMMM...',
];
export const MOON_COLORS = { M: '#f4e9b4', m: '#d8c98a' };

export const BAT_UP = ['X.....X', 'XX.X.XX', '.XXXXX.', '...X...'];
export const BAT_DOWN = ['...X...', '.XXXXX.', 'XX.X.XX', 'X.....X'];

// 8x8 achievement icons. X is the main color, Y an accent.
export const ICONS = {
  boot: ['..XXX...', '..XXX...', '..XXX...', '..XXX...', '..XXXXX.', '.XXXXXXX', '.XXXXXXX', '........'],
  star: ['...XX...', '...XX...', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '.XX..XX.', 'XX....XX', '........'],
  trophy: ['XXXXXXXX', 'X.XXXX.X', 'X.XXXX.X', '.XXXXXX.', '..XXXX..', '...XX...', '..XXXX..', '.XXXXXX.'],
  branch: ['.X....X.', 'XXX..XXX', '.X....X.', '.X...X..', '.X..X...', '.XXX....', 'XXX.....', '.X......'],
  merge: ['.X......', 'XXX.....', '.X......', '.XX.....', '.X.X....', '.X..X...', '.X...XXX', '.X....X.'],
  flame: ['...X....', '..XX....', '..XXX.X.', '.XXXXXX.', '.XXYYXX.', 'XXYYYYXX', 'XXYYYYXX', '.XXXXXX.'],
  house: ['...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', '.XXXXXX.', '.XX..XX.', '.XX..XX.', '.XX..XX.'],
  horn: ['......XX', '.....XX.', '....XX..', '...XX...', '..XXX...', '.XXXX...', 'XXXXX...', '........'],
  scroll: ['XXXXXXX.', 'X.....X.', 'X.YYY.X.', 'X.....X.', 'X.YYY.X.', 'X.....X.', 'XXXXXXX.', '........'],
  crown: ['X..X..X.', 'XX.X.XX.', 'XXXXXXX.', 'XXXXXXX.', 'XYXYXYX.', 'XXXXXXX.', '........', '........'],
  heart: ['.XX.XX..', 'XXXXXXX.', 'XXXXXXX.', '.XXXXX..', '..XXX...', '...X....', '........', '........'],
};
