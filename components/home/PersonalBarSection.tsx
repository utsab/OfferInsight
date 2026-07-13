'use client';

import type { CSSProperties } from 'react';
import { CriterionDetail } from './CriterionDetail';
import type { PersonalBarCriterion, PersonalBarRefs, PersonalBarTitle } from './personalBarTypes';

type PersonalBarSectionProps = {
  sectionShell: string;
  sectionId: string;
  headingId: string;
  title: PersonalBarTitle;
  logoPath: string;
  logoAlt?: string;
  criteria: readonly PersonalBarCriterion[];
  refs: PersonalBarRefs;
  zIndexClass?: string;
  sectionStyle?: CSSProperties;
  compactLayout?: boolean;
};

export function PersonalBarSection({
  sectionShell,
  sectionId,
  headingId,
  title,
  logoPath,
  logoAlt = '',
  criteria,
  refs,
  zIndexClass = 'z-20',
  sectionStyle,
  compactLayout = false,
}: PersonalBarSectionProps) {
  return (
    <section
      ref={refs.section}
      id={sectionId}
      className={`${sectionShell} ${zIndexClass} overflow-hidden bg-white opacity-0`}
      aria-labelledby={headingId}
      style={sectionStyle}
    >
      <div
        ref={refs.bgLogo}
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-0"
        aria-hidden
      >
        <div className="absolute inset-0 bg-white/50" />
        <img
          src={logoPath}
          alt={logoAlt}
          className="relative max-h-[min(72vh,640px)] w-auto max-w-[min(92vw,720px)] object-contain opacity-25"
        />
      </div>

      <div className="relative z-[2] h-full w-full overflow-hidden py-8">
        <div
          ref={refs.content}
          className="will-change-transform w-full px-5 pt-[8vh] sm:px-8 md:px-10 lg:px-14 xl:px-16"
        >
          {title.subheading ? (
            <p className="text-center text-sm font-bold uppercase tracking-widest text-gray-600 sm:text-base">
              {title.subheading}
            </p>
          ) : null}
          <h2
            id={headingId}
            className={`${title.subheading ? 'mt-3 ' : ''}text-center text-2xl font-bold leading-tight tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl`}
          >
            {title.heading}
          </h2>

          <div className="min-h-[22vh] sm:min-h-[28vh] md:min-h-[34vh] lg:min-h-[40vh]" aria-hidden />

          <div className="space-y-12 sm:space-y-14 md:space-y-20">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="pt-2 sm:pt-4">
                <hr className="mb-8 border-0 border-t border-light-steel-blue/45 sm:mb-10 md:mb-12" />
                <div
                  className={`grid gap-5 ${
                    compactLayout
                      ? ''
                      : 'md:grid-cols-2 md:gap-x-[clamp(2.5rem,10vw,11rem)] md:gap-y-6 lg:gap-x-[clamp(3.5rem,14vw,16rem)] xl:gap-x-[clamp(4rem,16vw,20rem)]'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-lg font-bold leading-snug text-black sm:text-xl md:text-2xl lg:text-3xl">
                      {criterion.heading}
                    </p>
                    {criterion.subheading ? (
                      <p className="mt-2 text-base font-semibold leading-snug text-gray-600 sm:text-lg md:text-xl">
                        {criterion.subheading}
                      </p>
                    ) : null}
                  </div>
                  <CriterionDetail detail={criterion.detail} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
