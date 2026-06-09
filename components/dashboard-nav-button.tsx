'use client';

import { useRouter } from 'next/navigation';
import { getUserDashboardPath } from '@/lib/dashboard-destination';

type DashboardNavButtonProps = {
  onboardingProgress?: number | null;
  instructor?: boolean;
};

export function DashboardNavButton({
  onboardingProgress,
  instructor = false,
}: DashboardNavButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() =>
        router.push(instructor ? '/instructor/dashboard' : getUserDashboardPath(onboardingProgress))
      }
      className="rounded-lg bg-electric-blue px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 whitespace-nowrap sm:px-5 sm:text-base"
    >
      Go to Dashboard
    </button>
  );
}
