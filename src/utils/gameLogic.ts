import {
  TetrominoType,
  Piece,
  DIR,
  TETROMINOES,
  BOARD_WIDTH,
  BOARD_HEIGHT,
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
 * Generate a random number between min and max
 */
function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Create a shuffled bag of pieces (28-bag randomizer: 4 of each piece type)
 */
export function createPieceBag(): TetrominoType[] {
  const pieces: TetrominoType[] = [];
  const types = Object.values(TETROMINOES);
  
  // Add 4 of each piece type (28 pieces total)
  types.forEach((type) => {
    for (let i = 0; i < 4; i++) {
      pieces.push(type);
    }
  });
  
  // Shuffle
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  
  return pieces;
}

/**
 * Get a random piece from the bag, refilling if empty
 */
export function getRandomPiece(bag: TetrominoType[]): { piece: Piece; newBag: TetrominoType[] } {
  let newBag = [...bag];
  
  if (newBag.length === 0) {
    newBag = createPieceBag();
  }
  
  const index = Math.floor(random(0, newBag.length));
  const type = newBag.splice(index, 1)[0];
  
  const piece: Piece = {
    type,
    dir: DIR.UP,
    x: Math.round(random(0, BOARD_WIDTH - type.size)),
    y: 0,
  };
  
  return { piece, newBag };
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
 * Calculate the step time based on rows cleared
 */
export function calculateStep(rows: number): number {
  const start = 0.6;
  const decrement = 0.005;
  const min = 0.1;
  return Math.max(min, start - decrement * rows);
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
 * Format score for display
 */
export function formatScore(score: number): string {
  return Math.floor(score).toString();
}
