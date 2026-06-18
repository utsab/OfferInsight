'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { HOME_ASSETS } from './homeAssets';
import { buildIntroScrollPhases, getOsrScrollHeightVh, getPageIndicatorScrollPhase } from './osrIntroTimeline';
import {
  ACTIONS_CONTENT_END_Y,
  ACTIONS_CONTENT_START_Y,
  PERSONAL_BAR_CONTENT_START_Y,
  TYPING_DESCRIPTIONS,
  getOsrSceneConfig,
  getViewportBelowNavbar,
  measurePersonalBarContentHeight,
  syncScrollTrackAnimations,
} from './osrScrollUtils';
import { TypingHeroLine } from './TypingHeroLine';
import { IntroActionsSection } from './IntroActionsSection';
import { MetaPersonalBarSection } from './MetaPersonalBarSection';
import { MicrosoftPersonalBarSection } from './MicrosoftPersonalBarSection';
import { WhoopPersonalBarSection } from './WhoopPersonalBarSection';
import { IntroScrollNav } from './IntroScrollNav';
import { computeScrollVhForAnchorTarget } from './introScrollJump';
import {
  buildIntroNavSections,
  getActiveIntroNavId,
  getIntroNavSectionProgress,
  type IntroNavSection,
} from './introScrollNav';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const ACCENT_CORAL = '#F57360';
const ACCENT_TEAL = '#58A4B0';

function attachScene(
  trigger: Element,
  offsetVh: number,
  durationPercent: number,
  animation: gsap.core.Animation,
  scrub: number | false = 0.45,
) {
  const isScrubbed = typeof scrub === 'number';
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
    scrub: isScrubbed ? scrub : false,
    toggleActions: isScrubbed ? undefined : 'play none none reverse',
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
  sectionActions: HTMLElement,
  pageIndicator?: HTMLElement | null,
) {
  gsap.set(sectionZero, { autoAlpha: 1 });
  gsap.set(sectionOne, { autoAlpha: 0 });
  gsap.set(sectionTwo, { autoAlpha: 0 });
  gsap.set(whoWeAreContent, { opacity: 0 });
  gsap.set(sectionWhoopPersonalBar, { autoAlpha: 0 });
  gsap.set(sectionMicrosoftPersonalBar, { autoAlpha: 0 });
  gsap.set(sectionMetaPersonalBar, { autoAlpha: 0 });
  gsap.set(sectionAffiliations, { autoAlpha: 0 });
  gsap.set(sectionActions, { autoAlpha: 0 });
  if (pageIndicator) {
    gsap.set(pageIndicator, { opacity: 1, top: '90%', yPercent: 0 });
  }
}

