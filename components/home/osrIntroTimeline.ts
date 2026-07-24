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
 *
 * Agreements beat: How fades out fully (`howSectionOut`), then agreements fade
 * 0 → 0.5 → 1 (`agreementsFadeIn`), hold at full opacity (`agreementsMarquee`),
 * then fade out as Whoop personal bar begins (`whoopPersonalBarScroll`).
 * Contact fades in after Whoop (`actionsScroll` crossfade only — no content scroll).
 */
import {
  getContentScrollTravelVh,
  getPersonalBarContentEndY,
  getPhaseEndVh,
  PERSONAL_BAR_CONTENT_START_VH,
} from './osrScrollUtils';

type OsrScrollPhase = {
  at: number;
  durationPercent: number;
};

const OSR_INTRO_PHASE_DURATIONS = {
  // Direct knob: change value to change timing.
  typingFadeOut: 40,
  // Direct knob.
  whoSectionIn: 50,
  // Derived by default (see `resolvePhaseDuration`) unless override is set.
  whoLettersMove: 170,
  // Direct knob (parallel phase).
  whoContentIn: 40,
  // Direct knob.
  whoSectionOut: 40,
  // Direct knob.
  howSectionIn: 30,
  // Derived by default (min floor) unless override is set.
  howLettersMove: 80, // minimum; resolved to match Who story chapter length
  // Direct knob.
  howSectionOut: 40,
} as const;

const OSR_INTRO_PHASE_DURATIONS_MOBILE: Partial<
  Record<keyof typeof OSR_INTRO_PHASE_DURATIONS, number>
> = {
  typingFadeOut: 30,
  whoSectionIn: 40,
  // Keep letters+copy on screen long enough to read (desktop is 170).
  whoLettersMove: 100,
  whoContentIn: 40,
  whoSectionOut: 40,
  howSectionIn: 35,
  howSectionOut: 35,
};

const OSR_CONTENT_PHASE_DURATIONS = {
  // Direct knob.
  agreementsFadeIn: 40,
  // Derived by default unless override is set.
  agreementsMarquee: 0, // resolved in `resolvePhaseDuration` (half Who-chapter hold)
  // `whoopPersonalBarScroll` is derived from measured travel unless override is set.
  actionsScroll: 8,
} as const;

const OSR_CONTENT_PHASE_DURATIONS_MOBILE: Partial<
  Record<keyof typeof OSR_CONTENT_PHASE_DURATIONS, number>
> = {
  agreementsFadeIn: 20,
  actionsScroll: 6,
};
/**
 * Optional overrides for derived phase durations.
 * Set to a number to force that durationPercent directly.
 * Keep `null` to use the computed/derived behavior.
 */
const PHASE_DURATION_OVERRIDES = {
  howLettersMove: null as number | null,
  agreementsMarquee: null as number | null,
  whoopPersonalBarScroll: null as number | null,
};
/**
 * Whoop timing is derived from measured content travel (see `getWhoopScrollDuration`)
 * so Contact can appear as soon as Whoop content clears the viewport.
 */
const WHOOP_END_MIN_VH = 90;

/** Sequential scroll story — must match scene attachment in OsrIntroScroll.tsx. */
const PHASE_ORDER = [
  'typingFadeOut',
  'whoSectionIn',
  'whoLettersMove',
  'whoSectionOut',
  'howSectionIn',
  'howLettersMove',
  'howSectionOut',
  'agreementsFadeIn',
  'agreementsMarquee',
  'whoopPersonalBarScroll',
  'actionsScroll',
] as const;

type OsrIntroPhaseKey = keyof typeof OSR_INTRO_PHASE_DURATIONS;
type OsrContentPhaseKey = keyof typeof OSR_CONTENT_PHASE_DURATIONS;
type OsrSequentialPhaseKey = (typeof PHASE_ORDER)[number];
type OsrPhaseKey = OsrSequentialPhaseKey | 'whoContentIn';

