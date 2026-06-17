'use client';

import { PersonalBarSection } from './PersonalBarSection';
import type { CSSProperties } from 'react';
import type { PersonalBarRefs } from './personalBarTypes';
import {
  META_LOGO_PATH,
  META_PERSONAL_BAR_CRITERIA,
  META_PERSONAL_BAR_TITLE,
} from './metaPersonalBar';

type MetaPersonalBarSectionProps = {
  sectionShell: string;
  refs: PersonalBarRefs;
  sectionStyle?: CSSProperties;
  compactLayout?: boolean;
};

export function MetaPersonalBarSection({
  sectionShell,
  refs,
  sectionStyle,
  compactLayout,
}: MetaPersonalBarSectionProps) {
  return (
    <PersonalBarSection
      sectionShell={sectionShell}
      sectionId="intro-meta-bar"
      headingId="meta-bar-heading"
      title={META_PERSONAL_BAR_TITLE}
      logoPath={META_LOGO_PATH}
      logoAlt="Meta"
      criteria={META_PERSONAL_BAR_CRITERIA}
      refs={refs}
      sectionStyle={sectionStyle}
      compactLayout={compactLayout}
      zIndexClass="z-[24]"
    />
  );
}
