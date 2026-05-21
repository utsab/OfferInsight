'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  OSR_SCROLL_HEIGHT_VH,
  TYPING_DESCRIPTIONS,
  getOsrSceneConfig,
} from './osrScrollUtils';
import { TypingHeroLine } from './TypingHeroLine';

gsap.registerPlugin(ScrollTrigger);

const ACCENT_CORAL = '#F57360';
const ACCENT_TEAL = '#58A4B0';

function attachScene(
  trigger: Element,
  offsetVh: number,
  durationPercent: number,
  animation: gsap.core.Animation,
  scrub: number | false = 0.45,
) {
  const { startPx, durationPx, scrub: sceneScrub } = getOsrSceneConfig(
    offsetVh,
    durationPercent,
    scrub,
  );

  ScrollTrigger.create({
    trigger,
    start: `top+=${startPx} top`,
    end: `+=${durationPx}`,
    scrub: sceneScrub,
    animation,
    invalidateOnRefresh: true,
  });
}

export function OsrIntroScroll() {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const sectionZeroRef = useRef<HTMLElement>(null);
  const sectionOneRef = useRef<HTMLElement>(null);
  const sectionTwoRef = useRef<HTMLElement>(null);
  const whoWeAreContentRef = useRef<HTMLDivElement>(null);
  const pageIndicatorRef = useRef<HTMLDivElement>(null);
  const whoLetterORef = useRef<HTMLDivElement>(null);
  const whoLetterSRef = useRef<HTMLDivElement>(null);
  const whoLetterRRef = useRef<HTMLDivElement>(null);
  const howLetterORef = useRef<HTMLDivElement>(null);
  const howLetterSRef = useRef<HTMLDivElement>(null);
  const howLetterRRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scrollTrack = scrollTrackRef.current;
      const sectionZero = sectionZeroRef.current;
      const sectionOne = sectionOneRef.current;
      const sectionTwo = sectionTwoRef.current;
      const whoWeAreContent = whoWeAreContentRef.current;
      const pageIndicator = pageIndicatorRef.current;
      const whoLetterO = whoLetterORef.current;
      const whoLetterS = whoLetterSRef.current;
      const whoLetterR = whoLetterRRef.current;
      const howLetterO = howLetterORef.current;
      const howLetterS = howLetterSRef.current;
      const howLetterR = howLetterRRef.current;

      if (
        !scrollTrack ||
        !sectionZero ||
        !sectionOne ||
        !sectionTwo ||
        !whoWeAreContent ||
        !pageIndicator ||
        !whoLetterO ||
        !whoLetterS ||
        !whoLetterR ||
        !howLetterO ||
        !howLetterS ||
        !howLetterR
      ) {
        return;
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.matchMedia('(max-width: 767px)').matches;

      if (reducedMotion) {
        gsap.set(sectionZero, { opacity: 0 });
        gsap.set(sectionOne, { opacity: 1 });
        gsap.set(whoWeAreContent, { opacity: 1 });
        gsap.set(sectionTwo, { opacity: 0 });
        gsap.set(pageIndicator, { opacity: 0 });
        return;
      }

      gsap.set(sectionZero, { opacity: 1 });
      gsap.set(sectionOne, { opacity: 0 });
      gsap.set(whoWeAreContent, { opacity: 0 });
      gsap.set(sectionTwo, { opacity: 0 });
      gsap.set(pageIndicator, { top: '90%', yPercent: 0 });

      const ctx = gsap.context(() => {
        attachScene(
          scrollTrack,
          0,
          isMobile ? 20 : 40,
          gsap.to(sectionZero, { opacity: 0, ease: 'none' }),
        );

        attachScene(
          scrollTrack,
          0,
          520,
          gsap.to(pageIndicator, { top: '-50%', ease: 'none' }),
        );

        attachScene(
          scrollTrack,
          isMobile ? 0.4 : 1.0,
          isMobile ? 20 : 50,
          gsap.to(sectionOne, { opacity: 1, ease: 'none' }),
        );

        if (isMobile) {
          attachScene(
            scrollTrack,
            0.5,
            30,
            gsap
              .timeline({ defaults: { ease: 'power2.in' } })
              .to(whoLetterO, { left: '140%', top: '-27%' }, 0)
              .to(whoLetterS, { bottom: '-10%', left: '-30%' }, 0)
              .to(whoLetterR, { bottom: '4%', right: '-25%' }, 0),
          );
        } else {
          attachScene(
            scrollTrack,
            1.2,
            170,
            gsap
              .timeline({ defaults: { ease: 'power2.in' } })
              .to(whoLetterO, { left: '100%', top: '-140%' }, 0)
              .to(whoLetterS, { bottom: '-75%', left: '30%' }, 0)
              .to(whoLetterR, { bottom: '-40%', right: '-26%' }, 0),
          );
        }

        attachScene(
          scrollTrack,
          isMobile ? 0.8 : 2.6,
          isMobile ? 20 : 40,
          gsap.to(whoWeAreContent, { opacity: 1, ease: 'none' }),
        );

        attachScene(scrollTrack, 4.1, 40, gsap.to(sectionOne, { opacity: 0, ease: 'none' }));

        attachScene(scrollTrack, 4.6, 30, gsap.to(sectionTwo, { opacity: 1, ease: 'none' }));

        if (isMobile) {
          attachScene(
            scrollTrack,
            4.9,
            80,
            gsap
              .timeline()
              .to(howLetterO, { top: '15%', left: '-12%' }, 0)
              .to(howLetterR, { bottom: '0%', right: '30%' }, 0)
              .to(howLetterS, { right: '15%', top: '0%' }, 0),
          );
        } else {
          attachScene(
            scrollTrack,
            4.9,
            80,
            gsap
              .timeline({ defaults: { ease: 'power2.in' } })
              .to(howLetterO, { top: '-20%', left: '-8%' }, 0)
              .to(howLetterR, { bottom: '-35%', right: '30%' }, 0)
              .to(howLetterS, { right: '22%', top: '-15%' }, 0),
          );
        }

        attachScene(scrollTrack, 5.7, 30, gsap.to(sectionTwo, { opacity: 0, ease: 'none' }));
      }, scrollTrack);

      const refresh = () => {
        requestAnimationFrame(() => ScrollTrigger.refresh(false));
      };

      refresh();
      window.addEventListener('load', refresh);
      document.fonts?.ready.then(refresh);

      return () => {
        window.removeEventListener('load', refresh);
        ctx.revert();
      };
    },
    { scope: scrollTrackRef },
  );

  const sectionShell =
    'pointer-events-none fixed left-0 right-0 top-[var(--navbar-height)] z-10 flex h-[calc(100dvh-var(--navbar-height))] items-center justify-center';

  const letterBase =
    'pointer-events-none absolute select-none font-bold leading-none font-[Montserrat,sans-serif] text-[clamp(5rem,22vw,14rem)] md:text-[clamp(7rem,22em,22rem)]';

  return (
    <div className="relative w-full">
      {/* Tall scroll track (6.1 × viewport) */}
      <div
        ref={scrollTrackRef}
        className="relative w-full"
        style={{ height: `${OSR_SCROLL_HEIGHT_VH * 100}vh` }}
        aria-hidden
      />

      <div
        ref={pageIndicatorRef}
        className="pointer-events-none fixed left-[20%] z-30 h-[45%] w-0.5 md:w-0.5"
        style={{ backgroundColor: ACCENT_CORAL, top: '90%' }}
        aria-hidden
      />

      {/* Phase 1 — typing hero */}
      <section
        ref={sectionZeroRef}
        id="intro-zero"
        className={`${sectionShell} z-[7] bg-gradient-to-br from-midnight-blue to-gray-900`}
        aria-label="Introduction"
      >
        <div className="w-[75%] max-w-4xl md:w-1/2">
          <p
            className="text-sm font-semibold uppercase tracking-wide md:text-xl"
            style={{ color: ACCENT_CORAL }}
          >
            Open Source Resume is{' '}
          </p>
          <TypingHeroLine
            descriptions={TYPING_DESCRIPTIONS}
            className="mt-5 min-h-[1.8em] border-b border-[#F57360] pb-5 text-xl font-semibold text-[#F57360] md:text-4xl"
          />
        </div>
      </section>

      {/* Phase 2 — big letters + who we are */}
      <section
        ref={sectionOneRef}
        id="intro-one"
        className={`${sectionShell} z-10 overflow-hidden bg-gradient-to-br from-midnight-blue to-gray-900 opacity-0`}
        aria-labelledby="intro-who-heading"
      >
        <div
          ref={whoLetterORef}
          className={`${letterBase} left-1/2 top-[30%] md:top-[-4%]`}
          style={{ color: ACCENT_CORAL }}
        >
          O
        </div>
        <div
          ref={whoLetterSRef}
          className={`${letterBase} bottom-[10%] left-[15%] md:right-[41%] md:bottom-[-5%] md:left-auto`}
          style={{ color: ACCENT_TEAL }}
        >
          S
        </div>
        <div
          ref={whoLetterRRef}
          className={`${letterBase} bottom-[10%] right-0 md:right-[2%] md:bottom-[-5%]`}
          style={{ color: ACCENT_CORAL }}
        >
          R
        </div>

        <div
          ref={whoWeAreContentRef}
          className="relative z-[2] w-[75%] max-w-3xl opacity-0 md:w-1/2"
        >
          <h2
            id="intro-who-heading"
            className="text-sm font-extrabold uppercase tracking-wide text-white md:text-xl"
          >
            Who we are
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-200 md:text-4xl">
            We are a pathway for entry-level SWEs to become valuable contributors to the tech
            industry by making deep contributions to open source.
          </p>
        </div>
      </section>

      {/* Phase 3 — how it works vignette */}
      <section
        ref={sectionTwoRef}
        id="intro-two"
        className={`${sectionShell} z-[19] overflow-hidden bg-white opacity-0`}
        aria-labelledby="intro-how-heading"
      >
        <div
          ref={howLetterORef}
          className={`${letterBase} left-[-5%] top-[20%] md:left-[-4%] md:top-[-10%]`}
          style={{ color: ACCENT_CORAL }}
        >
          O
        </div>
        <div
          ref={howLetterSRef}
          className={`${letterBase} right-[30%] top-[10%] md:top-[-8%]`}
          style={{ color: ACCENT_TEAL }}
        >
          S
        </div>
        <div
          ref={howLetterRRef}
          className={`${letterBase} bottom-[15%] right-[10%] md:bottom-[-5%]`}
          style={{ color: ACCENT_CORAL }}
        >
          R
        </div>

        <div className="relative z-[2] w-[75%] max-w-3xl md:w-1/2">
          <h2
            id="intro-how-heading"
            className="text-sm font-extrabold uppercase tracking-wide text-gray-800 md:text-xl"
          >
            How it works
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-700 md:text-4xl">
            SWE Hiring Managers define their dream candidate in terms of measurable open source
            achievements. Their personal bar becomes an actionable pathway for junior devs.
          </p>
        </div>
      </section>
    </div>
  );
}
