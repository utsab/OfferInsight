import { CriterionDetail } from './CriterionDetail';
import type { PersonalBarCriterion } from './personalBarTypes';
import { STATIC_SECTION_SCROLL_MT } from './staticIntroScrollNav';

type StaticPersonalBarSectionProps = {
  sectionId: string;
  headingId: string;
  title: string;
  logoPath: string;
  criteria: readonly PersonalBarCriterion[];
};

export function StaticPersonalBarSection({
  sectionId,
  headingId,
  title,
  logoPath,
  criteria,
}: StaticPersonalBarSectionProps) {
  return (
    <section
      id={sectionId}
      className={`relative ${STATIC_SECTION_SCROLL_MT} overflow-hidden border-t border-light-steel-blue/30 bg-white py-12 sm:py-16`}
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div className="absolute inset-0 bg-white/60" />
        <img
          src={logoPath}
          alt=""
          className="relative max-h-[min(50vh,420px)] w-auto max-w-[min(88vw,560px)] object-contain opacity-20"
        />
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-6xl px-5 sm:px-8">
        <h2
          id={headingId}
          className="text-center text-2xl font-bold leading-tight tracking-tight text-black sm:text-3xl md:text-4xl"
        >
          {title}
        </h2>

        <div className="mt-10 space-y-12 sm:mt-12 sm:space-y-14">
          {criteria.map((criterion) => (
            <div key={criterion.id} className="pt-2">
              <hr className="mb-8 border-0 border-t border-light-steel-blue/45 sm:mb-10" />
              <div className="grid gap-5">
                <p className="text-left text-lg font-bold leading-snug text-black sm:text-xl md:text-2xl">
                  {criterion.label}
                </p>
                <CriterionDetail detail={criterion.detail} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
