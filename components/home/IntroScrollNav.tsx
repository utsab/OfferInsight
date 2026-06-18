'use client';

import {
  getIntroNavProgressBarTranslateX,
  type IntroNavSection,
} from './introScrollNav';

const ACCENT_CORAL = '#F57360';

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
  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Intro sections"
      className="pointer-events-auto fixed left-2 top-[calc(var(--navbar-height)+1rem)] z-[30] flex flex-col gap-1.5 sm:left-5 sm:gap-2.5"
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
              className="relative z-10 block"
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
