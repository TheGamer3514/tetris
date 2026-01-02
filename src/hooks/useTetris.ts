'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Piece,
  TetrominoType,
  DIR,
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

  // End game function
  const endGame = useCallback((finalScore?: number) => {
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // Track game end with score
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('game_ended', { score: finalScore || 0 });
    }
  }, []);

  // Drop logic
  const drop = useCallback(() => {
    if (!current) return;

    const newY = current.y + 1;

    if (isUnoccupied(current.type, current.x, newY, current.dir, blocks)) {
      setCurrent((prev) => prev ? { ...prev, y: newY } : null);
    } else {
      // Piece has landed
      // Place piece on board
      let newBlocks = blocks;
      eachBlock(current.type, current.x, current.y, current.dir, (x, y) => {
        newBlocks = setBlock(newBlocks, x, y, current.type);
      });

      // Remove complete lines
      const { newBlocks: clearedBlocks, linesRemoved } = removeCompleteLines(newBlocks);
      setBlocks(clearedBlocks);

      // Calculate score changes
      const pieceScore = 10;
      const lineScore = linesRemoved > 0 ? 100 * Math.pow(2, linesRemoved - 1) : 0;

      // Update score and rows
      let finalScore = 0;
      setScore((prev) => {
        finalScore = prev + pieceScore + lineScore;
        return finalScore;
      });

      if (linesRemoved > 0) {
        setRows((prev) => prev + linesRemoved);
      }

      // Get next piece
      const nextPiece = next;
      const newNextPiece = getNextPiece();
      
      if (nextPiece && isOccupied(nextPiece.type, nextPiece.x, nextPiece.y, nextPiece.dir, clearedBlocks)) {
        // Game over - use the calculated final score
        endGame(finalScore);
        return;
      }

      setCurrent(nextPiece);
      setNext(newNextPiece);
      actionsRef.current = [];
    }
  }, [current, next, blocks, getNextPiece, endGame]);

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
    const audio = new Audio('/Audio/tetris-normal.mp3');
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
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
