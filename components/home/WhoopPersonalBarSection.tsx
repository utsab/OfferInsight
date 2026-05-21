'use client';

import { PersonalBarSection } from './PersonalBarSection';
import type { PersonalBarRefs } from './personalBarTypes';
import {
  WHOOP_LOGO_PATH,
  WHOOP_PERSONAL_BAR_CRITERIA,
  WHOOP_PERSONAL_BAR_TITLE,
} from './whoopPersonalBar';

export type WhoopPersonalBarRefs = PersonalBarRefs;

type WhoopPersonalBarSectionProps = {
  sectionShell: string;
  refs: WhoopPersonalBarRefs;
};

export function WhoopPersonalBarSection({ sectionShell, refs }: WhoopPersonalBarSectionProps) {
  return (
    <PersonalBarSection
      sectionShell={sectionShell}
      sectionId="intro-whoop-bar"
      headingId="whoop-bar-heading"
      title={WHOOP_PERSONAL_BAR_TITLE}
      logoPath={WHOOP_LOGO_PATH}
      criteria={WHOOP_PERSONAL_BAR_CRITERIA}
      refs={refs}
      zIndexClass="z-20"
    />
  );
}
