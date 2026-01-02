'use client';

import { useTetris } from '@/hooks/useTetris';
import { GameBoard, NextPiece, GameStats, StartPrompt } from '@/components';
import { ControlToggle } from '@/components/ControlToggle';
import styles from './TetrisGame.module.css';

export function TetrisGame() {
  const { playing, score, rows, blocks, current, next, controlScheme, setControlScheme, startGame } = useTetris();

  return (
    <>
      <div className={styles.mobileWarning}>
        ⚠️ This game is best played on desktop. Mobile support coming soon!
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Silly Tetris</h1>
        <p className={styles.subtitle}>Classic block-stacking fun!</p>
      </header>

      <div className={styles.tetris}>
        <div className={styles.leftPanel}>
          <StartPrompt playing={playing} onStart={startGame} />
          
          <div className={styles.nextPieceContainer}>
            <p className={styles.label}>Next:</p>
            <NextPiece piece={next} />
          </div>
          
          <GameStats score={score} rows={rows} />
        </div>
        
        <GameBoard blocks={blocks} current={current} playing={playing} />
        
        <div className={styles.rightPanel}>
          <ControlToggle scheme={controlScheme} onChange={setControlScheme} />
          
          <div className={styles.controlsSection}>
            <div className={styles.controlItem}>
              <div className={styles.keyButton}>
                {controlScheme === 'arrows' ? '↑' : 'W'}
              </div>
              <div className={styles.keyLabel}>Rotate</div>
            </div>
            
            <div className={styles.controlItem}>
              <div className={styles.keyButton}>
                {controlScheme === 'arrows' ? '← →' : 'A D'}
              </div>
              <div className={styles.keyLabel}>Move</div>
            </div>
            
            <div className={styles.controlItem}>
              <div className={styles.keyButton}>
                {controlScheme === 'arrows' ? '↓' : 'S'}
              </div>
              <div className={styles.keyLabel}>Soft Drop</div>
            </div>
            
            <div className={styles.controlItem}>
              <div className={styles.keyButton}>Space</div>
              <div className={styles.keyLabel}>Hard Drop</div>
            </div>
            
            <div className={styles.controlItem}>
              <div className={styles.keyButton}>Enter</div>
              <div className={styles.keyLabel}>Start</div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className={styles.footer}>
        <a href="https://discord.gg/mUpVm596As" target="_blank" rel="noopener noreferrer" className={styles.discordLink}>
          💬 Join our Discord server
        </a>
      </footer>
    </>
  );
}
