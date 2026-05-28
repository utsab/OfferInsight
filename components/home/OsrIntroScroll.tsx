'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { HOME_ASSETS } from './homeAssets';
import { getOsrScrollHeightVh, getScrollPhase } from './osrIntroTimeline';
import { TYPING_DESCRIPTIONS, getOsrSceneConfig } from './osrScrollUtils';
import { TypingHeroLine } from './TypingHeroLine';
import { MetaPersonalBarSection } from './MetaPersonalBarSection';
import { MicrosoftPersonalBarSection } from './MicrosoftPersonalBarSection';
import { WhoopPersonalBarSection } from './WhoopPersonalBarSection';

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
  ScrollTrigger.create({
    trigger,
    start: () => {
      const { startPx } = getOsrSceneConfig(offsetVh, durationPercent, scrub);
      return `top+=${startPx} top`;
    },
    end: () => {
      const { startPx, durationPx } = getOsrSceneConfig(offsetVh, durationPercent, scrub);
      return `top+=${startPx + durationPx} top`;
    },
    scrub: typeof scrub === 'number' ? scrub : false,
    animation,
    invalidateOnRefresh: true,
  });
}

const SCRUB_DEFAULTS = { ease: 'none' as const, immediateRender: false };

const COMPACT_MODE_WIDTH_THRESHOLD_PX = 1278;
const STAGE_BASE_WIDTH = 1920;
const STAGE_BASE_HEIGHT = 1080;
const STAGE_WIDTH_OFFSET_PX = 2;
const SCALE_BUCKET_MIN_WIDTHS = [638, 852, 1278, 1918, 2558, 3838] as const;

function applyIntroStartFrame(
  sectionZero: HTMLElement,
  sectionOne: HTMLElement,
  sectionTwo: HTMLElement,
  whoWeAreContent: HTMLElement,
  sectionWhoopPersonalBar: HTMLElement,
  sectionMicrosoftPersonalBar: HTMLElement,
  sectionMetaPersonalBar: HTMLElement,
  sectionAffiliations: HTMLElement,
  pageIndicator: HTMLElement,
) {
  gsap.set(sectionZero, { opacity: 1 });
  gsap.set(sectionOne, { opacity: 0 });
  gsap.set(sectionTwo, { opacity: 0 });
  gsap.set(whoWeAreContent, { opacity: 0 });
  gsap.set(sectionWhoopPersonalBar, { opacity: 0 });
  gsap.set(sectionMicrosoftPersonalBar, { opacity: 0 });
  gsap.set(sectionMetaPersonalBar, { opacity: 0 });
  gsap.set(sectionAffiliations, { opacity: 0 });
  gsap.set(pageIndicator, { opacity: 1, top: '90%', yPercent: 0 });
}

function readIsCompactViewport() {
  if (typeof window === 'undefined') return false;
  return window.outerWidth < COMPACT_MODE_WIDTH_THRESHOLD_PX;
}

function getScaleBucket(width: number) {
  let bucket = 0;
  for (let i = 0; i < SCALE_BUCKET_MIN_WIDTHS.length; i += 1) {
    if (width >= SCALE_BUCKET_MIN_WIDTHS[i]) bucket = i;
  }
  return bucket;
}

