'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { TetrisActions } from '@/hooks/useTetris';
import styles from './TouchControls.module.css';

interface TouchControlsProps {
  actions: TetrisActions;
  onPause: () => void;
  paused: boolean;
}

const REPEAT_DELAY = 180;
const REPEAT_INTERVAL = 60;

interface RepeatButtonProps {
  onAction: () => void;
  className?: string;
  ariaLabel: string;
  children: React.ReactNode;
}

/** Button that fires once on press, then auto-repeats while held (DAS-style). */
function RepeatButton({ onAction, className, ariaLabel, children }: RepeatButtonProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    onAction();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(onAction, REPEAT_INTERVAL);
    }, REPEAT_DELAY);
  }, [onAction]);

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      {children}
    </button>
  );
}

export function TouchControls({ actions, onPause, paused }: TouchControlsProps) {
  return (
    <div className={styles.pad} aria-label="Touch controls">
      <div className={styles.topRow}>
        <button type="button" className={styles.btn} onClick={actions.hold} aria-label="Hold">
          Hold
        </button>
        <button type="button" className={styles.btn} onClick={actions.rotate} aria-label="Rotate">
          ⟳
        </button>
        <button type="button" className={styles.btn} onClick={onPause} aria-label={paused ? 'Resume' : 'Pause'}>
          {paused ? '▶' : '⏸'}
        </button>
      </div>
      <div className={styles.midRow}>
        <RepeatButton onAction={actions.moveLeft} className={styles.btn} ariaLabel="Move left">
          ◀
        </RepeatButton>
        <RepeatButton onAction={actions.softDrop} className={styles.btn} ariaLabel="Soft drop">
          ▼
        </RepeatButton>
        <RepeatButton onAction={actions.moveRight} className={styles.btn} ariaLabel="Move right">
          ▶
        </RepeatButton>
      </div>
      <button type="button" className={`${styles.btn} ${styles.hardDrop}`} onClick={actions.hardDrop} aria-label="Hard drop">
        ⤓ Drop
      </button>
    </div>
  );
}
