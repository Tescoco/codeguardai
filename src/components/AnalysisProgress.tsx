"use client";

import { useState, useEffect } from "react";

interface ProgressData {
  analysisId: string;
  status: string;
  progress: number;
  currentStep: string;
  fileName: string;
  createdAt: string;
  completedAt?: string;
  overallScore?: number;
  errorMessage?: string;
  estimatedTimeRemaining?: number;
}

interface AnalysisProgressProps {
  analysisId: string;
  onComplete: (data: ProgressData) => void;
}

export default function AnalysisProgress({
  analysisId,
  onComplete,
}: AnalysisProgressProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const intervalId: NodeJS.Timeout = setInterval(() => {}, 1000); // This will be reassigned below

    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/progress/${analysisId}`);
        const data: ProgressData = await response.json();

        if (!response.ok) {
          throw new Error(data.errorMessage || "Failed to fetch progress");
        }

        setProgressData(data);

        if (data.status === "completed") {
          clearInterval(intervalId);
          onComplete(data);
        } else if (data.status === "failed") {
          clearInterval(intervalId);
          setError(data.errorMessage || "Analysis failed");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch progress"
        );
        clearInterval(intervalId);
      }
    };

    // Initial fetch
    fetchProgress();

    // Poll every 2 seconds while analysis is running
    clearInterval(intervalId);
    const newIntervalId = setInterval(fetchProgress, 2000);

    return () => {
      clearInterval(newIntervalId);
    };
  }, [analysisId, onComplete]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Analysis Failed
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "analyzing":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Analysis in Progress
          </h1>
          <p className="text-gray-600">
            Analyzing:{" "}
            <span className="font-medium">{progressData.fileName}</span>
          </p>
          <p className="text-sm text-gray-500">
            Analysis ID: {progressData.analysisId}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-sm font-medium ${getStatusColor(
                progressData.status
              )}`}
            >
              {progressData.status.charAt(0).toUpperCase() +
                progressData.status.slice(1)}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {progressData.progress}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                progressData.progress
              )}`}
              style={{ width: `${progressData.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Current Step:
          </h3>
          <p className="text-gray-700">{progressData.currentStep}</p>
        </div>

        {progressData.estimatedTimeRemaining &&
          progressData.estimatedTimeRemaining > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Estimated Time Remaining:
              </h3>
              <p className="text-gray-700">
                {formatTimeRemaining(progressData.estimatedTimeRemaining)}
              </p>
            </div>
          )}

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Analysis Steps:
          </h3>
          <div className="space-y-2">
            {[
              { step: "Parsing contract structure", threshold: 20 },
              { step: "Running static analysis", threshold: 40 },
              { step: "AI-powered analysis", threshold: 70 },
              { step: "Generating report", threshold: 90 },
              { step: "Complete", threshold: 100 },
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    progressData.progress >= item.threshold
                      ? "bg-green-500"
                      : progressData.progress >= item.threshold - 20
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span
                  className={`text-sm ${
                    progressData.progress >= item.threshold
                      ? "text-green-700 font-medium"
                      : progressData.progress >= item.threshold - 20
                      ? "text-blue-700"
                      : "text-gray-500"
                  }`}
                >
                  {item.step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
