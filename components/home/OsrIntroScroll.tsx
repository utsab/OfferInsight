'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { buildIntroScrollPhases, getOsrScrollHeightVh, getPageIndicatorScrollPhase, WHOOP_ENTRANCE_CROSSFADE_SHARE } from './osrIntroTimeline';
import {
  PERSONAL_BAR_CONTENT_START_Y,
  TYPING_DESCRIPTIONS,
  getOsrSceneConfig,
  getScrollTrackRelativePx,
  scrollToTrackOffsetPx,
  applyScrollTrackHeight,
  getViewportBelowNavbar,
  measurePersonalBarContentHeight,
  syncScrollTrackAnimations,
  preserveScrollTrackProgress,
} from './osrScrollUtils';
import { handleSignIn } from '@/components/auth-actions';
import { TypingHeroLine } from './TypingHeroLine';
import { IntroActionsSection } from './IntroActionsSection';
import { IntroAgreementsSection } from './IntroAgreementsSection';
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

function phaseEndVh(phase: { at: number; durationPercent: number }): number {
  return phase.at + phase.durationPercent / 100;
}

/**
 * Keep a scrubbed property covered for `[at, until)`.
 * Must use fromTo(same→same): `.to({ opacity: 0 })` while the layer is still at 1
 * interpolates 1→0 over the whole duration (looks like a blend), not a hold.
 */
function holdTween(
  timeline: gsap.core.Timeline,
  target: gsap.TweenTarget,
  vars: gsap.TweenVars,
  at: number,
  until: number,
) {
  const duration = until - at;
  if (duration <= 0) return;
  timeline.fromTo(target, vars, { ...vars, duration, immediateRender: false }, at);
}

/**
 * Compact chapter handoff wipe: rises with outgoing fade, clears with incoming fade.
 * Kiss at outEnd === inAt — brief white when scrolling slowly.
 */
function attachCompactWipeHandoff(
  timeline: gsap.core.Timeline,
  wipe: HTMLElement | null,
  outAt: number,
  outDurationVh: number,
  inAt: number,
  inDurationVh: number,
  holdZeroUntil: number,
) {
  if (!wipe) return;
  timeline.to(
    wipe,
    { opacity: 1, duration: outDurationVh, immediateRender: false },
    outAt,
  );
  timeline.to(
    wipe,
    { opacity: 0, duration: inDurationVh, immediateRender: false },
    inAt,
  );
  holdTween(timeline, wipe, { opacity: 0 }, inAt + inDurationVh, holdZeroUntil);
}

/**
 * Compact product timeline: every chapter is fade-out → (brief white) → fade-in.
 * No letter travel, no multi-layer overlap fades.
 */
