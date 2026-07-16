import type { PersonalBarCriterion } from './personalBarTypes';

type CriterionDetailProps = {
  detail: PersonalBarCriterion['detail'];
  density?: 'default' | 'compact';
};

export function CriterionDetail({ detail, density = 'default' }: CriterionDetailProps) {
  const detailClass =
    density === 'compact'
      ? 'text-left text-sm leading-relaxed text-gray-800 sm:text-base md:text-base lg:text-lg'
      : 'text-left text-base leading-relaxed text-gray-800 sm:text-lg md:text-xl lg:text-2xl';

  if (typeof detail === 'string') {
    return <p className={detailClass}>{detail}</p>;
  }

  return (
    <ul className={`${detailClass} list-none space-y-3 sm:space-y-4`}>
      {detail.map((bullet, index) => {
        if (bullet === 'Examples:') {
          return (
            <li
              key={index}
              className="pt-1 text-sm font-semibold uppercase tracking-wide text-gray-600 sm:text-base"
            >
              {bullet}
            </li>
          );
        }

        return (
          <li key={index} className="flex gap-2 sm:gap-3">
            <span className="shrink-0 text-gray-600" aria-hidden>
              ●
            </span>
            <span>{bullet}</span>
          </li>
        );
      })}
    </ul>
  );
}
