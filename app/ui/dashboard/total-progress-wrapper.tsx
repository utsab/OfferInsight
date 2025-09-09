"use client";

import { useState, useEffect } from "react";
import { TotalProgressBar } from "./total-progress-bar";
import { useDashboardMetrics } from "@/app/contexts/DashboardMetricsContext";

// Define the props for the wrapper component
interface TotalProgressBarWrapperProps {
  metricsData?: {
    name: string;
    current: number;
    total: number;
  }[];
}

// Create a wrapper component for server components to use
export function TotalProgressBarWrapper({
  metricsData: propMetricsData,
}: TotalProgressBarWrapperProps) {
  const [hasMounted, setHasMounted] = useState(false);
  
  // Use the context to get metrics data
  const { metricsData: contextMetricsData, isLoading } = useDashboardMetrics();

  // Handle client-side mounting to prevent hydration mismatches
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Use props data if provided, otherwise use context data
  const metricsData = propMetricsData || contextMetricsData;

  // Show loading state only on client side to prevent hydration mismatch
  if (!hasMounted) {
    return <div className="animate-pulse h-80 bg-gray-200 rounded-lg" />;
  }

  if (isLoading && !propMetricsData) {
    return <div className="animate-pulse h-80 bg-gray-200 rounded-lg" />;
  }

  return <TotalProgressBar metrics={metricsData} />;
}