function createCompactMasterTimeline(params: {
  phases: {
    typingFadeOut: { at: number; durationPercent: number };
    whoSectionIn: { at: number; durationPercent: number };
    whoLettersMove: { at: number; durationPercent: number };
    whoSectionOut: { at: number; durationPercent: number };
    howSectionIn: { at: number; durationPercent: number };
    howLettersMove: { at: number; durationPercent: number };
    howSectionOut: { at: number; durationPercent: number };
    agreementsFadeIn: { at: number; durationPercent: number };
    whoopPersonalBarScroll: { at: number; durationPercent: number };
    actionsScroll: { at: number; durationPercent: number };
  };
  sections: {
    sectionZero: HTMLElement;
    sectionOne: HTMLElement;
    sectionTwo: HTMLElement;
    whoWeAreContent: HTMLElement;
    whoLetterO: HTMLElement;
    whoLetterS: HTMLElement;
    whoLetterR: HTMLElement;
    howLetterO: HTMLElement;
    howLetterS: HTMLElement;
    howLetterR: HTMLElement;
    sectionAgreements: HTMLElement;
    sectionWhoopPersonalBar: HTMLElement;
    whoopPersonalBarBgLogo: HTMLElement;
    whoopPersonalBarContent: HTMLElement;
    sectionActions: HTMLElement;
  };
  whoopContentEndY: string;
  whoopPersonalBarIIIPanelBg: HTMLElement | null;
  whoopPersonalBarIIICards: HTMLElement[];
  emptyBeatOverlay: HTMLElement | null;
  agreementsScrollLine: HTMLElement | null;
  scrollTrack: HTMLElement;
  scrollTrackEndVh: number;
}) {
  const {
    phases,
    sections,
    whoopContentEndY,
    whoopPersonalBarIIIPanelBg,
    whoopPersonalBarIIICards,
    emptyBeatOverlay,
    agreementsScrollLine,
    scrollTrack,
    scrollTrackEndVh,
  } = params;

  const timeline = gsap.timeline({ defaults: { ease: 'none' } });
  const timelineEndVh = scrollTrackEndVh;
  const wipe = emptyBeatOverlay;

  const typingAt = phases.typingFadeOut.at;
  const typingDur = phases.typingFadeOut.durationPercent / 100;
  const typingEnd = phaseEndVh(phases.typingFadeOut);

  const whoInAt = typingEnd;
  const whoInDur = phases.whoSectionIn.durationPercent / 100;
  const whoInEnd = whoInAt + whoInDur;
  const whoOutAt = phases.whoSectionOut.at;
  const whoOutDur = phases.whoSectionOut.durationPercent / 100;
  const whoOutEnd = phaseEndVh(phases.whoSectionOut);

  const howInAt = phases.howSectionIn.at;
  const howInDur = phases.howSectionIn.durationPercent / 100;
  const howInEnd = phaseEndVh(phases.howSectionIn);
  const howOutAt = phases.howSectionOut.at;
  const howOutDur = phases.howSectionOut.durationPercent / 100;
  const howOutEnd = phaseEndVh(phases.howSectionOut);

  const agreementsInAt = phases.agreementsFadeIn.at;
  const agreementsInDur = phases.agreementsFadeIn.durationPercent / 100;
  const agreementsInEnd = phaseEndVh(phases.agreementsFadeIn);
  const whoopPhaseDur = phases.whoopPersonalBarScroll.durationPercent / 100;
  // Keep whoop entrance readable on phones (phase share can be tiny).
  const whoopHandoffDur = Math.max(whoopPhaseDur * WHOOP_ENTRANCE_CROSSFADE_SHARE, 0.2);
  const whoopInAt = phases.whoopPersonalBarScroll.at;
  const whoopInEnd = whoopInAt + whoopHandoffDur;
  const actionsAt = phases.actionsScroll.at;
  const actionsDur = Math.max(phases.actionsScroll.durationPercent / 100, 0.12);
  const actionsEnd = actionsAt + actionsDur;

  // --- Wipe idle before first handoff ---
  if (wipe) {
    holdTween(timeline, wipe, { opacity: 0 }, 0, typingAt);
  }

  // --- Typing ---
  holdTween(timeline, sections.sectionZero, { opacity: 1 }, 0, typingAt);
  timeline.to(
    sections.sectionZero,
    { opacity: 0, duration: typingDur, immediateRender: false },
    typingAt,
  );
  holdTween(timeline, sections.sectionZero, { opacity: 0 }, typingEnd, timelineEndVh);

  // --- Who (section + copy together; letters fly during whoLettersMove) ---
  holdTween(timeline, sections.sectionOne, { opacity: 0 }, 0, whoInAt);
  holdTween(timeline, sections.whoWeAreContent, { opacity: 0 }, 0, whoInAt);
  attachCompactWipeHandoff(timeline, wipe, typingAt, typingDur, whoInAt, whoInDur, whoOutAt);
  timeline.to(
    sections.sectionOne,
    { opacity: 1, duration: whoInDur, immediateRender: false },
    whoInAt,
  );
  timeline.to(
    sections.whoWeAreContent,
    { opacity: 1, duration: whoInDur, immediateRender: false },
    whoInAt,
  );
  holdTween(timeline, sections.sectionOne, { opacity: 1 }, whoInEnd, whoOutAt);
  holdTween(timeline, sections.whoWeAreContent, { opacity: 1 }, whoInEnd, whoOutAt);

  const whoLettersDur = phases.whoLettersMove.durationPercent / 100;
  timeline
    .to(
      sections.whoLetterO,
      {
        x: '-28vw',
        y: '-18vh',
        xPercent: -50,
        duration: whoLettersDur,
        immediateRender: false,
      },
      phases.whoLettersMove.at,
    )
    .to(
      sections.whoLetterS,
      { x: '36vw', y: '18vh', duration: whoLettersDur, immediateRender: false },
      phases.whoLettersMove.at,
    )
    .to(
      sections.whoLetterR,
      { right: '-18%', bottom: '78%', duration: whoLettersDur, immediateRender: false },
      phases.whoLettersMove.at,
    );

  timeline.to(
    sections.sectionOne,
    { opacity: 0, duration: whoOutDur, immediateRender: false },
    whoOutAt,
  );
  timeline.to(
    sections.whoWeAreContent,
    { opacity: 0, duration: whoOutDur, immediateRender: false },
    whoOutAt,
  );
  holdTween(timeline, sections.sectionOne, { opacity: 0 }, whoOutEnd, timelineEndVh);
  holdTween(timeline, sections.whoWeAreContent, { opacity: 0 }, whoOutEnd, timelineEndVh);

  // --- How (letters travel during howLettersMove) ---
  holdTween(timeline, sections.sectionTwo, { opacity: 0 }, 0, howInAt);
  attachCompactWipeHandoff(timeline, wipe, whoOutAt, whoOutDur, howInAt, howInDur, howOutAt);
  timeline.to(
    sections.sectionTwo,
    { opacity: 1, duration: howInDur, immediateRender: false },
    howInAt,
  );
  holdTween(timeline, sections.sectionTwo, { opacity: 1 }, howInEnd, howOutAt);

  const howLettersDur = phases.howLettersMove.durationPercent / 100;
  timeline
    .fromTo(
      sections.howLetterO,
      { left: '-5%', bottom: '12%', top: 'auto', right: 'auto' },
      { left: '-14%', bottom: '14%', duration: howLettersDur, immediateRender: false },
      phases.howLettersMove.at,
    )
    .to(
      sections.howLetterR,
      { bottom: '4%', right: '22%', duration: howLettersDur, immediateRender: false },
      phases.howLettersMove.at,
    )
    .to(
      sections.howLetterS,
      { right: '12%', top: '4%', duration: howLettersDur, immediateRender: false },
      phases.howLettersMove.at,
    );

  timeline.to(
    sections.sectionTwo,
    { opacity: 0, duration: howOutDur, immediateRender: false },
    howOutAt,
  );
  holdTween(timeline, sections.sectionTwo, { opacity: 0 }, howOutEnd, timelineEndVh);

  // --- Agreements ---
  holdTween(timeline, sections.sectionAgreements, { opacity: 0 }, 0, agreementsInAt);
  attachCompactWipeHandoff(
    timeline,
    wipe,
    howOutAt,
    howOutDur,
    agreementsInAt,
    agreementsInDur,
    whoopInAt,
  );
  timeline.to(
    sections.sectionAgreements,
    { opacity: 1, duration: agreementsInDur, immediateRender: false },
    agreementsInAt,
  );
  holdTween(timeline, sections.sectionAgreements, { opacity: 1 }, agreementsInEnd, whoopInAt);
  timeline.to(
    sections.sectionAgreements,
    { opacity: 0, duration: whoopHandoffDur, immediateRender: false },
    whoopInAt,
  );
  holdTween(
    timeline,
    sections.sectionAgreements,
    { opacity: 0 },
    whoopInEnd,
    timelineEndVh,
  );

  // Orange scroll cue: starts above the agreements copy and climbs upward only
  // (never down through the text) while agreements stays on screen.
  if (agreementsScrollLine) {
    // Climb across fade-in + marquee hold so travel feels slower.
    const climbAt = agreementsInAt;
    const climbDur = Math.max(whoopInAt - climbAt, 0.01);
    holdTween(timeline, agreementsScrollLine, { opacity: 0, y: 0 }, 0, agreementsInAt);
    timeline.to(
      agreementsScrollLine,
      { opacity: 1, duration: agreementsInDur, immediateRender: false },
      agreementsInAt,
    );
    timeline.fromTo(
      agreementsScrollLine,
      { y: 0 },
      { y: '-28vh', duration: climbDur, immediateRender: false, ease: 'none' },
      climbAt,
    );
    timeline.to(
      agreementsScrollLine,
      { opacity: 0, duration: whoopHandoffDur, immediateRender: false },
      whoopInAt,
    );
    holdTween(
      timeline,
      agreementsScrollLine,
      { opacity: 0, y: '-28vh' },
      whoopInAt + whoopHandoffDur,
      timelineEndVh,
    );
  }

  // --- Whoop: agreements fully out, then Whoop fades in (same recipe as Typing→Who) ---
  holdTween(timeline, sections.sectionWhoopPersonalBar, { opacity: 0 }, 0, whoopInAt);
  const whoopVisibleAt = whoopInAt + whoopHandoffDur;
  attachCompactWipeHandoff(
    timeline,
    wipe,
    whoopInAt,
    whoopHandoffDur,
    whoopVisibleAt,
    whoopHandoffDur,
    actionsAt,
  );
  timeline.to(
    sections.sectionWhoopPersonalBar,
    { opacity: 1, duration: whoopHandoffDur, immediateRender: false },
    whoopVisibleAt,
  );
  holdTween(
    timeline,
    sections.sectionWhoopPersonalBar,
    { opacity: 1 },
    whoopVisibleAt + whoopHandoffDur,
    actionsAt,
  );

  timeline.fromTo(
    sections.whoopPersonalBarContent,
    { y: PERSONAL_BAR_CONTENT_START_Y },
    { y: whoopContentEndY, duration: whoopPhaseDur, immediateRender: false },
    whoopInAt,
  );
  timeline.fromTo(
    sections.whoopPersonalBarBgLogo,
    { opacity: 0, scale: 0.88 },
    {
      opacity: 1,
      scale: 1,
      duration: whoopPhaseDur * 0.55,
      immediateRender: false,
    },
    whoopVisibleAt,
  );
  if (whoopPersonalBarIIIPanelBg) {
    timeline.fromTo(
      whoopPersonalBarIIIPanelBg,
      { y: '-6%' },
      { y: '6%', ease: 'none', duration: whoopPhaseDur * 0.88, immediateRender: false },
      whoopInAt + whoopPhaseDur * 0.06,
    );
  }
  if (whoopPersonalBarIIICards.length > 0) {
    const cardEntranceAt = whoopVisibleAt + whoopPhaseDur * 0.08;
    holdTween(timeline, whoopPersonalBarIIICards, { opacity: 0 }, whoopInAt, cardEntranceAt);
    timeline.to(
      whoopPersonalBarIIICards,
      {
        opacity: 1,
        duration: whoopPhaseDur * 0.12,
        stagger: whoopPhaseDur * 0.03,
        ease: 'power2.out',
        immediateRender: false,
      },
      cardEntranceAt,
    );
  }

  timeline.to(
    sections.sectionWhoopPersonalBar,
    { opacity: 0, duration: actionsDur, immediateRender: false },
    actionsAt,
  );
  holdTween(timeline, sections.sectionWhoopPersonalBar, { opacity: 0 }, actionsEnd, timelineEndVh);

  // --- Contact: Whoop fully out, then Contact fades in ---
  holdTween(timeline, sections.sectionActions, { opacity: 0 }, 0, actionsAt);
  const contactVisibleAt = actionsAt + actionsDur;
  attachCompactWipeHandoff(
    timeline,
    wipe,
    actionsAt,
    actionsDur,
    contactVisibleAt,
    actionsDur,
    timelineEndVh,
  );
  timeline.to(
    sections.sectionActions,
    { opacity: 1, duration: actionsDur, immediateRender: false },
    contactVisibleAt,
  );
  holdTween(
    timeline,
    sections.sectionActions,
    { opacity: 1 },
    contactVisibleAt + actionsDur,
    timelineEndVh,
  );

  ScrollTrigger.create({
    trigger: scrollTrack,
    start: 'top top',
    end: () => {
      const { startPx } = getOsrSceneConfig(scrollTrackEndVh, 0, false);
      return `top+=${startPx} top`;
    },
    scrub: true,
    invalidateOnRefresh: false,
    animation: timeline,
  });
}

