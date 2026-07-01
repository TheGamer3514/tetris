import {
  TetrominoType,
  Piece,
  DIR,
  TETROMINOES,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  LINES_PER_LEVEL,
} from '@/types/tetris';

/**
 * Iterates over each block in a tetromino piece
 */
export function eachBlock(
  type: TetrominoType,
  x: number,
  y: number,
  dir: number,
  fn: (blockX: number, blockY: number) => void
): void {
  const blocks = type.blocks[dir];
  let row = 0;
  let col = 0;

  for (let bit = 0x8000; bit > 0; bit = bit >> 1) {
    if (blocks & bit) {
      fn(x + col, y + row);
    }
    if (++col === 4) {
      col = 0;
      ++row;
    }
  }
}

/**
 * Check if a piece position is occupied or out of bounds
 */
export function isOccupied(
  type: TetrominoType,
  x: number,
  y: number,
  dir: number,
  blocks: (TetrominoType | null)[][]
): boolean {
  let result = false;
  eachBlock(type, x, y, dir, (blockX, blockY) => {
    if (
      blockX < 0 ||
      blockX >= BOARD_WIDTH ||
      blockY < 0 ||
      blockY >= BOARD_HEIGHT ||
      getBlock(blocks, blockX, blockY)
    ) {
      result = true;
    }
  });
  return result;
}

/**
 * Check if a piece position is unoccupied
 */
export function isUnoccupied(
  type: TetrominoType,
  x: number,
  y: number,
  dir: number,
  blocks: (TetrominoType | null)[][]
): boolean {
  return !isOccupied(type, x, y, dir, blocks);
}

/**
 * Get the block at position (x, y)
 */
export function getBlock(
  blocks: (TetrominoType | null)[][],
  x: number,
  y: number
): TetrominoType | null {
  return blocks && blocks[x] ? blocks[x][y] : null;
}

/**
 * Set the block at position (x, y)
 */
export function setBlock(
  blocks: (TetrominoType | null)[][],
  x: number,
  y: number,
  type: TetrominoType | null
): (TetrominoType | null)[][] {
  const newBlocks = [...blocks];
  if (!newBlocks[x]) {
    newBlocks[x] = [];
  }
  newBlocks[x] = [...newBlocks[x]];
  newBlocks[x][y] = type;
  return newBlocks;
}

/**
 * Create a shuffled 7-bag: each of the seven tetrominoes exactly once,
 * in random order. This guarantees no piece is ever more than 12 pieces
 * apart from its previous occurrence.
 */
export function createPieceBag(): TetrominoType[] {
  const pieces = Object.values(TETROMINOES);

  // Fisher-Yates shuffle
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }

  return pieces;
}

/**
 * Create a piece in its default spawn state, centered horizontally on the board
 */
export function spawnPiece(type: TetrominoType): Piece {
  return {
    type,
    dir: DIR.UP,
    x: Math.floor((BOARD_WIDTH - type.size) / 2),
    y: 0,
  };
}

/**
 * Take the next piece from the bag, refilling with a fresh shuffled 7-bag
 * when it runs out.
 */
export function getRandomPiece(bag: TetrominoType[]): { piece: Piece; newBag: TetrominoType[] } {
  const newBag = bag.length === 0 ? createPieceBag() : [...bag];
  const type = newBag.shift()!;

  return { piece: spawnPiece(type), newBag };
}

/**
 * Create an empty game board
 */
export function createEmptyBoard(): (TetrominoType | null)[][] {
  const board: (TetrominoType | null)[][] = [];
  for (let x = 0; x < BOARD_WIDTH; x++) {
    board[x] = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      board[x][y] = null;
    }
  }
  return board;
}

/**
 * Calculate the current level from the number of rows cleared
 */
export function calculateLevel(rows: number): number {
  return Math.floor(rows / LINES_PER_LEVEL) + 1;
}

/**
 * Calculate the gravity step time (seconds per cell) based on the level.
 * Higher levels drop pieces faster, down to a floor.
 */
export function calculateStep(level: number): number {
  const start = 0.6;
  const decrement = 0.05;
  const min = 0.08;
  return Math.max(min, start - decrement * (level - 1));
}

/**
 * Points awarded for clearing lines, scaled by the current level.
 * Uses the classic single/double/triple/tetris progression.
 */
export function lineClearScore(lines: number, level: number): number {
  const base = [0, 100, 300, 500, 800];
  return (base[lines] ?? 0) * level;
}

/**
 * Check and remove complete lines, returning the new board and number of lines removed
 */
export function removeCompleteLines(
  blocks: (TetrominoType | null)[][]
): { newBlocks: (TetrominoType | null)[][]; linesRemoved: number } {
  let newBlocks = blocks.map(col => [...col]);
  let linesRemoved = 0;

  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    let complete = true;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (!getBlock(newBlocks, x, y)) {
        complete = false;
        break;
      }
    }

    if (complete) {
      // Remove line and shift everything down
      for (let yy = y; yy >= 0; yy--) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          newBlocks[x][yy] = yy === 0 ? null : getBlock(newBlocks, x, yy - 1);
        }
      }
      y++; // Check this row again since everything shifted
      linesRemoved++;
    }
  }

  return { newBlocks, linesRemoved };
}

/**
 * Find the Y position where a piece would land if dropped straight down
 */
export function findDropPosition(
  piece: Piece,
  blocks: (TetrominoType | null)[][]
): number {
  let ghostY = piece.y;
  while (!isOccupied(piece.type, piece.x, ghostY + 1, piece.dir, blocks)) {
    ghostY++;
  }
  return ghostY;
}
