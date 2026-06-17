import type { RefObject } from 'react';

export type PersonalBarCriterion = {
  id: string;
  label: string;
  /** Plain paragraph or bullet list (rendered with ● markers). */
  detail: string | readonly string[];
};

export type PersonalBarRefs = {
  section: RefObject<HTMLElement | null>;
  bgLogo: RefObject<HTMLDivElement | null>;
  content: RefObject<HTMLDivElement | null>;
};