function createPrimaryMasterTimeline(params: {
  phases: {
    typingFadeOut: { at: number; durationPercent: number };
    whoContentIn: { at: number; durationPercent: number };
    whoSectionIn: { at: number; durationPercent: number };
    whoLettersMove: { at: number; durationPercent: number };
    whoSectionOut: { at: number; durationPercent: number };
    howSectionIn: { at: number; durationPercent: number };
    howLettersMove: { at: number; durationPercent: number };
    howSectionOut: { at: number; durationPercent: number };
    agreementsFadeIn: { at: number; durationPercent: number };
    agreementsMarquee: { at: number; durationPercent: number };
    whoopPersonalBarScroll: { at: number; durationPercent: number };
    actionsScroll: { at: number; durationPercent: number };
  };
  sections: {
    sectionZero: HTMLElement;
    sectionOne: HTMLElement;
    sectionTwo: HTMLElement;
    whoWeAreContent: HTMLElement;
    whoLetterO: HTMLElement;
    whoLetterS: HTMLElement;
    whoLetterR: HTMLElement;
    howLetterO: HTMLElement;
    howLetterS: HTMLElement;
    howLetterR: HTMLElement;
    sectionAgreements: HTMLElement;
    sectionWhoopPersonalBar: HTMLElement;
    whoopPersonalBarBgLogo: HTMLElement;
    whoopPersonalBarContent: HTMLElement;
    sectionActions: HTMLElement;
  };
  whoopContentEndY: string;
  whoopPersonalBarIIIPanelBg: HTMLElement | null;
  whoopPersonalBarIIICards: HTMLElement[];
  pageIndicator: HTMLElement | null;
  emptyBeatOverlay: HTMLElement | null;
  agreementsScrollLine: HTMLElement | null;
  scrollTrack: HTMLElement;
  scrollTrackEndVh: number;
  isCompactMode: boolean;
  useEarlyWhoopCardEntrance: boolean;
}) {
  // Single source of truth for scroll-driven visuals:
  // all primary fades/crossfades and phase motion are authored here,
  // then scrubbed by one ScrollTrigger.
  const {
    phases,
    sections,
    whoopContentEndY,
    whoopPersonalBarIIIPanelBg,
    whoopPersonalBarIIICards,
    pageIndicator,
    emptyBeatOverlay,
    agreementsScrollLine,
    scrollTrack,
    scrollTrackEndVh,
    isCompactMode,
    useEarlyWhoopCardEntrance,
  } = params;
  const pageIndicatorScroll = getPageIndicatorScrollPhase(phases.whoopPersonalBarScroll);
  const whoopPhaseDurationVh = phases.whoopPersonalBarScroll.durationPercent / 100;
  const whoopCrossfadeDurationVh = whoopPhaseDurationVh * WHOOP_ENTRANCE_CROSSFADE_SHARE;
  const whoopCrossfadeStartVh = phases.whoopPersonalBarScroll.at;
  const actionsCrossfadeDurationVh = phases.actionsScroll.durationPercent / 100;

  const primaryTimeline = gsap.timeline({ defaults: { ease: 'none' } });
  const timelineEndVh = scrollTrackEndVh;
  const whoOutEndVh = phaseEndVh(phases.whoSectionOut);
  const howInEndVh = phaseEndVh(phases.howSectionIn);
  const howOutEndVh = phaseEndVh(phases.howSectionOut);
  const agreementsFadeEndVh = phaseEndVh(phases.agreementsFadeIn);

  if (isCompactMode) {
    createCompactMasterTimeline({
      phases,
      sections,
      whoopContentEndY,
      whoopPersonalBarIIIPanelBg,
      whoopPersonalBarIIICards,
      emptyBeatOverlay,
      agreementsScrollLine,
      scrollTrack,
      scrollTrackEndVh,
    });
    return;
  }

  // Desktop: sequential fades + letter choreography.
  const typingEndVh = phaseEndVh(phases.typingFadeOut);
  const typingWhoOverlapVh = 0.08;
  const typingFadeEndVh = typingEndVh + typingWhoOverlapVh;
  const whoInAt = Math.max(0, phases.whoSectionIn.at - typingWhoOverlapVh);
  const whoInDurationVh =
    phases.whoSectionIn.durationPercent / 100 + (phases.whoSectionIn.at - whoInAt);

  holdTween(primaryTimeline, sections.sectionZero, { opacity: 1 }, 0, phases.typingFadeOut.at);
  primaryTimeline.to(
    sections.sectionZero,
    {
      opacity: 0,
      duration: typingFadeEndVh - phases.typingFadeOut.at,
      immediateRender: false,
    },
    phases.typingFadeOut.at,
  );
  holdTween(primaryTimeline, sections.sectionZero, { opacity: 0 }, typingFadeEndVh, timelineEndVh);

  holdTween(primaryTimeline, sections.sectionOne, { opacity: 0 }, 0, whoInAt);
  primaryTimeline.to(
    sections.sectionOne,
    { opacity: 1, duration: whoInDurationVh, immediateRender: false },
    whoInAt,
  );
  holdTween(
    primaryTimeline,
    sections.sectionOne,
    { opacity: 1 },
    whoInAt + whoInDurationVh,
    phases.whoSectionOut.at,
  );
  primaryTimeline.to(
    sections.sectionOne,
    { opacity: 0, duration: phases.whoSectionOut.durationPercent / 100, immediateRender: false },
    phases.whoSectionOut.at,
  );
  holdTween(primaryTimeline, sections.sectionOne, { opacity: 0 }, whoOutEndVh, timelineEndVh);

  holdTween(primaryTimeline, sections.whoWeAreContent, { opacity: 0 }, 0, whoInAt);
  primaryTimeline.to(
    sections.whoWeAreContent,
    {
      opacity: 1,
      duration: phases.whoContentIn.durationPercent / 100 + (phases.whoContentIn.at - whoInAt),
      immediateRender: false,
    },
    whoInAt,
  );
  holdTween(
    primaryTimeline,
    sections.whoWeAreContent,
    { opacity: 1 },
    whoInAt + phases.whoContentIn.durationPercent / 100 + (phases.whoContentIn.at - whoInAt),
    whoOutEndVh,
  );
  holdTween(primaryTimeline, sections.whoWeAreContent, { opacity: 0 }, whoOutEndVh, timelineEndVh);

  primaryTimeline
    .to(
      sections.whoLetterO,
      {
        x: '-34vw',
        y: '-30vh',
        xPercent: -50,
        duration: phases.whoLettersMove.durationPercent / 100,
        immediateRender: false,
      },
      phases.whoLettersMove.at,
    )
    .to(
      sections.whoLetterS,
      {
        x: '46vw',
        y: '32vh',
        duration: phases.whoLettersMove.durationPercent / 100,
        immediateRender: false,
      },
      phases.whoLettersMove.at,
    )
    .to(
      sections.whoLetterR,
      {
        right: '-28%',
        bottom: '94%',
        duration: phases.whoLettersMove.durationPercent / 100,
        immediateRender: false,
      },
      phases.whoLettersMove.at,
    );

  // --- How section ---
  holdTween(primaryTimeline, sections.sectionTwo, { opacity: 0 }, 0, phases.howSectionIn.at);
  primaryTimeline.to(
    sections.sectionTwo,
    { opacity: 1, duration: phases.howSectionIn.durationPercent / 100, immediateRender: false },
    phases.howSectionIn.at,
  );
  holdTween(primaryTimeline, sections.sectionTwo, { opacity: 1 }, howInEndVh, phases.howSectionOut.at);
  primaryTimeline
    .fromTo(
      sections.howLetterO,
      { left: '-4%', bottom: '5%', top: 'auto', right: 'auto' },
      { left: '-20%', bottom: '16%', duration: phases.howLettersMove.durationPercent / 100, immediateRender: false },
      phases.howLettersMove.at,
    )
    .to(
      sections.howLetterR,
      { bottom: '-35%', right: '30%', duration: phases.howLettersMove.durationPercent / 100, immediateRender: false },
      phases.howLettersMove.at,
    )
    .to(
      sections.howLetterS,
      { right: '22%', top: '-15%', duration: phases.howLettersMove.durationPercent / 100, immediateRender: false },
      phases.howLettersMove.at,
    );
  primaryTimeline.to(
    sections.sectionTwo,
    { opacity: 0, duration: phases.howSectionOut.durationPercent / 100, immediateRender: false },
    phases.howSectionOut.at,
  );
  holdTween(primaryTimeline, sections.sectionTwo, { opacity: 0 }, howOutEndVh, timelineEndVh);

  // --- Agreements ---
  holdTween(primaryTimeline, sections.sectionAgreements, { opacity: 0 }, 0, phases.agreementsFadeIn.at);
  primaryTimeline.to(
    sections.sectionAgreements,
    {
      opacity: 0.5,
      duration: (phases.agreementsFadeIn.durationPercent / 100) * 0.5,
      immediateRender: false,
    },
    phases.agreementsFadeIn.at,
  );
  primaryTimeline.to(
    sections.sectionAgreements,
    {
      opacity: 1,
      duration: (phases.agreementsFadeIn.durationPercent / 100) * 0.5,
      immediateRender: false,
    },
    phases.agreementsFadeIn.at + (phases.agreementsFadeIn.durationPercent / 100) * 0.5,
  );
  holdTween(
    primaryTimeline,
    sections.sectionAgreements,
    { opacity: 1 },
    agreementsFadeEndVh,
    whoopCrossfadeStartVh,
  );
  primaryTimeline.to(
    sections.sectionAgreements,
    { opacity: 0, duration: whoopCrossfadeDurationVh, immediateRender: false },
    whoopCrossfadeStartVh,
  );
  holdTween(
    primaryTimeline,
    sections.sectionAgreements,
    { opacity: 0 },
    whoopCrossfadeStartVh + whoopCrossfadeDurationVh,
    timelineEndVh,
  );

  // --- Whoop ---
  holdTween(
    primaryTimeline,
    sections.sectionWhoopPersonalBar,
    { opacity: 0 },
    0,
    whoopCrossfadeStartVh,
  );
  primaryTimeline.to(
    sections.sectionWhoopPersonalBar,
    { opacity: 1, duration: whoopCrossfadeDurationVh, immediateRender: false },
    whoopCrossfadeStartVh,
  );
  holdTween(
    primaryTimeline,
    sections.sectionWhoopPersonalBar,
    { opacity: 1 },
    whoopCrossfadeStartVh + whoopCrossfadeDurationVh,
    phases.actionsScroll.at,
  );
  primaryTimeline.fromTo(
    sections.whoopPersonalBarContent,
    { y: PERSONAL_BAR_CONTENT_START_Y },
    { y: whoopContentEndY, duration: whoopPhaseDurationVh, immediateRender: false },
    phases.whoopPersonalBarScroll.at,
  );
  primaryTimeline.fromTo(
    sections.whoopPersonalBarBgLogo,
    { opacity: 0, scale: 0.88 },
    {
      opacity: 1,
      scale: 1,
      duration: whoopPhaseDurationVh * 0.55,
      immediateRender: false,
    },
    phases.whoopPersonalBarScroll.at,
  );
  if (whoopPersonalBarIIIPanelBg) {
    // Run for most of Whoop (not just the first ~41%) so the soft bottom
    // stays tracked while content scrolls and Contact crossfades.
    primaryTimeline.fromTo(
      whoopPersonalBarIIIPanelBg,
      { y: '-6%' },
      { y: '6%', ease: 'none', duration: whoopPhaseDurationVh * 0.88, immediateRender: false },
      phases.whoopPersonalBarScroll.at + whoopPhaseDurationVh * 0.06,
    );
  }
  if (whoopPersonalBarIIICards.length > 0) {
    // Phase shares: content starts ~140vh below the fold. At ≤1918 cards enter the
    // viewport sooner, so slide earlier; above that keep the later mid-window timing.
    const cardEntranceShare = useEarlyWhoopCardEntrance ? 0.16 : 0.28;
    const cardDurationShare = useEarlyWhoopCardEntrance ? 0.18 : 0.2;
    const cardStaggerShare = useEarlyWhoopCardEntrance ? 0.035 : 0.04;
    const cardEntranceAt =
      phases.whoopPersonalBarScroll.at + whoopPhaseDurationVh * cardEntranceShare;
    const cardFrom = useEarlyWhoopCardEntrance
      ? { opacity: 0, xPercent: -70, x: -80 }
      : { opacity: 0, xPercent: -70, x: -80 };
    holdTween(
      primaryTimeline,
      whoopPersonalBarIIICards,
      cardFrom,
      phases.whoopPersonalBarScroll.at,
      cardEntranceAt,
    );
    primaryTimeline.to(
      whoopPersonalBarIIICards,
      {
        opacity: 1,
        xPercent: 0,
        x: 0,
        ease: 'power2.out',
        stagger: whoopPhaseDurationVh * cardStaggerShare,
        duration: whoopPhaseDurationVh * cardDurationShare,
        immediateRender: false,
      },
      cardEntranceAt,
    );
  }

  primaryTimeline.to(
    sections.sectionWhoopPersonalBar,
    { opacity: 0, duration: actionsCrossfadeDurationVh, immediateRender: false },
    phases.actionsScroll.at,
  );
  holdTween(
    primaryTimeline,
    sections.sectionWhoopPersonalBar,
    { opacity: 0 },
    phases.actionsScroll.at + actionsCrossfadeDurationVh,
    timelineEndVh,
  );

  // --- Contact ---
  holdTween(primaryTimeline, sections.sectionActions, { opacity: 0 }, 0, phases.actionsScroll.at);
  primaryTimeline.to(
    sections.sectionActions,
    { opacity: 1, duration: actionsCrossfadeDurationVh, immediateRender: false },
    phases.actionsScroll.at,
  );
  holdTween(
    primaryTimeline,
    sections.sectionActions,
    { opacity: 1 },
    phases.actionsScroll.at + actionsCrossfadeDurationVh,
    timelineEndVh,
  );

  if (pageIndicator) {
    primaryTimeline.fromTo(
      pageIndicator,
      { top: '90%' },
      { top: '-50%', duration: pageIndicatorScroll.durationPercent / 100, immediateRender: false },
      pageIndicatorScroll.at,
    );
    primaryTimeline.set(pageIndicator, { opacity: 0 }, phaseEndVh(pageIndicatorScroll));
  }

  ScrollTrigger.create({
    trigger: scrollTrack,
    start: 'top top',
    end: () => {
      const { startPx } = getOsrSceneConfig(scrollTrackEndVh, 0, false);
      return `top+=${startPx} top`;
    },
    scrub: 0.45,
    // Master timeline uses authored fromTo/to values — invalidateOnRefresh would
    // re-record starts from mid-scroll computed styles and cause phase overlap on resize.
    invalidateOnRefresh: false,
    animation: primaryTimeline,
  });
}

