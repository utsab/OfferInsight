import { getViewportOffsetTopPx } from './osrScrollUtils';

export type StaticIntroNavSection = {
  id: string;
  label: string;
  /** Document scroll target when the section is selected. */
  scrollTargetId: string;
  /** Element whose top marks when this section becomes active while scrolling. */
  startElementId: string;
  scrollToPageBottom?: boolean;
};

export const STATIC_INTRO_NAV_SECTIONS: StaticIntroNavSection[] = [
  {
    id: 'intro',
    label: 'Intro',
    scrollTargetId: 'intro-zero',
    startElementId: 'intro-zero',
  },
  {
    id: 'personal-bars',
    label: 'Personal Bars',
    scrollTargetId: 'whoop-bar-heading',
    startElementId: 'intro-whoop-bar',
  },
  {
    id: 'contact',
    label: 'Contact',
    scrollTargetId: 'intro-actions',
    startElementId: 'intro-actions',
    scrollToPageBottom: true,
  },
];

export const STATIC_SECTION_SCROLL_MT =
  'scroll-mt-[calc(var(--navbar-height)+var(--static-intro-nav-height,3.25rem)+0.5rem)]';

function getElementDocumentTop(id: string): number | null {
  const element = document.getElementById(id);
  if (!element) return null;
  return element.getBoundingClientRect().top + window.scrollY;
}

export function getStaticIntroNavHeaderOffsetPx(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--static-intro-nav-height')
    .trim();
  const navHeight = raw.endsWith('px') ? parseFloat(raw) : 52;

  return getViewportOffsetTopPx(0) + navHeight;
}

function getSectionRangeStart(section: StaticIntroNavSection, headerOffsetPx: number): number {
  if (section.id === 'intro') return 0;
  const top = getElementDocumentTop(section.startElementId);
  if (top === null) return 0;
  return Math.max(0, top - headerOffsetPx);
}

function getSectionRangeEnd(
  sections: StaticIntroNavSection[],
  index: number,
  headerOffsetPx: number,
): number {
  const next = sections[index + 1];
  if (next) return getSectionRangeStart(next, headerOffsetPx);
  const contact = sections[sections.length - 1];
  if (contact?.scrollToPageBottom) {
    return Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      getSectionRangeStart(contact, headerOffsetPx),
    );
  }
  return document.documentElement.scrollHeight - window.innerHeight;
}

export function getActiveStaticIntroNavId(
  sections: StaticIntroNavSection[],
  scrollY: number,
  headerOffsetPx: number,
): string {
  if (sections.length === 0) return 'intro';

  const referenceY = scrollY + headerOffsetPx * 0.35;
  let active = sections[0].id;

  for (const section of sections) {
    const start = getSectionRangeStart(section, headerOffsetPx);
    if (referenceY + 2 >= start) active = section.id;
  }

  return active;
}

export function getStaticIntroNavSectionProgress(
  sections: StaticIntroNavSection[],
  scrollY: number,
  sectionId: string,
  headerOffsetPx: number,
): number {
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index === -1) return 0;

  const section = sections[index];
  const start = getSectionRangeStart(section, headerOffsetPx);
  const end = getSectionRangeEnd(sections, index, headerOffsetPx);
  const span = end - start;
  if (span <= 0) return 1;

  return Math.min(1, Math.max(0, (scrollY - start) / span));
}

export function scrollToStaticIntroNavSection(
  section: StaticIntroNavSection,
  headerOffsetPx: number,
): void {
  if (section.scrollToPageBottom) {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
    return;
  }

  if (section.id === 'intro') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const targetTop = getElementDocumentTop(section.scrollTargetId);
  if (targetTop === null) return;

  window.scrollTo({
    top: Math.max(0, targetTop - headerOffsetPx),
    behavior: 'smooth',
  });
}
