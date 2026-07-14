'use client';

import type { CSSProperties, RefObject } from 'react';
import { AgreementsSectionContent } from './LogoMarquee';

type IntroAgreementsSectionProps = {
  sectionShell: string;
  sectionStyle?: CSSProperties;
  sectionRef: RefObject<HTMLElement | null>;
  /** Compact: coral scroll-progress line above the copy. Desktop uses the fixed page indicator. */
  compactLayout?: boolean;
};

export function IntroAgreementsSection({
  sectionShell,
  sectionStyle,
  sectionRef,
  compactLayout = false,
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
        {compactLayout ? (
          <div className="relative mb-5 h-48 w-full max-w-6xl shrink-0 sm:mb-6 sm:h-56">
            <div
              data-agreements-scroll-line
              className="absolute left-[12%] top-0 h-full w-0.5 opacity-0"
              style={{ backgroundColor: '#F57360' }}
              aria-hidden
            />
          </div>
        ) : null}
        <div className="w-full max-w-6xl">
          <AgreementsSectionContent />
        </div>
      </div>
    </section>
  );
}
