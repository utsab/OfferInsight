"use client";

import { TotalProgressBar } from "./total-progress-bar";

// Define the props for the wrapper component
interface TotalProgressBarWrapperProps {
  metricsData: {
    name: string;
    current: number;
    total: number;
  }[];
}

// Create a wrapper component for server components to use
export function TotalProgressBarWrapper({
  metricsData,
}: TotalProgressBarWrapperProps) {
  return <TotalProgressBar metrics={metricsData} />;
}
