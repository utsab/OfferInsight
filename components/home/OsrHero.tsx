'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { HOME_ASSETS } from './homeAssets';

gsap.registerPlugin(ScrollTrigger);

/** Pinned timeline: phase 4 (how it works + contracts) → phase 5 (affiliations). */
const PHASE5_START = 0.52;

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
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const affiliationsRef = useRef<HTMLDivElement>(null);
  const contractRefs = useRef<(HTMLImageElement | null)[]>([]);
  const logoRefs = useRef<(HTMLImageElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const howItWorks = howItWorksRef.current;
      const affiliations = affiliationsRef.current;
      if (!section || !howItWorks || !affiliations) return;

      const contracts = contractRefs.current.filter(Boolean) as HTMLImageElement[];
      const logos = logoRefs.current.filter(Boolean) as HTMLImageElement[];
      if (contracts.length !== 3 || logos.length !== HOME_ASSETS.affiliations.length) return;

      clearScrollLockStyles();

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reducedMotion) {
        gsap.set(howItWorks, { opacity: 0, y: 0, scale: 1 });
        gsap.set(affiliations, { opacity: 1, y: 0, scale: 1 });
        gsap.set(contracts, { opacity: 1, y: 0, rotate: 0, scale: 1 });
        gsap.set(logos, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      const mm = gsap.matchMedia();

      const setupAnimation = () => {
        gsap.set(howItWorks, { opacity: 0, y: 26, scale: 0.985 });
        gsap.set(affiliations, { opacity: 0, y: 24, scale: 0.99 });
        gsap.set(contracts, {
          opacity: 0,
          y: 56,
          rotate: (i: number) => (i === 1 ? -6 : i === 2 ? 6 : 0),
          scale: (i: number) => (i === 0 ? 0.97 : 0.94),
        });
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
            end: '+=340%',
            pin: true,
            pinSpacing: true,
            scrub: 0.45,
            anticipatePin: 0,
            invalidateOnRefresh: true,
          },
        });

        tl.to(
          howItWorks,
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
          contracts,
          {
            opacity: 1,
            y: 0,
            rotate: (i: number) => (i === 1 ? -5 : i === 2 ? 5 : 0),
            scale: (i: number) => (i === 0 ? 1 : 0.965),
            duration: 0.38,
            stagger: 0.08,
            ease: 'none',
          },
          0.03,
        );

        tl.to(
          howItWorks,
          {
            opacity: 0,
            y: -58,
            scale: 0.96,
            duration: 0.28,
            ease: 'none',
          },
          PHASE5_START - 0.08,
        );

        tl.to(
          contracts,
          {
            opacity: 0,
            y: -24,
            scale: 0.9,
            duration: 0.26,
            stagger: 0.04,
            ease: 'none',
          },
          PHASE5_START - 0.08,
        );

        tl.to(
          affiliations,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.32,
            ease: 'none',
          },
          PHASE5_START,
        );

        tl.to(
          logos,
          {
            opacity: 1,
            y: 0,
            scale: (i: number) => HOME_ASSETS.affiliations[i].scale,
            duration: 0.34,
            stagger: 0.03,
            ease: 'none',
          },
          PHASE5_START + 0.02,
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
      aria-label="How it works and hiring manager affiliations"
    >
      <div
        ref={howItWorksRef}
        className="absolute inset-0 flex items-center justify-center px-4 sm:px-8"
        aria-labelledby="how-it-works-heading"
      >
        <div className="w-full max-w-6xl text-center">
          <h2
            id="how-it-works-heading"
            className="mb-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            How it works
          </h2>
          <p className="mx-auto mb-10 max-w-4xl text-lg leading-relaxed text-gray-200 sm:text-xl md:text-2xl">
            SWE Hiring Managers define their dream candidate in terms of measurable open source
            achievements. Their personal bar becomes an actionable pathway for junior devs.
          </p>

          <div className="relative mx-auto h-[420px] w-full max-w-6xl md:h-[520px]">
            <img
              ref={(el) => {
                contractRefs.current[0] = el;
              }}
              src={HOME_ASSETS.contracts[0]}
              alt="Redacted contract 001"
              className="absolute left-1/2 top-1/2 h-[340px] w-auto max-w-[88vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-light-steel-blue/50 bg-gray-800/80 object-contain shadow-2xl md:h-[430px] md:max-w-none"
            />
            <img
              ref={(el) => {
                contractRefs.current[1] = el;
              }}
              src={HOME_ASSETS.contracts[1]}
              alt="Redacted contract 005"
              className="absolute left-[24%] top-[56%] hidden h-[300px] w-auto -translate-x-1/2 -translate-y-1/2 rounded-xl border border-light-steel-blue/40 bg-gray-800/70 object-contain shadow-xl md:block"
            />
            <img
              ref={(el) => {
                contractRefs.current[2] = el;
              }}
              src={HOME_ASSETS.contracts[2]}
              alt="Redacted contract 011"
              className="absolute left-[76%] top-[56%] hidden h-[300px] w-auto -translate-x-1/2 -translate-y-1/2 rounded-xl border border-light-steel-blue/40 bg-gray-800/70 object-contain shadow-xl md:block"
            />
          </div>
        </div>
      </div>

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
