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

        const desktopSpread = [
          -Math.min(window.innerWidth * 0.22, 220),
          -Math.min(window.innerWidth * 0.07, 70),
          Math.min(window.innerWidth * 0.07, 70),
          Math.min(window.innerWidth * 0.22, 220),
        ];

        const mobileSpread = [
          -Math.min(window.innerHeight * 0.12, 96),
          -Math.min(window.innerHeight * 0.04, 32),
          Math.min(window.innerHeight * 0.04, 32),
          Math.min(window.innerHeight * 0.12, 96),
        ];

        const navbarOffset = getNavbarHeightPx();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: `top top+=${navbarOffset}`,
            end: '+=160%',
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
              duration: 1,
              ease: 'power2.inOut',
            },
            0,
          );
        } else {
          tl.to(
            groups,
            {
              y: (i: number) => mobileSpread[i],
              duration: 1,
              ease: 'power2.inOut',
            },
            0,
          );
        }

        tl.to(
          suffixes,
          {
            opacity: 1,
            duration: 0.45,
            stagger: 0.08,
            ease: 'power1.out',
          },
          0.55,
        );
      };

      mm.add('(min-width: 768px)', () => setupAnimation(true));
      mm.add('(max-width: 767px)', () => setupAnimation(false));

      refreshScrollTriggers();

      const onLoad = () => refreshScrollTriggers();
      window.addEventListener('load', onLoad);

      if (document.fonts?.ready) {
        document.fonts.ready.then(refreshScrollTriggers);
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
        className="flex w-full flex-col items-center justify-center gap-0 md:flex-row md:gap-0"
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
