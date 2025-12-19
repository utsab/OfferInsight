import Link from "next/link";
import { UserButton } from "./user-button";
import { LineChart } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-light-steel-blue bg-gradient-to-br from-midnight-blue to-gray-900">
      <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3">
          <LineChart className="text-electric-blue text-2xl" />
          <h1 className="text-2xl font-bold text-white">OpenSourceResumeBook</h1>
        </Link>
        <div className="user-button-container">
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
