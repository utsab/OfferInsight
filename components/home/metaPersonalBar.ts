import type { PersonalBarCriterion } from './personalBarTypes';

export const META_LOGO_PATH =
  '/images/home/meta_platforms-logo_brandlogos.net_rqa1r.png';

export const META_PERSONAL_BAR_TITLE =
  'Personal bar of a Hiring Manager for Meta';

export const META_PERSONAL_BAR_CRITERIA: readonly PersonalBarCriterion[] = [
  {
    id: 'problem-solving',
    label: 'Problem-solving skills',
    detail:
      '2 examples of creating your own open source project from scratch or 6 examples of issues solved on a pre-existing, respected open source project',
  },
  {
    id: 'proactiveness',
    label: 'Proactiveness / Initiative',
    detail: [
      '2 examples where the definition of “done” goes beyond the bare minimum of what is asked for in the original issue.',
      'Examples:',
      'Do they think about details that are not explicitly asked for (e.g. writing unit tests or updating documentation)?',
      'Do they consider other aspects of the product, like user-friendliness, performance or security?',
    ],
  },
  {
    id: 'teamwork',
    label: 'Teamwork / Collaboration',
    detail: [
      '2 examples where feedback was proactively sought after and incorporated either from project collaborators or from users. They demonstrate a willingness/desire to improve themselves and their product.',
      '1 example of a pull request with thorough documentation explaining the contribution, even better if the issue has comments throughout the timeline of the Github thread.',
    ],
  },
  {
    id: 'ai',
    label: 'Applying AI to solve everyday problems',
    detail:
      '1 example of using AI APIs to simplify or automate personal or business workflows.',
  },
];
