'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Piece,
  TetrominoType,
  DIR,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from '@/types/tetris';
import {
  createEmptyBoard,
  createPieceBag,
  getRandomPiece,
  isOccupied,
  isUnoccupied,
  eachBlock,
  setBlock,
  removeCompleteLines,
  calculateStep,
} from '@/utils/gameLogic';

interface UseTetrisReturn {
  playing: boolean;
  score: number;
  rows: number;
  blocks: (TetrominoType | null)[][];
  current: Piece | null;
  next: Piece | null;
  controlScheme: 'arrows' | 'wasd';
  setControlScheme: (scheme: 'arrows' | 'wasd') => void;
  startGame: () => void;
  endGame: () => void;
}

export function useTetris(): UseTetrisReturn {
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [blocks, setBlocks] = useState<(TetrominoType | null)[][]>(() => createEmptyBoard());
  const [current, setCurrent] = useState<Piece | null>(null);
  const [controlScheme, setControlScheme] = useState<'arrows' | 'wasd'>('arrows');
  const [next, setNext] = useState<Piece | null>(() => {
    // Preload next piece on first load
    const bag = createPieceBag();
    const { piece } = getRandomPiece(bag);
    return piece;
  });
  
  const pieceBagRef = useRef<TetrominoType[]>([]);
  const actionsRef = useRef<number[]>([]);
  const dtRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get next piece from bag
  const getNextPiece = useCallback(() => {
    const { piece, newBag } = getRandomPiece(pieceBagRef.current);
    pieceBagRef.current = newBag;
    return piece;
  }, []);

  // Reset game state
  const resetGame = useCallback(() => {
    pieceBagRef.current = createPieceBag();
    actionsRef.current = [];
    dtRef.current = 0;
    
    setBlocks(createEmptyBoard());
    setScore(0);
    setRows(0);
    
    const firstPiece = getNextPiece();
    const secondPiece = getNextPiece();
    setCurrent(firstPiece);
    setNext(secondPiece);
  }, [getNextPiece]);

  // Handle piece drop
  const dropPiece = useCallback(() => {
    if (!current) return;

    setBlocks((prevBlocks) => {
      let newBlocks = prevBlocks;
      eachBlock(current.type, current.x, current.y, current.dir, (x, y) => {
        newBlocks = setBlock(newBlocks, x, y, current.type);
      });
      return newBlocks;
    });
  }, [current]);

  // Move piece
  const move = useCallback((dir: number): boolean => {
    if (!current) return false;

    let newX = current.x;
    let newY = current.y;

    switch (dir) {
      case DIR.RIGHT:
        newX = current.x + 1;
        break;
      case DIR.LEFT:
        newX = current.x - 1;
        break;
      case DIR.DOWN:
        newY = current.y + 1;
        break;
    }

    setBlocks((prevBlocks) => {
      if (isUnoccupied(current.type, newX, newY, current.dir, prevBlocks)) {
        setCurrent((prev) => prev ? { ...prev, x: newX, y: newY } : null);
      }
      return prevBlocks;
    });

    // Need to check synchronously for drop logic
    return isUnoccupied(current.type, newX, newY, current.dir, blocks);
  }, [current, blocks]);

  // Rotate piece
  const rotate = useCallback(() => {
    if (!current) return;

    const newDir = current.dir === DIR.MAX ? DIR.MIN : current.dir + 1;

    if (isUnoccupied(current.type, current.x, current.y, newDir, blocks)) {
      setCurrent((prev) => prev ? { ...prev, dir: newDir } : null);
    }
  }, [current, blocks]);

  // Drop logic
  const drop = useCallback(() => {
    if (!current) return;

    const newY = current.y + 1;

    if (isUnoccupied(current.type, current.x, newY, current.dir, blocks)) {
      setCurrent((prev) => prev ? { ...prev, y: newY } : null);
    } else {
      // Piece has landed
      setScore((prev) => prev + 10);

      // Place piece on board
      let newBlocks = blocks;
      eachBlock(current.type, current.x, current.y, current.dir, (x, y) => {
        newBlocks = setBlock(newBlocks, x, y, current.type);
      });

      // Remove complete lines
      const { newBlocks: clearedBlocks, linesRemoved } = removeCompleteLines(newBlocks);
      setBlocks(clearedBlocks);

      if (linesRemoved > 0) {
        setRows((prev) => prev + linesRemoved);
        setScore((prev) => prev + 100 * Math.pow(2, linesRemoved - 1));
      }

      // Get next piece
      const nextPiece = next;
      const newNextPiece = getNextPiece();
      
      if (nextPiece && isOccupied(nextPiece.type, nextPiece.x, nextPiece.y, nextPiece.dir, clearedBlocks)) {
        // Game over - track with final score
        const finalScore = score + 10 + (linesRemoved > 0 ? 100 * Math.pow(2, linesRemoved - 1) : 0);
        setPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        if (typeof window !== 'undefined' && (window as any).umami) {
          (window as any).umami.track('game_ended', { score: finalScore });
        }
        return;
      }

      setCurrent(nextPiece);
      setNext(newNextPiece);
      actionsRef.current = [];
    }
  }, [current, next, blocks, getNextPiece]);

  // Handle action
  const handleAction = useCallback((action: number | undefined) => {
    if (action === undefined) return;

    switch (action) {
      case DIR.LEFT:
        move(DIR.LEFT);
        break;
      case DIR.RIGHT:
        move(DIR.RIGHT);
        break;
      case DIR.UP:
        rotate();
        break;
      case DIR.DOWN:
        drop();
        break;
    }
  }, [move, rotate, drop]);

  // Game loop
  useEffect(() => {
    if (!playing) return;

    const step = calculateStep(rows);

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = Math.min(1, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      // Handle queued actions
      const action = actionsRef.current.shift();
      handleAction(action);

      // Automatic drop
      dtRef.current += deltaTime;
      if (dtRef.current > step) {
        dtRef.current -= step;
        drop();
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playing, rows, handleAction, drop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (playing) {
        let handled = false;

        // Arrow keys (always work)
        switch (e.key) {
          case 'ArrowLeft':
            actionsRef.current.push(DIR.LEFT);
            handled = true;
            break;
          case 'ArrowRight':
            actionsRef.current.push(DIR.RIGHT);
            handled = true;
            break;
          case 'ArrowUp':
            actionsRef.current.push(DIR.UP);
            handled = true;
            break;
          case 'ArrowDown':
          case ' ':
            actionsRef.current.push(DIR.DOWN);
            handled = true;
            break;
          case 'Escape':
            setPlaying(false);
            if (audioRef.current) {
              audioRef.current.pause();
            }
            handled = true;
            break;
        }

        // WASD controls (if enabled)
        if (controlScheme === 'wasd') {
          switch (e.key.toLowerCase()) {
            case 'a':
              actionsRef.current.push(DIR.LEFT);
              handled = true;
              break;
            case 'd':
              actionsRef.current.push(DIR.RIGHT);
              handled = true;
              break;
            case 'w':
              actionsRef.current.push(DIR.UP);
              handled = true;
              break;
            case 's':
              actionsRef.current.push(DIR.DOWN);
              handled = true;
              break;
          }
        }

        if (handled) {
          e.preventDefault();
        }
      } else if (e.key === 'Enter') {
        resetGame();
        setPlaying(true);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing, resetGame, controlScheme]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/Audio/tetris-normal.mp3');
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setPlaying(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    // Track game start
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('game_started');
    }
  }, [resetGame]);

  const endGame = useCallback((finalScore?: number) => {
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // Track game end with score
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('game_ended', { score: finalScore || score });
    }
  }, [score]);

  return {
    playing,
    score,
    rows,
    blocks,
    current,
    next,
    controlScheme,
    setControlScheme,
    startGame,
    endGame,
  };
}
