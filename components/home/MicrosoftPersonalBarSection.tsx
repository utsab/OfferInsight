'use client';

import { PersonalBarSection } from './PersonalBarSection';
import type { PersonalBarRefs } from './personalBarTypes';
import {
  MICROSOFT_LOGO_PATH,
  MICROSOFT_PERSONAL_BAR_CRITERIA,
  MICROSOFT_PERSONAL_BAR_TITLE,
} from './microsoftPersonalBar';

export type MicrosoftPersonalBarRefs = PersonalBarRefs;

type MicrosoftPersonalBarSectionProps = {
  sectionShell: string;
  refs: MicrosoftPersonalBarRefs;
};

export function MicrosoftPersonalBarSection({
  sectionShell,
  refs,
}: MicrosoftPersonalBarSectionProps) {
  return (
    <PersonalBarSection
      sectionShell={sectionShell}
      sectionId="intro-microsoft-bar"
      headingId="microsoft-bar-heading"
      title={MICROSOFT_PERSONAL_BAR_TITLE}
      logoPath={MICROSOFT_LOGO_PATH}
      logoAlt="Microsoft"
      criteria={MICROSOFT_PERSONAL_BAR_CRITERIA}
      refs={refs}
      zIndexClass="z-[22]"
    />
  );
}
