import type { RefObject } from 'react';

export type PersonalBarCriterion = {
  id: string;
  heading: string;
  subheading?: string;
  /** Plain paragraph or bullet list (rendered with ● markers). */
  detail: string | readonly string[];
};

export type PersonalBarTitle = {
  heading: string;
  subheading?: string;
};

export type PersonalBarRefs = {
  section: RefObject<HTMLElement | null>;
  bgLogo: RefObject<HTMLDivElement | null>;
  content: RefObject<HTMLDivElement | null>;
};
