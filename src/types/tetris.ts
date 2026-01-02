// Tetromino piece definitions
export interface TetrominoType {
  size: number;
  blocks: number[];
  color: string;
}

export interface Piece {
  type: TetrominoType;
  dir: number;
  x: number;
  y: number;
}

export const DIR = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3,
  MIN: 0,
  MAX: 3,
} as const;

export type Direction = typeof DIR[keyof typeof DIR];

// Tetromino definitions using bit patterns for rotation states
export const TETROMINOES: Record<string, TetrominoType> = {
  I: { size: 4, blocks: [0x0F00, 0x2222, 0x00F0, 0x4444], color: 'cyan' },
  J: { size: 3, blocks: [0x44C0, 0x8E00, 0x6440, 0x0E20], color: 'blue' },
  L: { size: 3, blocks: [0x4460, 0x0E80, 0xC440, 0x2E00], color: 'orange' },
  O: { size: 2, blocks: [0xCC00, 0xCC00, 0xCC00, 0xCC00], color: 'yellow' },
  S: { size: 3, blocks: [0x06C0, 0x8C40, 0x6C00, 0x4620], color: 'green' },
  T: { size: 3, blocks: [0x0E40, 0x4C40, 0x4E00, 0x4640], color: 'magenta' },
  Z: { size: 3, blocks: [0x0C60, 0x4C80, 0xC600, 0x2640], color: 'red' },
};

export interface GameState {
  playing: boolean;
  score: number;
  rows: number;
  blocks: (TetrominoType | null)[][];
  current: Piece | null;
  next: Piece | null;
}

export interface GameSpeed {
  start: number;
  decrement: number;
  min: number;
}

export const DEFAULT_SPEED: GameSpeed = {
  start: 0.6,
  decrement: 0.005,
  min: 0.1,
};

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
