import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  getViewportBelowNavbar,
  getViewportOffsetTopPx,
  syncScrollTrackAnimations,
} from './osrScrollUtils';

/** Snap scroll + scrub state so anchor measurements match what the user sees. */
function snapScrollTrackToRelativePx(
  scrollTrack: HTMLElement,
  relativePx: number,
): void {
  window.scrollTo(0, scrollTrack.offsetTop + relativePx);
  ScrollTrigger.update();
  syncScrollTrackAnimations(scrollTrack);
}

/**
 * Find track-relative scroll (in vh) so `anchor`'s top sits at `targetFromTopVh`
 * below the navbar, searching within [scrollMinVh, scrollMaxVh].
 */
export function computeScrollVhForAnchorTarget(
  scrollTrack: HTMLElement,
  anchor: HTMLElement,
  targetFromTopVh: number,
  scrollMinVh: number,
  scrollMaxVh: number,
): number {
  const viewportVh = getViewportBelowNavbar();
  const targetTopPx = getViewportOffsetTopPx(targetFromTopVh);
  const savedScrollY = window.scrollY;

  let lowPx = scrollMinVh * viewportVh;
  let highPx = scrollMaxVh * viewportVh;
  let bestPx = lowPx;
  let bestAbsDelta = Infinity;

  for (let i = 0; i < 20; i += 1) {
    const midPx = (lowPx + highPx) / 2;
    snapScrollTrackToRelativePx(scrollTrack, midPx);

    const delta = anchor.getBoundingClientRect().top - targetTopPx;
    const absDelta = Math.abs(delta);
    if (absDelta < bestAbsDelta) {
      bestAbsDelta = absDelta;
      bestPx = midPx;
    }

    if (absDelta < 1.5) break;

    if (delta > 0) {
      lowPx = midPx;
    } else {
      highPx = midPx;
    }
  }

  window.scrollTo(0, savedScrollY);
  ScrollTrigger.update();
  syncScrollTrackAnimations(scrollTrack);

  return bestPx / viewportVh;
}
