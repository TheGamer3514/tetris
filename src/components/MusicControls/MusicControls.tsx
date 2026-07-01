'use client';

import type { MusicTrack } from '@/types/tetris';
import styles from './MusicControls.module.css';

interface MusicControlsProps {
  track: MusicTrack;
  onTrackChange: (track: MusicTrack) => void;
  muted: boolean;
  onToggleMute: () => void;
}

const TRACKS: { value: MusicTrack; label: string }[] = [
  { value: 'normal', label: 'Classic' },
  { value: 'halloween', label: 'Halloween' },
  { value: 'christmas', label: 'Christmas' },
];

export function MusicControls({ track, onTrackChange, muted, onToggleMute }: MusicControlsProps) {
  return (
    <div className={styles.music}>
      <p className={styles.label}>Music:</p>
      <div className={styles.row}>
        <select
          className={styles.select}
          value={track}
          onChange={(e) => onTrackChange(e.target.value as MusicTrack)}
          aria-label="Music track"
        >
          {TRACKS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.muteButton}
          onClick={onToggleMute}
          aria-pressed={muted}
          aria-label={muted ? 'Unmute music' : 'Mute music'}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
}
