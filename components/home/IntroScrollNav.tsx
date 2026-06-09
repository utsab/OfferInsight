'use client';

import type { IntroNavSection } from './introScrollNav';

const ACCENT_CORAL = '#F57360';

type IntroScrollNavProps = {
  sections: IntroNavSection[];
  activeId: string;
  onSelect: (section: IntroNavSection) => void;
};

export function IntroScrollNav({ sections, activeId, onSelect }: IntroScrollNavProps) {
  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Intro sections"
      className="pointer-events-auto fixed left-2 top-[calc(var(--navbar-height)+1rem)] z-[30] flex flex-col gap-1.5 sm:left-5 sm:gap-2.5"
    >
      {sections.map((section) => {
        const isActive = section.id === activeId;
        return (
          <button
            key={section.id}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(section)}
            className={`origin-left text-left transition-all duration-200 ${
              isActive
                ? 'text-xs font-semibold tracking-tight sm:text-base md:text-lg'
                : 'text-[9px] font-medium text-gray-400 hover:text-gray-600 sm:text-[10px] md:text-xs'
            }`}
            style={isActive ? { color: ACCENT_CORAL } : undefined}
          >
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}
