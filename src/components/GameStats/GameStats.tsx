import { formatScore } from '@/utils/gameLogic';
import styles from './GameStats.module.css';

interface GameStatsProps {
  score: number;
  rows: number;
}

export function GameStats({ score, rows }: GameStatsProps) {
  return (
    <div className={styles.stats}>
      <div className={styles.statItem}>
        <div className={styles.label}>Score</div>
        <div className={styles.value}>{formatScore(score)}</div>
      </div>
      <div className={styles.statItem}>
        <div className={styles.label}>Lines</div>
        <div className={styles.value}>{rows}</div>
      </div>
    </div>
  );
}
