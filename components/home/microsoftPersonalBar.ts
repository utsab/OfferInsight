import type { PersonalBarCriterion } from './personalBarTypes';

export const MICROSOFT_LOGO_PATH = '/images/home/microsoft-logo-black.svg';

export const MICROSOFT_PERSONAL_BAR_TITLE =
  'Personal bar of a Hiring Manager from Microsoft';

export const MICROSOFT_PERSONAL_BAR_CRITERIA: readonly PersonalBarCriterion[] = [
  {
    id: 'collaboration',
    label: 'Collaboration/Teamwork',
    detail: [
      '2 examples of comments on a PR that is not their own, where their feedback is accepted by the other person.',
      '2 examples of a pull request where the candidate received critical feedback and they incorporated the feedback.',
      'Ideally some kind of back-and-forth conversation occurred.',
    ],
  },
  {
    id: 'curiosity',
    label: 'Curiosity',
    detail: [
      '2 examples of finding and filing new bugs on the project.',
      '1 example of fixing a complex bug (getting to the root cause), where they had to explore multiple branches of possibilities. The solution is explained in a blog post, video walkthrough, or detailed pull request description.',
    ],
  },
  {
    id: 'initiative',
    label: 'Initiative',
    detail: [
      '1 example of solving a problem for the project that wasn’t directly asked for (for example, they open and solve an issue themselves, initiate a new feature, or improve the project’s technical documentation)',
      '2 examples of helping onboard someone into the project (e.g. answering questions on the project’s forum).',
    ],
  },
  {
    id: 'product-sense',
    label: 'Product sense (cares about the product / cares about the customers)',
    detail: [
      'They not only contribute to the project, but they also use it actively.',
      '1 example of the candidate self-hosting the product and using it in a meaningful way (demonstrated in a video walkthrough) or using the project/library in another one of their personal projects.',
    ],
  },
];