function readIsCompactViewport(width: number) {
  return width < COMPACT_MODE_WIDTH_THRESHOLD_PX;
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
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [scrollHeightVh, setScrollHeightVh] = useState(() => getOsrScrollHeightVh(false));
  const [stageScale, setStageScale] = useState(1);
  const [introNavSections, setIntroNavSections] = useState<IntroNavSection[]>([]);
  const [activeNavId, setActiveNavId] = useState('intro');
  const [activeNavProgress, setActiveNavProgress] = useState(0);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const sectionZeroRef = useRef<HTMLElement>(null);
  const sectionOneRef = useRef<HTMLElement>(null);
  const sectionTwoRef = useRef<HTMLElement>(null);
  const whoWeAreContentRef = useRef<HTMLDivElement>(null);
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
  const affiliationsContentRef = useRef<HTMLDivElement>(null);
  const sectionActionsRef = useRef<HTMLElement>(null);
  const actionsContentRef = useRef<HTMLDivElement>(null);
  const lastViewportModeRef = useRef<{ compact: boolean; scaleBucket: number } | null>(null);

  const scrollToNavSection = useCallback((section: IntroNavSection) => {
    const track = scrollTrackRef.current;
    if (!track) return;

    const anchorJump = section.anchorJump;
    if (anchorJump) {
      const anchor = document.getElementById(anchorJump.anchorId);
      if (anchor) {
        const jumpVh = computeScrollVhForAnchorTarget(
          track,
          anchor,
          anchorJump.targetFromTopVh,
          anchorJump.scrollMinVh,
          anchorJump.scrollMaxVh,
        );
        const { startPx } = getOsrSceneConfig(jumpVh, 0, false);
        window.scrollTo({ top: track.offsetTop + startPx, behavior: 'smooth' });
        return;
      }
    }

    const { startPx } = getOsrSceneConfig(section.jumpVh, 0, false);
    window.scrollTo({ top: track.offsetTop + startPx, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const track = scrollTrackRef.current;
    if (!track || introNavSections.length === 0) return;

    const updateActive = () => {
      const vh = getViewportBelowNavbar();
      const relativePx = Math.max(window.scrollY - track.offsetTop, 0);
      const relativeVh = relativePx / vh;
      const activeId = getActiveIntroNavId(introNavSections, relativeVh);
      setActiveNavId(activeId);
      setActiveNavProgress(getIntroNavSectionProgress(introNavSections, relativeVh, activeId));
    };

    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    ScrollTrigger.addEventListener('refresh', updateActive);
    return () => {
      window.removeEventListener('scroll', updateActive);
      ScrollTrigger.removeEventListener('refresh', updateActive);
    };
  }, [introNavSections]);

  useEffect(() => {
    const previousOverscroll = document.documentElement.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = 'none';
    return () => {
      document.documentElement.style.overscrollBehaviorY = previousOverscroll;
    };
  }, []);

  useEffect(() => {
    let reloadTimer: ReturnType<typeof setTimeout> | undefined;
    const computeViewportMode = () => {
      const width = window.outerWidth;
      const isCompact = readIsCompactViewport(width);
      const scaleBucket = getScaleBucket(width);

      const last = lastViewportModeRef.current;
      if (last) {
        const crossedModeThreshold = last.compact !== isCompact;
        const crossedScaleThreshold = !isCompact && !last.compact && last.scaleBucket !== scaleBucket;
        if (crossedModeThreshold || crossedScaleThreshold) {
          if (reloadTimer) clearTimeout(reloadTimer);
          reloadTimer = setTimeout(() => {
            window.scrollTo(0, 0);
            window.location.reload();
          }, 60);
          return;
        }
      }

      lastViewportModeRef.current = { compact: isCompact, scaleBucket };
      setIsCompactViewport(isCompact);
      if (isCompact) {
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
      const previousScrollRestoration =
        'scrollRestoration' in window.history ? window.history.scrollRestoration : null;
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      ScrollTrigger.clearScrollMemory();
      window.scrollTo(0, 0);

      const introRoot = introRootRef.current;
      const scrollTrack = scrollTrackRef.current;
      const sectionZero = sectionZeroRef.current;
      const sectionOne = sectionOneRef.current;
      const sectionTwo = sectionTwoRef.current;
      const whoWeAreContent = whoWeAreContentRef.current;
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
      const affiliationsContent = affiliationsContentRef.current;
      const sectionActions = sectionActionsRef.current;
      const actionsContent = actionsContentRef.current;

      if (
        !introRoot ||
        !scrollTrack ||
        !sectionZero ||
        !sectionOne ||
        !sectionTwo ||
        !whoWeAreContent ||
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
        !sectionAffiliations ||
        !affiliationsContent ||
        !sectionActions ||
        !actionsContent
      ) {
        return undefined;
      }

      const pageIndicator = introRoot.querySelector<HTMLElement>('[data-page-indicator]');

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
        gsap.set(sectionAffiliations, { opacity: 0 });
        gsap.set(affiliationsContent, { y: 0 });
        gsap.set(sectionActions, { opacity: 1 });
        gsap.set(actionsContent, { y: 0 });
        if (pageIndicator) gsap.set(pageIndicator, { opacity: 0 });
        return;
      }

      let removeTopScrubSyncListener: (() => void) | undefined;
      const ctx = gsap.context(() => {
        const buildScenes = (isCompactMode: boolean) => {
          const resetWhoLetterStartFrame = () => {
            gsap.set(whoLetterO, { left: '50%', xPercent: -50, x: 0, y: 0 });
            gsap.set(whoLetterS, { x: 0, y: 0 });
            gsap.set(whoLetterR, { x: 0, y: 0 });
          };
          applyIntroStartFrame(
            sectionZero,
            sectionOne,
            sectionTwo,
            whoWeAreContent,
            sectionWhoopPersonalBar,
            sectionMicrosoftPersonalBar,
            sectionMetaPersonalBar,
            sectionAffiliations,
            sectionActions,
            pageIndicator,
          );
          gsap.set(whoopPersonalBarBgLogo, { opacity: 0, scale: 0.88 });
          gsap.set(microsoftPersonalBarBgLogo, { opacity: 0, scale: 0.88 });
          gsap.set(metaPersonalBarBgLogo, { opacity: 0, scale: 0.88 });
          gsap.set(whoopPersonalBarContent, { y: PERSONAL_BAR_CONTENT_START_Y });
          gsap.set(microsoftPersonalBarContent, { y: PERSONAL_BAR_CONTENT_START_Y });
          gsap.set(metaPersonalBarContent, { y: PERSONAL_BAR_CONTENT_START_Y });
          gsap.set(affiliationsContent, { y: PERSONAL_BAR_CONTENT_START_Y });
          gsap.set(actionsContent, { y: ACTIONS_CONTENT_START_Y });
          const viewportHeight = getViewportBelowNavbar();
          const layoutReferenceHeight = isCompactMode ? viewportHeight : STAGE_BASE_HEIGHT;
          const { phases, motion, scrollTrackEndVh } = buildIntroScrollPhases(isCompactMode, {
            viewportHeight,
            layoutReferenceHeight,
            whoopContentHeight: measurePersonalBarContentHeight(whoopPersonalBarContent),
            microsoftContentHeight: measurePersonalBarContentHeight(microsoftPersonalBarContent),
            metaContentHeight: measurePersonalBarContentHeight(metaPersonalBarContent),
            affiliationsContentHeight: measurePersonalBarContentHeight(affiliationsContent),
          });
          const {
            whoopEndY: whoopContentEndY,
            microsoftEndY: microsoftContentEndY,
            metaEndY: metaContentEndY,
            affiliationsEndY,
          } = motion;

          scrollTrack.style.height = `${scrollTrackEndVh * 100}vh`;
          setScrollHeightVh(scrollTrackEndVh);
          setIntroNavSections(
            buildIntroNavSections({
              whoSectionIn: phases.whoSectionIn,
              whoContentIn: phases.whoContentIn,
              howSectionIn: phases.howSectionIn,
              whoopPersonalBarScroll: phases.whoopPersonalBarScroll,
              microsoftPersonalBarScroll: phases.microsoftPersonalBarScroll,
              metaPersonalBarScroll: phases.metaPersonalBarScroll,
              affiliationsScroll: phases.affiliationsScroll,
              actionsScroll: phases.actionsScroll,
            }),
          );
          const attachSectionCrossfade = (
            phase: { at: number; durationPercent: number },
            fromSection: HTMLElement,
            toSection: HTMLElement,
          ) => {
            attachScene(
              scrollTrack,
              phase.at,
              phase.durationPercent,
              gsap
                .timeline({ defaults: { ease: 'none' } })
                .fromTo(fromSection, { autoAlpha: 1 }, { autoAlpha: 0, ...SCRUB_DEFAULTS }, 0)
                .fromTo(toSection, { autoAlpha: 0 }, { autoAlpha: 1, ...SCRUB_DEFAULTS }, 0),
              isCompactMode ? 0.2 : 0.45,
            );
          };
          const attachContentScroll = (
            phase: { at: number; durationPercent: number },
            content: HTMLElement,
            contentY: string,
            bgLogo?: HTMLElement,
            contentStartY: string = PERSONAL_BAR_CONTENT_START_Y,
          ) => {
            const timeline = gsap
              .timeline({ defaults: { ease: 'none' } })
              .fromTo(
                content,
                { y: contentStartY },
                { y: contentY, ease: 'none', duration: 1 },
                0,
              );
            if (bgLogo) {
              timeline.fromTo(
                bgLogo,
                { opacity: 0, scale: 0.88 },
                { opacity: 1, scale: 1, ease: 'none', duration: 0.55 },
                0,
              );
            }
            attachScene(scrollTrack, phase.at, phase.durationPercent, timeline);
          };
          /** Re-sync scrub progress at scroll top without overriding tween values. */
          const attachTopScrubSync = () => {
            const syncScrubToScroll = () => {
              const relativeScroll = Math.max(window.scrollY - scrollTrack.offsetTop, 0);
              if (relativeScroll > 1) return;
              syncScrollTrackAnimations(scrollTrack);
            };

            ScrollTrigger.create({
              trigger: scrollTrack,
              start: 'top top',
              end: 'top+=1 top',
              invalidateOnRefresh: true,
              onEnterBack: syncScrubToScroll,
              onUpdate: (self) => {
                if (self.isActive) syncScrubToScroll();
              },
            });

            ScrollTrigger.addEventListener('scrollEnd', syncScrubToScroll);

            return () => {
              ScrollTrigger.removeEventListener('scrollEnd', syncScrubToScroll);
            };
          };

          attachScene(
            scrollTrack,
            phases.typingFadeOut.at,
            phases.typingFadeOut.durationPercent,
            gsap.fromTo(sectionZero, { autoAlpha: 1 }, { autoAlpha: 0, ...SCRUB_DEFAULTS }),
          );

          attachScene(
            scrollTrack,
            phases.whoContentIn.at,
            phases.whoContentIn.durationPercent,
            gsap.fromTo(whoWeAreContent, { opacity: 0 }, { opacity: 1, ...SCRUB_DEFAULTS }),
          );

          const pageIndicatorScroll = getPageIndicatorScrollPhase(phases.howToWhoop);
          if (pageIndicator) {
            attachScene(
              scrollTrack,
              pageIndicatorScroll.at,
              pageIndicatorScroll.durationPercent,
              gsap.fromTo(pageIndicator, { top: '90%' }, { top: '-50%', ...SCRUB_DEFAULTS }),
            );
          }

          attachScene(
            scrollTrack,
            phases.whoSectionIn.at,
            phases.whoSectionIn.durationPercent,
            gsap.fromTo(sectionOne, { autoAlpha: 0 }, { autoAlpha: 1, ...SCRUB_DEFAULTS }),
          );

          resetWhoLetterStartFrame();

          const whoLetterExit = isCompactMode
            ? {
                O: { x: '-38vw', y: '-24vh', xPercent: -50 },
                S: { x: '54vw', y: '28vh' },
                R: { right: '-32%', bottom: '92%' },
              }
            : {
                O: { x: '-34vw', y: '-30vh', xPercent: -50 },
                S: { x: '46vw', y: '32vh' },
                R: { right: '-28%', bottom: '94%' },
              };

          attachScene(
            scrollTrack,
            phases.whoLettersMove.at,
            phases.whoLettersMove.durationPercent,
            gsap
              .timeline({ defaults: { ease: 'none' } })
              .to(whoLetterO, whoLetterExit.O, 0)
              .to(whoLetterS, whoLetterExit.S, 0)
              .to(whoLetterR, whoLetterExit.R, 0),
          );

          attachScene(
            scrollTrack,
            phases.whoSectionOut.at,
            phases.whoSectionOut.durationPercent,
            gsap.fromTo(sectionOne, { autoAlpha: 1 }, { autoAlpha: 0, ...SCRUB_DEFAULTS }),
          );

          attachScene(
            scrollTrack,
            phases.howSectionIn.at,
            phases.howSectionIn.durationPercent,
            gsap.fromTo(sectionTwo, { autoAlpha: 0 }, { autoAlpha: 1, ...SCRUB_DEFAULTS }),
          );

          if (isCompactMode) {
            attachScene(
              scrollTrack,
              phases.howLettersMove.at,
              phases.howLettersMove.durationPercent,
              gsap
                .timeline({ defaults: { ease: 'none' } })
                .fromTo(
                  howLetterO,
                  { left: '-5%', bottom: '12%', top: 'auto', right: 'auto' },
                  { left: '-22%', bottom: '16%', ...SCRUB_DEFAULTS },
                  0,
                )
                .to(howLetterR, { bottom: '0%', right: '30%' }, 0)
                .to(howLetterS, { right: '15%', top: '0%' }, 0),
            );
          } else {
            attachScene(
              scrollTrack,
              phases.howLettersMove.at,
              phases.howLettersMove.durationPercent,
              gsap
                .timeline({ defaults: { ease: 'none' } })
                .fromTo(
                  howLetterO,
                  { left: '-4%', bottom: '5%', top: 'auto', right: 'auto' },
                  { left: '-20%', bottom: '16%', ...SCRUB_DEFAULTS },
                  0,
                )
                .to(howLetterR, { bottom: '-35%', right: '30%' }, 0)
                .to(howLetterS, { right: '22%', top: '-15%' }, 0),
            );
          }

          attachSectionCrossfade(phases.howToWhoop, sectionTwo, sectionWhoopPersonalBar);

          attachContentScroll(
            phases.whoopPersonalBarScroll,
            whoopPersonalBarContent,
            whoopContentEndY,
            whoopPersonalBarBgLogo,
          );

          attachSectionCrossfade(
            phases.whoopToMicrosoft,
            sectionWhoopPersonalBar,
            sectionMicrosoftPersonalBar,
          );

          attachContentScroll(
            phases.microsoftPersonalBarScroll,
            microsoftPersonalBarContent,
            microsoftContentEndY,
            microsoftPersonalBarBgLogo,
          );

          attachSectionCrossfade(
            phases.microsoftToMeta,
            sectionMicrosoftPersonalBar,
            sectionMetaPersonalBar,
          );

          attachContentScroll(
            phases.metaPersonalBarScroll,
            metaPersonalBarContent,
            metaContentEndY,
            metaPersonalBarBgLogo,
          );

          attachSectionCrossfade(
            phases.metaToAffiliations,
            sectionMetaPersonalBar,
            sectionAffiliations,
          );

          if (pageIndicator) {
            attachScene(
              scrollTrack,
              phases.metaToAffiliations.at,
              phases.metaToAffiliations.durationPercent,
              gsap.fromTo(pageIndicator, { opacity: 1 }, { opacity: 0, ...SCRUB_DEFAULTS }),
            );
          }

          attachContentScroll(
            phases.affiliationsScroll,
            affiliationsContent,
            affiliationsEndY,
          );

          attachSectionCrossfade(
            phases.affiliationsToActions,
            sectionAffiliations,
            sectionActions,
          );

          attachContentScroll(
            phases.actionsScroll,
            actionsContent,
            ACTIONS_CONTENT_END_Y,
            undefined,
            ACTIONS_CONTENT_START_Y,
          );

          removeTopScrubSyncListener = attachTopScrubSync();
          scheduleLayoutSync();
        };
        buildScenes(isCompactViewport);
      }, introRoot);

      window.scrollTo(0, 0);
      scheduleLayoutSync();
      window.addEventListener('load', scheduleLayoutSync);
      document.fonts?.ready.then(scheduleLayoutSync);

      let resizeTimer: ReturnType<typeof setTimeout> | undefined;
      let lastOuterWidth = window.outerWidth;
      const onWindowResize = () => {
        const nextOuterWidth = window.outerWidth;
        const widthChanged = nextOuterWidth !== lastOuterWidth;
        lastOuterWidth = nextOuterWidth;

        // On mobile/compact view, browser chrome show/hide can fire frequent resize events
        // while scrolling; avoid refreshing triggers unless width actually changes.
        if (isCompactViewport && !widthChanged) return;

        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(scheduleLayoutSync, 120);
      };
      window.addEventListener('resize', onWindowResize);

      return () => {
        if (previousScrollRestoration !== null) {
          window.history.scrollRestoration = previousScrollRestoration;
        }
        window.removeEventListener('load', scheduleLayoutSync);
        window.removeEventListener('resize', onWindowResize);
        if (resizeTimer) clearTimeout(resizeTimer);
        removeTopScrubSyncListener?.();
        ctx.revert();
        ScrollTrigger.clearScrollMemory();
      };
    },
    { scope: introRootRef, dependencies: [isCompactViewport] },
  );

  const useFixedStage = !isCompactViewport;
  const sectionShellCommon = useFixedStage
    ? 'fixed left-1/2 flex items-center justify-center overflow-hidden bg-transparent'
    : 'fixed left-0 right-0 top-[var(--navbar-height)] flex h-[calc(100dvh-var(--navbar-height))] items-center justify-center overflow-hidden bg-transparent';
  const sectionShell = `${sectionShellCommon} pointer-events-none z-10`;
  const actionsSectionShell = `${sectionShellCommon} pointer-events-auto z-[22]`;
  const stageBackdropClass = useFixedStage
    ? 'pointer-events-none fixed left-1/2 z-[6] bg-white'
    : 'pointer-events-none fixed left-0 right-0 top-[var(--navbar-height)] z-[6] h-[calc(100dvh-var(--navbar-height))] bg-white';
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

      {/* White stage backdrop; fixed section layers sit above */}
      <div
        className={stageBackdropClass}
        style={sectionShellStyle}
        aria-hidden
      />

      <IntroScrollNav
        sections={introNavSections}
        activeId={activeNavId}
        activeProgress={activeNavProgress}
        onSelect={scrollToNavSection}
      />

      <div
        data-page-indicator
        className="pointer-events-none fixed left-[20%] z-[8] h-[45%] w-0.5"
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
          className={`${letterBase} left-1/2 top-[24%] -translate-x-1/2 md:top-[-2%]`}
          style={{ color: ACCENT_CORAL }}
        >
          O
        </div>
        <div
          ref={whoLetterSRef}
          className={`${letterBase} bottom-[12%] left-[9%] md:bottom-[5%] md:left-[7%]`}
          style={{ color: ACCENT_TEAL }}
        >
          S
        </div>
        <div
          ref={whoLetterRRef}
          className={`${letterBase} bottom-[10%] right-[6%] md:bottom-[5%] md:right-[5%]`}
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
          className={`${letterBase} bottom-[12%] left-[-5%] md:bottom-[5%] md:left-[-4%]`}
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

      {/* Phase 7 — hiring manager affiliations */}
      <section
        ref={sectionAffiliationsRef}
        id="intro-affiliations"
        className={`${sectionShell} z-[21] overflow-hidden bg-white opacity-0`}
        style={sectionShellStyle}
        aria-labelledby="affiliations-heading"
      >
        <div className="relative z-[2] h-full w-full overflow-hidden">
          <div
            ref={affiliationsContentRef}
            className="will-change-transform flex w-full items-center justify-center px-4 pt-[8vh] sm:px-8"
          >
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
                {HOME_ASSETS.affiliations.map((logo) => (
                  <div
                    key={logo.path}
                    className="flex h-[78px] items-center justify-center rounded-xl border border-light-steel-blue/35 bg-white/95 p-3 shadow-lg sm:h-[92px] sm:p-4"
                  >
                    <img
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
        </div>
      </section>

      <IntroActionsSection
        sectionShell={actionsSectionShell}
        sectionStyle={sectionShellStyle}
        sectionRef={sectionActionsRef}
        contentRef={actionsContentRef}
      />
    </div>
  );
}
