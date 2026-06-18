/**
 * Homepage scroll phases (viewport-height multiples).
 *
 * **Sequential chain** (`PHASE_ORDER`): each phase `at` is the end of the previous phase.
 * Store only `durationPercent` per phase; `buildIntroScrollPhases` assigns `at`.
 *
 * **Parallel phases** (own scroll window, not in `PHASE_ORDER`):
 * - `whoContentIn` — starts when typing hero is fully gone
 * - page indicator — see `getPageIndicatorScrollPhase()`
 *
 * Pattern for content sections: scroll → crossfade → scroll → crossfade …
 */
import {
  ACTIONS_CONTENT_START_VH,
  getAffiliationsContentEndY,
  getActionsContentEndY,
  getContentScrollTravelVh,
  getMetaContentEndY,
  getPersonalBarContentEndY,
  getPhaseEndVh,
  getScrollDurationForTravelVh,
  PERSONAL_BAR_CONTENT_START_VH,
} from './osrScrollUtils';

type OsrScrollPhase = {
  at: number;
  durationPercent: number;
};

const OSR_INTRO_PHASE_DURATIONS = {
  typingFadeOut: 40,
  whoSectionIn: 50,
  whoLettersMove: 170,
  whoContentIn: 40,
  whoSectionOut: 40,
  howSectionIn: 30,
  howLettersMove: 80, // minimum; resolved to match Who story chapter length
  howToWhoop: 8,
} as const;

const OSR_INTRO_PHASE_DURATIONS_MOBILE: Partial<
  Record<keyof typeof OSR_INTRO_PHASE_DURATIONS, number>
> = {
  typingFadeOut: 20,
  whoSectionIn: 20,
  whoLettersMove: 30,
  whoContentIn: 20,
  howToWhoop: 6,
};

const OSR_CONTENT_PHASE_DURATIONS = {
  whoopPersonalBarScroll: 400,
  whoopToMicrosoft: 32,
  microsoftPersonalBarScroll: 420,
  microsoftToMeta: 32,
  metaPersonalBarScroll: 55,
  metaToAffiliations: 32,
  affiliationsScroll: 55,
  actionsScroll: 36,
} as const;

const OSR_CONTENT_PHASE_DURATIONS_MOBILE: Partial<
  Record<keyof typeof OSR_CONTENT_PHASE_DURATIONS, number>
> = {
  whoopPersonalBarScroll: 430,
  whoopToMicrosoft: 34,
  microsoftPersonalBarScroll: 450,
  microsoftToMeta: 34,
  metaPersonalBarScroll: 45,
  metaToAffiliations: 34,
  affiliationsScroll: 45,
  actionsScroll: 36,
};

/** Sequential scroll story — must match scene attachment in OsrIntroScroll.tsx. */
const PHASE_ORDER = [
  'typingFadeOut',
  'whoSectionIn',
  'whoLettersMove',
  'whoSectionOut',
  'howSectionIn',
  'howLettersMove',
  'howToWhoop',
  'whoopPersonalBarScroll',
  'whoopToMicrosoft',
  'microsoftPersonalBarScroll',
  'microsoftToMeta',
  'metaPersonalBarScroll',
  'metaToAffiliations',
  'affiliationsScroll',
  'actionsScroll',
] as const;

type OsrIntroPhaseKey = keyof typeof OSR_INTRO_PHASE_DURATIONS;
type OsrContentPhaseKey = keyof typeof OSR_CONTENT_PHASE_DURATIONS;
type OsrSequentialPhaseKey = (typeof PHASE_ORDER)[number];
type OsrPhaseKey = OsrSequentialPhaseKey | 'whoContentIn';

/** Fixed overlay beats — Who section visible through `whoSectionOut`. */
const WHO_STORY_PHASES = ['whoSectionIn', 'whoLettersMove', 'whoSectionOut'] as const satisfies readonly OsrIntroPhaseKey[];
/** Fixed overlay beats — How section visible through `howToWhoop`. */
const HOW_STORY_CORE_PHASES = ['howSectionIn', 'howToWhoop'] as const satisfies readonly OsrIntroPhaseKey[];

function getStoryChapterDuration(
  phaseKeys: readonly OsrIntroPhaseKey[],
  isMobile: boolean,
): number {
  return phaseKeys.reduce((total, key) => total + getIntroPhaseDuration(key, isMobile), 0);
}

const STAGE_BASE_HEIGHT = 1080;
const MOBILE_VIEWPORT_HEIGHT = 844;

const ESTIMATED_CONTENT_HEIGHTS = {
  whoop: 900,
  microsoft: 1100,
  meta: 950,
  affiliations: 500,
  actions: 680,
} as const;

type IntroContentMeasurements = {
  viewportHeight: number;
  layoutReferenceHeight: number;
  whoopContentHeight: number;
  microsoftContentHeight: number;
  metaContentHeight: number;
  affiliationsContentHeight: number;
  actionsContentHeight: number;
};

type IntroContentMotion = {
  whoopEndY: string;
  microsoftEndY: string;
  metaEndY: string;
  affiliationsEndY: string;
  actionsEndY: string;
};

function getIntroPhaseDuration(key: OsrIntroPhaseKey, isMobile: boolean): number {
  const mobile = OSR_INTRO_PHASE_DURATIONS_MOBILE[key];
  if (isMobile && mobile !== undefined) return mobile;
  return OSR_INTRO_PHASE_DURATIONS[key];
}

function getContentPhaseDuration(key: OsrContentPhaseKey, isMobile: boolean): number {
  const mobile = OSR_CONTENT_PHASE_DURATIONS_MOBILE[key];
  if (isMobile && mobile !== undefined) return mobile;
  return OSR_CONTENT_PHASE_DURATIONS[key];
}

