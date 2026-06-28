'use client';

import { PersonalBarSection } from './PersonalBarSection';
import { PersonalBarSectionIII } from './PersonalBarSection-III';

import type { CSSProperties } from 'react';
import type { PersonalBarRefs } from './personalBarTypes';
import {
  WHOOP_LOGO_PATH,
  WHOOP_PERSONAL_BAR_CRITERIA,
  WHOOP_PERSONAL_BAR_TITLE,
} from './whoopPersonalBar';

type WhoopPersonalBarSectionProps = {
  sectionShell: string;
  refs: PersonalBarRefs;
  sectionStyle?: CSSProperties;
  compactLayout?: boolean;
};

export function WhoopPersonalBarSection({
  sectionShell,
  refs,
  sectionStyle,
  compactLayout,
}: WhoopPersonalBarSectionProps) {
  return (
    <PersonalBarSectionIII
      sectionShell={sectionShell}
      sectionId="intro-whoop-bar"
      headingId="whoop-bar-heading"
      title={WHOOP_PERSONAL_BAR_TITLE}
      logoPath={WHOOP_LOGO_PATH}
      criteria={WHOOP_PERSONAL_BAR_CRITERIA}
      refs={refs}
      sectionStyle={sectionStyle}
      compactLayout={compactLayout}
      zIndexClass="z-20"
    />
  );
}
