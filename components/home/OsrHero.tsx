'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { HOME_ASSETS } from './homeAssets';

gsap.registerPlugin(ScrollTrigger);

function clearScrollLockStyles() {
  gsap.set([document.documentElement, document.body], {
    clearProps: 'overflow,overflowY,height',
  });
}

function refreshScrollTriggers() {
  requestAnimationFrame(() => {
    ScrollTrigger.refresh(false);
  });
}

function getNavbarHeightPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--navbar-height').trim();
  if (!raw) return 72;
  if (raw.endsWith('rem')) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(raw) * rootFontSize;
  }
  return parseFloat(raw) || 72;
}

export function OsrHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const affiliationsRef = useRef<HTMLDivElement>(null);
  const logoRefs = useRef<(HTMLImageElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const affiliations = affiliationsRef.current;
      if (!section || !affiliations) return;

      const logos = logoRefs.current.filter(Boolean) as HTMLImageElement[];
      if (logos.length !== HOME_ASSETS.affiliations.length) return;

      clearScrollLockStyles();

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reducedMotion) {
        gsap.set(affiliations, { opacity: 1, y: 0, scale: 1 });
        gsap.set(logos, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      const mm = gsap.matchMedia();

      const setupAnimation = () => {
        gsap.set(affiliations, { opacity: 0, y: 24, scale: 0.99 });
        gsap.set(logos, {
          opacity: 0,
          y: 26,
          scale: (i: number) => HOME_ASSETS.affiliations[i].scale * 0.92,
        });

        const navbarOffset = getNavbarHeightPx();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: `top top+=${navbarOffset}`,
            end: '+=220%',
            pin: true,
            pinSpacing: true,
            scrub: 0.45,
            anticipatePin: 0,
            invalidateOnRefresh: true,
          },
        });

        tl.to(
          affiliations,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.34,
            ease: 'none',
          },
          0,
        );

        tl.to(
          logos,
          {
            opacity: 1,
            y: 0,
            scale: (i: number) => HOME_ASSETS.affiliations[i].scale,
            duration: 0.38,
            stagger: 0.03,
            ease: 'none',
          },
          0.04,
        );
      };

      const initAnimations = () => {
        mm.revert();
        mm.add('(min-width: 0px)', setupAnimation);
        refreshScrollTriggers();
      };

      initAnimations();

      const onLoad = () => refreshScrollTriggers();
      window.addEventListener('load', onLoad);

      if (document.fonts?.ready) {
        document.fonts.ready.then(initAnimations);
      }

      return () => {
        window.removeEventListener('load', onLoad);
        mm.revert();
        clearScrollLockStyles();
        refreshScrollTriggers();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[calc(100dvh-var(--navbar-height))] w-full overflow-hidden bg-gradient-to-br from-midnight-blue to-gray-900"
      aria-label="Hiring manager affiliations"
    >
      <div
        ref={affiliationsRef}
        className="absolute inset-0 flex items-center justify-center px-4 sm:px-8"
        aria-labelledby="affiliations-heading"
      >
        <div className="w-full max-w-6xl text-center">
          <h2
            id="affiliations-heading"
            className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            Hiring Manager Affiliations
          </h2>
          <p className="mx-auto mb-3 max-w-5xl text-base leading-relaxed text-gray-200 sm:text-lg md:text-xl">
            Participating managers at these companies commit to interview candidates who meet their
            defined open-source benchmarks.
          </p>
          <p className="mx-auto mb-9 max-w-4xl text-sm text-gray-300 sm:text-base">
            Standards are manager-defined and do not represent official company policy.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-5">
            {HOME_ASSETS.affiliations.map((logo, index) => (
              <div
                key={logo.path}
                className="flex h-[78px] items-center justify-center rounded-xl border border-light-steel-blue/35 bg-white/95 p-3 shadow-lg sm:h-[92px] sm:p-4"
              >
                <img
                  ref={(el) => {
                    logoRefs.current[index] = el;
                  }}
                  src={logo.path}
                  alt={`${logo.label} logo`}
                  className="max-h-full max-w-full origin-center object-contain"
                  style={{
                    transform: `scale(${logo.scale})`,
                  }}
                />
              </div>
            ))}
          </div>
          <p className="mt-6 text-xl font-semibold italic tracking-wide text-gray-200 sm:mt-7 sm:text-2xl">
            and more...
          </p>
        </div>
      </div>
    </section>
  );
}
