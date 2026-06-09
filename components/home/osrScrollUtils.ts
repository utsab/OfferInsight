import gsap from 'gsap';

export const TYPING_DESCRIPTIONS = [
  'A pathway for entry-level SWEs',
  'Measurable open source achievements',
  'Hiring-manager-defined benchmarks',
  'Your portfolio, verifiable on GitHub',
] as const;

export function getNavbarHeightPx(): number {
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

/** Scroll-driven scene: offset and duration as multiples of viewport height. */
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

/** Scroll duration (durationPercent) scaled to measured content height. */
export function getPersonalBarScrollDurationPercent(
  contentHeightPx: number,
  viewportHeightPx: number,
  minDurationPercent: number,
): number {
  const contentVh = (contentHeightPx / viewportHeightPx) * 100;
  const travelVh = PERSONAL_BAR_CONTENT_START_VH + Math.max(135, contentVh + 55);
  return Math.round(Math.max(minDurationPercent, travelVh));
}

/** Parse a negative vh string (e.g. `-185vh`) into a positive vh magnitude. */
export function parseNegativeVh(value: string): number {
  const match = value.match(/^-?(\d+(?:\.\d+)?)vh$/);
  return match ? Number(match[1]) : 0;
}

/** Resting y for actions CTA after the 140vh entry (lower than y=0 when content is short). */
export function getActionsContentEndY(
  contentHeightPx: number,
  viewportHeightPx: number,
): string {
  const bottomMarginVh = 7;
  const contentVh = (contentHeightPx / viewportHeightPx) * 100;

  if (contentVh + 16 > 100) {
    return getPersonalBarContentEndY(contentHeightPx, viewportHeightPx, 0);
  }

  const maxSafeEndVh = Math.max(0, (100 - 2 * bottomMarginVh - contentVh) / 2);
  const endVh = Math.round(Math.min(maxSafeEndVh, 22));
  return `${endVh}vh`;
}

/** Vertical travel for actions entry, paired with getMatchedScrollDurationPercent. */
export function getActionsScrollTravelVh(endY: string): number {
  if (endY.startsWith('-')) {
    return PERSONAL_BAR_CONTENT_START_VH + parseNegativeVh(endY);
  }
  const endVh = Number.parseFloat(endY);
  return PERSONAL_BAR_CONTENT_START_VH - (Number.isFinite(endVh) ? endVh : 0);
}

/** Match scroll duration to another phase's travel distance and rate. */
export function getMatchedScrollDurationPercent(
  sourceDurationPercent: number,
  sourceTravelVh: number,
  targetTravelVh: number,
  minDurationPercent: number,
): number {
  if (sourceTravelVh <= 0) return minDurationPercent;
  return Math.round(
    Math.max(minDurationPercent, sourceDurationPercent * (targetTravelVh / sourceTravelVh)),
  );
}
