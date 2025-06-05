import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import connectToDatabase from "../../../../lib/mongodb";
import Analysis from "../../../../models/Analysis";
import { startAnalysis } from "../../../../lib/analyzer";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("contract") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".sol")) {
      return NextResponse.json(
        { error: "Only .sol files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || "10485760");
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum 10MB allowed." },
        { status: 400 }
      );
    }

    // Read file content
    const sourceCode = await file.text();

    // Basic validation for Solidity content
    if (
      !sourceCode.includes("pragma solidity") &&
      !sourceCode.includes("contract")
    ) {
      return NextResponse.json(
        { error: "Invalid Solidity file content" },
        { status: 400 }
      );
    }

    // Generate unique analysis ID and contract hash
    const analysisId = uuidv4();
    const contractHash = crypto
      .createHash("sha256")
      .update(sourceCode)
      .digest("hex");

    // Check for duplicate analysis
    const existingAnalysis = await Analysis.findOne({
      contractHash,
      status: { $in: ["completed", "analyzing"] },
    });

    if (existingAnalysis) {
      return NextResponse.json({
        analysisId: existingAnalysis.analysisId,
        duplicate: true,
        message: "This contract has been analyzed before",
        status: existingAnalysis.status,
      });
    }

    // Create new analysis record
    const analysis = new Analysis({
      analysisId,
      contractHash,
      sourceCode,
      fileName: file.name,
      status: "pending",
      progress: 0,
      currentStep: "Analysis queued...",
    });

    await analysis.save();

    // Start background analysis process (non-blocking)
    startAnalysis(analysisId).catch((error) => {
      console.error(`Analysis failed for ${analysisId}:`, error);
    });

    return NextResponse.json({
      analysisId,
      message: "Analysis started successfully",
      status: "pending",
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Use POST to upload a contract for analysis" },
    { status: 405 }
  );
}
