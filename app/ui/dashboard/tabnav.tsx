"use client";

import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { getDashboardMetrics } from "@/app/actions/dashboard-metrics";

// Define the props for the health bar component
interface HealthBarProps {
  current: number;
  total: number;
  isActive: boolean;
  displayValue: string;
}

// Create the health bar component based on ProgressBar
function HealthBar({ current, total, isActive, displayValue }: HealthBarProps) {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // Calculate percentage with a maximum of 100%
    const calculatedPercentage = Math.min((current / total) * 100, 100);
    setPercentage(calculatedPercentage);
  }, [current, total]);

  const getHealthBarColor = () => {
    if (percentage === 100) {
      return "bg-blue-500 animate-pulse"; // Glowing blue at 100%
    } else if (percentage >= 50) {
      return "bg-green-500"; // Green for 50-99%
    } else {
      return "bg-orange-500"; // Orange for 0-49%
    }
  };

  return (
    <div className="w-full h-8 bg-gray-200 rounded-md relative">
      <div
        className={`h-full rounded-md ${getHealthBarColor()}`}
        style={{ width: `${percentage}%` }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        <span className={percentage > 50 ? "text-white" : "text-gray-700"}>
          {displayValue}
        </span>
      </div>
    </div>
  );
}

// Define the tab data with progress information
interface TabData {
  name: string;
  href: string;
  icon: any;
  current: number;
  total: number;
  displayValue: string;
}

export default function TabNav() {
  const pathname = usePathname();
  const [tabData, setTabData] = useState<TabData[]>([
    {
      name: "Home",
      href: "/dashboard",
      icon: HomeIcon,
      current: 0,
      total: 0,
      displayValue: "",
    },
    {
      name: "Applications with Outreach",
      href: "/dashboard/applications_with_outreach",
      icon: UsersIcon,
      current: 0,
      total: 10,
      displayValue: "0/10",
    },
    {
      name: "In Person Events",
      href: "/dashboard/in_person_events",
      icon: CalendarIcon,
      current: 0,
      total: 5,
      displayValue: "0/5",
    },
    {
      name: "LinkedIn Outreach",
      href: "/dashboard/linkedin_outreach",
      icon: BriefcaseIcon,
      current: 0,
      total: 10,
      displayValue: "0/10",
    },
    {
      name: "Career Fairs",
      href: "/dashboard/career_fairs",
      icon: BriefcaseIcon,
      current: 0,
      total: 5,
      displayValue: "0/5",
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get metrics data from server action
        const data = await getDashboardMetrics();

        if (data) {
          // Update tab data with fetched metrics
          setTabData([
            {
              name: "Home",
              href: "/dashboard",
              icon: HomeIcon,
              current: 0,
              total: 0,
              displayValue: "",
            },
            {
              name: "Applications with Outreach",
              href: "/dashboard/applications_with_outreach",
              icon: UsersIcon,
              current: data.appWithOutreachCount,
              total: data.apps_with_outreach_per_week,
              displayValue: `${data.appWithOutreachCount}/${data.apps_with_outreach_per_week}`,
            },
            {
              name: "In Person Events",
              href: "/dashboard/in_person_events",
              icon: CalendarIcon,
              current: data.inPersonEventsCount,
              total: data.in_person_events_per_month,
              displayValue: `${data.inPersonEventsCount}/${data.in_person_events_per_month}`,
            },
            {
              name: "LinkedIn Outreach",
              href: "/dashboard/linkedin_outreach",
              icon: BriefcaseIcon,
              current: data.linkedInOutreachCount,
              total: data.info_interview_outreach_per_week,
              displayValue: `${data.linkedInOutreachCount}/${data.info_interview_outreach_per_week}`,
            },
            {
              name: "Career Fairs",
              href: "/dashboard/career_fairs",
              icon: BriefcaseIcon,
              current: data.careerFairsCount,
              total: data.career_fairs_quota,
              displayValue: `${data.careerFairsCount}/${data.career_fairs_quota}`,
            },
          ]);
        }
        // If data is null (not authenticated), we'll use the default values
      } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
        // Default data already set in state initialization
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    // Show skeleton loading tabs
    return (
      <div className="w-full bg-white border-b border-gray-200">
        <div className="grid grid-cols-5 gap-2 px-4 py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 animate-pulse rounded-md"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="grid grid-cols-5 w-full">
        {tabData.map((tab) => {
          const LinkIcon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={clsx(
                "flex flex-col p-4 text-sm font-medium hover:bg-sky-50 relative h-full",
                {
                  "bg-sky-50": isActive,
                  "text-gray-600": !isActive,
                }
              )}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <LinkIcon className="w-5 h-5" />
                <span>{tab.name}</span>
              </div>

              {tab.href !== "/dashboard" && (
                <HealthBar
                  current={tab.current}
                  total={tab.total}
                  isActive={isActive}
                  displayValue={tab.displayValue}
                />
              )}

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
