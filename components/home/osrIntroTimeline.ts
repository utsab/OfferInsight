/**
 * Ordered homepage scroll phases (viewport-height multiples).
 * Insert new phases between `howLettersMove` and `howToAffiliations` — not at the end.
 */
export type OsrScrollPhase = {
  at: number;
  durationPercent: number;
};

export const OSR_SCROLL_PHASES = {
  typingFadeOut: { at: 0, durationPercent: 40 },
  pageIndicator: { at: 0, durationPercent: 520 },
  whoSectionIn: { at: 1.0, durationPercent: 50 },
  whoLettersMove: { at: 1.2, durationPercent: 170 },
  whoContentIn: { at: 2.6, durationPercent: 40 },
  whoSectionOut: { at: 4.1, durationPercent: 40 },
  howSectionIn: { at: 4.6, durationPercent: 30 },
  howLettersMove: { at: 4.9, durationPercent: 80 },
  /** Affiliations replaces How it works here (Apprenta-style handoff at ~5.7× vh). */
  howToAffiliations: { at: 5.7, durationPercent: 38 },
  affiliationsLogos: { at: 5.95, durationPercent: 88 },
} as const satisfies Record<string, OsrScrollPhase>;

/** Extra scroll after the last scrub scene so logo stagger can finish. */
const SCROLL_TAIL_HOLD_VH = 0.65;

const lastPhaseEndVh =
  OSR_SCROLL_PHASES.affiliationsLogos.at +
  OSR_SCROLL_PHASES.affiliationsLogos.durationPercent / 100;

/** Total scroll track height — always past the final animation. */
export const OSR_SCROLL_HEIGHT_VH = lastPhaseEndVh + SCROLL_TAIL_HOLD_VH;

/** Mobile overrides for phases that differ from desktop. */
export const OSR_SCROLL_PHASES_MOBILE: Partial<typeof OSR_SCROLL_PHASES> = {
  typingFadeOut: { at: 0, durationPercent: 20 },
  whoSectionIn: { at: 0.4, durationPercent: 20 },
  whoLettersMove: { at: 0.5, durationPercent: 30 },
  whoContentIn: { at: 0.8, durationPercent: 20 },
  howLettersMove: { at: 4.9, durationPercent: 80 },
};

export function getScrollPhase(
  key: keyof typeof OSR_SCROLL_PHASES,
  isMobile: boolean,
): OsrScrollPhase {
  const desktop = OSR_SCROLL_PHASES[key];
  const mobile = OSR_SCROLL_PHASES_MOBILE[key];
  if (isMobile && mobile) {
    return { ...desktop, ...mobile };
  }
  return desktop;
}
