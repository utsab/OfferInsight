'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  STATIC_INTRO_NAV_SECTIONS,
  getActiveStaticIntroNavId,
  getStaticIntroNavHeaderOffsetPx,
  getStaticIntroNavSectionProgress,
  scrollToStaticIntroNavSection,
} from './staticIntroScrollNav';
import { getIntroNavProgressBarTranslateX } from './introScrollNav';

const ACCENT_CORAL = '#F57360';

export function StaticIntroNav() {
  const navShellRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState('intro');
  const [activeProgress, setActiveProgress] = useState(0);

  const syncNavHeightVariable = useCallback(() => {
    const height = navShellRef.current?.offsetHeight ?? 52;
    document.documentElement.style.setProperty('--static-intro-nav-height', `${height}px`);
  }, []);

  useEffect(() => {
    syncNavHeightVariable();

    const updateActive = () => {
      const headerOffsetPx = getStaticIntroNavHeaderOffsetPx();
      const scrollY = window.scrollY;
      const nextActiveId = getActiveStaticIntroNavId(
        STATIC_INTRO_NAV_SECTIONS,
        scrollY,
        headerOffsetPx,
      );
      setActiveId(nextActiveId);
      setActiveProgress(
        getStaticIntroNavSectionProgress(
          STATIC_INTRO_NAV_SECTIONS,
          scrollY,
          nextActiveId,
          headerOffsetPx,
        ),
      );
    };

    const onViewportChange = () => {
      syncNavHeightVariable();
      updateActive();
    };

    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', onViewportChange);

    return () => {
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', onViewportChange);
      document.documentElement.style.removeProperty('--static-intro-nav-height');
    };
  }, [syncNavHeightVariable]);

  return (
    <div
      ref={navShellRef}
      className="pointer-events-none fixed inset-x-0 top-[var(--navbar-height)] z-[30]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+1.25rem)]"
        style={{
          background:
            'linear-gradient(to bottom, #ffffff 0%, #ffffff 62%, rgba(255,255,255,0.92) 82%, transparent 100%)',
        }}
      />

      <nav
        aria-label="Intro sections"
        className="pointer-events-auto relative flex items-stretch justify-center gap-1 px-3 pb-2.5 pt-2 sm:gap-2 sm:px-5 sm:pb-3 sm:pt-2.5"
      >
        {STATIC_INTRO_NAV_SECTIONS.map((section) => {
          const isActive = section.id === activeId;
          const barTranslateX = getIntroNavProgressBarTranslateX(isActive ? activeProgress : 0);

          return (
            <button
              key={section.id}
              type="button"
              aria-current={isActive ? 'true' : undefined}
              onClick={() => {
                scrollToStaticIntroNavSection(section, getStaticIntroNavHeaderOffsetPx());
              }}
              className={`relative min-w-0 flex-1 overflow-hidden rounded-sm px-1 py-1 text-center sm:px-2 sm:py-1.5 ${
                isActive
                  ? 'text-[11px] font-semibold tracking-tight sm:text-sm'
                  : 'text-[10px] font-medium text-gray-400 hover:text-gray-600 sm:text-xs'
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
