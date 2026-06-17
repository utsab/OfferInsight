'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STEPS = [
  { href: '/parallax_tutorial/step1', label: 'Step 1', description: 'Scroll track + scrub' },
  { href: '/parallax_tutorial/step2', label: 'Step 2', description: 'Timeline + crossfade' },
] as const;

export function ParallaxTutorialNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Parallax tutorial steps"
      className="fixed right-2 top-[calc(var(--navbar-height)+0.75rem)] z-[40] flex flex-col gap-1 rounded-sm border border-gray-200 bg-white/95 p-2 shadow-sm backdrop-blur-sm sm:right-5"
    >
      <Link
        href="/parallax_tutorial"
        className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${
          pathname === '/parallax_tutorial'
            ? 'bg-[#F57360] text-white'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`}
      >
        Index
      </Link>
      {STEPS.map((step) => {
        const isActive = pathname === step.href;
        return (
          <Link
            key={step.href}
            href={step.href}
            title={step.description}
            className={`rounded px-2 py-1 text-[10px] font-medium sm:text-xs ${
              isActive
                ? 'bg-[#F57360] text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}
