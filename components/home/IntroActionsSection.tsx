'use client';

import type { CSSProperties, RefObject } from 'react';
import { HIRING_MANAGER_CALENDLY_URL } from './homeCtas';

const ACCENT_CORAL = '#F57360';
const ACCENT_TEAL = '#58A4B0';

type IntroActionsSectionProps = {
  sectionShell: string;
  sectionStyle?: CSSProperties;
  sectionRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  onSignUp: () => void;
};

export function IntroActionsSection({
  sectionShell,
  sectionStyle,
  sectionRef,
  contentRef,
  onSignUp,
}: IntroActionsSectionProps) {
  return (
    <section
      ref={sectionRef}
      id="intro-actions"
      className={`${sectionShell} pointer-events-auto z-[22] overflow-hidden opacity-0`}
      style={sectionStyle}
      aria-labelledby="intro-actions-heading"
    >
      <div className="relative z-[2] h-full w-full overflow-hidden">
        <div
          ref={contentRef}
          className="will-change-transform flex w-full items-center justify-center px-4 pt-[8vh] sm:px-8"
        >
          <div className="w-full max-w-4xl">
            <div className="text-center">
              <h2
                id="intro-actions-heading"
                className="text-3xl font-bold tracking-tight text-black sm:text-4xl md:text-5xl"
              >
                What&apos;s next?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
                Choose the path that fits you.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-2 md:gap-6">
              <div className="flex flex-col rounded-2xl border border-light-steel-blue/40 bg-white p-6 shadow-sm sm:p-8">
                <p
                  className="text-xs font-bold uppercase tracking-widest sm:text-sm"
                  style={{ color: ACCENT_CORAL }}
                >
                  For candidates
                </p>
                <h3 className="mt-3 text-xl font-bold text-black sm:text-2xl">Start your pathway</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-gray-700 sm:text-lg">
                  Sign up to track open source achievements and work toward hiring-manager-defined
                  benchmarks.
                </p>
                <button
                  type="button"
                  onClick={onSignUp}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-base font-semibold text-white transition-colors hover:opacity-90 sm:w-auto"
                  style={{ backgroundColor: ACCENT_CORAL }}
                >
                  Sign up
                </button>
              </div>

              <div className="flex flex-col rounded-2xl border border-light-steel-blue/40 bg-white p-6 shadow-sm sm:p-8">
                <p
                  className="text-xs font-bold uppercase tracking-widest sm:text-sm"
                  style={{ color: ACCENT_TEAL }}
                >
                  For hiring managers &amp; recruiters
                </p>
                <h3 className="mt-3 text-xl font-bold text-black sm:text-2xl">Partner with us</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-gray-700 sm:text-lg">
                  Schedule a conversation with Utsab Saha to learn how your team can define a personal
                  bar and interview qualified candidates.
                </p>
                <a
                  href={HIRING_MANAGER_CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg border-2 px-5 py-3 text-base font-semibold transition-colors hover:bg-gray-50 sm:w-auto"
                  style={{ borderColor: ACCENT_TEAL, color: ACCENT_TEAL }}
                >
                  Schedule a meeting
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
