'use client';

import type { CSSProperties } from 'react';
import { CriterionDetail } from './CriterionDetail';
import type { PersonalBarCriterion, PersonalBarRefs, PersonalBarTitle } from './personalBarTypes';

type PersonalBarSectionIIIProps = {
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
  /** Full compact band (<1278): denser type, auto-height cards, tighter chrome. */
  compactLayout?: boolean;
};

const ACCENT_CORAL = '#F57360';
const ACCENT_TEAL = '#58A4B0';

export function PersonalBarSectionIII({
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
}: PersonalBarSectionIIIProps) {
  return (
    <section
      ref={refs.section}
      id={sectionId}
      className={`${sectionShell} ${zIndexClass} overflow-hidden bg-white opacity-0`}
      aria-labelledby={headingId}
      style={sectionStyle}
    >
      <div className="relative z-[2] h-full w-full overflow-hidden">
        <div
          ref={refs.content}
          className={
            compactLayout
              ? 'will-change-transform mx-auto grid w-full max-w-7xl gap-4 px-4 pb-8 pt-12'
              : 'will-change-transform mx-auto grid w-full max-w-7xl gap-8 px-5 py-[8vh] sm:px-8 md:px-10 lg:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)] lg:gap-12 lg:px-14'
          }
        >
          <aside
            className={
              compactLayout
                ? 'relative z-20 p-4 text-right shadow-[6px_0_20px_rgba(15,23,42,0.15)]'
                : 'relative z-20 p-6 text-right shadow-[6px_0_20px_rgba(15,23,42,0.15)] sm:p-8 lg:p-10'
            }
          >
            <span
              data-personal-bar-measure-ignore
              className="pointer-events-none absolute -right-3 left-0 -inset-y-80"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.18) 18%, rgba(15, 23, 42, 0.18) 90%, rgba(15, 23, 42, 0))',
                filter: 'blur(12px)',
              }}
              aria-hidden
            />
            <span
              data-personal-bar-iii-panel-bg
              data-personal-bar-measure-ignore
              className="absolute inset-x-0 -inset-y-80"
              style={{
                // Keep coral solid longer before the bottom fade so the orange
                // tail softens into white instead of flashing a hard edge.
                background: `linear-gradient(to bottom, rgba(245, 115, 96, 0), ${ACCENT_CORAL} 18%, ${ACCENT_CORAL} 90%, rgba(245, 115, 96, 0))`,
              }}
              aria-hidden
            />
            <h2
              id={headingId}
              className={
                compactLayout
                  ? 'relative text-right text-2xl font-bold leading-tight text-white'
                  : 'relative text-right text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl'
              }
            >
              {title.heading}
            </h2>
            {title.subheading ? (
              <p
                className={
                  compactLayout
                    ? 'relative mt-2 text-xs font-bold uppercase tracking-widest text-white/80'
                    : 'relative mt-4 text-sm font-bold uppercase tracking-widest text-white/80 sm:text-base'
                }
              >
                {title.subheading}
              </p>
            ) : null}

            <div
              ref={refs.bgLogo}
              className={
                compactLayout
                  ? 'relative mt-4 flex min-h-20 w-full items-center justify-end p-0'
                  : 'relative mt-8 flex min-h-32 w-full items-center justify-end p-0 lg:mt-12 lg:min-h-44'
              }
              aria-hidden={logoAlt === ''}
            >
              <img
                src={logoPath}
                alt={logoAlt}
                className={
                  compactLayout
                    ? 'max-h-16 w-auto max-w-full object-contain [filter:invert(1)_brightness(2)]'
                    : 'max-h-28 w-auto max-w-full object-contain [filter:invert(1)_brightness(2)] lg:max-h-36'
                }
              />
            </div>
          </aside>

          <div className={compactLayout ? 'space-y-4' : 'space-y-6 lg:space-y-8'}>
            {criteria.map((criterion, index) => {
              const accent = index % 2 === 0 ? ACCENT_CORAL : ACCENT_TEAL;

              return (
                <article
                  key={criterion.id}
                  data-personal-bar-iii-card
                  className={
                    compactLayout
                      ? 'rounded-xl border border-light-steel-blue/40 bg-white shadow-[6px_0_18px_rgba(15,23,42,0.09)]'
                      : 'h-[260px] rounded-2xl border border-light-steel-blue/40 bg-white shadow-[6px_0_18px_rgba(15,23,42,0.09)] lg:h-[280px]'
                  }
                >
                  <div
                    className={
                      compactLayout
                        ? 'grid gap-0'
                        : 'grid h-full gap-0 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'
                    }
                  >
                    <div
                      className={
                        compactLayout
                          ? 'border-b border-light-steel-blue/35 p-4'
                          : 'min-h-0 border-b border-light-steel-blue/35 p-5 sm:p-6 md:border-b-0 md:border-r'
                      }
                    >
                      <span
                        className={
                          compactLayout
                            ? 'mb-3 block h-1 w-12 rounded-full'
                            : 'mb-5 block h-1.5 w-16 rounded-full'
                        }
                        style={{ backgroundColor: accent }}
                        aria-hidden
                      />
                      <h3
                        className={
                          compactLayout
                            ? 'text-lg font-bold leading-snug text-black'
                            : 'text-xl font-bold leading-snug text-black sm:text-2xl md:text-3xl'
                        }
                      >
                        {criterion.heading}
                      </h3>
                      {criterion.subheading ? (
                        <p
                          className={
                            compactLayout
                              ? 'mt-2 text-sm font-semibold leading-snug text-gray-600'
                              : 'mt-3 text-base font-semibold leading-snug text-gray-600 sm:text-lg md:text-xl'
                          }
                        >
                          {criterion.subheading}
                        </p>
                      ) : null}
                    </div>

                    <div className={compactLayout ? 'p-4' : 'min-h-0 p-5 sm:p-6'}>
                      <p
                        className={
                          compactLayout
                            ? 'mb-2 text-[11px] font-bold uppercase tracking-widest'
                            : 'mb-3 text-xs font-bold uppercase tracking-widest'
                        }
                        style={{ color: accent }}
                      >
                        Evidence
                      </p>
                      <div
                        className={
                          compactLayout
                            ? 'max-h-[140px] overflow-y-auto pr-1'
                            : 'max-h-[172px] overflow-y-auto pr-1 lg:max-h-[192px]'
                        }
                      >
                        <CriterionDetail detail={criterion.detail} density="compact" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
