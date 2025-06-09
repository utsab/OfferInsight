"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TotalProgressBarProps {
  metrics: {
    current: number;
    total: number;
    name: string;
  }[];
}

export function TotalProgressBar({ metrics }: TotalProgressBarProps) {
  const [percentage, setPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Calculate total percentage across all metrics
    let totalCurrent = 0;
    let totalMax = 0;

    metrics.forEach((metric) => {
      totalCurrent += metric.current;
      totalMax += metric.total > 0 ? metric.total : 0;
    });

    const calculatedPercentage =
      totalMax > 0
        ? Math.min(Math.round((totalCurrent / totalMax) * 100), 100)
        : 0;

    // Animate the percentage
    setIsVisible(true);
    setPercentage(calculatedPercentage);
  }, [metrics]);

  const getProgressColor = () => {
    if (percentage >= 90) {
      return "from-blue-600 to-indigo-600";
    } else if (percentage >= 75) {
      return "from-green-500 to-emerald-600";
    } else if (percentage >= 50) {
      return "from-yellow-400 to-amber-500";
    } else {
      return "from-orange-400 to-red-500";
    }
  };

  return (
    <div className="relative w-full mb-8 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg shadow-md">
      <motion.h2
        className="text-xl font-bold text-center text-gray-800 mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Overall Progress
      </motion.h2>

      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Job Search Activity Progress
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {percentage}% Complete
        </motion.span>
      </div>

      <div className="w-full h-14 bg-gray-200 rounded-lg relative overflow-hidden">
        {/* Progress bar background with gradient */}
        <motion.div
          className={`h-full rounded-lg bg-gradient-to-r ${getProgressColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Subtle gradient overlay to add depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>

          {/* Remove the problematic shine effect and replace with a better one */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute top-0 -left-48 h-full w-48 bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-[-20deg]"
              style={{
                animation: "shine 3s infinite linear",
              }}
            ></div>
          </div>
        </motion.div>

        {/* Percentage text inside the bar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              scale: isVisible ? 1 : 0.8,
            }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center space-x-1"
          >
            <motion.span
              className="text-3xl font-bold text-white drop-shadow-md"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                repeat: Infinity,
                repeatDelay: 5,
                duration: 0.5,
              }}
            >
              {percentage}%
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* Individual metric indicators */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        {metrics.map((metric, index) => {
          const metricPercentage =
            metric.total > 0
              ? Math.min(Math.round((metric.current / metric.total) * 100), 100)
              : 0;

          return (
            <motion.div
              key={index}
              className="bg-white p-5 rounded-md shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            >
              <div className="text-base font-medium text-gray-700 mb-3">
                {metric.name}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">
                  {metric.current}/{metric.total}
                </span>
                <span
                  className={`text-sm font-bold ${
                    metricPercentage >= 100
                      ? "text-blue-600"
                      : metricPercentage >= 50
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {metricPercentage}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    metricPercentage >= 100
                      ? "bg-blue-500"
                      : metricPercentage >= 50
                      ? "bg-green-500"
                      : "bg-orange-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${metricPercentage}%` }}
                  transition={{ duration: 1, delay: 0.4 + index * 0.1 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add the necessary keyframe animation for the shine effect */}
      <style jsx global>{`
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
      `}</style>
    </div>
  );
}
