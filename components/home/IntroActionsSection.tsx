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
      className={`${sectionShell} overflow-hidden bg-white opacity-0`}
      style={sectionStyle}
      aria-labelledby="intro-actions-heading"
    >
      <div className="relative z-[2] h-full w-full overflow-hidden">
        <div
          ref={contentRef}
          className="will-change-transform flex w-full items-start justify-center px-4 pt-[8vh] sm:px-8 sm:pt-[10vh]"
        >
          <div className="w-full max-w-6xl">
            <div className="text-center">
              <h2
                id="intro-actions-heading"
                className="text-3xl font-bold tracking-tight text-black sm:text-4xl md:text-5xl"
              >
                What&apos;s next?
              </h2>
            </div>

            <div className="mt-8 grid gap-6 sm:mt-10 md:grid-cols-2 md:gap-8">
              <div className="flex min-h-[280px] flex-col rounded-2xl border border-light-steel-blue/40 bg-white p-8 shadow-sm sm:min-h-[320px] sm:p-10 md:min-h-[360px]">
                <p
                  className="text-sm font-bold uppercase tracking-widest sm:text-base"
                  style={{ color: ACCENT_CORAL }}
                >
                  For candidates
                </p>
                <h3 className="mt-4 text-2xl font-bold text-black sm:text-3xl">Start your pathway</h3>
                <p className="mt-4 flex-1 text-lg leading-relaxed text-gray-700 sm:text-xl">
                  Sign up to track open source achievements and work toward hiring-manager-defined
                  benchmarks.
                </p>
                <button
                  type="button"
                  onClick={onSignUp}
                  className="mt-8 inline-flex w-full cursor-pointer items-center justify-center rounded-lg px-6 py-4 text-lg font-semibold text-white transition-colors hover:opacity-90 sm:w-auto"
                  style={{ backgroundColor: ACCENT_CORAL }}
                >
                  Sign up
                </button>
              </div>

              <div className="flex min-h-[280px] flex-col rounded-2xl border border-light-steel-blue/40 bg-white p-8 shadow-sm sm:min-h-[320px] sm:p-10 md:min-h-[360px]">
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
        </div>
      </div>
    </section>
  );
}
