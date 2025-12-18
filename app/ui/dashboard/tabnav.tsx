"use client";

import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  BriefcaseIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";

// Define the tab data without progress information
interface TabData {
  name: string;
  href: string;
  icon: any;
}

export default function TabNav() {
  const pathname = usePathname();

  const [tabData] = useState<TabData[]>([
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: ChartBarIcon,
    },
    {
      name: "Applications with Outreach",
      href: "/dashboard/applications_with_outreach",
      icon: UsersIcon,
    },
    {
      name: "In Person Events",
      href: "/dashboard/in_person_events",
      icon: CalendarIcon,
    },
    {
      name: "LinkedIn Outreach",
      href: "/dashboard/linkedin_outreach",
      icon: BriefcaseIcon,
    },
  ]);

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="grid grid-cols-4 w-full">
        {tabData.map((tab) => {
          const LinkIcon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={clsx(
                "flex flex-col p-4 text-sm font-medium hover:bg-sky-50 relative h-full items-center justify-center",
                {
                  "bg-sky-50": isActive,
                  "text-gray-600": !isActive,
                }
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <LinkIcon className="w-5 h-5" />
                <span>{tab.name}</span>
              </div>

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
