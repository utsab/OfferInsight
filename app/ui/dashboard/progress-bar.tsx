"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // Calculate percentage with a maximum of 100%
    const calculatedPercentage = Math.min((current / total) * 100, 100);
    setPercentage(calculatedPercentage);
  }, [current, total]);

  const getProgressBarColor = () => {
    if (percentage === 100) {
      return "bg-blue-500 animate-pulse"; // Glowing blue at 100%
    } else if (percentage >= 50) {
      return "bg-green-500"; // Green for 50-99%
    } else {
      return "bg-orange-500"; // Orange for 0-49%
    }
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
      <div
        className={`h-2.5 rounded-full ${getProgressBarColor()}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}
