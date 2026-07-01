'use client';

import { useTetris } from '@/hooks/useTetris';
import {
  GameBoard,
  NextPiece,
  GameStats,
  GameOverlay,
  ControlToggle,
  MusicControls,
  TouchControls,
} from '@/components';
import styles from './TetrisGame.module.css';

export function TetrisGame() {
  const {
    playing,
    paused,
    gameOver,
    score,
    bestScore,
    newBest,
    rows,
    level,
    blocks,
    current,
    next,
    hold,
    canHold,
    controlScheme,
    setControlScheme,
    musicTrack,
    setMusicTrack,
    muted,
    toggleMute,
    startGame,
    togglePause,
    actions,
  } = useTetris();

  const isArrows = controlScheme === 'arrows';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Silly Tetris</h1>
        <p className={styles.subtitle}>Classic block-stacking fun!</p>
      </header>

      <div className={styles.tetris}>
        <div className={styles.leftPanel}>
          <div className={styles.previewBox}>
            <p className={styles.label}>Hold</p>
            <NextPiece piece={hold} dimmed={playing && !canHold} />
          </div>

          <div className={styles.previewBox}>
            <p className={styles.label}>Next</p>
            <NextPiece piece={next} />
          </div>

          <GameStats score={score} bestScore={bestScore} rows={rows} level={level} />
        </div>

        <div className={styles.boardWrap}>
          <GameBoard blocks={blocks} current={current} playing={playing} />
          <GameOverlay
            playing={playing}
            paused={paused}
            gameOver={gameOver}
            score={score}
            bestScore={bestScore}
            newBest={newBest}
            onStart={startGame}
            onResume={togglePause}
          />
        </div>

        <div className={styles.rightPanel}>
          <ControlToggle scheme={controlScheme} onChange={setControlScheme} />

          <MusicControls
            track={musicTrack}
            onTrackChange={setMusicTrack}
            muted={muted}
            onToggleMute={toggleMute}
          />

          <div className={styles.controlsSection}>
            <p className={styles.sectionTitle}>Controls</p>
            <ul className={styles.controlList}>
              <li><span className={styles.key}>{isArrows ? '← →' : 'A D'}</span> Move</li>
              <li><span className={styles.key}>{isArrows ? '↑' : 'W'}</span> Rotate</li>
              <li><span className={styles.key}>{isArrows ? '↓' : 'S'}</span> Soft drop</li>
              <li><span className={styles.key}>Space</span> Hard drop</li>
              <li><span className={styles.key}>C</span> Hold</li>
              <li><span className={styles.key}>P</span> Pause</li>
            </ul>
          </div>
        </div>
      </div>

      {playing && (
        <TouchControls actions={actions} onPause={togglePause} paused={paused} />
      )}

      <footer className={styles.footer}>
        <a
          href="https://discord.gg/mUpVm596As"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.discordLink}
        >
          💬 Join our Discord server
        </a>
      </footer>
    </div>
  );
}
