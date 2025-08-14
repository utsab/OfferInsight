"use client";

import { useDashboardMetrics } from "@/app/contexts/DashboardMetricsContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
  name: string;
  color: string;
}

function HorizontalProgressBar({ current, total, name, color }: ProgressBarProps) {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const calculatedPercentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    setPercentage(calculatedPercentage);
  }, [current, total]);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-xs font-medium text-gray-700 text-center">{name}</div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="text-xs text-gray-500">
        {current}/{total}
      </div>
    </div>
  );
}

export function ProgressSidebar() {
  const { metricsData, isLoading } = useDashboardMetrics();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) {
      return "bg-blue-500";
    } else if (percentage >= 75) {
      return "bg-green-500";
    } else if (percentage >= 50) {
      return "bg-yellow-500";
    } else {
      return "bg-orange-500";
    }
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!metricsData || metricsData.length === 0) return { current: 0, total: 0 };
    
    let totalCurrent = 0;
    let totalMax = 0;
    
    metricsData.forEach((metric) => {
      totalCurrent += metric.current;
      totalMax += metric.total;
    });
    
    return { current: totalCurrent, total: totalMax };
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const overallPercentage = overallProgress.total > 0 ? Math.min((overallProgress.current / overallProgress.total) * 100, 100) : 0;

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
        Progress Overview
      </h2>
      
      <div className="space-y-6">
        {/* Overall Progress Bar */}
        <HorizontalProgressBar
          current={overallProgress.current}
          total={overallProgress.total}
          name="Overall Progress"
          color={getProgressColor(overallPercentage)}
        />
        
        {/* Individual Progress Bars */}
        {metricsData?.map((metric, index) => {
          const percentage = metric.total > 0 ? Math.min((metric.current / metric.total) * 100, 100) : 0;
          const color = getProgressColor(percentage);
          
          return (
            <HorizontalProgressBar
              key={index}
              current={metric.current}
              total={metric.total}
              name={metric.name}
              color={color}
            />
          );
        })}
      </div>
    </div>
  );
} 