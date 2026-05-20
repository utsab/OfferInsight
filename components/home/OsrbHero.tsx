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

/** Full rendered word width (letter + suffix); suffix is absolutely positioned. */
function measureWordWidth(group: HTMLDivElement): number {
  const letter = group.firstElementChild as HTMLElement | null;
  const suffix = group.lastElementChild as HTMLElement | null;
  if (!letter || !suffix) return group.getBoundingClientRect().width;
  return letter.getBoundingClientRect().width + suffix.getBoundingClientRect().width;
}

function measureWordHeight(group: HTMLDivElement): number {
  const letter = group.firstElementChild as HTMLElement | null;
  const suffix = group.lastElementChild as HTMLElement | null;
  if (!letter || !suffix) return group.getBoundingClientRect().height;
  return Math.max(letter.getBoundingClientRect().height, suffix.getBoundingClientRect().height);
}

/**
 * Positions word groups so the gap after each full word (e.g. n→S, e→R, e→B) is equal.
 * Returns GSAP x offsets from the clustered flex layout.
 */
function computeEqualGapSpreadX(
  groups: HTMLDivElement[],
  row: HTMLDivElement,
  horizontalPadding: number,
): number[] {
  const wordWidths = groups.map(measureWordWidth);
  const available = row.clientWidth - horizontalPadding;
  const sumWords = wordWidths.reduce((sum, w) => sum + w, 0);

  let gap = (available - sumWords) / 3;
  const minGap = 16;
  const maxGap = 80;
  gap = Math.max(minGap, Math.min(maxGap, gap));
  if (sumWords + 3 * gap > available) {
    gap = Math.max(minGap, (available - sumWords) / 3);
  }

  const totalSpan = sumWords + 3 * gap;
  let cursor = (row.clientWidth - totalSpan) / 2;

  const targetLefts = wordWidths.map((width) => {
    const left = cursor;
    cursor += width + gap;
    return left;
  });

  const naturalLefts = groups.map((group) => group.offsetLeft);
  return groups.map((_, index) => targetLefts[index] - naturalLefts[index]);
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
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const suffixRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const row = rowRef.current;
      if (!section || !row) return;

      const groups = groupRefs.current.filter(Boolean) as HTMLDivElement[];
      const suffixes = suffixRefs.current.filter(Boolean) as HTMLSpanElement[];
      if (groups.length !== 4 || suffixes.length !== 4) return;

      clearScrollLockStyles();

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reducedMotion) {
        gsap.set(suffixes, { opacity: 1 });
        gsap.set(groups, { clearProps: 'transform' });
        row.classList.remove('gap-0', 'md:gap-0');
        row.classList.add('gap-6', 'md:gap-16');
        return;
      }

      const mm = gsap.matchMedia();

      const setupAnimation = (isDesktop: boolean) => {
        gsap.set(groups, { x: 0, y: 0 });
        gsap.set(suffixes, { opacity: 0 });

        const navbarOffset = getNavbarHeightPx();
        const desktopSpread = computeEqualGapSpreadX(groups, row, 48);
        const mobileSpread = computeEqualGapSpreadY(groups, row, 48);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: `top top+=${navbarOffset}`,
            end: '+=240%',
            pin: true,
            pinSpacing: true,
            scrub: 0.8,
            anticipatePin: 0,
            invalidateOnRefresh: true,
          },
        });

        if (isDesktop) {
          tl.to(
            groups,
            {
              x: (i: number) => desktopSpread[i],
              duration: 0.5,
              ease: 'power2.inOut',
            },
            0,
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
        }

        tl.to(
          suffixes,
          {
            opacity: 1,
            duration: 0.4,
            stagger: 0.1,
            ease: 'power1.out',
          },
          0.62,
        );
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
      <div
        ref={rowRef}
        className="relative flex w-full flex-col items-center justify-center gap-0 md:flex-row md:gap-0"
      >
        {WORD_GROUPS.map((word, index) => (
          <div
            key={word.letter}
            ref={(el) => {
              groupRefs.current[index] = el;
            }}
            className="relative inline-flex items-baseline whitespace-nowrap will-change-transform"
          >
            <span className="select-none font-bold leading-none tracking-tight text-white text-[clamp(3.5rem,18vw,9rem)] md:text-[clamp(4rem,11vw,10rem)]">
              {word.letter}
            </span>
            <span
              ref={(el) => {
                suffixRefs.current[index] = el;
              }}
              className="pointer-events-none absolute left-full bottom-0 select-none font-bold leading-none text-white opacity-0 text-[clamp(1.75rem,8vw,4.5rem)] md:text-[clamp(2rem,5vw,5rem)]"
            >
              {word.suffix}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