const COMPACT_MODE_WIDTH_THRESHOLD_PX = 1278;
const STAGE_BASE_WIDTH = 1920;
const STAGE_BASE_HEIGHT = 1080;
const STAGE_WIDTH_OFFSET_PX = 2;
/** Wider desktop still crops Whoop cards sooner — use earlier slide-in at/below this width. */
const EARLY_WHOOP_CARD_ENTRANCE_MAX_WIDTH_PX = 1918;

function applyIntroStartFrame(
  sectionZero: HTMLElement,
  sectionOne: HTMLElement,
  sectionTwo: HTMLElement,
  whoWeAreContent: HTMLElement,
  sectionAgreements: HTMLElement,
  sectionWhoopPersonalBar: HTMLElement,
  sectionActions: HTMLElement,
  pageIndicator?: HTMLElement | null,
) {
  gsap.set(sectionZero, { opacity: 1 });
  gsap.set(sectionOne, { opacity: 0 });
  gsap.set(sectionTwo, { opacity: 0 });
  gsap.set(whoWeAreContent, { opacity: 0 });
  gsap.set(sectionAgreements, { opacity: 0 });
  gsap.set(sectionWhoopPersonalBar, { opacity: 0 });
  gsap.set(sectionActions, { opacity: 0 });
  if (pageIndicator) {
    gsap.set(pageIndicator, { opacity: 1, top: '90%' });
  }
}

