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

/** Viewport height below the fixed navbar (matches pinned hero start). */
export function getViewportBelowNavbar(): number {
  return Math.max(window.innerHeight - getSiteNavbarHeightPx(), 320);
}

/** Absolute viewport Y for a point `offsetVh` below the navbar. */
export function getViewportOffsetTopPx(offsetVh: number): number {
  return getSiteNavbarHeightPx() + (offsetVh / 100) * getViewportBelowNavbar();
}

/** Keep scrubbed ScrollTrigger timelines aligned with the current scroll position. */
export function syncScrollTrackAnimations(scrollTrack: HTMLElement): void {
  ScrollTrigger.getAll().forEach((st) => {
    if (st.trigger !== scrollTrack || !st.animation) return;
    // Kill scrub catch-up lag so layers don't briefly show the wrong phase after
    // refresh/resize (progress jumped, animation still easing toward it).
    const scrubTween = typeof st.getTween === 'function' ? st.getTween() : null;
    if (scrubTween) {
      scrubTween.progress(1);
    }
    st.animation.progress(st.progress);
  });
}

export function getOsrSceneConfig(offsetVh: number) {
  return {
    startPx: Math.round(offsetVh * getViewportBelowNavbar()),
  };
}

export const PERSONAL_BAR_CONTENT_START_VH = 140;
export const PERSONAL_BAR_CONTENT_START_Y = `${PERSONAL_BAR_CONTENT_START_VH}vh`;

/** Measure personal-bar content height without transform affecting layout reads. */
export function measurePersonalBarContentHeight(content: HTMLElement): number {
  const ignoredElements = Array.from(
    content.querySelectorAll<HTMLElement>('[data-personal-bar-measure-ignore]'),
  );
  const previousDisplays = ignoredElements.map((element) => element.style.display);

  gsap.set(content, { y: 0 });
  ignoredElements.forEach((element) => {
    element.style.display = 'none';
  });
  const height = content.scrollHeight;
  ignoredElements.forEach((element, index) => {
    element.style.display = previousDisplays[index] ?? '';
  });
  gsap.set(content, { y: PERSONAL_BAR_CONTENT_START_Y });
  return height;
}

/** How far content travels upward (vh) so tall lists can fully scroll through. */
export function getPersonalBarContentEndY(
  contentHeightPx: number,
  viewportHeightPx: number,
  minEndVh: number,
  endPaddingVh = 55,
): string {
  const contentVh = (contentHeightPx / viewportHeightPx) * 100;
  const endVh = Math.max(minEndVh, Math.round(contentVh + endPaddingVh));
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
 * Scroll track height in px — phase positions use below-navbar vh, so total
 * scrollable distance is `scrollTrackEndVh * belowNav`, plus one viewport to
 * reach the first phase.
 */
export function getScrollTrackHeightPx(scrollTrackEndVh: number): number {
  if (typeof window === 'undefined') return 0;
  return Math.round(window.innerHeight + scrollTrackEndVh * getViewportBelowNavbar());
}

/** Client-only — sets scroll track height from phase end (below-navbar vh). */
export function applyScrollTrackHeight(
  track: HTMLElement,
  scrollTrackEndVh: number,
): void {
  track.style.height = `${getScrollTrackHeightPx(scrollTrackEndVh)}px`;
}

/** Document Y of the scroll track top (offsetTop is 0 vs intro root — use this for scrollTo). */
export function getScrollTrackDocumentTopPx(scrollTrack: HTMLElement): number {
  return scrollTrack.getBoundingClientRect().top + window.scrollY;
}

/** Pixels scrolled into the track from its top. */
export function getScrollTrackRelativePx(scrollTrack: HTMLElement): number {
  return Math.max(window.scrollY - getScrollTrackDocumentTopPx(scrollTrack), 0);
}

/**
 * Keep story progress stable across layout/track-height changes (e.g. resize).
 * Without this, same scrollY maps to a different phase after the track reflows.
 */
export function preserveScrollTrackProgress(
  scrollTrack: HTMLElement,
  updateLayout: () => void,
): void {
  const beforeHeight = Math.max(scrollTrack.offsetHeight, 1);
  const progress = Math.min(1, getScrollTrackRelativePx(scrollTrack) / beforeHeight);

  updateLayout();

  const afterHeight = Math.max(scrollTrack.offsetHeight, 1);
  scrollToTrackOffsetPx(scrollTrack, progress * afterHeight, 'auto');
}

/** Scroll so `offsetPx` of the track has passed the viewport top. */
export function scrollToTrackOffsetPx(
  scrollTrack: HTMLElement,
  offsetPx: number,
  behavior: ScrollBehavior = 'smooth',
): void {
  window.scrollTo({
    top: getScrollTrackDocumentTopPx(scrollTrack) + offsetPx,
    behavior,
  });
}

/** Vertical travel (vh) for a content scroll from `startVh` to `endY`. */
export function getContentScrollTravelVh(startVh: number, endY: string): number {
  if (endY.startsWith('-')) {
    return startVh + parseNegativeVh(endY);
  }
  const endVh = Number.parseFloat(endY);
  return startVh - (Number.isFinite(endVh) ? endVh : 0);
}

