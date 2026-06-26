'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getIntroNavProgressBarTranslateX,
  type IntroNavSection,
} from './introScrollNav';
import { getSiteNavbarHeightPx } from './osrScrollUtils';

const ACCENT_CORAL = '#F57360';
/** Bleed above the nav strip to cover subpixel gaps below the site navbar. */
const BACKDROP_BLEED_TOP_PX = 12;
/** Gap between navbar bottom and jump-nav buttons async with `top-[calc(var(--navbar-height)+1rem)]`. */
const NAV_TOP_GAP_PX = 16;
/** Tall enough to mask personal-bar content scrolling up behind the left nav. */
const BACKDROP_FADE_HEIGHT_PX = 148;

type IntroScrollNavProps = {
  sections: IntroNavSection[];
  activeId: string;
  activeProgress: number;
  onSelect: (section: IntroNavSection) => void;
};

export function IntroScrollNav({
  sections,
  activeId,
  activeProgress,
  onSelect,
}: IntroScrollNavProps) {
  const [mounted, setMounted] = useState(false);
  const [navbarTopPx, setNavbarTopPx] = useState<number | null>(null);

  const syncNavbarTop = useCallback(() => {
    setNavbarTopPx(Math.ceil(getSiteNavbarHeightPx()));
  }, []);

  useEffect(() => {
    setMounted(true);
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

  const showBackdrop = activeId === 'personal-bar';

  const backdrop =
    mounted &&
    createPortal(
      <div
        className={`pointer-events-none fixed inset-x-0 z-[100] transition-opacity duration-300 ${
          showBackdrop ? 'opacity-100' : 'opacity-0'
        } ${navbarTopPx == null ? 'top-[var(--navbar-height)]' : ''}`}
        style={{
          ...(navbarTopPx != null ? { top: `${navbarTopPx}px` } : {}),
          height: `${NAV_TOP_GAP_PX + BACKDROP_FADE_HEIGHT_PX}px`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            top: `-${BACKDROP_BLEED_TOP_PX}px`,
            background:
              'linear-gradient(to bottom, #ffffff 0%, #ffffff 70%, rgba(255,255,255,0.97) 86%, transparent 100%)',
          }}
        />
      </div>,
      document.body,
    );

  return (
    <>
      {backdrop}

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
              className={`relative overflow-hidden rounded-sm px-1 py-0.5 text-left sm:px-1.5 sm:py-1 ${
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
    </>
  );
}
