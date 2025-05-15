"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

// Define the metrics data structure
export interface MetricsData {
  name: string;
  current: number;
  total: number;
}

// Define the context interface
interface DashboardMetricsContextType {
  metricsData: MetricsData[];
  refreshMetrics: () => Promise<void>;
  isLoading: boolean;
}

// Create the context with a default value
const DashboardMetricsContext = createContext<DashboardMetricsContextType>({
  metricsData: [],
  refreshMetrics: async () => {},
  isLoading: false,
});

// Hook to use dashboard metrics
export const useDashboardMetrics = () => useContext(DashboardMetricsContext);

// Provider component
export function DashboardMetricsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [metricsData, setMetricsData] = useState<MetricsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  // Function to fetch metrics data
  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard-metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }
      const data = await response.json();

      // Transform data to the metrics format
      const metrics = [
        {
          name: "Applications",
          current: data.appWithOutreachCount,
          total: data.apps_with_outreach_per_week || 10,
        },
        {
          name: "LinkedIn",
          current: data.linkedInOutreachCount,
          total: data.info_interview_outreach_per_week || 10,
        },
        {
          name: "Events",
          current: data.inPersonEventsCount,
          total: data.in_person_events_per_month || 5,
        },
        {
          name: "Career Fairs",
          current: data.careerFairsCount,
          total: data.career_fairs_quota || 5,
        },
      ];

      setMetricsData(metrics);

      // Update the timestamp to trigger re-renders in dependent components
      setRefreshTimestamp(Date.now());
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch metrics on initial load
  useEffect(() => {
    refreshMetrics();

    // Set up a polling interval to refresh metrics every 30 seconds
    // This ensures data stays fresh even if user actions don't trigger refreshes
    const intervalId = setInterval(() => {
      refreshMetrics();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [refreshMetrics]);

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      metricsData,
      refreshMetrics,
      isLoading,
    }),
    [metricsData, refreshMetrics, isLoading, refreshTimestamp]
  );

  return (
    <DashboardMetricsContext.Provider value={contextValue}>
      {children}
    </DashboardMetricsContext.Provider>
  );
}