export function OsrIntroScroll() {
  const introRootRef = useRef<HTMLDivElement>(null);
  const [scrollHeightVh, setScrollHeightVh] = useState(() => getOsrScrollHeightVh(false));
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [stageScale, setStageScale] = useState(1);
  const [useFixedStage, setUseFixedStage] = useState(true);
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
  const sectionWhoopPersonalBarRef = useRef<HTMLElement>(null);
  const whoopPersonalBarBgLogoRef = useRef<HTMLDivElement>(null);
  const whoopPersonalBarContentRef = useRef<HTMLDivElement>(null);
  const sectionMicrosoftPersonalBarRef = useRef<HTMLElement>(null);
  const microsoftPersonalBarBgLogoRef = useRef<HTMLDivElement>(null);
  const microsoftPersonalBarContentRef = useRef<HTMLDivElement>(null);
  const sectionMetaPersonalBarRef = useRef<HTMLElement>(null);
  const metaPersonalBarBgLogoRef = useRef<HTMLDivElement>(null);
  const metaPersonalBarContentRef = useRef<HTMLDivElement>(null);
  const sectionAffiliationsRef = useRef<HTMLElement>(null);
  const logoRefs = useRef<(HTMLImageElement | null)[]>([]);
  const lastViewportModeRef = useRef<{ compact: boolean; scaleBucket: number } | null>(null);

  useEffect(() => {
    let reloadTimer: ReturnType<typeof setTimeout> | undefined;
    const computeViewportMode = () => {
      const compact = readIsCompactViewport();
      const width = window.outerWidth;
      const scaleBucket = getScaleBucket(width);

      const last = lastViewportModeRef.current;
      if (last) {
        const crossedModeThreshold = last.compact !== compact;
        const crossedScaleThreshold = !compact && !last.compact && last.scaleBucket !== scaleBucket;
        if (crossedModeThreshold || crossedScaleThreshold) {
          if (reloadTimer) clearTimeout(reloadTimer);
          reloadTimer = setTimeout(() => {
            window.scrollTo(0, 0);
            window.location.reload();
          }, 60);
          return;
        }
      }

      lastViewportModeRef.current = { compact, scaleBucket };
      setIsCompactViewport(compact);
      setUseFixedStage(!compact);
      if (compact) {
        setStageScale(1);
        return;
      }

      setStageScale(Math.max((width - STAGE_WIDTH_OFFSET_PX) / (STAGE_BASE_WIDTH - STAGE_WIDTH_OFFSET_PX), 0.3334));
    };

    computeViewportMode();
    window.addEventListener('resize', computeViewportMode);
    return () => {
      window.removeEventListener('resize', computeViewportMode);
      if (reloadTimer) clearTimeout(reloadTimer);
    };
  }, []);

  useGSAP(
    () => {
      const introRoot = introRootRef.current;
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
      const sectionWhoopPersonalBar = sectionWhoopPersonalBarRef.current;
      const whoopPersonalBarBgLogo = whoopPersonalBarBgLogoRef.current;
      const whoopPersonalBarContent = whoopPersonalBarContentRef.current;
      const sectionMicrosoftPersonalBar = sectionMicrosoftPersonalBarRef.current;
      const microsoftPersonalBarBgLogo = microsoftPersonalBarBgLogoRef.current;
      const microsoftPersonalBarContent = microsoftPersonalBarContentRef.current;
      const sectionMetaPersonalBar = sectionMetaPersonalBarRef.current;
      const metaPersonalBarBgLogo = metaPersonalBarBgLogoRef.current;
      const metaPersonalBarContent = metaPersonalBarContentRef.current;
      const sectionAffiliations = sectionAffiliationsRef.current;
      const logos = logoRefs.current.filter(Boolean) as HTMLImageElement[];

      if (
        !introRoot ||
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
        !howLetterR ||
        !sectionWhoopPersonalBar ||
        !whoopPersonalBarBgLogo ||
        !whoopPersonalBarContent ||
        !sectionMicrosoftPersonalBar ||
        !microsoftPersonalBarBgLogo ||
        !microsoftPersonalBarContent ||
        !sectionMetaPersonalBar ||
        !metaPersonalBarBgLogo ||
        !metaPersonalBarContent ||
        !sectionAffiliations
      ) {
        return undefined;
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const scheduleLayoutSync = () => {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh(true);
        });
      };

      if (reducedMotion) {
        gsap.set(sectionZero, { opacity: 0 });
        gsap.set(sectionOne, { opacity: 1 });
        gsap.set(whoWeAreContent, { opacity: 1 });
        gsap.set(sectionTwo, { opacity: 0 });
        gsap.set(sectionWhoopPersonalBar, { opacity: 0 });
        gsap.set(sectionMicrosoftPersonalBar, { opacity: 0 });
        gsap.set(sectionMetaPersonalBar, { opacity: 1 });
        gsap.set(whoopPersonalBarBgLogo, { opacity: 0 });
        gsap.set(microsoftPersonalBarBgLogo, { opacity: 0 });
        gsap.set(metaPersonalBarBgLogo, { opacity: 0.5 });
        gsap.set(whoopPersonalBarContent, { y: 0 });
        gsap.set(microsoftPersonalBarContent, { y: 0 });
        gsap.set(metaPersonalBarContent, { y: 0 });
        gsap.set(sectionAffiliations, { opacity: 1 });
        if (logos.length === HOME_ASSETS.affiliations.length) {
          gsap.set(logos, { opacity: 1, y: 0, scale: 1 });
        }
        gsap.set(pageIndicator, { opacity: 0 });
        return;
      }

      const ctx = gsap.context(() => {
        const buildScenes = (compactMode: boolean) => {
          const heightVh = getOsrScrollHeightVh(compactMode);
          scrollTrack.style.height = `${heightVh * 100}vh`;
          setScrollHeightVh(heightVh);
          applyIntroStartFrame(
            sectionZero,
            sectionOne,
            sectionTwo,
            whoWeAreContent,
            sectionWhoopPersonalBar,
            sectionMicrosoftPersonalBar,
            sectionMetaPersonalBar,
            sectionAffiliations,
            pageIndicator,
          );
          gsap.set(whoopPersonalBarBgLogo, { opacity: 0, scale: 0.88 });
          gsap.set(microsoftPersonalBarBgLogo, { opacity: 0, scale: 0.88 });
          gsap.set(metaPersonalBarBgLogo, { opacity: 0, scale: 0.88 });
          gsap.set(whoopPersonalBarContent, { y: '140vh' });
          gsap.set(microsoftPersonalBarContent, { y: '140vh' });
          gsap.set(metaPersonalBarContent, { y: '140vh' });
          if (logos.length === HOME_ASSETS.affiliations.length) {
            gsap.set(logos, {
              opacity: 0,
              y: 26,
              scale: (i: number) => HOME_ASSETS.affiliations[i].scale * 0.92,
            });
          }
          const typingFadeOut = getScrollPhase('typingFadeOut', compactMode);
          const pageIndicatorPhase = getScrollPhase('pageIndicator', compactMode);
          const whoSectionIn = getScrollPhase('whoSectionIn', compactMode);
          const whoLettersMove = getScrollPhase('whoLettersMove', compactMode);
          const whoContentIn = getScrollPhase('whoContentIn', compactMode);
          const whoSectionOut = getScrollPhase('whoSectionOut', compactMode);
          const howSectionIn = getScrollPhase('howSectionIn', compactMode);
          const howLettersMove = getScrollPhase('howLettersMove', compactMode);
          const howSectionOut = getScrollPhase('howSectionOut', compactMode);
          const whoopPersonalBarScroll = getScrollPhase('whoopPersonalBarScroll', compactMode);
          const whoopToMicrosoft = getScrollPhase('whoopToMicrosoft', compactMode);
          const microsoftPersonalBarScroll = getScrollPhase('microsoftPersonalBarScroll', compactMode);
          const microsoftToMeta = getScrollPhase('microsoftToMeta', compactMode);
          const metaPersonalBarScroll = getScrollPhase('metaPersonalBarScroll', compactMode);
          const metaToAffiliations = getScrollPhase('metaToAffiliations', compactMode);
          const affiliationsLogos = getScrollPhase('affiliationsLogos', compactMode);

          attachScene(
          scrollTrack,
          typingFadeOut.at,
          typingFadeOut.durationPercent,
          gsap.fromTo(
            sectionZero,
            { opacity: 1 },
            { opacity: 0, ...SCRUB_DEFAULTS },
          ),
        );

        attachScene(
          scrollTrack,
          pageIndicatorPhase.at,
          pageIndicatorPhase.durationPercent,
          gsap.to(pageIndicator, { top: '-50%', ...SCRUB_DEFAULTS }),
        );

        attachScene(
          scrollTrack,
          whoSectionIn.at,
          whoSectionIn.durationPercent,
          gsap.fromTo(
            sectionOne,
            { opacity: 0 },
            { opacity: 1, ...SCRUB_DEFAULTS },
          ),
        );

        if (compactMode) {
          attachScene(
            scrollTrack,
            whoLettersMove.at,
            whoLettersMove.durationPercent,
            gsap
              .timeline({ defaults: { ease: 'power2.in' } })
              .to(whoLetterO, { left: '140%', top: '-27%' }, 0)
              .to(whoLetterS, { bottom: '-10%', left: '-30%' }, 0)
              .to(whoLetterR, { bottom: '4%', right: '-25%' }, 0),
          );
        } else {
          attachScene(
            scrollTrack,
            whoLettersMove.at,
            whoLettersMove.durationPercent,
            gsap
              .timeline({ defaults: { ease: 'power2.in' } })
              .to(whoLetterO, { left: '100%', top: '-140%' }, 0)
              .to(whoLetterS, { bottom: '-75%', left: '30%' }, 0)
              .to(whoLetterR, { bottom: '-40%', right: '-26%' }, 0),
          );
        }

        attachScene(
          scrollTrack,
          whoContentIn.at,
          whoContentIn.durationPercent,
          gsap.to(whoWeAreContent, { opacity: 1, ...SCRUB_DEFAULTS }),
        );

        attachScene(
          scrollTrack,
          whoSectionOut.at,
          whoSectionOut.durationPercent,
          gsap.to(sectionOne, { opacity: 0, ...SCRUB_DEFAULTS }),
        );

        attachScene(
          scrollTrack,
          howSectionIn.at,
          howSectionIn.durationPercent,
          gsap.to(sectionTwo, { opacity: 1, ...SCRUB_DEFAULTS }),
        );

        if (compactMode) {
          attachScene(
            scrollTrack,
            howLettersMove.at,
            howLettersMove.durationPercent,
            gsap
              .timeline()
              .to(howLetterO, { top: '15%', left: '-12%' }, 0)
              .to(howLetterR, { bottom: '0%', right: '30%' }, 0)
              .to(howLetterS, { right: '15%', top: '0%' }, 0),
          );
        } else {
          attachScene(
            scrollTrack,
            howLettersMove.at,
            howLettersMove.durationPercent,
            gsap
              .timeline({ defaults: { ease: 'power2.in' } })
              .to(howLetterO, { top: '-20%', left: '-8%' }, 0)
              .to(howLetterR, { bottom: '-35%', right: '30%' }, 0)
              .to(howLetterS, { right: '22%', top: '-15%' }, 0),
          );
        }

        attachScene(
          scrollTrack,
          howSectionOut.at,
          howSectionOut.durationPercent,
          gsap.to(sectionTwo, { opacity: 0, ...SCRUB_DEFAULTS }),
        );

        attachScene(
          scrollTrack,
          whoopPersonalBarScroll.at,
          whoopPersonalBarScroll.durationPercent,
          gsap
            .timeline({ defaults: { ease: 'none' } })
            .to(sectionWhoopPersonalBar, { opacity: 1, ...SCRUB_DEFAULTS }, 0)
            .to(whoopPersonalBarContent, { y: '-135vh', ease: 'none', duration: 1 }, 0)
            .to(
              whoopPersonalBarBgLogo,
              { opacity: 1, scale: 1, ease: 'none', duration: 0.55 },
              0,
            ),
        );

        attachScene(
          scrollTrack,
          whoopToMicrosoft.at,
          whoopToMicrosoft.durationPercent,
          gsap
            .timeline({ defaults: { ease: 'none' } })
            .to(sectionWhoopPersonalBar, { opacity: 0, ...SCRUB_DEFAULTS }, 0)
            .to(sectionMicrosoftPersonalBar, { opacity: 1, ...SCRUB_DEFAULTS }, 0),
        );

        attachScene(
          scrollTrack,
          microsoftPersonalBarScroll.at,
          microsoftPersonalBarScroll.durationPercent,
          gsap
            .timeline({ defaults: { ease: 'none' } })
            .to(microsoftPersonalBarContent, { y: '-185vh', ease: 'none', duration: 1 }, 0)
            .to(
              microsoftPersonalBarBgLogo,
              { opacity: 1, scale: 1, ease: 'none', duration: 0.55 },
              0,
            ),
        );

        attachScene(
          scrollTrack,
          microsoftToMeta.at,
          microsoftToMeta.durationPercent,
          gsap
            .timeline({ defaults: { ease: 'none' } })
            .to(sectionMicrosoftPersonalBar, { opacity: 0, ...SCRUB_DEFAULTS }, 0)
            .to(sectionMetaPersonalBar, { opacity: 1, ...SCRUB_DEFAULTS }, 0),
        );

        attachScene(
          scrollTrack,
          metaPersonalBarScroll.at,
          metaPersonalBarScroll.durationPercent,
          gsap
            .timeline({ defaults: { ease: 'none' } })
            .to(metaPersonalBarContent, { y: '-185vh', ease: 'none', duration: 1 }, 0)
            .to(
              metaPersonalBarBgLogo,
              { opacity: 1, scale: 1, ease: 'none', duration: 0.55 },
              0,
            ),
        );

        attachScene(
          scrollTrack,
          metaToAffiliations.at,
          metaToAffiliations.durationPercent,
          gsap
            .timeline({ defaults: { ease: 'none' } })
            .to(sectionMetaPersonalBar, { opacity: 0, ...SCRUB_DEFAULTS }, 0)
            .to(sectionAffiliations, { opacity: 1, ...SCRUB_DEFAULTS }, 0)
            .to(pageIndicator, { opacity: 0, ...SCRUB_DEFAULTS }, 0),
        );

        let affiliationsLogosAttached = false;
        const attachAffiliationLogos = () => {
          if (affiliationsLogosAttached) return true;
          const readyLogos = logoRefs.current.filter(Boolean) as HTMLImageElement[];
          if (readyLogos.length !== HOME_ASSETS.affiliations.length) return false;

          affiliationsLogosAttached = true;
          attachScene(
            scrollTrack,
            affiliationsLogos.at,
            affiliationsLogos.durationPercent,
            gsap.to(readyLogos, {
              opacity: 1,
              y: 0,
              scale: (i: number) => HOME_ASSETS.affiliations[i].scale,
              duration: 1,
              stagger: 0.08,
              ...SCRUB_DEFAULTS,
            }),
          );
          return true;
        };

          if (!attachAffiliationLogos()) {
            let attempts = 0;
            const retryLogos = () => {
              if (attachAffiliationLogos()) {
                scheduleLayoutSync();
                return;
              }
              if (attempts++ > 24) {
                scheduleLayoutSync();
                return;
              }
              requestAnimationFrame(retryLogos);
            };
            requestAnimationFrame(retryLogos);
          } else {
            scheduleLayoutSync();
          }
        };

        buildScenes(isCompactViewport);
      }, introRoot);

      window.scrollTo(0, 0);
      scheduleLayoutSync();
      window.addEventListener('load', scheduleLayoutSync);
      document.fonts?.ready.then(scheduleLayoutSync);

      let resizeTimer: ReturnType<typeof setTimeout> | undefined;
      const onWindowResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(scheduleLayoutSync, 120);
      };
      window.addEventListener('resize', onWindowResize);

      return () => {
        window.removeEventListener('load', scheduleLayoutSync);
        window.removeEventListener('resize', onWindowResize);
        if (resizeTimer) clearTimeout(resizeTimer);
        ctx.revert();
        ScrollTrigger.clearScrollMemory();
      };
    },
    { scope: introRootRef, dependencies: [isCompactViewport] },
  );

  const sectionShell = useFixedStage
    ? 'pointer-events-none fixed left-1/2 z-10 flex items-center justify-center overflow-hidden bg-white'
    : 'pointer-events-none fixed left-0 right-0 top-[var(--navbar-height)] z-10 flex h-[calc(100dvh-var(--navbar-height))] items-center justify-center overflow-hidden bg-white';
  const sectionShellStyle = useFixedStage
    ? ({
        top: 'calc(var(--navbar-height) + (100dvh - var(--navbar-height)) / 2)',
        width: `${STAGE_BASE_WIDTH}px`,
        height: `${STAGE_BASE_HEIGHT}px`,
        transform: `translate(-50%, -50%) scale(${stageScale})`,
        transformOrigin: 'center center',
      } as const)
    : undefined;

  const letterBase =
    'pointer-events-none absolute select-none font-bold leading-none font-[Montserrat,sans-serif] text-[clamp(5rem,22vw,14rem)] md:text-[clamp(7rem,22em,22rem)]';

  return (
    <div ref={introRootRef} className="relative w-full bg-white">
      {/* Tall scroll track — phase timings live in osrIntroTimeline.ts */}
      <div
        ref={scrollTrackRef}
        className="relative w-full"
        style={{ height: `${scrollHeightVh * 100}vh` }}
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
        className={`${sectionShell} z-[7]`}
        style={sectionShellStyle}
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
        className={`${sectionShell} z-10 overflow-hidden opacity-0`}
        style={sectionShellStyle}
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
            className="text-sm font-extrabold uppercase tracking-wide text-black md:text-xl"
          >
            Who we are
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-800 md:text-4xl">
            We are a pathway for entry-level SWEs to become valuable contributors to the tech
            industry by making deep contributions to open source.
          </p>
        </div>
      </section>

      {/* Phase 3 — how it works vignette */}
      <section
        ref={sectionTwoRef}
        id="intro-two"
        className={`${sectionShell} z-[19] overflow-hidden opacity-0`}
        style={sectionShellStyle}
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
            className="text-sm font-extrabold uppercase tracking-wide text-black md:text-xl"
          >
            How it works
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-800 md:text-4xl">
            SWE Hiring Managers define their dream candidate in terms of measurable open source
            achievements. Their personal bar becomes an actionable pathway for junior devs.
          </p>
        </div>
      </section>

      <WhoopPersonalBarSection
        sectionShell={sectionShell}
        sectionStyle={sectionShellStyle}
        compactLayout={!useFixedStage}
        refs={{
          section: sectionWhoopPersonalBarRef,
          bgLogo: whoopPersonalBarBgLogoRef,
          content: whoopPersonalBarContentRef,
        }}
      />

      <MicrosoftPersonalBarSection
        sectionShell={sectionShell}
        sectionStyle={sectionShellStyle}
        compactLayout={!useFixedStage}
        refs={{
          section: sectionMicrosoftPersonalBarRef,
          bgLogo: microsoftPersonalBarBgLogoRef,
          content: microsoftPersonalBarContentRef,
        }}
      />

      <MetaPersonalBarSection
        sectionShell={sectionShell}
        sectionStyle={sectionShellStyle}
        compactLayout={!useFixedStage}
        refs={{
          section: sectionMetaPersonalBarRef,
          bgLogo: metaPersonalBarBgLogoRef,
          content: metaPersonalBarContentRef,
        }}
      />

      {/* Phase 7 — hiring manager affiliations (same fixed viewport as intro) */}
      <section
        ref={sectionAffiliationsRef}
        id="intro-affiliations"
        className={`${sectionShell} z-[21] overflow-hidden opacity-0`}
        style={sectionShellStyle}
        aria-labelledby="affiliations-heading"
      >
        <div className="relative z-[2] flex w-full items-center justify-center px-4 sm:px-8">
          <div className="w-full max-w-6xl text-center">
            <h2
              id="affiliations-heading"
              className="mb-4 text-3xl font-bold tracking-tight text-black sm:text-4xl md:text-5xl"
            >
              Hiring Manager Affiliations
            </h2>
            <p className="mx-auto mb-3 max-w-5xl text-base leading-relaxed text-gray-800 sm:text-lg md:text-xl">
              Participating managers at these companies commit to interview candidates who meet their
              defined open-source benchmarks.
            </p>
            <p className="mx-auto mb-9 max-w-4xl text-sm text-gray-600 sm:text-base">
              Standards are manager-defined and do not represent official company policy.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-5">
              {HOME_ASSETS.affiliations.map((logo, index) => (
                <div
                  key={logo.path}
                  className="flex h-[78px] items-center justify-center rounded-xl border border-light-steel-blue/35 bg-white/95 p-3 shadow-lg sm:h-[92px] sm:p-4"
                >
                  <img
                    ref={(el) => {
                      logoRefs.current[index] = el;
                    }}
                    src={logo.path}
                    alt={`${logo.label} logo`}
                    className="max-h-full max-w-full origin-center object-contain"
                    style={{
                      transform: `scale(${logo.scale})`,
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-6 text-xl font-semibold italic tracking-wide text-gray-800 sm:mt-7 sm:text-2xl">
              and more...
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
