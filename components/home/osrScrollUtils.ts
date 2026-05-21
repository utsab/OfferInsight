export const OSR_SCROLL_HEIGHT_VH = 6.1;

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
