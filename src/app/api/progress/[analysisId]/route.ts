import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../../../../lib/mongodb";
import Analysis from "../../../../../models/Analysis";

interface ProgressResponse {
  analysisId: string;
  status: string;
  progress: number;
  currentStep: string;
  fileName: string;
  createdAt: Date;
  completedAt?: Date;
  overallScore?: number;
  errorMessage?: string;
  estimatedTimeRemaining?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectToDatabase();

    const { analysisId } = await params;

    if (!analysisId) {
      return NextResponse.json(
        { error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    const analysis = await Analysis.findOne({ analysisId });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    const response: ProgressResponse = {
      analysisId: analysis.analysisId,
      status: analysis.status,
      progress: analysis.progress,
      currentStep: analysis.currentStep,
      fileName: analysis.fileName,
      createdAt: analysis.createdAt,
      completedAt: analysis.completedAt,
      overallScore: analysis.overallScore,
      errorMessage: analysis.errorMessage,
    };

    // Add estimated time remaining based on progress
    if (analysis.status === "analyzing" && analysis.progress < 100) {
      const elapsed = Date.now() - new Date(analysis.createdAt).getTime();
      const estimatedTotal = elapsed / (analysis.progress / 100);
      const remaining = Math.max(0, estimatedTotal - elapsed);

      response.estimatedTimeRemaining = Math.ceil(remaining / 1000); // in seconds
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
