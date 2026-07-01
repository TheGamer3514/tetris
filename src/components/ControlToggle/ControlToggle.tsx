'use client';

import type { ControlScheme } from '@/types/tetris';
import styles from './ControlToggle.module.css';

export type { ControlScheme };

interface ControlToggleProps {
  scheme: ControlScheme;
  onChange: (scheme: ControlScheme) => void;
}

export function ControlToggle({ scheme, onChange }: ControlToggleProps) {
  return (
    <div className={styles.toggle}>
      <p className={styles.label}>Controls:</p>
      <div className={styles.buttons} role="group" aria-label="Control scheme">
        <button
          type="button"
          className={`${styles.button} ${scheme === 'arrows' ? styles.active : ''}`}
          onClick={() => onChange('arrows')}
          aria-pressed={scheme === 'arrows'}
        >
          Arrows
        </button>
        <button
          type="button"
          className={`${styles.button} ${scheme === 'wasd' ? styles.active : ''}`}
          onClick={() => onChange('wasd')}
          aria-pressed={scheme === 'wasd'}
        >
          WASD
        </button>
      </div>
    </div>
  );
}
