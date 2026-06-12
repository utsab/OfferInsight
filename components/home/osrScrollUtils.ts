import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const TYPING_DESCRIPTIONS = [
  'A pathway for entry-level SWEs',
  'Measurable open source achievements',
  'Hiring-manager-defined benchmarks',
  'Your portfolio, verifiable on GitHub',
] as const;

function getNavbarHeightPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--navbar-height').trim();
  if (!raw) return 72;
  if (raw.endsWith('rem')) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(raw) * rootFontSize;
  }
  return parseFloat(raw) || 72;
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

/** Actions entry: one viewport below (not 140vh). Content scrolls up to y=0. */
export const ACTIONS_CONTENT_START_VH = 100;
export const ACTIONS_CONTENT_START_Y = `${ACTIONS_CONTENT_START_VH}vh`;
export const ACTIONS_CONTENT_END_Y = '0';

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
 * per vh of content travel — keeps Meta → affiliations → actions continuous.
 */
export function getScrollDurationForTravelVh(
  travelVh: number,
  minDurationPercent: number,
): number {
  return Math.round(Math.max(minDurationPercent, travelVh));
}

/** Meta personal bar — shorter tail before affiliations, same scroll rate. */
export function getMetaContentEndY(
  contentHeightPx: number,
  viewportHeightPx: number,
): string {
  const contentVh = (contentHeightPx / viewportHeightPx) * 100;
  const endVh = Math.max(48, Math.round(contentVh + 12));
  return `-${endVh}vh`;
}

/** Affiliations logo grid — shorter tail than criteria pages, same scroll rate. */
export function getAffiliationsContentEndY(
  contentHeightPx: number,
  viewportHeightPx: number,
): string {
  const contentVh = (contentHeightPx / viewportHeightPx) * 100;
  const endVh = Math.max(20, Math.round(contentVh + 24));
  return `-${endVh}vh`;
}

