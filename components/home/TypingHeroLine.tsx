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
  const [isTyping, setIsTyping] = useState(false);
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
      setIsTyping(false);
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
        setIsTyping(true);
        const phrase = descriptions[wordIndexRef.current % descriptions.length];

        typingTimer = setInterval(() => {
          const nextIndex = letterIndexRef.current + 1;
          letterIndexRef.current = nextIndex;
          setDisplayed(phrase.slice(0, nextIndex));

          if (nextIndex >= phrase.length) {
            clearTimers();
            startBlink();
            pauseTimer = setTimeout(() => {
              if (cancelled) return;
              startDeleting();
            }, PAUSE_BEFORE_DELETE_MS);
          }
        }, TYPING_INTERVAL_MS);
      }, PAUSE_BEFORE_TYPE_MS);
    };

    const startDeleting = () => {
      startBlink();

      pauseTimer = setTimeout(() => {
        if (cancelled) return;
        stopBlink();
        setIsTyping(true);

        deletingTimer = setInterval(() => {
          setDisplayed((prev) => {
            if (prev.length === 0) {
              clearTimers();
              wordIndexRef.current = (wordIndexRef.current + 1) % descriptions.length;
              startTyping();
              return '';
            }
            return prev.slice(0, -1);
          });
        }, DELETING_INTERVAL_MS);
      }, PAUSE_BEFORE_DELETE_MS);
    };

    startTyping();

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [descriptions]);

  const showCursor = isTyping || cursorVisible;

  return (
    <div className={className} aria-live="polite">
      <span>{displayed}</span>
      <span className={showCursor ? 'opacity-100' : 'opacity-0'} aria-hidden>
        |
      </span>
    </div>
  );
}
