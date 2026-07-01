import styles from './GameStats.module.css';

interface GameStatsProps {
  score: number;
  bestScore: number;
  rows: number;
  level: number;
}

export function GameStats({ score, bestScore, rows, level }: GameStatsProps) {
  return (
    <div className={styles.stats}>
      <div className={styles.statItem}>
        <div className={styles.label}>Score</div>
        <div className={styles.value}>{score.toLocaleString()}</div>
      </div>
      <div className={styles.statItem}>
        <div className={styles.label}>Best</div>
        <div className={styles.value}>{bestScore.toLocaleString()}</div>
      </div>
      <div className={styles.statRow}>
        <div className={styles.statItem}>
          <div className={styles.label}>Level</div>
          <div className={styles.value}>{level}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.label}>Lines</div>
          <div className={styles.value}>{rows}</div>
        </div>
      </div>
    </div>
  );
}
