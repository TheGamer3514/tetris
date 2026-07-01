'use client';

import styles from './GameOverlay.module.css';

interface GameOverlayProps {
  playing: boolean;
  paused: boolean;
  gameOver: boolean;
  score: number;
  bestScore: number;
  newBest: boolean;
  onStart: () => void;
  onResume: () => void;
}

export function GameOverlay({
  playing,
  paused,
  gameOver,
  score,
  bestScore,
  newBest,
  onStart,
  onResume,
}: GameOverlayProps) {
  // Nothing to show while actively playing.
  if (playing && !paused) return null;

  if (gameOver) {
    return (
      <div className={styles.overlay}>
        <h2 className={styles.title}>Game Over</h2>
        {newBest && <p className={styles.badge}>★ New Best!</p>}
        <p className={styles.stat}>Score: <strong>{score.toLocaleString()}</strong></p>
        <p className={styles.stat}>Best: <strong>{bestScore.toLocaleString()}</strong></p>
        <button type="button" className={styles.button} onClick={onStart}>
          Play Again
        </button>
        <p className={styles.hint}>or press Enter</p>
      </div>
    );
  }

  if (paused) {
    return (
      <div className={styles.overlay}>
        <h2 className={styles.title}>Paused</h2>
        <button type="button" className={styles.button} onClick={onResume}>
          Resume
        </button>
        <p className={styles.hint}>or press P</p>
      </div>
    );
  }

  // Idle / start screen.
  return (
    <div className={styles.overlay}>
      <h2 className={styles.title}>Ready?</h2>
      {bestScore > 0 && <p className={styles.stat}>Best: <strong>{bestScore.toLocaleString()}</strong></p>}
      <button type="button" className={styles.button} onClick={onStart}>
        Play
      </button>
      <p className={styles.hint}>or press Enter</p>
    </div>
  );
}
