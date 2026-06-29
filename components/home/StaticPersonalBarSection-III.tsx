import { CriterionDetail } from './CriterionDetail';
import type { PersonalBarCriterion, PersonalBarTitle } from './personalBarTypes';
import { STATIC_SECTION_SCROLL_MT } from './staticIntroScrollNav';

type StaticPersonalBarSectionIIIProps = {
  sectionId: string;
  headingId: string;
  title: PersonalBarTitle;
  logoPath: string;
  criteria: readonly PersonalBarCriterion[];
};

const ACCENT_CORAL = '#F57360';
const ACCENT_TEAL = '#58A4B0';

export function StaticPersonalBarSectionIII({
  sectionId,
  headingId,
  title,
  logoPath,
  criteria,
}: StaticPersonalBarSectionIIIProps) {
  return (
    <section
      id={sectionId}
      className={`relative ${STATIC_SECTION_SCROLL_MT} overflow-hidden border-t border-light-steel-blue/30 bg-white py-12 sm:py-16`}
      aria-labelledby={headingId}
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl border-b border-light-steel-blue/45 pb-7 text-center">
          <h2 id={headingId} className="text-2xl font-bold leading-tight text-black sm:text-3xl">
            {title.heading}
          </h2>
          {title.subheading ? (
            <p
              className="mt-3 text-sm font-bold uppercase tracking-widest"
              style={{ color: ACCENT_CORAL }}
            >
              {title.subheading}
            </p>
          ) : null}

          <div className="mx-auto mt-6 flex min-h-24 w-full max-w-xs items-center justify-center bg-white p-4">
            <img src={logoPath} alt="" className="max-h-20 w-auto max-w-full object-contain" />
          </div>
        </div>

        <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
          {criteria.map((criterion, index) => {
            const accent = index % 2 === 0 ? ACCENT_CORAL : ACCENT_TEAL;

            return (
              <article
                key={criterion.id}
                className="min-h-[220px] rounded-2xl border border-light-steel-blue/40 bg-white shadow-sm"
              >
                <div className="grid h-full gap-0 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="border-b border-light-steel-blue/35 p-5 md:border-b-0 md:border-r">
                    <span className="mb-4 block h-1.5 w-14 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
                    <h3 className="text-lg font-bold leading-snug text-black sm:text-xl">
                      {criterion.heading}
                    </h3>
                    {criterion.subheading ? (
                      <p className="mt-2 text-base font-semibold leading-snug text-gray-600">
                        {criterion.subheading}
                      </p>
                    ) : null}
                  </div>

                  <div className="p-5">
                    <p
                      className="mb-3 text-xs font-bold uppercase tracking-widest"
                      style={{ color: accent }}
                    >
                      Evidence
                    </p>
                    <CriterionDetail detail={criterion.detail} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