function readIsCompactViewport(width: number) {
  return width < COMPACT_MODE_WIDTH_THRESHOLD_PX;
}

/** Layout CSS width — DevTools device mode spoofs this; `outerWidth` often stays desktop. */
function getLayoutViewportWidthPx(): number {
  if (typeof window === 'undefined') return COMPACT_MODE_WIDTH_THRESHOLD_PX;
  return Math.min(window.innerWidth, document.documentElement.clientWidth || window.innerWidth);
}

export function OsrIntroScroll() {
  const introRootRef = useRef<HTMLDivElement>(null);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [scrollTrackEndVh, setScrollTrackEndVh] = useState(() => getOsrScrollHeightVh(false));
  const [stageScale, setStageScale] = useState(1);
  const [introNavSections, setIntroNavSections] = useState<IntroNavSection[]>([]);
  const [activeNavId, setActiveNavId] = useState('intro');
  const [activeNavProgress, setActiveNavProgress] = useState(0);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const sectionZeroRef = useRef<HTMLElement>(null);
  const sectionOneRef = useRef<HTMLElement>(null);
  const sectionTwoRef = useRef<HTMLElement>(null);
  const sectionAgreementsRef = useRef<HTMLElement>(null);
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
  const sectionActionsRef = useRef<HTMLElement>(null);
  const lastCompactViewportRef = useRef<boolean | null>(null);
  const scheduleLayoutSyncRef = useRef<(() => void) | null>(null);
  const skipNextStageScaleSyncRef = useRef(true);

  const scrollToNavSection = useCallback((section: IntroNavSection) => {
    const track = scrollTrackRef.current;
    if (!track) return;

    if (section.id === 'intro') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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
        scrollToTrackOffsetPx(track, getOsrSceneConfig(jumpVh, 0, false).startPx);
        return;
      }
    }

    scrollToTrackOffsetPx(track, getOsrSceneConfig(section.jumpVh, 0, false).startPx);
  }, []);

  useEffect(() => {
    const track = scrollTrackRef.current;
    if (!track || introNavSections.length === 0) return;

    const updateActive = () => {
      const vh = getViewportBelowNavbar();
      const relativePx = getScrollTrackRelativePx(track);
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
    const track = scrollTrackRef.current;
    if (!track || scrollTrackEndVh <= 0) return;

    const syncTrackHeight = () => {
      preserveScrollTrackProgress(track, () => {
        applyScrollTrackHeight(track, scrollTrackEndVh);
      });
      syncScrollTrackAnimations(track);
    };

    syncTrackHeight();
    window.addEventListener('resize', syncTrackHeight);
    return () => window.removeEventListener('resize', syncTrackHeight);
  }, [scrollTrackEndVh]);

  useEffect(() => {
    const previousOverscroll = document.documentElement.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = 'none';
    return () => {
      document.documentElement.style.overscrollBehaviorY = previousOverscroll;
    };
  }, []);

  useLayoutEffect(() => {
    const computeViewportMode = () => {
      const width = getLayoutViewportWidthPx();
      const isCompact = readIsCompactViewport(width);

      // Compact ↔ desktop rebuilds scenes via useGSAP deps; reset scroll for a clean handoff.
      if (lastCompactViewportRef.current !== null && lastCompactViewportRef.current !== isCompact) {
        window.scrollTo(0, 0);
      }
      lastCompactViewportRef.current = isCompact;

      setIsCompactViewport(isCompact);
      if (isCompact) {
        setStageScale(1);
        return;
      }

      // Desktop: continuous 1920×1080 stage scale (no width-bucket reloads).
      // Prefer outerWidth for physical window chrome; fall back to layout width.
      const scaleWidth = Math.max(window.outerWidth, width);
      setStageScale(
        Math.max(
          (scaleWidth - STAGE_WIDTH_OFFSET_PX) / (STAGE_BASE_WIDTH - STAGE_WIDTH_OFFSET_PX),
          0.3334,
        ),
      );
    };

    computeViewportMode();
    window.addEventListener('resize', computeViewportMode);
    return () => {
      window.removeEventListener('resize', computeViewportMode);
    };
  }, []);

  // After continuous desktop scale changes, snap the master timeline to scroll
  // (buckets used to hide this with a full reload).
  useEffect(() => {
    if (skipNextStageScaleSyncRef.current) {
      skipNextStageScaleSyncRef.current = false;
      return;
    }
    if (isCompactViewport) return;
    const timer = setTimeout(() => {
      scheduleLayoutSyncRef.current?.();
    }, 50);
    return () => clearTimeout(timer);
  }, [stageScale, isCompactViewport]);

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
      const sectionAgreements = sectionAgreementsRef.current;
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
      const sectionActions = sectionActionsRef.current;

      if (
        !introRoot ||
        !scrollTrack ||
        !sectionZero ||
        !sectionOne ||
        !sectionTwo ||
        !sectionAgreements ||
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
        !sectionActions
      ) {
        return undefined;
      }

      const pageIndicator = introRoot.querySelector<HTMLElement>('[data-page-indicator]');
      const emptyBeatOverlay = introRoot.querySelector<HTMLElement>('[data-compact-empty-beat]');
      const agreementsScrollLine = introRoot.querySelector<HTMLElement>(
        '[data-agreements-scroll-line]',
      );
      const whoopPersonalBarIIIPanelBg = sectionWhoopPersonalBar.querySelector<HTMLElement>(
        '[data-personal-bar-iii-panel-bg]',
      );
      const whoopPersonalBarIIICards = Array.from(
        sectionWhoopPersonalBar.querySelectorAll<HTMLElement>('[data-personal-bar-iii-card]'),
      );

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let pendingLayoutSyncRaf: number | null = null;
      let layoutScrollTrackEndVh = 0;

      const scheduleLayoutSync = () => {
        if (pendingLayoutSyncRaf !== null) return;
        pendingLayoutSyncRaf = requestAnimationFrame(() => {
          pendingLayoutSyncRaf = null;
          preserveScrollTrackProgress(scrollTrack, () => {
            if (layoutScrollTrackEndVh > 0) {
              applyScrollTrackHeight(scrollTrack, layoutScrollTrackEndVh);
            }
            ScrollTrigger.refresh(true);
          });
          // Second frame: snap scrubbed master timeline after geometry settles.
          requestAnimationFrame(() => {
            ScrollTrigger.update();
            syncScrollTrackAnimations(scrollTrack);
          });
        });
      };
      scheduleLayoutSyncRef.current = scheduleLayoutSync;

      if (reducedMotion) {
        gsap.set(sectionZero, { opacity: 0 });
        gsap.set(sectionOne, { opacity: 1 });
        gsap.set(whoWeAreContent, { opacity: 1 });
        gsap.set(sectionTwo, { opacity: 0 });
        gsap.set(sectionAgreements, { opacity: 1 });
        gsap.set(sectionWhoopPersonalBar, { opacity: 0 });
        gsap.set(whoopPersonalBarBgLogo, { opacity: 0.5 });
        gsap.set(whoopPersonalBarContent, { y: 0 });
        if (whoopPersonalBarIIIPanelBg) gsap.set(whoopPersonalBarIIIPanelBg, { y: 0 });
        if (whoopPersonalBarIIICards.length > 0) {
          gsap.set(whoopPersonalBarIIICards, { opacity: 1, x: 0 });
        }
        gsap.set(sectionActions, { opacity: 1 });
        if (pageIndicator) gsap.set(pageIndicator, { opacity: 0 });
        return;
      }

      const ctx = gsap.context(() => {
        const buildScenes = (isCompactMode: boolean) => {
          // Prefer live layout width so DevTools/phone never keep a stale desktop timeline.
          const liveCompact = readIsCompactViewport(getLayoutViewportWidthPx());
          const compactMode = liveCompact || isCompactMode;
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
            sectionAgreements,
            sectionWhoopPersonalBar,
            sectionActions,
            pageIndicator,
          );
          gsap.set(whoopPersonalBarBgLogo, { opacity: 0, scale: 0.88 });
          gsap.set(whoopPersonalBarContent, { y: PERSONAL_BAR_CONTENT_START_Y });
          if (whoopPersonalBarIIIPanelBg) {
            gsap.set(whoopPersonalBarIIIPanelBg, { y: '-6%' });
          }
          if (whoopPersonalBarIIICards.length > 0) {
            gsap.set(
              whoopPersonalBarIIICards,
              compactMode
                ? { opacity: 0, xPercent: -18, x: -24 }
                : { opacity: 0, xPercent: -70, x: -80 },
            );
          }
          if (emptyBeatOverlay) {
            gsap.set(emptyBeatOverlay, { opacity: 0 });
          }
          if (agreementsScrollLine) {
            gsap.set(agreementsScrollLine, { opacity: 0, y: 0 });
          }
          const viewportHeight = getViewportBelowNavbar();
          const { phases, motion, scrollTrackEndVh } = buildIntroScrollPhases(compactMode, {
            viewportHeight,
            whoopContentHeight: measurePersonalBarContentHeight(whoopPersonalBarContent),
          });
          const { whoopEndY: whoopContentEndY } = motion;

          applyScrollTrackHeight(scrollTrack, scrollTrackEndVh);
          layoutScrollTrackEndVh = scrollTrackEndVh;
          setScrollTrackEndVh(scrollTrackEndVh);
          setIntroNavSections(
            buildIntroNavSections({
              whoopPersonalBarScroll: phases.whoopPersonalBarScroll,
              actionsScroll: phases.actionsScroll,
            }),
          );
          resetWhoLetterStartFrame();
          createPrimaryMasterTimeline({
            phases: {
              typingFadeOut: phases.typingFadeOut,
              whoContentIn: phases.whoContentIn,
              whoSectionIn: phases.whoSectionIn,
              whoLettersMove: phases.whoLettersMove,
              whoSectionOut: phases.whoSectionOut,
              howSectionIn: phases.howSectionIn,
              howLettersMove: phases.howLettersMove,
              howSectionOut: phases.howSectionOut,
              agreementsFadeIn: phases.agreementsFadeIn,
              agreementsMarquee: phases.agreementsMarquee,
              whoopPersonalBarScroll: phases.whoopPersonalBarScroll,
              actionsScroll: phases.actionsScroll,
            },
            sections: {
              sectionZero,
              sectionOne,
              sectionTwo,
              whoWeAreContent,
              whoLetterO,
              whoLetterS,
              whoLetterR,
              howLetterO,
              howLetterS,
              howLetterR,
              sectionAgreements,
              sectionWhoopPersonalBar,
              whoopPersonalBarBgLogo,
              whoopPersonalBarContent,
              sectionActions,
            },
            whoopContentEndY,
            whoopPersonalBarIIIPanelBg,
            whoopPersonalBarIIICards,
            pageIndicator: pageIndicator ?? null,
            emptyBeatOverlay,
            agreementsScrollLine,
            scrollTrack,
            scrollTrackEndVh,
            isCompactMode: compactMode,
            useEarlyWhoopCardEntrance: getLayoutViewportWidthPx() <= EARLY_WHOOP_CARD_ENTRANCE_MAX_WIDTH_PX,
          });
          scheduleLayoutSync();
        };
        buildScenes(isCompactViewport);
      }, introRoot);

      scheduleLayoutSync();
      window.addEventListener('load', scheduleLayoutSync);
      document.fonts?.ready.then(scheduleLayoutSync);

      let resizeTimer: ReturnType<typeof setTimeout> | undefined;
      let lastLayoutWidth = getLayoutViewportWidthPx();
      const onWindowResize = () => {
        const nextLayoutWidth = getLayoutViewportWidthPx();
        const widthChanged = nextLayoutWidth !== lastLayoutWidth;
        lastLayoutWidth = nextLayoutWidth;

        // On mobile/compact view, browser chrome show/hide can fire frequent resize events
        // while scrolling; avoid refreshing triggers unless layout width actually changes.
        if (isCompactViewport && !widthChanged) return;

        // Live snap while dragging the window; debounced refresh for pin/end geometry.
        preserveScrollTrackProgress(scrollTrack, () => {
          if (layoutScrollTrackEndVh > 0) {
            applyScrollTrackHeight(scrollTrack, layoutScrollTrackEndVh);
          }
        });
        syncScrollTrackAnimations(scrollTrack);

        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(scheduleLayoutSync, 120);
      };
      window.addEventListener('resize', onWindowResize);

      return () => {
        if (previousScrollRestoration !== null) {
          window.history.scrollRestoration = previousScrollRestoration;
        }
        if (pendingLayoutSyncRaf !== null) {
          cancelAnimationFrame(pendingLayoutSyncRaf);
          pendingLayoutSyncRaf = null;
        }
        scheduleLayoutSyncRef.current = null;
        window.removeEventListener('load', scheduleLayoutSync);
        window.removeEventListener('resize', onWindowResize);
        if (resizeTimer) clearTimeout(resizeTimer);
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

  const letterBase = isCompactViewport
    ? 'pointer-events-none absolute select-none font-bold leading-none font-[Montserrat,sans-serif] text-[clamp(3.25rem,16vw,7rem)]'
    : 'pointer-events-none absolute select-none font-bold leading-none font-[Montserrat,sans-serif] text-[clamp(5rem,22vw,14rem)] md:text-[clamp(7rem,22em,22rem)]';
  const storyCopyClass = isCompactViewport
    ? 'mt-4 text-base leading-relaxed text-gray-800'
    : 'mt-5 text-lg leading-relaxed text-gray-800 md:text-4xl';
  const storyContentWidthClass = isCompactViewport
    ? 'relative z-[2] w-[88%] max-w-3xl pt-10'
    : 'relative z-[2] w-[75%] max-w-3xl md:w-1/2';
  const heroContentWidthClass = isCompactViewport
    ? 'w-[88%] max-w-4xl pt-10'
    : 'w-[75%] max-w-4xl md:w-1/2';

  return (
    <div ref={introRootRef} className="relative w-full bg-white">
      {/* Tall scroll track — phase timings live in osrIntroTimeline.ts */}
      <div
        ref={scrollTrackRef}
        className="relative w-full"
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
        compactLayout={isCompactViewport}
      />

      {/* Compact Typing→Who wipe: solid white covering all story layers for one viewport of scroll. */}
      <div
        data-compact-empty-beat
        className="pointer-events-none fixed inset-x-0 top-[var(--navbar-height)] bottom-0 z-[90] bg-white opacity-0"
        aria-hidden
      />

      <div
        data-page-indicator
        className={`pointer-events-none fixed left-[20%] z-[21] h-[45%] w-0.5 ${
          isCompactViewport ? 'hidden' : ''
        }`}
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
        <div className={heroContentWidthClass}>
          <p
            className={
              isCompactViewport
                ? 'text-sm font-semibold uppercase tracking-wide'
                : 'text-sm font-semibold uppercase tracking-wide md:text-xl'
            }
            style={{ color: ACCENT_CORAL }}
          >
            Open Source Resume is{' '}
          </p>
          <TypingHeroLine
            descriptions={TYPING_DESCRIPTIONS}
            className={
              isCompactViewport
                ? 'mt-4 min-h-[1.8em] border-b border-[#F57360] pb-4 text-lg font-semibold text-[#F57360]'
                : 'mt-5 min-h-[1.8em] border-b border-[#F57360] pb-5 text-xl font-semibold text-[#F57360] md:text-4xl'
            }
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
          className={`${storyContentWidthClass} opacity-0`}
        >
          <h2
            id="intro-who-heading"
            className={
              isCompactViewport
                ? 'text-sm font-extrabold uppercase tracking-wide text-black'
                : 'text-sm font-extrabold uppercase tracking-wide text-black md:text-xl'
            }
          >
            Who we are
          </h2>
          <p className={storyCopyClass}>
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

        <div className={storyContentWidthClass}>
          <h2
            id="intro-how-heading"
            className={
              isCompactViewport
                ? 'text-sm font-extrabold uppercase tracking-wide text-black'
                : 'text-sm font-extrabold uppercase tracking-wide text-black md:text-xl'
            }
          >
            How it works
          </h2>
          <p className={storyCopyClass}>
            SWE Hiring Managers define their dream candidate in terms of measurable open source
            achievements. Their personal bar becomes an actionable pathway for junior devs.
          </p>
        </div>
      </section>

      {/* Phase 4 — personal bar agreements marquee */}
      <IntroAgreementsSection
        sectionShell={sectionShell}
        sectionStyle={sectionShellStyle}
        sectionRef={sectionAgreementsRef}
      />

      {/* Phase 5 — Whoop personal bar */}
      <WhoopPersonalBarSection
        sectionShell={sectionShell}
        sectionStyle={sectionShellStyle}
        compactLayout={isCompactViewport}
        refs={{
          section: sectionWhoopPersonalBarRef,
          bgLogo: whoopPersonalBarBgLogoRef,
          content: whoopPersonalBarContentRef,
        }}
      />

      {/* Phase 6 — contact / what's next */}
      <IntroActionsSection
        sectionShell={actionsSectionShell}
        sectionStyle={sectionShellStyle}
        sectionRef={sectionActionsRef}
        compactLayout={isCompactViewport}
        onSignUp={() => {
          void handleSignIn();
        }}
      />
    </div>
  );
}