function estimatedMeasurements(isMobile: boolean): IntroContentMeasurements {
  const viewport = isMobile ? MOBILE_VIEWPORT_HEIGHT : STAGE_BASE_HEIGHT;
  return {
    viewportHeight: viewport,
    layoutReferenceHeight: viewport,
    whoopContentHeight: ESTIMATED_CONTENT_HEIGHTS.whoop,
    microsoftContentHeight: ESTIMATED_CONTENT_HEIGHTS.microsoft,
    metaContentHeight: ESTIMATED_CONTENT_HEIGHTS.meta,
    affiliationsContentHeight: ESTIMATED_CONTENT_HEIGHTS.affiliations,
    actionsContentHeight: ESTIMATED_CONTENT_HEIGHTS.actions,
  };
}

function resolveContentMotion(measurements: IntroContentMeasurements): IntroContentMotion {
  const { viewportHeight, layoutReferenceHeight } = measurements;
  return {
    whoopEndY: getPersonalBarContentEndY(measurements.whoopContentHeight, viewportHeight, 135),
    microsoftEndY: getPersonalBarContentEndY(
      measurements.microsoftContentHeight,
      viewportHeight,
      185,
    ),
    metaEndY: getMetaContentEndY(measurements.metaContentHeight, layoutReferenceHeight),
    affiliationsEndY: getAffiliationsContentEndY(
      measurements.affiliationsContentHeight,
      layoutReferenceHeight,
    ),
    actionsEndY: getActionsContentEndY(
      measurements.actionsContentHeight,
      layoutReferenceHeight,
    ),
  };
}

function scrollDurationForEndY(
  startVh: number,
  endY: string,
  minDurationPercent: number,
): number {
  return getScrollDurationForTravelVh(
    getContentScrollTravelVh(startVh, endY),
    minDurationPercent,
  );
}

function resolvePhaseDuration(
  key: OsrSequentialPhaseKey,
  isMobile: boolean,
  motion: IntroContentMotion,
): number {
  switch (key) {
    case 'whoopPersonalBarScroll':
      return scrollDurationForEndY(
        PERSONAL_BAR_CONTENT_START_VH,
        motion.whoopEndY,
        getContentPhaseDuration(key, isMobile),
      );
    case 'microsoftPersonalBarScroll':
      return scrollDurationForEndY(
        PERSONAL_BAR_CONTENT_START_VH,
        motion.microsoftEndY,
        getContentPhaseDuration(key, isMobile),
      );
    case 'metaPersonalBarScroll':
      return scrollDurationForEndY(
        PERSONAL_BAR_CONTENT_START_VH,
        motion.metaEndY,
        getContentPhaseDuration(key, isMobile),
      );
    case 'affiliationsScroll':
      return scrollDurationForEndY(
        PERSONAL_BAR_CONTENT_START_VH,
        motion.affiliationsEndY,
        getContentPhaseDuration(key, isMobile),
      );
    case 'actionsScroll':
      return scrollDurationForEndY(
        ACTIONS_CONTENT_START_VH,
        motion.actionsEndY,
        getContentPhaseDuration(key, isMobile),
      );
    case 'howLettersMove': {
      const whoStoryDuration = getStoryChapterDuration(WHO_STORY_PHASES, isMobile);
      const howCoreDuration = getStoryChapterDuration(HOW_STORY_CORE_PHASES, isMobile);
      const minDuration = getIntroPhaseDuration('howLettersMove', isMobile);
      return Math.max(minDuration, whoStoryDuration - howCoreDuration);
    }
    default:
      if (key in OSR_INTRO_PHASE_DURATIONS) {
        return getIntroPhaseDuration(key as OsrIntroPhaseKey, isMobile);
      }
      return getContentPhaseDuration(key as OsrContentPhaseKey, isMobile);
  }
}

/** Who copy fades in as soon as the typing hero is fully gone (parallel with whoSectionIn). */
function getWhoContentInScrollPhase(
  typingFadeOutPhase: OsrScrollPhase,
  isMobile: boolean,
): OsrScrollPhase {
  return {
    at: getPhaseEndVh(typingFadeOutPhase),
    durationPercent: getIntroPhaseDuration('whoContentIn', isMobile),
  };
}

/** Parallel intro phase — line scrolls through the unified intro story (Intro → How). */
export function getPageIndicatorScrollPhase(howToWhoopPhase: OsrScrollPhase): OsrScrollPhase {
  return {
    at: 0,
    durationPercent: getPhaseEndVh(howToWhoopPhase) * 100,
  };
}

export function buildIntroScrollPhases(
  isMobile: boolean,
  measurements: IntroContentMeasurements,
): {
  phases: Record<OsrPhaseKey, OsrScrollPhase>;
  motion: IntroContentMotion;
  scrollTrackEndVh: number;
} {
  const motion = resolveContentMotion(measurements);
  let at = 0;
  const phases = {} as Record<OsrPhaseKey, OsrScrollPhase>;

  for (const key of PHASE_ORDER) {
    const durationPercent = resolvePhaseDuration(key, isMobile, motion);
    phases[key] = { at, durationPercent };
    at = getPhaseEndVh(phases[key]);
  }

  phases.whoContentIn = getWhoContentInScrollPhase(phases.typingFadeOut, isMobile);

  return { phases, motion, scrollTrackEndVh: getPhaseEndVh(phases.actionsScroll) };
}

/** Pre-measurement scroll track height (updated once content is measured in GSAP). */
export function getOsrScrollHeightVh(isMobile: boolean): number {
  return buildIntroScrollPhases(isMobile, estimatedMeasurements(isMobile)).scrollTrackEndVh;
}
