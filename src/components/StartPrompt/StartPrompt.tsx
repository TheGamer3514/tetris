import styles from './StartPrompt.module.css';

interface StartPromptProps {
  playing: boolean;
  onStart: () => void;
}

export function StartPrompt({ playing, onStart }: StartPromptProps) {
  if (playing) return null;

  return (
    <p className={styles.start}>
      <a href="#" onClick={(e) => { e.preventDefault(); onStart(); }}>
        Press Enter to Play.
      </a>
    </p>
  );
}
