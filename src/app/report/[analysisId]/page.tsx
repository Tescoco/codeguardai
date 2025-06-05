"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Vulnerability {
  severity: string;
  title: string;
  description: string;
  codeSnippet: string;
  location: {
    line: number;
  };
  confidence: number;
  recommendation: string;
  source: string;
  aiExplanation?: string;
}

interface ReportData {
  analysis: {
    analysisId: string;
    fileName: string;
    status: string;
    overallScore: number;
    createdAt: string;
    completedAt: string;
  };
  summary: {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  vulnerabilities: {
    critical: Vulnerability[];
    high: Vulnerability[];
    medium: Vulnerability[];
    low: Vulnerability[];
  };
  allVulnerabilities: Vulnerability[];
  recommendations: string[];
  executiveSummary: string;
  riskAssessment: {
    overallRisk: string;
    keyRisks: string[];
    mitigationPriority: string[];
  };
}

export default function ReportPage() {
  const params = useParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const analysisId = params.analysisId as string;

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/report/${analysisId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch report");
        }

        setReportData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [analysisId]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <span className="text-red-600">💥</span>;
      case "high":
        return <span className="text-orange-600">🔴</span>;
      case "medium":
        return <span className="text-yellow-600">🟡</span>;
      case "low":
        return <span className="text-green-600">🟢</span>;
      default:
        return <span className="text-gray-600">⚪</span>;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "ai_analysis":
        return (
          <span className="text-purple-600" title="AI Analysis">
            🤖
          </span>
        );
      case "static_analysis":
        return (
          <span className="text-blue-600" title="Static Analysis">
            ⚡
          </span>
        );
      case "hybrid":
        return (
          <span className="text-green-600" title="Hybrid Analysis">
            🔬
          </span>
        );
      default:
        return <span className="text-gray-600">📋</span>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-orange-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Report Not Found
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            No report data available
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Security Audit Report
              </h1>
              <p className="text-gray-600 mt-1">
                {reportData.analysis.fileName} •{" "}
                {new Date(reportData.analysis.completedAt).toLocaleDateString()}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg font-bold text-2xl ${getScoreColor(
                reportData.analysis.overallScore
              )}`}
            >
              {reportData.analysis.overallScore}/100
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Executive Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {reportData.executiveSummary}
          </p>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Risk Assessment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Overall Risk Level
              </h3>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(
                  reportData.riskAssessment.overallRisk
                )}`}
              >
                {reportData.riskAssessment.overallRisk.toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Key Risks</h3>
              <ul className="space-y-1">
                {reportData.riskAssessment.keyRisks
                  .slice(0, 3)
                  .map((risk, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {risk}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {reportData.summary.totalIssues}
            </div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {reportData.summary.criticalCount}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {reportData.summary.highCount}
            </div>
            <div className="text-sm text-gray-600">High</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {reportData.summary.mediumCount}
            </div>
            <div className="text-sm text-gray-600">Medium</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {reportData.summary.lowCount}
            </div>
            <div className="text-sm text-gray-600">Low</div>
          </div>
        </div>

        {/* Vulnerabilities */}
        {reportData.allVulnerabilities.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Vulnerabilities Found
            </h2>
            <div className="space-y-4">
              {reportData.allVulnerabilities.map((vuln, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(vuln.severity)}
                      {getSourceIcon(vuln.source)}
                      <h3 className="font-medium text-gray-900">
                        {vuln.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          vuln.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : vuln.severity === "high"
                            ? "bg-orange-100 text-orange-800"
                            : vuln.severity === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {vuln.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{vuln.description}</p>

                  {vuln.aiExplanation && vuln.source === "ai_analysis" && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-2">
                      <h4 className="text-sm font-medium text-purple-800 mb-1">
                        🤖 AI Analysis Insight:
                      </h4>
                      <p className="text-sm text-purple-700">
                        {vuln.aiExplanation}
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded p-2 mb-2">
                    <code className="text-sm text-gray-800">
                      {vuln.codeSnippet}
                    </code>
                  </div>
                  <div className="text-sm text-gray-600 flex justify-between">
                    <span>
                      <strong>Line {vuln.location.line}</strong> •
                      <span
                        className={`ml-1 ${getConfidenceColor(
                          vuln.confidence
                        )}`}
                      >
                        Confidence: {Math.round(vuln.confidence * 100)}%
                      </span>
                    </span>
                    <span className="text-xs text-gray-500">
                      Source: {vuln.source.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-blue-600">
                    <strong>Recommendation:</strong> {vuln.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {reportData.recommendations.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Security Recommendations
            </h2>
            <ul className="space-y-2">
              {reportData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Issues Found */}
        {reportData.summary.totalIssues === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
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
            <h3 className="text-lg font-medium text-green-800 mb-2">
              No Security Issues Detected!
            </h3>
            <p className="text-green-700">
              Your smart contract passed all static security checks. However,
              consider getting a manual audit for production deployment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
