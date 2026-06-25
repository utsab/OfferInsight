import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const TYPING_DESCRIPTIONS = [
  'A pathway for entry-level SWEs',
  'Measurable open source achievements',
  'Hiring-manager-defined benchmarks',
  'Your portfolio, verifiable on GitHub',
] as const;

function getNavbarHeightPxFromCssVar(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--navbar-height').trim();
  if (!raw) return 72;
  if (raw.endsWith('rem')) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(raw) * rootFontSize;
  }
  return parseFloat(raw) || 72;
}

/** Prefer live navbar measurement — CSS var can drift from rendered height on resize. */
export function getSiteNavbarHeightPx(): number {
  if (typeof document !== 'undefined') {
    const navbar = document.getElementById('site-navbar');
    if (navbar) {
      const height = navbar.getBoundingClientRect().height;
      if (height > 0) return height;
    }
  }
  return getNavbarHeightPxFromCssVar();
}

function getNavbarHeightPx(): number {
  return getSiteNavbarHeightPx();
}

/** Viewport height below the fixed navbar (matches pinned hero start). */
export function getViewportBelowNavbar(): number {
  return Math.max(window.innerHeight - getNavbarHeightPx(), 320);
}

/** Absolute viewport Y for a point `offsetVh` below the navbar. */
export function getViewportOffsetTopPx(offsetVh: number): number {
  return getNavbarHeightPx() + (offsetVh / 100) * getViewportBelowNavbar();
}

/** Keep scrubbed ScrollTrigger timelines aligned with the current scroll position. */
export function syncScrollTrackAnimations(scrollTrack: HTMLElement): void {
  ScrollTrigger.getAll().forEach((st) => {
    if (st.trigger !== scrollTrack || !st.animation) return;
    st.animation.progress(st.progress);
  });
}

export function getOsrSceneConfig(
  offsetVh: number,
  durationPercent: number,
  scrub: number | false = 0.45,
) {
  const vh = getViewportBelowNavbar();
  return {
    startPx: Math.round(offsetVh * vh),
    durationPx: Math.round((durationPercent / 100) * vh),
    scrub,
  };
}

export const PERSONAL_BAR_CONTENT_START_VH = 140;
export const PERSONAL_BAR_CONTENT_START_Y = `${PERSONAL_BAR_CONTENT_START_VH}vh`;

/** Actions entry: just below the stage — contact rises in as affiliations exits. */
export const ACTIONS_CONTENT_START_VH = 72;
export const ACTIONS_CONTENT_START_Y = `${ACTIONS_CONTENT_START_VH}vh`;

/** Measure contact section content height (same pattern as personal bars). */
export function measureActionsContentHeight(content: HTMLElement): number {
  gsap.set(content, { y: 0 });
  const height = Math.max(content.scrollHeight, content.getBoundingClientRect().height);
  gsap.set(content, { y: ACTIONS_CONTENT_START_Y });
  return height;
}

/** Measure personal-bar content height without transform affecting layout reads. */
export function measurePersonalBarContentHeight(content: HTMLElement): number {
  gsap.set(content, { y: 0 });
  const height = content.scrollHeight;
  gsap.set(content, { y: PERSONAL_BAR_CONTENT_START_Y });
  return height;
}

/** How far content travels upward (vh) so tall lists can fully scroll through. */
export function getPersonalBarContentEndY(
  contentHeightPx: number,
  viewportHeightPx: number,
  minEndVh: number,
): string {
  const contentVh = (contentHeightPx / viewportHeightPx) * 100;
  const endVh = Math.max(minEndVh, Math.round(contentVh + 55));
  return `-${endVh}vh`;
}

function parseNegativeVh(value: string): number {
  const match = value.match(/^-?(\d+(?:\.\d+)?)vh$/);
  return match ? Number(match[1]) : 0;
}

export function getPhaseEndVh(phase: { at: number; durationPercent: number }): number {
  return phase.at + phase.durationPercent / 100;
}

/**
 * Furthest track-relative scroll (below-navbar vh).
 * Track height uses full window vh; scene math uses viewport below navbar — this closes the gap.
 */
export function getScrollTrackBottomRelativeVh(scrollTrackEndVh: number): number {
  const belowNav = getViewportBelowNavbar();
  const maxPx = Math.max(0, scrollTrackEndVh * window.innerHeight - window.innerHeight);
  return maxPx / belowNav;
}

/** Window scrollY that pins the scroll track to the page bottom. */
export function getScrollTrackBottomPx(scrollTrack: HTMLElement): number {
  return Math.max(
    scrollTrack.offsetTop,
    scrollTrack.offsetTop + scrollTrack.offsetHeight - window.innerHeight,
  );
}

/** Vertical travel (vh) for a content scroll from `startVh` to `endY`. */
export function getContentScrollTravelVh(startVh: number, endY: string): number {
  if (endY.startsWith('-')) {
    return startVh + parseNegativeVh(endY);
  }
  const endVh = Number.parseFloat(endY);
  return startVh - (Number.isFinite(endVh) ? endVh : 0);
}

/**
 * Personal-bar scroll rate: one unit of scroll distance (durationPercent)
 * per vh of content travel — keeps affiliations → actions continuous.
 */
export function getScrollDurationForTravelVh(
  travelVh: number,
  minDurationPercent: number,
): number {
  return Math.round(Math.max(minDurationPercent, travelVh));
}

/** Affiliations logo grid — shorter tail than criteria pages, same scroll rate. */
export function getAffiliationsContentEndY(
  contentHeightPx: number,
  viewportHeightPx: number,
): string {
  const contentVh = (contentHeightPx / viewportHeightPx) * 100;
  const endVh = Math.max(15, Math.round(contentVh + 10));
  return `-${endVh}vh`;
}

/** Contact section — rest with the block's midpoint on screen, not its top edge. */
const ACTIONS_CONTENT_MIDPOINT_VH = 40;

export function getActionsContentEndY(
  contentHeightPx: number,
  stageHeightPx: number,
): string {
  const contentVh = (contentHeightPx / stageHeightPx) * 100;
  if (contentVh >= 100) return '0';
  const offsetVh = Math.round(ACTIONS_CONTENT_MIDPOINT_VH - contentVh / 2);
  return `${Math.max(0, offsetVh)}vh`;
}

