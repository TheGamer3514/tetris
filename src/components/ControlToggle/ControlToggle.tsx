'use client';

import { useState } from 'react';
import styles from './ControlToggle.module.css';

export type ControlScheme = 'arrows' | 'wasd';

interface ControlToggleProps {
  scheme: ControlScheme;
  onChange: (scheme: ControlScheme) => void;
}

export function ControlToggle({ scheme, onChange }: ControlToggleProps) {
  return (
    <div className={styles.toggle}>
      <p className={styles.label}>Controls:</p>
      <div className={styles.buttons}>
        <button
          className={`${styles.button} ${scheme === 'arrows' ? styles.active : ''}`}
          onClick={() => onChange('arrows')}
        >
          Arrows
        </button>
        <button
          className={`${styles.button} ${scheme === 'wasd' ? styles.active : ''}`}
          onClick={() => onChange('wasd')}
        >
          WASD
        </button>
      </div>
    </div>
  );
}
