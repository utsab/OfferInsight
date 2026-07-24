'use client';

import type { CSSProperties, RefObject } from 'react';
import { AgreementsSectionContent } from './LogoMarquee';

type IntroAgreementsSectionProps = {
  sectionShell: string;
  sectionStyle?: CSSProperties;
  sectionRef: RefObject<HTMLElement | null>;
  /** Compact: tighter padding + left gutter for the fixed page-indicator line. */
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
      <div
        className={
          compactLayout
            ? 'flex h-full w-full flex-col items-center justify-center py-6 pl-10 pr-4'
            : 'flex h-full w-full flex-col items-center justify-center px-4 sm:px-8'
        }
      >
        <div className="w-full max-w-6xl">
          <AgreementsSectionContent />
        </div>
      </div>
    </section>
  );
}
