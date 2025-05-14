"use client";

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  ClipboardIcon,
  UsersIcon,
  CalendarIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { name: "Home", href: "/dashboard", icon: HomeIcon },
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
  {
    name: "Career Fairs",
    href: "/dashboard/career_fairs",
    icon: BriefcaseIcon,
  },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="flex overflow-x-auto px-4 py-2">
        {links.map((link) => {
          const LinkIcon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 mx-1 text-sm font-medium rounded-t-md whitespace-nowrap hover:bg-sky-100 hover:text-blue-600",
                {
                  "bg-sky-100 text-blue-600 border-b-2 border-blue-600":
                    pathname === link.href,
                  "text-gray-600": pathname !== link.href,
                }
              )}
            >
              <LinkIcon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
