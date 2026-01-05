import Link from "next/link";
import { UserButton } from "./user-button";
import { LineChart } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-light-steel-blue bg-gradient-to-br from-midnight-blue to-gray-900 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-between items-center gap-4">
        <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 min-w-0">
          <LineChart className="text-electric-blue text-xl sm:text-2xl flex-shrink-0" />
          <h1 className="text-lg sm:text-2xl font-bold text-white truncate">OpenSourceResumeBook</h1>
        </Link>
        <div className="user-button-container flex-shrink-0">
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
