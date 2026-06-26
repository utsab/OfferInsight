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
      <div className="flex h-full w-full items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-6xl">
          <AgreementsSectionContent />
        </div>
      </div>
    </section>
  );
}
