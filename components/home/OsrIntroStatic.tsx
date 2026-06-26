import { AgreementsSectionContent } from './LogoMarquee';
import { StaticIntroActionsSection } from './StaticIntroActionsSection';
import { StaticIntroNav } from './StaticIntroNav';
import { StaticPersonalBarSection } from './StaticPersonalBarSection';
import { STATIC_SECTION_SCROLL_MT } from './staticIntroScrollNav';
import { TypingHeroLine } from './TypingHeroLine';
import { TYPING_DESCRIPTIONS } from './osrScrollUtils';
import {
  WHOOP_LOGO_PATH,
  WHOOP_PERSONAL_BAR_CRITERIA,
  WHOOP_PERSONAL_BAR_TITLE,
} from './whoopPersonalBar';

const ACCENT_CORAL = '#F57360';

/** Plain stacked homepage intro for mobile browsers (no scroll-scrub / parallax). */
export function OsrIntroStatic() {
  return (
    <article className="relative w-full bg-white pt-[var(--static-intro-nav-height,3.25rem)]">
      <StaticIntroNav />

      <section
        id="intro-zero"
        className={`${STATIC_SECTION_SCROLL_MT} px-5 py-14 sm:px-8 sm:py-16`}
        aria-label="Introduction"
      >
        <div className="mx-auto w-full max-w-3xl">
          <p
            className="text-sm font-semibold uppercase tracking-wide sm:text-base"
            style={{ color: ACCENT_CORAL }}
          >
            Open Source Resume is
          </p>
          <TypingHeroLine
            descriptions={TYPING_DESCRIPTIONS}
            className="mt-4 min-h-[1.8em] border-b border-[#F57360] pb-4 text-xl font-semibold leading-snug text-[#F57360] sm:text-2xl"
          />
        </div>
      </section>

      <section
        id="intro-one"
        className={`${STATIC_SECTION_SCROLL_MT} border-t border-light-steel-blue/30 px-5 py-12 sm:px-8 sm:py-14`}
        aria-labelledby="intro-who-heading"
      >
        <div className="mx-auto w-full max-w-3xl">
          <h2
            id="intro-who-heading"
            className="text-sm font-extrabold uppercase tracking-wide text-black sm:text-base"
          >
            Who we are
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-800 sm:text-xl">
            We are a pathway for entry-level SWEs to become valuable contributors to the tech
            industry by making deep contributions to open source.
          </p>
        </div>
      </section>

      <section
        id="intro-two"
        className={`${STATIC_SECTION_SCROLL_MT} border-t border-light-steel-blue/30 px-5 py-12 sm:px-8 sm:py-14`}
        aria-labelledby="intro-how-heading"
      >
        <div className="mx-auto w-full max-w-3xl">
          <h2
            id="intro-how-heading"
            className="text-sm font-extrabold uppercase tracking-wide text-black sm:text-base"
          >
            How it works
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-800 sm:text-xl">
            SWE Hiring Managers define their dream candidate in terms of measurable open source
            achievements. Their personal bar becomes an actionable pathway for junior devs.
          </p>
        </div>
      </section>

      <section
        id="intro-agreements"
        className={`${STATIC_SECTION_SCROLL_MT} border-t border-light-steel-blue/30 bg-white px-5 py-12 sm:px-8 sm:py-14`}
        aria-labelledby="intro-agreements-heading"
      >
        <AgreementsSectionContent
          titleClassName="mx-auto max-w-4xl text-center text-xl font-bold leading-snug tracking-tight text-black sm:text-2xl"
        />
      </section>

      <StaticPersonalBarSection
        sectionId="intro-whoop-bar"
        headingId="whoop-bar-heading"
        title={WHOOP_PERSONAL_BAR_TITLE}
        logoPath={WHOOP_LOGO_PATH}
        criteria={WHOOP_PERSONAL_BAR_CRITERIA}
      />

      <StaticIntroActionsSection />
    </article>
  );
}
