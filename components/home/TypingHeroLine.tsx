'use client';

import { useEffect, useRef, useState } from 'react';

const TYPING_INTERVAL_MS = 66;
const DELETING_INTERVAL_MS = 20;
const PAUSE_BEFORE_TYPE_MS = 1000;
const PAUSE_BEFORE_DELETE_MS = 1500;

type TypingHeroLineProps = {
  descriptions: readonly string[];
  className?: string;
};

export function TypingHeroLine({ descriptions, className }: TypingHeroLineProps) {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const wordIndexRef = useRef(0);
  const letterIndexRef = useRef(0);

  useEffect(() => {
    if (descriptions.length === 0) return;

    let typingTimer: ReturnType<typeof setInterval> | undefined;
    let deletingTimer: ReturnType<typeof setInterval> | undefined;
    let pauseTimer: ReturnType<typeof setTimeout> | undefined;
    let blinkTimer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    const clearTimers = () => {
      if (typingTimer) clearInterval(typingTimer);
      if (deletingTimer) clearInterval(deletingTimer);
      if (pauseTimer) clearTimeout(pauseTimer);
      if (blinkTimer) clearInterval(blinkTimer);
      typingTimer = undefined;
      deletingTimer = undefined;
      pauseTimer = undefined;
      blinkTimer = undefined;
    };

    const startBlink = () => {
      if (blinkTimer) clearInterval(blinkTimer);
      blinkTimer = setInterval(() => {
        setCursorVisible((v) => !v);
      }, 500);
    };

    const stopBlink = () => {
      if (blinkTimer) clearInterval(blinkTimer);
      blinkTimer = undefined;
      setCursorVisible(true);
    };

    const startTyping = () => {
      letterIndexRef.current = 0;
      startBlink();

      pauseTimer = setTimeout(() => {
        if (cancelled) return;
        stopBlink();
        const phrase = descriptions[wordIndexRef.current % descriptions.length];

        typingTimer = setInterval(() => {
          const nextIndex = letterIndexRef.current + 1;
          letterIndexRef.current = nextIndex;
          setDisplayed(phrase.slice(0, nextIndex));

          if (nextIndex >= phrase.length) {
            clearTimers();
            // startDeleting owns the hold-then-delete pause
            startDeleting();
          }
        }, TYPING_INTERVAL_MS);
      }, PAUSE_BEFORE_TYPE_MS);
    };

    const startDeleting = () => {
      startBlink();

      pauseTimer = setTimeout(() => {
        if (cancelled) return;
        stopBlink();

        // Drive deletion from a ref — not a setState updater. React Strict Mode
        // double-invokes updaters in dev, which would skip every other slogan.
        const phrase = descriptions[wordIndexRef.current % descriptions.length];
        letterIndexRef.current = phrase.length;

        deletingTimer = setInterval(() => {
          const nextIndex = letterIndexRef.current - 1;
          letterIndexRef.current = nextIndex;

          if (nextIndex <= 0) {
            setDisplayed('');
            clearTimers();
            wordIndexRef.current = (wordIndexRef.current + 1) % descriptions.length;
            startTyping();
            return;
          }

          setDisplayed(phrase.slice(0, nextIndex));
        }, DELETING_INTERVAL_MS);
      }, PAUSE_BEFORE_DELETE_MS);
    };

    startTyping();

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [descriptions]);

  return (
    <div className={className} aria-live="polite">
      <span>{displayed}</span>
      <span className={cursorVisible ? 'opacity-100' : 'opacity-0'} aria-hidden>
        |
      </span>
    </div>
  );
}
