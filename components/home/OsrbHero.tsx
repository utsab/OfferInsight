'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const WORD_GROUPS = [
  { letter: 'O', suffix: 'pen' },
  { letter: 'S', suffix: 'ource' },
  { letter: 'R', suffix: 'esume' },
  { letter: 'B', suffix: 'ook' },
] as const;

/** Slightly larger so OSRB separation reads in the first part of the scroll */
const DESKTOP_WORD_GAP_PX = 16;

function clearScrollLockStyles() {
  gsap.set([document.documentElement, document.body], {
    clearProps: 'overflow,overflowY,height',
  });
}

function refreshScrollTriggers() {
  requestAnimationFrame(() => {
    ScrollTrigger.refresh(false);
  });
}

function getNavbarHeightPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--navbar-height').trim();
  if (!raw) return 72;
  if (raw.endsWith('rem')) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(raw) * rootFontSize;
  }
  return parseFloat(raw) || 72;
}

function measureSuffixWidths(suffixes: HTMLSpanElement[]): number[] {
  return suffixes.map((suffix) => {
    const parent = suffix.parentElement;
    if (!parent) return suffix.scrollWidth;

    const clone = suffix.cloneNode(true) as HTMLSpanElement;
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.maxWidth = 'none';
    clone.style.opacity = '1';
    clone.style.pointerEvents = 'none';
    parent.appendChild(clone);
    const width = clone.getBoundingClientRect().width;
    clone.remove();
    return width;
  });
}

function measureWordHeight(group: HTMLDivElement): number {
  const letter = group.firstElementChild as HTMLElement | null;
  const suffix = group.lastElementChild as HTMLElement | null;
  if (!letter || !suffix) return group.getBoundingClientRect().height;
  return Math.max(letter.getBoundingClientRect().height, suffix.getBoundingClientRect().height);
}

function computeEqualGapSpreadY(
  groups: HTMLDivElement[],
  row: HTMLDivElement,
  verticalPadding: number,
): number[] {
  const wordHeights = groups.map(measureWordHeight);
  const available = row.clientHeight - verticalPadding;
  const sumHeights = wordHeights.reduce((sum, h) => sum + h, 0);

  let gap = (available - sumHeights) / 3;
  const minGap = 12;
  const maxGap = 56;
  gap = Math.max(minGap, Math.min(maxGap, gap));
  if (sumHeights + 3 * gap > available) {
    gap = Math.max(minGap, (available - sumHeights) / 3);
  }

  const totalSpan = sumHeights + 3 * gap;
  let cursor = (row.clientHeight - totalSpan) / 2;

  const targetTops = wordHeights.map((height) => {
    const top = cursor;
    cursor += height + gap;
    return top;
  });

  const naturalTops = groups.map((group) => group.offsetTop);
  return groups.map((_, index) => targetTops[index] - naturalTops[index]);
}

export function OsrbHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const suffixRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const row = rowRef.current;
      const track = trackRef.current;
      if (!section || !row || !track) return;

      const groups = groupRefs.current.filter(Boolean) as HTMLDivElement[];
      const suffixes = suffixRefs.current.filter(Boolean) as HTMLSpanElement[];
      if (groups.length !== 4 || suffixes.length !== 4) return;

      clearScrollLockStyles();

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reducedMotion) {
        gsap.set(track, { gap: DESKTOP_WORD_GAP_PX });
        gsap.set(suffixes, { opacity: 1, maxWidth: 'none' });
        gsap.set(groups, { clearProps: 'transform' });
        return;
      }

      const mm = gsap.matchMedia();

      const setupAnimation = (isDesktop: boolean) => {
        const suffixWidths = measureSuffixWidths(suffixes);

        gsap.set(groups, { x: 0, y: 0 });
        gsap.set(track, { gap: 0 });
        gsap.set(suffixes, { opacity: 0, maxWidth: 0 });

        const navbarOffset = getNavbarHeightPx();
        const mobileSpread = computeEqualGapSpreadY(groups, row, 48);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: `top top+=${navbarOffset}`,
            end: '+=240%',
            pin: true,
            pinSpacing: true,
            scrub: 0.45,
            anticipatePin: 0,
            invalidateOnRefresh: true,
          },
        });

        if (isDesktop) {
          // Gap opens first (visible OSRB spread), suffixes start almost immediately so early scroll isn't "dead"
          tl.to(
            track,
            {
              gap: DESKTOP_WORD_GAP_PX,
              duration: 0.42,
              ease: 'none',
            },
            0,
          );

          tl.to(
            suffixes,
            {
              opacity: 1,
              maxWidth: (index: number) => suffixWidths[index],
              duration: 0.78,
              stagger: 0.05,
              ease: 'none',
            },
            0.04,
          );
        } else {
          tl.to(
            groups,
            {
              y: (i: number) => mobileSpread[i],
              duration: 0.5,
              ease: 'power2.inOut',
            },
            0,
          );

          tl.to(
            suffixes,
            {
              opacity: 1,
              maxWidth: (index: number) => suffixWidths[index],
              duration: 0.4,
              stagger: 0.1,
              ease: 'power1.out',
            },
            0.62,
          );
        }
      };

      const initAnimations = () => {
        mm.revert();
        mm.add('(min-width: 768px)', () => setupAnimation(true));
        mm.add('(max-width: 767px)', () => setupAnimation(false));
        refreshScrollTriggers();
      };

      initAnimations();

      const onLoad = () => refreshScrollTriggers();
      window.addEventListener('load', onLoad);

      if (document.fonts?.ready) {
        document.fonts.ready.then(initAnimations);
      }

      return () => {
        window.removeEventListener('load', onLoad);
        mm.revert();
        clearScrollLockStyles();
        refreshScrollTriggers();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[calc(100dvh-var(--navbar-height))] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-midnight-blue to-gray-900 px-4 sm:px-8"
      aria-label="Open Source Resume Book"
    >
      <p className="sr-only">Open Source Resume Book</p>
      <div ref={rowRef} className="flex w-full justify-center px-1">
        <div
          ref={trackRef}
          className="inline-flex max-w-full flex-col items-center md:flex-row md:items-baseline"
        >
          {WORD_GROUPS.map((word, index) => (
            <div
              key={word.letter}
              ref={(el) => {
                groupRefs.current[index] = el;
              }}
              className="inline-flex shrink-0 items-baseline whitespace-nowrap"
            >
              <span className="select-none font-bold leading-none tracking-tight text-white text-[clamp(3.5rem,18vw,9rem)] md:text-[clamp(4rem,11vw,10rem)]">
                {word.letter}
              </span>
              <span
                ref={(el) => {
                  suffixRefs.current[index] = el;
                }}
                className="pointer-events-none inline-block max-w-0 overflow-hidden align-baseline select-none font-bold leading-none text-white opacity-0 text-[clamp(1.75rem,8vw,4.5rem)] md:text-[clamp(2rem,5vw,5rem)]"
              >
                {word.suffix}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
