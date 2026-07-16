'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getIntroNavProgressBarTranslateX,
  INTRO_NAV_DESKTOP_ITEM_WIDTH_CLASS,
  INTRO_NAV_MOBILE_NAV_PADDING_CLASS,
  type IntroNavSection,
} from './introScrollNav';
import { getSiteNavbarHeightPx } from './osrScrollUtils';

const ACCENT_CORAL = '#F57360';
/** Gap between navbar bottom and jump-nav buttons async with `top-[calc(var(--navbar-height)+1rem)]`. */
const NAV_TOP_GAP_PX = 16;

type IntroScrollNavProps = {
  sections: IntroNavSection[];
  activeId: string;
  activeProgress: number;
  onSelect: (section: IntroNavSection) => void;
  /** Full compact band (<1278): top strip instead of left rail. */
  compactLayout?: boolean;
};

export function IntroScrollNav({
  sections,
  activeId,
  activeProgress,
  onSelect,
  compactLayout = false,
}: IntroScrollNavProps) {
  const [navbarTopPx, setNavbarTopPx] = useState<number | null>(null);

  const syncNavbarTop = useCallback(() => {
    setNavbarTopPx(Math.ceil(getSiteNavbarHeightPx()));
  }, []);

  useEffect(() => {
    syncNavbarTop();

    const navbar = document.getElementById('site-navbar');
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && navbar
        ? new ResizeObserver(syncNavbarTop)
        : null;
    resizeObserver?.observe(navbar!);

    window.addEventListener('resize', syncNavbarTop);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncNavbarTop);
    };
  }, [syncNavbarTop]);

  if (sections.length === 0) return null;

  if (compactLayout) {
    return (
      <div
        className={`pointer-events-none fixed inset-x-0 z-[101] ${
          navbarTopPx == null ? 'top-[var(--navbar-height)]' : ''
        }`}
        style={navbarTopPx != null ? { top: `${navbarTopPx}px` } : undefined}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 top-0 bg-white/95"
        />
        <nav
          aria-label="Intro sections"
          className={`pointer-events-auto relative flex items-stretch justify-center gap-1 pb-2 pt-1.5 ${INTRO_NAV_MOBILE_NAV_PADDING_CLASS}`}
        >
          {sections.map((section) => {
            const isActive = section.id === activeId;
            const barTranslateX = isActive
              ? getIntroNavProgressBarTranslateX(activeProgress)
              : getIntroNavProgressBarTranslateX(0);

            return (
              <button
                key={section.id}
                type="button"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelect(section)}
                className={`relative min-w-0 flex-1 overflow-hidden rounded-sm px-1 py-1 text-center ${
                  isActive
                    ? 'text-[11px] font-semibold tracking-tight'
                    : 'text-[10px] font-medium text-gray-400 hover:text-gray-600'
                }`}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 will-change-transform"
                  style={{
                    backgroundColor: isActive ? `${ACCENT_CORAL}22` : 'transparent',
                    transform: `translateX(${barTranslateX})`,
                  }}
                />
                <span
                  className="relative z-10 block truncate"
                  style={isActive ? { color: ACCENT_CORAL } : undefined}
                >
                  {section.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <nav
      aria-label="Intro sections"
      className={`pointer-events-auto fixed left-2 z-[101] flex w-fit flex-col items-start gap-1.5 sm:left-5 sm:gap-2.5 ${
        navbarTopPx == null ? 'top-[calc(var(--navbar-height)+1rem)]' : ''
      }`}
      style={navbarTopPx != null ? { top: navbarTopPx + NAV_TOP_GAP_PX } : undefined}
    >
      {sections.map((section) => {
        const isActive = section.id === activeId;
        const barTranslateX = isActive
          ? getIntroNavProgressBarTranslateX(activeProgress)
          : getIntroNavProgressBarTranslateX(0);

        return (
          <button
            key={section.id}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(section)}
            className={`relative overflow-hidden rounded-sm px-1 py-0.5 text-left sm:px-1.5 sm:py-1 ${INTRO_NAV_DESKTOP_ITEM_WIDTH_CLASS} ${
              isActive
                ? 'text-xs font-semibold tracking-tight sm:text-base md:text-lg'
                : 'text-[9px] font-medium text-gray-400 hover:text-gray-600 sm:text-[10px] md:text-xs'
            }`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 will-change-transform"
              style={{
                backgroundColor: isActive ? `${ACCENT_CORAL}22` : 'transparent',
                transform: `translateX(${barTranslateX})`,
              }}
            />
            <span
              className="relative z-10 block whitespace-nowrap"
              style={isActive ? { color: ACCENT_CORAL } : undefined}
            >
              {section.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
