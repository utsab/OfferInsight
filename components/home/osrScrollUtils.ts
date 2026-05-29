import gsap from 'gsap';

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

export type OsrSceneConfig = {
  startPx: number;
  durationPx: number;
  scrub: number | false;
};

/** Scroll-driven scene: offset and duration as multiples of viewport height. */
export function getOsrSceneConfig(
  offsetVh: number,
  durationPercent: number,
  scrub: number | false = 0.45,
): OsrSceneConfig {
  const vh = getViewportBelowNavbar();
  return {
    startPx: Math.round(offsetVh * vh),
    durationPx: Math.round((durationPercent / 100) * vh),
    scrub,
  };
}

const PERSONAL_BAR_CONTENT_START_VH = 140;

/** Measure personal-bar content height without transform affecting layout reads. */
export function measurePersonalBarContentHeight(content: HTMLElement): number {
  gsap.set(content, { y: 0 });
  const height = content.scrollHeight;
  gsap.set(content, { y: `${PERSONAL_BAR_CONTENT_START_VH}vh` });
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
