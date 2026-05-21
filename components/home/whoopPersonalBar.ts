export const WHOOP_LOGO_PATH = '/images/home/whoop-logo_brandlogos.net_l0f1l.png';

export const WHOOP_PERSONAL_BAR_TITLE =
  'Personal bar of a Hiring Manager from Whoop';

export type WhoopPersonalBarCriterion = {
  id: string;
  label: string;
  detail: string;
};

export const WHOOP_PERSONAL_BAR_CRITERIA: readonly WhoopPersonalBarCriterion[] = [
  {
    id: 'problem-solving',
    label:
      'Problem-solving skills: Experience solving real-life engineering problems',
    detail: '6 issues solved',
  },
  {
    id: 'coachability',
    label: 'Coachability: Can take critical feedback',
    detail:
      '2 examples of a pull request which received critical feedback which was then followed up with a resubmission that was eventually accepted.',
  },
  {
    id: 'closer',
    label: 'Closer: Follows through on a task until it is fully done',
    detail:
      'Time to completion (from the moment an issue is started to the moment it is merged into the codebase) averages to 3 months or less.',
  },
];
