'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Piece,
  TetrominoType,
  GameState,
  ControlScheme,
  MusicTrack,
  DIR,
} from '@/types/tetris';
import {
  createEmptyBoard,
  createPieceBag,
  getRandomPiece,
  spawnPiece,
  isOccupied,
  isUnoccupied,
  eachBlock,
  setBlock,
  removeCompleteLines,
  findDropPosition,
  calculateStep,
  calculateLevel,
  lineClearScore,
} from '@/utils/gameLogic';

const BEST_SCORE_KEY = 'silly-tetris:best-score';
const CONTROL_SCHEME_KEY = 'silly-tetris:control-scheme';
const MUSIC_TRACK_KEY = 'silly-tetris:music-track';
const MUTED_KEY = 'silly-tetris:muted';

const MUSIC_SRC: Record<MusicTrack, string> = {
  normal: '/Audio/tetris-normal.mp3',
  halloween: '/Audio/tetris-halloween.mp3',
  christmas: '/Audio/tetris-christmas.mp3',
};

export interface TetrisActions {
  moveLeft: () => void;
  moveRight: () => void;
  rotate: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  hold: () => void;
}

/** The slice of game state the UI renders from. */
interface TetrisSnapshot {
  playing: boolean;
  paused: boolean;
  gameOver: boolean;
  score: number;
  bestScore: number;
  rows: number;
  level: number;
  blocks: (TetrominoType | null)[][];
  current: Piece | null;
  next: Piece | null;
  hold: Piece | null;
  canHold: boolean;
  /** True only when the score at game over strictly beat the previous best. */
  newBest: boolean;
  controlScheme: ControlScheme;
  musicTrack: MusicTrack;
  muted: boolean;
}

export interface UseTetrisReturn extends TetrisSnapshot {
  setControlScheme: (scheme: ControlScheme) => void;
  setMusicTrack: (track: MusicTrack) => void;
  toggleMute: () => void;
  startGame: () => void;
  endGame: () => void;
  togglePause: () => void;
  actions: TetrisActions;
}

function createInitialState(): GameState {
  // Preload a "next" piece so the preview isn't empty before the first game.
  const bag = createPieceBag();
  const { piece } = getRandomPiece(bag);
  return {
    playing: false,
    paused: false,
    gameOver: false,
    score: 0,
    bestScore: 0,
    rows: 0,
    level: 1,
    blocks: createEmptyBoard(),
    current: null,
    next: piece,
    hold: null,
    canHold: true,
    bag: [],
  };
}

