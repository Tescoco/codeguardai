import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../../../../lib/mongodb";
import Analysis from "../../../../../models/Analysis";
import Vulnerability from "../../../../../models/Vulnerability";
import Report from "../../../../../models/Report";

export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    await connectToDatabase();

    const { analysisId } = params;

    if (!analysisId) {
      return NextResponse.json(
        { error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    // Fetch analysis details
    const analysis = await Analysis.findOne({ analysisId });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    if (analysis.status !== "completed") {
      return NextResponse.json(
        {
          error: "Analysis not completed yet",
          status: analysis.status,
          progress: analysis.progress,
        },
        { status: 202 } // Accepted but not ready
      );
    }

    // Fetch vulnerabilities
    const vulnerabilities = await Vulnerability.find({ analysisId }).sort({
      severity: 1, // critical first (assuming enum order)
      confidence: -1,
    });

    // Fetch report
    const report = await Report.findOne({ analysisId });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Organize vulnerabilities by severity
    const vulnerabilitiesBySeverity = {
      critical: vulnerabilities.filter((v) => v.severity === "critical"),
      high: vulnerabilities.filter((v) => v.severity === "high"),
      medium: vulnerabilities.filter((v) => v.severity === "medium"),
      low: vulnerabilities.filter((v) => v.severity === "low"),
    };

    const response = {
      analysis: {
        analysisId: analysis.analysisId,
        fileName: analysis.fileName,
        status: analysis.status,
        overallScore: analysis.overallScore,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
      },
      summary: report.summary,
      vulnerabilities: vulnerabilitiesBySeverity,
      allVulnerabilities: vulnerabilities,
      recommendations: report.recommendations,
      gasOptimizations: report.gasOptimizations,
      bestPractices: report.bestPractices,
      executiveSummary: report.executiveSummary,
      technicalNotes: report.technicalNotes,
      riskAssessment: report.riskAssessment,
      complianceChecks: report.complianceChecks,
      generatedAt: report.generatedAt,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export PDF report
export async function POST(request: NextRequest) {
  try {
    const { format } = await request.json();

    if (format === "pdf") {
      // TODO: Implement PDF generation
      return NextResponse.json(
        { error: "PDF export not implemented yet" },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: "Unsupported export format" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
