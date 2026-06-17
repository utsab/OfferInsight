import { HIRING_MANAGER_CALENDLY_URL } from './homeCtas';

const ACCENT_CORAL = '#F57360';
const ACCENT_TEAL = '#58A4B0';

export function StaticIntroActionsSection() {
  return (
    <section
      id="intro-actions"
      className="scroll-mt-[calc(var(--navbar-height)+1rem)] border-t border-light-steel-blue/30 bg-white py-12 sm:py-16"
      aria-labelledby="intro-actions-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="text-center">
          <h2
            id="intro-actions-heading"
            className="text-3xl font-bold tracking-tight text-black sm:text-4xl"
          >
            What&apos;s next?
          </h2>
        </div>

        <div className="mt-8 grid gap-6 sm:mt-10 md:grid-cols-2 md:gap-8">
          <div className="flex min-h-[240px] flex-col rounded-2xl border border-light-steel-blue/40 bg-white p-8 shadow-sm sm:min-h-[280px] sm:p-10">
            <p
              className="text-sm font-bold uppercase tracking-widest sm:text-base"
              style={{ color: ACCENT_CORAL }}
            >
              For candidates
            </p>
            <h3 className="mt-4 text-2xl font-bold text-black sm:text-3xl">Start your pathway</h3>
            <p className="mt-4 flex-1 text-lg leading-relaxed text-gray-700 sm:text-xl">
              Use <span className="font-semibold text-black">Sign In</span> in the navbar above to
              get started, track open source achievements, and work toward hiring-manager-defined
              benchmarks.
            </p>
          </div>

          <div className="flex min-h-[240px] flex-col rounded-2xl border border-light-steel-blue/40 bg-white p-8 shadow-sm sm:min-h-[280px] sm:p-10">
            <p
              className="text-sm font-bold uppercase tracking-widest sm:text-base"
              style={{ color: ACCENT_TEAL }}
            >
              For hiring managers &amp; recruiters
            </p>
            <h3 className="mt-4 text-2xl font-bold text-black sm:text-3xl">Partner with us</h3>
            <p className="mt-4 flex-1 text-lg leading-relaxed text-gray-700 sm:text-xl">
              Schedule a conversation with Utsab Saha to learn how your team can define a personal
              bar and interview qualified candidates.
            </p>
            <a
              href={HIRING_MANAGER_CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-full cursor-pointer items-center justify-center rounded-lg px-6 py-4 text-lg font-semibold text-white transition-colors hover:opacity-90 sm:w-auto"
              style={{ backgroundColor: ACCENT_TEAL }}
            >
              Schedule a meeting
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
