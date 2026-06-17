'use client';

/**
 * STEP 2 — One timeline, two animations (crossfade)
 *
 * Same scroll track as Step 1, but now:
 * - Box still moves left → right (whole scroll)
 * - Scene A fades out while Scene B fades in (middle of the scroll)
 *
 * Pattern matches homepage section crossfades (autoAlpha / opacity handoffs).
 */
import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_TRACK_VH = 300;

export default function ParallaxTutorialStep2Page() {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const sceneARef = useRef<HTMLDivElement>(null);
  const sceneBRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scrollTrack = scrollTrackRef.current;
      const box = boxRef.current;
      const sceneA = sceneARef.current;
      const sceneB = sceneBRef.current;
      if (!scrollTrack || !box || !sceneA || !sceneB) return;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: scrollTrack,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
        },
      });

      timeline.fromTo(box, { x: -120 }, { x: 120, ease: 'none', duration: 1 }, 0);
      timeline.fromTo(sceneA, { opacity: 1 }, { opacity: 0, ease: 'none', duration: 0.5 }, 0);
      timeline.fromTo(sceneB, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.5 }, 0.5);
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="-mt-[var(--navbar-height)] bg-white pt-[var(--navbar-height)]"
    >
      <div className="pointer-events-none fixed inset-0 top-[var(--navbar-height)] z-10 flex items-center justify-center px-6">
        <div
          ref={sceneARef}
          className="absolute inset-0 flex flex-col items-center justify-center px-6"
        >
          <div className="mb-8 max-w-md text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#F57360]">
              Step 2 — Scene A
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">One timeline, two scenes</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Keep scrolling. This text will fade out while another scene fades in — same scroll
              track, same ScrollTrigger, one GSAP timeline.
            </p>
          </div>
        </div>

        <div
          ref={sceneBRef}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 opacity-0"
        >
          <div className="mb-8 max-w-md text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#58A4B0]">
              Step 2 — Scene B
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">You crossed the crossfade</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Scene A and Scene B are stacked in the same spot. Opacity swap = crossfade. Your
              homepage does this with section <code className="rounded bg-gray-100 px-1">autoAlpha</code>.
            </p>
          </div>
        </div>

        <div
          ref={boxRef}
          className="relative z-[1] flex h-24 w-24 items-center justify-center rounded-xl bg-[#F57360] text-sm font-bold text-white shadow-lg"
        >
          Box
        </div>
      </div>

      <div
        ref={scrollTrackRef}
        className="relative w-full"
        style={{ height: `${SCROLL_TRACK_VH}vh` }}
        aria-hidden
      />

      <div className="relative z-20 border-t border-gray-200 bg-gray-50 px-6 py-10">
        <h2 className="text-lg font-bold text-gray-900">What changed in Step 2?</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-700">
          <li>
            <strong>One timeline</strong> — multiple tweens share one scrubbed ScrollTrigger (like
            chaining scenes on your homepage).
          </li>
          <li>
            <strong>Crossfade</strong> — Scene A opacity 1→0 in the first half; Scene B 0→1 in the
            second half.
          </li>
          <li>
            <strong>Box unchanged</strong> — still moves the full scroll; other things can animate on
            different “beats” in the same timeline.
          </li>
        </ul>
        <p className="mt-6 text-sm text-gray-500">
          <Link href="/parallax_tutorial/step1" className="text-[#F57360] hover:underline">
            ← Step 1
          </Link>
          {' · '}
          Step 3 (inner content scroll) coming next.
        </p>
      </div>
    </div>
  );
}
