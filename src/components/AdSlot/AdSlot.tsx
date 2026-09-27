'use client';

import { useEffect, useRef } from 'react';
import styles from './AdSlot.module.css';

export const ADSENSE_CLIENT = 'ca-pub-4814283255853981';
const DEFAULT_SLOT = '2026318484';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  slot?: string;
  format?: 'auto' | 'vertical' | 'horizontal' | 'rectangle';
  className?: string;
}

export function AdSlot({ slot = DEFAULT_SLOT, format = 'auto', className }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const ins = insRef.current;
    // Guard against StrictMode double-invocation: AdSense marks filled slots.
    if (!ins || ins.getAttribute('data-adsbygoogle-status')) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers or a not-yet-approved account; leave the slot empty.
    }
  }, []);

  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <ins
        ref={insRef}
        className={`adsbygoogle ${styles.ins}`}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}
