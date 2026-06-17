'use client';

import { useId, useState } from 'react';

const ACCENT_CORAL = '#F57360';

const STATIC_NAV_LINKS = [
  { id: 'intro', label: 'Intro', href: '#intro-zero' },
  { id: 'who', label: 'Who', href: '#intro-who-heading' },
  { id: 'how', label: 'How', href: '#intro-how-heading' },
  { id: 'whoop', label: 'Personal Bar 1', href: '#whoop-bar-heading' },
  { id: 'microsoft', label: 'Personal Bar 2', href: '#microsoft-bar-heading' },
  { id: 'meta', label: 'Personal Bar 3', href: '#meta-bar-heading' },
  { id: 'affiliations', label: 'Affiliations', href: '#affiliations-heading' },
  { id: 'actions', label: "What's next", href: '#intro-actions-heading' },
] as const;

export function StaticIntroNav() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

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
        {STATIC_NAV_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            tabIndex={isOpen ? 0 : -1}
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-medium text-gray-500 transition-colors hover:text-gray-800 sm:text-xs"
          >
            {link.label}
          </a>
        ))}
        <p className="mt-1 border-t border-gray-100 pt-2 text-[9px] leading-snug text-gray-400 sm:text-[10px]">
          Mobile layout —{' '}
          <span className="font-medium" style={{ color: ACCENT_CORAL }}>
            scroll
          </span>{' '}
          to read each section.
        </p>
      </nav>
    </div>
  );
}
