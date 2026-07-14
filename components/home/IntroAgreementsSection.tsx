'use client';

import type { CSSProperties, RefObject } from 'react';
import { AgreementsSectionContent } from './LogoMarquee';

type IntroAgreementsSectionProps = {
  sectionShell: string;
  sectionStyle?: CSSProperties;
  sectionRef: RefObject<HTMLElement | null>;
};

export function IntroAgreementsSection({
  sectionShell,
  sectionStyle,
  sectionRef,
}: IntroAgreementsSectionProps) {
  return (
    <section
      ref={sectionRef}
      id="intro-agreements"
      className={`${sectionShell} z-[15] overflow-hidden bg-white opacity-0`}
      style={sectionStyle}
      aria-labelledby="intro-agreements-heading"
    >
      <div className="flex h-full w-full flex-col items-center justify-center px-4 sm:px-8">
        {/* Compact scroll cue — left of center, above the copy; climbs up only. */}
        <div className="relative mb-5 h-48 w-full max-w-6xl shrink-0 sm:mb-6 sm:h-56">
          <div
            data-agreements-scroll-line
            className="absolute left-[12%] top-0 h-full w-0.5 opacity-0"
            style={{ backgroundColor: '#F57360' }}
            aria-hidden
          />
        </div>
        <div className="w-full max-w-6xl">
          <AgreementsSectionContent />
        </div>
      </div>
    </section>
  );
}