/** Fixed overlay beats — Who section visible through `whoSectionOut`. */
const WHO_STORY_PHASES = ['whoSectionIn', 'whoLettersMove', 'whoSectionOut'] as const satisfies readonly OsrIntroPhaseKey[];
/** Fixed overlay beats — How section visible through `howSectionOut`. */
const HOW_STORY_CORE_PHASES = ['howSectionIn', 'howSectionOut'] as const satisfies readonly OsrIntroPhaseKey[];

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
} as const;

type IntroContentMeasurements = {
  viewportHeight: number;
  whoopContentHeight: number;
};

type IntroContentMotion = {
  whoopEndY: string;
};

function getAgreementsStoryDuration(isMobile: boolean): number {
  return getStoryChapterDuration(WHO_STORY_PHASES, isMobile);
}

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
    whoopContentHeight: ESTIMATED_CONTENT_HEIGHTS.whoop,
  };
}

function resolveContentMotion(measurements: IntroContentMeasurements): IntroContentMotion {
  return {
    whoopEndY: getPersonalBarContentEndY(
      measurements.whoopContentHeight,
      measurements.viewportHeight,
      WHOOP_END_MIN_VH,
      0,
    ),
  };
}

function getWhoopScrollDuration(motion: IntroContentMotion): number {
  const travelVh = getContentScrollTravelVh(PERSONAL_BAR_CONTENT_START_VH, motion.whoopEndY);
  return Math.max(1, Math.round(Math.max(0, travelVh)));
}

function resolvePhaseDuration(
  key: OsrSequentialPhaseKey,
  isMobile: boolean,
  motion: IntroContentMotion,
): number {
  switch (key) {
    case 'whoopPersonalBarScroll':
      if (PHASE_DURATION_OVERRIDES.whoopPersonalBarScroll !== null) {
        return PHASE_DURATION_OVERRIDES.whoopPersonalBarScroll;
      }
      return getWhoopScrollDuration(motion);
    case 'howLettersMove': {
      if (PHASE_DURATION_OVERRIDES.howLettersMove !== null) {
        return PHASE_DURATION_OVERRIDES.howLettersMove;
      }
      const whoStoryDuration = getStoryChapterDuration(WHO_STORY_PHASES, isMobile);
      const howCoreDuration = getStoryChapterDuration(HOW_STORY_CORE_PHASES, isMobile);
      const minDuration = getIntroPhaseDuration('howLettersMove', isMobile);
      return Math.max(minDuration, whoStoryDuration - howCoreDuration);
    }
    case 'agreementsMarquee':
      if (PHASE_DURATION_OVERRIDES.agreementsMarquee !== null) {
        return PHASE_DURATION_OVERRIDES.agreementsMarquee;
      }
      return (
        (getAgreementsStoryDuration(isMobile) -
          getContentPhaseDuration('agreementsFadeIn', isMobile)) /
        2
      );
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

/**
 * Share of `whoopPersonalBarScroll` used for the agreements → Whoop crossfade.
 * Must match `duration` values on those tweens in `OsrIntroScroll.tsx`.
 */
export const WHOOP_ENTRANCE_CROSSFADE_SHARE = 0.03;

/**
 * How far into `whoopPersonalBarScroll` the orange page indicator finishes
 * climbing off-screen. Opacity is never tweened — only `top`. Keep the line at
 * z-[21] in OsrIntroScroll (above story sections, below Contact) so section
 * crossfades do not wash over it.
 */
export const PAGE_INDICATOR_WHOOP_EXIT_SHARE = 0.15;

/**
 * Parallel intro phase — orange line climbs Intro → Agreements, exiting partway
 * into the Whoop personal-bar entrance.
 */
export function getPageIndicatorScrollPhase(
  whoopPersonalBarScrollPhase: OsrScrollPhase,
): OsrScrollPhase {
  const exitVh =
    whoopPersonalBarScrollPhase.at +
    (whoopPersonalBarScrollPhase.durationPercent / 100) * PAGE_INDICATOR_WHOOP_EXIT_SHARE;
  return {
    at: 0,
    durationPercent: exitVh * 100,
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
