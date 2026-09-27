'use client';

import { useSyncExternalStore } from 'react';
import { AdSlot } from './AdSlot';
import styles from './AdSlot.module.css';

// Wide enough for the ~720px game plus two 160px rails and gutters.
const RAIL_QUERY = '(min-width: 1200px)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(RAIL_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function SideRails() {
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(RAIL_QUERY).matches,
    () => false, // server render: no rails until the client knows its width
  );

  // Don't render (rather than CSS-hide) on narrow screens: AdSense errors on
  // zero-width slots and would waste an impression request.
  if (!wide) return null;

  return (
    <>
      <aside className={`${styles.rail} ${styles.railLeft}`}>
        <AdSlot format="vertical" />
      </aside>
      <aside className={`${styles.rail} ${styles.railRight}`}>
        <AdSlot format="vertical" />
      </aside>
    </>
  );
}
