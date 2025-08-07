// src/config.js

// ——— Duration settings ———
export const VALID_DURATIONS = [2, 4, 8, 16];
export const DURATION_SETS = [
  [2, 2, 2, 2],
  [4, 2, 2],
  [2, 2, 4],
  [2, 4, 2],
  [4, 4],
  [8],
];
// how many times to repeat a set (will randomize between these bounds)
export const MIN_SET_REPEATS = 2;
export const MAX_SET_REPEATS = 4;

// ——— Subdivision labels for timer modes ———
// Keys = timerMode (0..3), values = array of text labels
export const SUBDIVISION_LABELS = {
  0: ['1', '2', '3', '4', '5', '6', '7', '8'],
  1: [
    // One And
    '1',
    'and',
    '2',
    'and',
    '3',
    'and',
    '4',
    'and',
    '5',
    'and',
    '6',
    'and',
    '7',
    'and',
    '8',
    'and',
  ],
  2: [
    // And One
    'and',
    '1',
    'and',
    '2',
    'and',
    '3',
    'and',
    '4',
    'and',
    '5',
    'and',
    '6',
    'and',
    '7',
    'and',
    '8',
  ],
  3: [
    // Sixteenths
    '1',
    'e',
    'and',
    'a',
    '2',
    'e',
    'and',
    'a',
    '3',
    'e',
    'and',
    'a',
    '4',
    'e',
    'and',
    'a',
    '5',
    'e',
    'and',
    'a',
    '6',
    'e',
    'and',
    'a',
    '7',
    'e',
    'and',
    'a',
    '8',
    'e',
    'and',
    'a',
  ],
};

// ——— Default tempo and timerMode ———
export const DEFAULT_TEMPO = 60;
export const DEFAULT_TIMERMODE = 0; // 0=Whole,1=OneAnd,2=AndOne,3=Quarter

// ——— Weight/Gesture sequence fallback ———
export const FALLBACK_WEIGHT_SEQ = [
  'C.R',
  'C.D',
  'C.L',
  'C.U',
  'U.R',
  'U.D',
  'U.L',
  'U.U',
  'D.R',
  'D.D',
  'D.L',
  'D.U',
  'RU',
  'R',
  'RD',
  'LU',
  'L',
  'LD',
];
export const FALLBACK_GESTURE_SEQ = ['X.R', 'X.D', 'X.L', 'X.U'];

// ——— (Later) CSV filename ———
export const SEQUENCE_CSV_PATH = 'sequences - Sheet1.csv';
