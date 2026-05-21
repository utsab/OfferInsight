'use client';

import type { RefObject } from 'react';
import {
  WHOOP_LOGO_PATH,
  WHOOP_PERSONAL_BAR_CRITERIA,
  WHOOP_PERSONAL_BAR_TITLE,
} from './whoopPersonalBar';

export type WhoopPersonalBarRefs = {
  section: RefObject<HTMLElement | null>;
  bgLogo: RefObject<HTMLDivElement | null>;
  /** Title, divider, and criteria rows — scroll up together as one page. */
  content: RefObject<HTMLDivElement | null>;
};

type WhoopPersonalBarSectionProps = {
  sectionShell: string;
  refs: WhoopPersonalBarRefs;
};

export function WhoopPersonalBarSection({ sectionShell, refs }: WhoopPersonalBarSectionProps) {
  return (
    <section
      ref={refs.section}
      id="intro-whoop-bar"
      className={`${sectionShell} z-20 overflow-hidden bg-gradient-to-br from-midnight-blue to-gray-900 opacity-0`}
      aria-labelledby="whoop-bar-heading"
    >
      <div
        ref={refs.bgLogo}
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-0"
        aria-hidden
      >
        <div className="absolute inset-0 bg-midnight-blue/60" />
        <img
          src={WHOOP_LOGO_PATH}
          alt=""
          className="relative max-h-[min(72vh,640px)] w-auto max-w-[min(92vw,720px)] object-contain opacity-50 brightness-[0.35] contrast-125"
        />
      </div>

      <div className="relative z-[2] h-full w-full overflow-hidden py-8">
        <div
          ref={refs.content}
          className="will-change-transform w-full px-5 pt-[8vh] sm:px-8 md:px-10 lg:px-14 xl:px-16"
        >
          <h2
            id="whoop-bar-heading"
            className="text-center text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
          >
            {WHOOP_PERSONAL_BAR_TITLE}
          </h2>

          {/* Breathing room between title and first criterion */}
          <div className="min-h-[22vh] sm:min-h-[28vh] md:min-h-[34vh] lg:min-h-[40vh]" aria-hidden />

          <div className="space-y-12 sm:space-y-14 md:space-y-20">
            {WHOOP_PERSONAL_BAR_CRITERIA.map((criterion) => (
              <div key={criterion.id} className="pt-2 sm:pt-4">
                <hr className="mb-8 border-0 border-t border-light-steel-blue/45 sm:mb-10 md:mb-12" />
                <div className="grid gap-5 md:grid-cols-2 md:gap-x-[clamp(2.5rem,10vw,11rem)] md:gap-y-6 lg:gap-x-[clamp(3.5rem,14vw,16rem)] xl:gap-x-[clamp(4rem,16vw,20rem)]">
                  <p className="text-left text-lg font-bold leading-snug text-white sm:text-xl md:text-2xl lg:text-3xl">
                    {criterion.label}
                  </p>
                  <p className="text-left text-base leading-relaxed text-gray-200 sm:text-lg md:text-xl lg:text-2xl">
                    {criterion.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
