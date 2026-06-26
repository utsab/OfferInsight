'use client';

import { HOME_ASSETS } from './homeAssets';

export const AGREEMENTS_SECTION_TITLE =
  'Personal Bar Agreements with 20+ SWE Engineers/Hiring Managers';

type LogoMarqueeProps = {
  className?: string;
};

export function LogoMarquee({ className }: LogoMarqueeProps) {
  const logos = HOME_ASSETS.affiliations;
  const marqueeLogos = [...logos, ...logos];

  return (
    <div className={`relative w-full overflow-hidden ${className ?? ''}`}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-white to-transparent sm:w-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-white to-transparent sm:w-16"
        aria-hidden
      />

      <div className="logo-marquee-track flex w-max items-center gap-10 py-2 sm:gap-14 md:gap-16">
        {marqueeLogos.map((logo, index) => (
          <div
            key={`${logo.path}-${index}`}
            className="flex h-12 w-28 shrink-0 items-center justify-center sm:h-14 sm:w-32 md:h-16 md:w-36"
          >
            <img
              src={logo.path}
              alt={`${logo.label} logo`}
              className="max-h-full max-w-full object-contain"
              style={{ transform: `scale(${logo.scale})` }}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgreementsSectionContent({
  titleClassName,
  contentClassName,
}: {
  titleClassName?: string;
  contentClassName?: string;
}) {
  return (
    <div className={contentClassName}>
      <h2
        id="intro-agreements-heading"
        className={
          titleClassName ??
          'mx-auto max-w-4xl text-center text-2xl font-bold leading-tight tracking-tight text-black sm:text-3xl md:text-4xl'
        }
      >
        {AGREEMENTS_SECTION_TITLE}
      </h2>
      <LogoMarquee className="mt-8 sm:mt-10 md:mt-12" />
    </div>
  );
}
