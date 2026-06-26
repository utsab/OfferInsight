/**
 * Jump nav pill sizing — tweak these to taste.
 *
 * Desktop (`IntroScrollNav.tsx`): every label + progress bar uses the same width.
 * Mobile (`StaticIntroNav.tsx`): row buttons share width equally via flex; adjust
 * horizontal padding on the nav shell if the row feels too tight or too wide.
 */
export const INTRO_NAV_DESKTOP_ITEM_WIDTH_CLASS = 'w-[8.25rem] sm:w-[9rem] md:w-[9.5rem]';
export const INTRO_NAV_MOBILE_NAV_PADDING_CLASS = 'px-3 sm:px-5';

/**
 * Left-nav sections for the homepage intro scroll story.
 *
 * ## Coordinate system (same as GSAP / `osrIntroTimeline.ts`)
 *
 * All positions are **track vh**: multiples of the viewport height below the fixed
 * navbar, measured from the top of the scroll track.
 *
 * - `startVh` — scroll position where this nav label becomes active
 * - `jumpVh` — scroll target when anchor jump is unavailable
 *
 * ## Nav jumps
 *
 * **Intro** — scroll to page top (`scrollY` 0).
 *
 * **Personal Bar** — `introScrollJump.ts` aligns the first personal-bar heading
 * below the navbar.
 *
 * **Contact** — `jumpVh` is the track end (`getPhaseEndVh(actionsScroll)`); same
 * document-coordinate scroll path as other sections via `scrollToTrackOffsetPx`.
 */

import { getPhaseEndVh } from './osrScrollUtils';

type IntroNavAnchorJump = {
  anchorId: string;
  targetFromTopVh: number;
  scrollMinVh: number;
  scrollMaxVh: number;
};

export type IntroNavSection = {
  id: string;
  label: string;
  startVh: number;
  jumpVh: number;
  anchorJump?: IntroNavAnchorJump;
};

type IntroNavPhase = {
  at: number;
  durationPercent: number;
};

/** Phase subset needed to resolve nav scroll ranges. */
type IntroNavBuildPhases = {
  whoopPersonalBarScroll: IntroNavPhase;
  actionsScroll: IntroNavPhase;
};

/** vh below navbar for personal-bar heading alignment in anchor jumps. */
const SCROLL_CONTENT_HEADING_TOP_VH = 14;

function scrollContentAnchorJump(
  anchorId: string,
  scrollMinVh: number,
  scrollMaxVh: number,
): IntroNavAnchorJump {
  return {
    anchorId,
    targetFromTopVh: SCROLL_CONTENT_HEADING_TOP_VH,
    scrollMinVh,
    scrollMaxVh,
  };
}

export function buildIntroNavSections(phases: IntroNavBuildPhases): IntroNavSection[] {
  const whoop = phases.whoopPersonalBarScroll.at;
  const actions = phases.actionsScroll.at;
  const trackEndVh = getPhaseEndVh(phases.actionsScroll);

  return [
    {
      id: 'intro',
      label: 'Intro',
      startVh: 0,
      jumpVh: 0,
    },
    {
      id: 'personal-bar',
      label: 'Personal Bar',
      startVh: whoop,
      jumpVh: whoop,
      anchorJump: scrollContentAnchorJump('whoop-bar-heading', whoop, actions),
    },
    {
      id: 'contact',
      label: 'Contact',
      startVh: actions,
      jumpVh: trackEndVh,
    },
  ];
}

export function getActiveIntroNavId(
  sections: IntroNavSection[],
  relativeScrollVh: number,
): string {
  if (sections.length === 0) return 'intro';
  let active = sections[0].id;
  for (const section of sections) {
    if (relativeScrollVh + 0.02 >= section.startVh) active = section.id;
  }
  return active;
}

function getIntroNavSectionEndVh(sections: IntroNavSection[], index: number): number {
  const next = sections[index + 1];
  if (next) return next.startVh;
  return sections[index].jumpVh;
}

/** 0 at section start, 1 at section end — drives the active nav progress bar fill. */
export function getIntroNavSectionProgress(
  sections: IntroNavSection[],
  relativeScrollVh: number,
  sectionId: string,
): number {
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index === -1) return 0;

  const section = sections[index];
  const endVh = getIntroNavSectionEndVh(sections, index);
  const span = endVh - section.startVh;
  if (span <= 0) return 1;

  return Math.min(1, Math.max(0, (relativeScrollVh - section.startVh) / span));
}

/** Gilroy-style bar: hidden off-left at -101%, fully revealed at 0%. */
export function getIntroNavProgressBarTranslateX(progress: number): string {
  const hiddenPercent = -101;
  return `${hiddenPercent + progress * -hiddenPercent}%`;
}
