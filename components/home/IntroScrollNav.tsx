'use client';

import { useId, useState } from 'react';
import type { IntroNavSection } from './introScrollNav';

const ACCENT_CORAL = '#F57360';

type IntroScrollNavProps = {
  sections: IntroNavSection[];
  activeId: string;
  onSelect: (section: IntroNavSection) => void;
};

export function IntroScrollNav({ sections, activeId, onSelect }: IntroScrollNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  if (sections.length === 0) return null;

  const handleSelect = (section: IntroNavSection) => {
    onSelect(section);
    setIsOpen(false);
  };

  return (
    <div className="pointer-events-auto fixed left-2 top-[calc(var(--navbar-height)+1rem)] z-[30] sm:left-5">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={isOpen ? 'Close section navigation' : 'Open section navigation'}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-10 items-center justify-center rounded-sm border border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:border-gray-300 sm:h-11 sm:w-11"
      >
        <span className="flex flex-col gap-1" aria-hidden>
          <span className="block h-0.5 w-5 rounded-full bg-gray-700" />
          <span className="block h-0.5 w-5 rounded-full bg-gray-700" />
          <span className="block h-0.5 w-5 rounded-full bg-gray-700" />
        </span>
      </button>

      <nav
        id={menuId}
        aria-label="Intro sections"
        aria-hidden={!isOpen}
        className={`mt-2 flex max-h-[min(70vh,24rem)] flex-col gap-1.5 overflow-hidden rounded-sm border border-gray-200 bg-white/95 p-2 shadow-sm backdrop-blur-sm transition-[max-height,opacity,transform,margin] duration-200 ease-out sm:gap-2.5 sm:p-2.5 ${
          isOpen
            ? 'pointer-events-auto max-h-[min(70vh,24rem)] translate-y-0 opacity-100'
            : 'pointer-events-none max-h-0 -translate-y-1 border-transparent p-0 opacity-0 shadow-none'
        }`}
      >
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              tabIndex={isOpen ? 0 : -1}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => handleSelect(section)}
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
    </div>
  );
}
