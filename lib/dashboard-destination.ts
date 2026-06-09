export function getUserDashboardPath(onboardingProgress: number | null | undefined): string {
  switch (onboardingProgress) {
    case 0:
      return '/onboarding/page1';
    case 1:
      return '/onboarding/page2';
    case 2:
      return '/onboarding/page3';
    case 3:
      return '/dashboard';
    default:
      return '/onboarding/page1';
  }
}
