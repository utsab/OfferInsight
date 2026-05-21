'use client';

import { PersonalBarSection } from './PersonalBarSection';
import type { PersonalBarRefs } from './personalBarTypes';
import {
  META_LOGO_PATH,
  META_PERSONAL_BAR_CRITERIA,
  META_PERSONAL_BAR_TITLE,
} from './metaPersonalBar';

export type MetaPersonalBarRefs = PersonalBarRefs;

type MetaPersonalBarSectionProps = {
  sectionShell: string;
  refs: MetaPersonalBarRefs;
};

export function MetaPersonalBarSection({ sectionShell, refs }: MetaPersonalBarSectionProps) {
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
      zIndexClass="z-[24]"
    />
  );
}
