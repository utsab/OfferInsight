'use client';

/**
 * STEP 1 — Scroll track + one scrubbed animation
 *
 * Two layers:
 * 1. Fixed "stage" — the orange box stays in the viewport.
 * 2. Tall scroll track — empty height that gives you something to scroll through.
 *
 * GSAP ScrollTrigger links scroll position → box movement (scrub).
 */
import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_TRACK_VH = 300;

export default function ParallaxTutorialStep1Page() {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scrollTrack = scrollTrackRef.current;
      const box = boxRef.current;
      if (!scrollTrack || !box) return;

      gsap.fromTo(
        box,
        { x: -120 },
        {
          x: 120,
          ease: 'none',
          scrollTrigger: {
            trigger: scrollTrack,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
          },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="-mt-[var(--navbar-height)] bg-white pt-[var(--navbar-height)]"
    >
      <div className="pointer-events-none fixed inset-0 top-[var(--navbar-height)] z-10 flex flex-col items-center justify-center px-6">
        <div className="mb-8 max-w-md text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#F57360]">
            Step 1
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Scroll drives animation</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            The orange box is <strong>fixed</strong> on screen. The page is tall because of a hidden{' '}
            <strong>scroll track</strong> below. Scroll up and down — GSAP moves the box left/right
            based on how far you&apos;ve scrolled.
          </p>
        </div>

        <div
          ref={boxRef}
          className="flex h-24 w-24 items-center justify-center rounded-xl bg-[#F57360] text-sm font-bold text-white shadow-lg"
        >
          Box
        </div>

        <p className="mt-6 max-w-xs text-center text-xs text-gray-400">
          Scroll to the bottom of the track → box goes right. Back to top → box goes left.
        </p>
      </div>

      <div
        ref={scrollTrackRef}
        className="relative w-full"
        style={{ height: `${SCROLL_TRACK_VH}vh` }}
        aria-hidden
      />

      <div className="relative z-20 border-t border-gray-200 bg-gray-50 px-6 py-10">
        <h2 className="text-lg font-bold text-gray-900">What&apos;s on this page?</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-700">
          <li>
            <strong>Scroll track</strong> — a {SCROLL_TRACK_VH}vh-tall div. It&apos;s empty, but it
            makes the page scrollable.
          </li>
          <li>
            <strong>Fixed stage</strong> — the box and instructions use{' '}
            <code className="rounded bg-gray-200 px-1">position: fixed</code> so they stay in view.
          </li>
          <li>
            <strong>ScrollTrigger + scrub</strong> — maps scroll progress to animation progress (no
            play button; your scroll is the timeline).
          </li>
        </ul>
        <p className="mt-6 text-sm text-gray-500">
          <Link href="/parallax_tutorial/step2" className="font-medium text-[#F57360] hover:underline">
            Continue to Step 2 →
          </Link>
        </p>
      </div>
    </div>
  );
}