export function useTetris(): UseTetrisReturn {
  const initialGame = useMemo(() => createInitialState(), []);
  const stateRef = useRef<GameState>(initialGame);

  // Config lives in refs so input handlers always read fresh values; it is
  // mirrored into the render snapshot below.
  const controlSchemeRef = useRef<ControlScheme>('arrows');
  const musicTrackRef = useRef<MusicTrack>('normal');
  const mutedRef = useRef(false);
  const newBestRef = useRef(false);

  // Render snapshot: the mutable ref is the source of truth, and every mutation
  // publishes a fresh snapshot via sync() so React re-renders.
  const [snapshot, setSnapshot] = useState<TetrisSnapshot>(() => ({
    playing: initialGame.playing,
    paused: initialGame.paused,
    gameOver: initialGame.gameOver,
    score: initialGame.score,
    bestScore: initialGame.bestScore,
    rows: initialGame.rows,
    level: initialGame.level,
    blocks: initialGame.blocks,
    current: initialGame.current,
    next: initialGame.next,
    hold: initialGame.hold,
    canHold: initialGame.canHold,
    newBest: false,
    controlScheme: 'arrows',
    musicTrack: 'normal',
    muted: false,
  }));

  const sync = useCallback(() => {
    const s = stateRef.current;
    setSnapshot({
      playing: s.playing,
      paused: s.paused,
      gameOver: s.gameOver,
      score: s.score,
      bestScore: s.bestScore,
      rows: s.rows,
      level: s.level,
      blocks: s.blocks,
      current: s.current,
      next: s.next,
      hold: s.hold,
      canHold: s.canHold,
      newBest: newBestRef.current,
      controlScheme: controlSchemeRef.current,
      musicTrack: musicTrackRef.current,
      muted: mutedRef.current,
    });
  }, []);

  // Game-loop bookkeeping
  const dtRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const loopActiveRef = useRef(false);
  const tickRef = useRef<(timestamp: number) => void>(() => {});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ---- Audio helpers -------------------------------------------------------

  const playMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || mutedRef.current) return;
    audio.play().catch(() => {});
  }, []);

  const pauseMusic = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const restartMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    playMusic();
  }, [playMusic]);

  // ---- Analytics -----------------------------------------------------------

  const track = useCallback((event: string, data?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    const umami = (window as unknown as { umami?: { track: (e: string, d?: unknown) => void } }).umami;
    umami?.track(event, data);
  }, []);

  // ---- Persistence ---------------------------------------------------------

  const persistBestScore = useCallback(() => {
    const s = stateRef.current;
    const beat = s.score > s.bestScore;
    newBestRef.current = beat;
    if (beat) {
      s.bestScore = s.score;
      try {
        window.localStorage.setItem(BEST_SCORE_KEY, String(s.score));
      } catch {
        /* localStorage may be unavailable (private mode) */
      }
    }
  }, []);

  // ---- Game loop -----------------------------------------------------------

  const stopLoop = useCallback(() => {
    loopActiveRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleGameOver = useCallback(() => {
    const s = stateRef.current;
    s.playing = false;
    s.paused = false;
    s.gameOver = true;
    s.current = null;
    stopLoop();
    pauseMusic();
    persistBestScore();
    track('game_ended', { score: s.score, rows: s.rows, level: s.level });
    sync();
  }, [stopLoop, pauseMusic, persistBestScore, track, sync]);

  // Lock the current piece into the board, clear lines, then spawn the next one.
  const lockPiece = useCallback(() => {
    const s = stateRef.current;
    if (!s.current) return;
    const current = s.current;

    let newBlocks = s.blocks;
    eachBlock(current.type, current.x, current.y, current.dir, (x, y) => {
      newBlocks = setBlock(newBlocks, x, y, current.type);
    });

    const { newBlocks: cleared, linesRemoved } = removeCompleteLines(newBlocks);
    s.blocks = cleared;

    if (linesRemoved > 0) {
      s.rows += linesRemoved;
      s.level = calculateLevel(s.rows);
      s.score += lineClearScore(linesRemoved, s.level);
    }

    const nextPiece = s.next;
    const { piece, newBag } = getRandomPiece(s.bag);
    s.bag = newBag;
    s.next = piece;
    s.canHold = true;

    if (!nextPiece || isOccupied(nextPiece.type, nextPiece.x, nextPiece.y, nextPiece.dir, s.blocks)) {
      handleGameOver();
      return;
    }

    s.current = nextPiece;
    dtRef.current = 0;
  }, [handleGameOver]);

  // One step of gravity (also used by the manual soft drop).
  const dropStep = useCallback((fromPlayer: boolean) => {
    const s = stateRef.current;
    if (!s.current || s.paused || s.gameOver) return;

    const newY = s.current.y + 1;
    if (isUnoccupied(s.current.type, s.current.x, newY, s.current.dir, s.blocks)) {
      s.current = { ...s.current, y: newY };
      if (fromPlayer) s.score += 1;
      sync();
    } else {
      lockPiece();
      sync();
    }
  }, [lockPiece, sync]);

  const tick = useCallback((timestamp: number) => {
    if (!loopActiveRef.current) return;
    const s = stateRef.current;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = Math.min(1, (timestamp - lastTimeRef.current) / 1000);
    lastTimeRef.current = timestamp;

    if (s.playing && !s.paused && !s.gameOver) {
      const step = calculateStep(s.level);
      dtRef.current += deltaTime;
      let steps = 0;
      while (dtRef.current > step && steps < 8) {
        dtRef.current -= step;
        dropStep(false);
        steps++;
        if (stateRef.current.gameOver) break;
      }
    } else {
      dtRef.current = 0;
    }

    if (loopActiveRef.current) {
      rafRef.current = requestAnimationFrame(tickRef.current);
    }
  }, [dropStep]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const startLoop = useCallback(() => {
    if (loopActiveRef.current) return;
    loopActiveRef.current = true;
    lastTimeRef.current = 0;
    dtRef.current = 0;
    rafRef.current = requestAnimationFrame(tickRef.current);
  }, []);

  // ---- Player actions ------------------------------------------------------

  const canAct = useCallback(() => {
    const s = stateRef.current;
    return s.playing && !s.paused && !s.gameOver && s.current !== null;
  }, []);

  const move = useCallback((dx: number) => {
    if (!canAct()) return;
    const s = stateRef.current;
    const current = s.current!;
    const newX = current.x + dx;
    if (isUnoccupied(current.type, newX, current.y, current.dir, s.blocks)) {
      s.current = { ...current, x: newX };
      sync();
    }
  }, [canAct, sync]);

  const moveLeft = useCallback(() => move(-1), [move]);
  const moveRight = useCallback(() => move(1), [move]);

  const rotate = useCallback(() => {
    if (!canAct()) return;
    const s = stateRef.current;
    const current = s.current!;
    const newDir = current.dir === DIR.MAX ? DIR.MIN : current.dir + 1;
    // Basic wall kick: try in place, then nudge horizontally if blocked.
    for (const kick of [0, -1, 1, -2, 2]) {
      const newX = current.x + kick;
      if (isUnoccupied(current.type, newX, current.y, newDir, s.blocks)) {
        s.current = { ...current, x: newX, dir: newDir };
        sync();
        return;
      }
    }
  }, [canAct, sync]);

  const softDrop = useCallback(() => {
    if (!canAct()) return;
    dropStep(true);
  }, [canAct, dropStep]);

  const hardDrop = useCallback(() => {
    if (!canAct()) return;
    const s = stateRef.current;
    const current = s.current!;
    const landingY = findDropPosition(current, s.blocks);
    const distance = landingY - current.y;
    if (distance > 0) s.score += distance * 2;
    s.current = { ...current, y: landingY };
    lockPiece();
    sync();
  }, [canAct, lockPiece, sync]);

  const hold = useCallback(() => {
    if (!canAct()) return;
    const s = stateRef.current;
    if (!s.canHold) return;

    const currentType = s.current!.type;

    if (s.hold) {
      const swapIn = spawnPiece(s.hold.type);
      if (isOccupied(swapIn.type, swapIn.x, swapIn.y, swapIn.dir, s.blocks)) return;
      s.hold = spawnPiece(currentType);
      s.current = swapIn;
    } else {
      s.hold = spawnPiece(currentType);
      const nextPiece = s.next;
      const { piece, newBag } = getRandomPiece(s.bag);
      s.bag = newBag;
      s.next = piece;
      if (!nextPiece || isOccupied(nextPiece.type, nextPiece.x, nextPiece.y, nextPiece.dir, s.blocks)) {
        handleGameOver();
        return;
      }
      s.current = nextPiece;
    }

    s.canHold = false;
    dtRef.current = 0;
    sync();
  }, [canAct, handleGameOver, sync]);

  // ---- Game control --------------------------------------------------------

  const startGame = useCallback(() => {
    const s = stateRef.current;
    const first = getRandomPiece(createPieceBag());
    const second = getRandomPiece(first.newBag);

    s.blocks = createEmptyBoard();
    s.bag = second.newBag;
    s.current = first.piece;
    s.next = second.piece;
    s.hold = null;
    s.canHold = true;
    s.score = 0;
    s.rows = 0;
    s.level = 1;
    s.playing = true;
    s.paused = false;
    s.gameOver = false;
    newBestRef.current = false;

    dtRef.current = 0;
    startLoop();
    restartMusic();
    track('game_started');
    sync();
  }, [startLoop, restartMusic, track, sync]);

  const endGame = useCallback(() => {
    const s = stateRef.current;
    if (!s.playing) return;
    s.playing = false;
    s.paused = false;
    s.gameOver = false;
    s.current = null;
    stopLoop();
    pauseMusic();
    persistBestScore();
    sync();
  }, [stopLoop, pauseMusic, persistBestScore, sync]);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (!s.playing || s.gameOver) return;
    s.paused = !s.paused;
    if (s.paused) {
      pauseMusic();
    } else {
      lastTimeRef.current = 0;
      playMusic();
    }
    sync();
  }, [pauseMusic, playMusic, sync]);

  // ---- Config setters ------------------------------------------------------

  const setControlScheme = useCallback((scheme: ControlScheme) => {
    controlSchemeRef.current = scheme;
    try {
      window.localStorage.setItem(CONTROL_SCHEME_KEY, scheme);
    } catch {
      /* ignore */
    }
    sync();
  }, [sync]);

  const setMusicTrack = useCallback((newTrack: MusicTrack) => {
    musicTrackRef.current = newTrack;
    const audio = audioRef.current;
    if (audio) {
      audio.src = MUSIC_SRC[newTrack];
      audio.load();
      const s = stateRef.current;
      if (s.playing && !s.paused) restartMusic();
    }
    try {
      window.localStorage.setItem(MUSIC_TRACK_KEY, newTrack);
    } catch {
      /* ignore */
    }
    sync();
  }, [restartMusic, sync]);

  const toggleMute = useCallback(() => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    const audio = audioRef.current;
    if (audio) {
      audio.muted = nextMuted;
      const s = stateRef.current;
      if (!nextMuted && s.playing && !s.paused) playMusic();
    }
    try {
      window.localStorage.setItem(MUTED_KEY, String(nextMuted));
    } catch {
      /* ignore */
    }
    sync();
  }, [playMusic, sync]);

  // ---- Effects -------------------------------------------------------------

  // Load persisted preferences and best score on mount.
  useEffect(() => {
    try {
      const best = window.localStorage.getItem(BEST_SCORE_KEY);
      if (best !== null) {
        const parsed = parseInt(best, 10);
        if (!Number.isNaN(parsed)) stateRef.current.bestScore = parsed;
      }
      const scheme = window.localStorage.getItem(CONTROL_SCHEME_KEY);
      if (scheme === 'arrows' || scheme === 'wasd') controlSchemeRef.current = scheme;
      const savedTrack = window.localStorage.getItem(MUSIC_TRACK_KEY);
      if (savedTrack === 'normal' || savedTrack === 'halloween' || savedTrack === 'christmas') {
        musicTrackRef.current = savedTrack;
      }
      const savedMuted = window.localStorage.getItem(MUTED_KEY);
      if (savedMuted !== null) mutedRef.current = savedMuted === 'true';
    } catch {
      /* ignore */
    }
    sync();
  }, [sync]);

  // Set up the audio element once on mount.
  useEffect(() => {
    const audio = new Audio(MUSIC_SRC[musicTrackRef.current]);
    audio.loop = true;
    audio.muted = mutedRef.current;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audio.load();
      audioRef.current = null;
    };
  }, []);

  // Keyboard controls.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const key = e.key;
      const lower = key.length === 1 ? key.toLowerCase() : key;
      const scheme = controlSchemeRef.current;

      // Start / restart from the menu or game-over screen.
      if (!s.playing) {
        if (key === 'Enter' || key === ' ') {
          startGame();
          e.preventDefault();
        } else if (key.startsWith('Arrow')) {
          // Swallow arrows so the page doesn't scroll behind the overlay.
          e.preventDefault();
        }
        return;
      }

      let handled = true;

      switch (key) {
        case 'ArrowLeft':
          moveLeft();
          break;
        case 'ArrowRight':
          moveRight();
          break;
        case 'ArrowUp':
          if (!e.repeat) rotate();
          break;
        case 'ArrowDown':
          softDrop();
          break;
        case ' ':
          if (!e.repeat) hardDrop();
          break;
        case 'Escape':
          endGame();
          break;
        default:
          handled = false;
      }

      if (!handled && lower === 'p') {
        if (!e.repeat) togglePause();
        handled = true;
      }

      if (!handled && (lower === 'c' || key === 'Shift')) {
        if (!e.repeat) hold();
        handled = true;
      }

      if (!handled && scheme === 'wasd') {
        switch (lower) {
          case 'a':
            moveLeft();
            handled = true;
            break;
          case 'd':
            moveRight();
            handled = true;
            break;
          case 'w':
            if (!e.repeat) rotate();
            handled = true;
            break;
          case 's':
            softDrop();
            handled = true;
            break;
        }
      }

      if (handled) e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, endGame, togglePause, moveLeft, moveRight, rotate, softDrop, hardDrop, hold]);

  // Stop the loop if the component unmounts mid-game.
  useEffect(() => stopLoop, [stopLoop]);

  return {
    ...snapshot,
    setControlScheme,
    setMusicTrack,
    toggleMute,
    startGame,
    endGame,
    togglePause,
    actions: { moveLeft, moveRight, rotate, softDrop, hardDrop, hold },
  };
}
