import { getPhaseEndVh } from './osrScrollUtils';

/**
 * Left-nav sections for the homepage intro scroll story.
 *
 * ## Coordinate system (same as GSAP / `osrIntroTimeline.ts`)
 *
 * All positions are **track vh**: multiples of the viewport height below the fixed
 * navbar, measured from the top of the scroll track.
 *
 * - `startVh` — scroll position where this nav label becomes active
 * - `jumpVh` — scroll target (intro / who / how, or fallback when anchor is missing)
 *
 * ## Nav jumps
 *
 * **Scroll-content sections** (personal bars, affiliations, actions): on click,
 * `introScrollJump.ts` searches scroll so the heading sits at
 * `SCROLL_CONTENT_HEADING_TOP_VH` below the navbar.
 *
 * **Fixed sections** (who, how): the heading does not move with scroll — tune
 * `JUMP_OFFSET_VH` (added to the phase start) instead.
 */

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
  whoSectionIn: IntroNavPhase;
  howSectionIn: IntroNavPhase;
  whoopPersonalBarScroll: IntroNavPhase;
  microsoftPersonalBarScroll: IntroNavPhase;
  metaPersonalBarScroll: IntroNavPhase;
  affiliationsScroll: IntroNavPhase;
  actionsScroll: IntroNavPhase;
};

/** vh below navbar for scroll-content section headings (personal bars, affiliations, actions). */
const SCROLL_CONTENT_HEADING_TOP_VH = 14;

/** Extra scroll (vh) past phase start for fixed overlay sections. Positive = farther down. */
const JUMP_OFFSET_VH = {
  who: 2.2,
  how: 0.6,
} as const;

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
  const who = phases.whoSectionIn.at;
  const how = phases.howSectionIn.at;
  const whoop = phases.whoopPersonalBarScroll.at;
  const microsoft = phases.microsoftPersonalBarScroll.at;
  const meta = phases.metaPersonalBarScroll.at;
  const affiliations = phases.affiliationsScroll.at;
  const actions = phases.actionsScroll.at;
  const scrollEndVh = getPhaseEndVh(phases.actionsScroll);

  return [
    {
      id: 'intro',
      label: 'Intro',
      startVh: 0,
      jumpVh: 0,
    },
    {
      id: 'who',
      label: 'Who',
      startVh: who,
      jumpVh: who + JUMP_OFFSET_VH.who,
    },
    {
      id: 'how',
      label: 'How',
      startVh: how,
      jumpVh: how + JUMP_OFFSET_VH.how,
    },
    {
      id: 'whoop',
      label: 'Personal Bar 1',
      startVh: whoop,
      jumpVh: whoop,
      anchorJump: scrollContentAnchorJump(
        'whoop-bar-heading',
        whoop,
        getPhaseEndVh(phases.whoopPersonalBarScroll),
      ),
    },
    {
      id: 'microsoft',
      label: 'Personal Bar 2',
      startVh: microsoft,
      jumpVh: microsoft,
      anchorJump: scrollContentAnchorJump(
        'microsoft-bar-heading',
        microsoft,
        getPhaseEndVh(phases.microsoftPersonalBarScroll),
      ),
    },
    {
      id: 'meta',
      label: 'Personal Bar 3',
      startVh: meta,
      jumpVh: meta,
      anchorJump: scrollContentAnchorJump(
        'meta-bar-heading',
        meta,
        getPhaseEndVh(phases.metaPersonalBarScroll),
      ),
    },
    {
      id: 'affiliations',
      label: 'Affiliations',
      startVh: affiliations,
      jumpVh: affiliations,
      anchorJump: scrollContentAnchorJump(
        'affiliations-heading',
        affiliations,
        getPhaseEndVh(phases.affiliationsScroll),
      ),
    },
    {
      id: 'actions',
      label: "What's next",
      startVh: actions,
      jumpVh: scrollEndVh,
      anchorJump: scrollContentAnchorJump(
        'intro-actions-heading',
        actions,
        scrollEndVh,
      ),
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
