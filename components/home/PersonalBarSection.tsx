'use client';

import type { CSSProperties } from 'react';
import type { PersonalBarCriterion, PersonalBarRefs } from './personalBarTypes';

type PersonalBarSectionProps = {
  sectionShell: string;
  sectionId: string;
  headingId: string;
  title: string;
  logoPath: string;
  logoAlt?: string;
  criteria: readonly PersonalBarCriterion[];
  refs: PersonalBarRefs;
  zIndexClass?: string;
  sectionStyle?: CSSProperties;
  compactLayout?: boolean;
};

function CriterionDetail({ detail }: { detail: PersonalBarCriterion['detail'] }) {
  const detailClass =
    'text-left text-base leading-relaxed text-gray-800 sm:text-lg md:text-xl lg:text-2xl';

  if (typeof detail === 'string') {
    return <p className={detailClass}>{detail}</p>;
  }

  return (
    <ul className={`${detailClass} list-none space-y-3 sm:space-y-4`}>
      {detail.map((bullet, index) => {
        if (bullet === 'Examples:') {
          return (
            <li
              key={index}
              className="pt-1 text-sm font-semibold uppercase tracking-wide text-gray-600 sm:text-base"
            >
              {bullet}
            </li>
          );
        }

        return (
          <li key={index} className="flex gap-2 sm:gap-3">
            <span className="shrink-0 text-gray-600" aria-hidden>
              ●
            </span>
            <span>{bullet}</span>
          </li>
        );
      })}
    </ul>
  );
}

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
          <h2
            id={headingId}
            className="text-center text-2xl font-bold leading-tight tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
          >
            {title}
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
                  <p className="text-left text-lg font-bold leading-snug text-black sm:text-xl md:text-2xl lg:text-3xl">
                    {criterion.label}
                  </p>
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
