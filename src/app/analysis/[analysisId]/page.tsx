"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AnalysisProgress from "../../../components/AnalysisProgress";

interface AnalysisData {
  analysisId: string;
  status: string;
  progress: number;
  currentStep: string;
  fileName: string;
  createdAt: string;
  completedAt?: string;
  overallScore?: number;
  errorMessage?: string;
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);
  const analysisId = params.analysisId as string;

  const handleAnalysisComplete = (data: AnalysisData) => {
    console.log("Analysis completed:", data);
    setShowResults(true);
    // Redirect to report page after a short delay
    setTimeout(() => {
      router.push(`/report/${analysisId}`);
    }, 2000);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Analysis Complete!
          </h1>
          <p className="text-gray-600 mb-4">
            Your smart contract has been successfully analyzed. Redirecting to
            the full report...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalysisProgress
        analysisId={analysisId}
        onComplete={handleAnalysisComplete}
      />
    </div>
  );
}
