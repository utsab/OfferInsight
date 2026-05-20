'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { handleSignIn } from '@/components/auth-actions';
import { OsrbHero } from '@/components/home/OsrbHero';

export default function Page() {
  const [onboardingProgress, setOnboardingProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [userRes, instructorRes] = await Promise.all([
          fetch('/api/users/onboarding2'),
          fetch('/api/instructor'),
        ]);

        if (instructorRes.ok) {
          setIsInstructor(true);
        }

        if (userRes.ok) {
          const user = await userRes.json();
          setOnboardingProgress(user.onboardingProgress);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleGoToDashboard = async () => {
    if (loading) return;

    if (isInstructor) {
      window.location.href = '/instructor/dashboard';
      return;
    }

    if (!isAuthenticated) {
      await handleSignIn();
      return;
    }

    switch (onboardingProgress) {
      case 0:
        window.location.href = '/onboarding/page1';
        break;
      case 1:
        window.location.href = '/onboarding/page2';
        break;
      case 2:
        window.location.href = '/onboarding/page3';
        break;
      case 3:
        window.location.href = '/dashboard';
        break;
      default:
        window.location.href = '/onboarding/page1';
    }
  };

  const showDashboardButton = !loading && (isAuthenticated || isInstructor);

  const dashboardButton =
    portalReady &&
    createPortal(
      <button
        type="button"
        onClick={handleGoToDashboard}
        aria-hidden={!showDashboardButton}
        tabIndex={showDashboardButton ? 0 : -1}
        className={`fixed right-4 top-[calc(var(--navbar-height)+0.5rem)] z-[105] rounded-lg bg-electric-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-blue-600 sm:right-6 sm:px-6 sm:py-3 sm:text-base ${
          showDashboardButton ? '' : 'pointer-events-none invisible'
        }`}
      >
        Go to Dashboard
      </button>,
      document.body,
    );

  return (
    <div className="min-h-[calc(100dvh-var(--navbar-height))] bg-gradient-to-br from-midnight-blue to-gray-900">
      {dashboardButton}
      <OsrbHero />
    </div>
  );
}
