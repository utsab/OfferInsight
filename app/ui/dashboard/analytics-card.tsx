"use client";

import { ProgressBar } from "./progress-bar";
import { lusitana } from "@/app/ui/fonts";

export interface AnalyticsCardProps {
  title: string;
  current?: number;
  total?: number;
  displayValue: string;
}

export function AnalyticsCard({
  title,
  current,
  total,
  displayValue,
}: AnalyticsCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h3
        className={`${lusitana.className} text-sm font-medium text-gray-700 mb-2`}
      >
        {title}
      </h3>

      <p
        className={`${lusitana.className} text-2xl font-semibold text-center my-4`}
      >
        {displayValue}
      </p>

      {current !== undefined && total !== undefined && (
        <ProgressBar current={current} total={total} />
      )}
    </div>
  );
}
