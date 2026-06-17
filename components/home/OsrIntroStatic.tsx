import { HOME_ASSETS } from './homeAssets';
import {
  META_LOGO_PATH,
  META_PERSONAL_BAR_CRITERIA,
  META_PERSONAL_BAR_TITLE,
} from './metaPersonalBar';
import {
  MICROSOFT_LOGO_PATH,
  MICROSOFT_PERSONAL_BAR_CRITERIA,
  MICROSOFT_PERSONAL_BAR_TITLE,
} from './microsoftPersonalBar';
import { StaticIntroActionsSection } from './StaticIntroActionsSection';
import { StaticIntroNav } from './StaticIntroNav';
import { StaticPersonalBarSection } from './StaticPersonalBarSection';
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
    <article className="relative w-full bg-white">
      <StaticIntroNav />

      <section
        id="intro-zero"
        className="scroll-mt-[calc(var(--navbar-height)+1rem)] px-5 py-14 sm:px-8 sm:py-16"
        aria-label="Introduction"
      >
        <div className="mx-auto w-full max-w-3xl">
          <p
            className="text-sm font-semibold uppercase tracking-wide sm:text-base"
            style={{ color: ACCENT_CORAL }}
          >
            Open Source Resume is
          </p>
          <p className="mt-4 border-b border-[#F57360] pb-4 text-xl font-semibold leading-snug text-[#F57360] sm:text-2xl">
            {TYPING_DESCRIPTIONS[0]}
          </p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base">
            {TYPING_DESCRIPTIONS.slice(1).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="intro-one"
        className="scroll-mt-[calc(var(--navbar-height)+1rem)] border-t border-light-steel-blue/30 px-5 py-12 sm:px-8 sm:py-14"
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
        className="scroll-mt-[calc(var(--navbar-height)+1rem)] border-t border-light-steel-blue/30 px-5 py-12 sm:px-8 sm:py-14"
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

      <StaticPersonalBarSection
        sectionId="intro-whoop-bar"
        headingId="whoop-bar-heading"
        title={WHOOP_PERSONAL_BAR_TITLE}
        logoPath={WHOOP_LOGO_PATH}
        criteria={WHOOP_PERSONAL_BAR_CRITERIA}
      />

      <StaticPersonalBarSection
        sectionId="intro-microsoft-bar"
        headingId="microsoft-bar-heading"
        title={MICROSOFT_PERSONAL_BAR_TITLE}
        logoPath={MICROSOFT_LOGO_PATH}
        criteria={MICROSOFT_PERSONAL_BAR_CRITERIA}
      />

      <StaticPersonalBarSection
        sectionId="intro-meta-bar"
        headingId="meta-bar-heading"
        title={META_PERSONAL_BAR_TITLE}
        logoPath={META_LOGO_PATH}
        criteria={META_PERSONAL_BAR_CRITERIA}
      />

      <section
        id="intro-affiliations"
        className="scroll-mt-[calc(var(--navbar-height)+1rem)] border-t border-light-steel-blue/30 bg-white py-12 sm:py-16"
        aria-labelledby="affiliations-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-8">
          <h2
            id="affiliations-heading"
            className="text-3xl font-bold tracking-tight text-black sm:text-4xl"
          >
            Hiring Manager Affiliations
          </h2>
          <p className="mx-auto mt-4 max-w-5xl text-base leading-relaxed text-gray-800 sm:text-lg">
            Participating managers at these companies commit to interview candidates who meet their
            defined open-source benchmarks.
          </p>
          <p className="mx-auto mt-2 max-w-4xl text-sm text-gray-600 sm:text-base">
            Standards are manager-defined and do not represent official company policy.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {HOME_ASSETS.affiliations.map((logo) => (
              <div
                key={logo.path}
                className="flex h-[78px] items-center justify-center rounded-xl border border-light-steel-blue/35 bg-white p-3 shadow-sm sm:h-[92px] sm:p-4"
              >
                <img
                  src={logo.path}
                  alt={`${logo.label} logo`}
                  className="max-h-full max-w-full origin-center object-contain"
                  style={{ transform: `scale(${logo.scale})` }}
                />
              </div>
            ))}
          </div>
          <p className="mt-6 text-lg font-semibold italic tracking-wide text-gray-800 sm:text-xl">
            and more...
          </p>
        </div>
      </section>

      <StaticIntroActionsSection />
    </article>
  );
}
