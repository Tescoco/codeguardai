import mongoose, { Document, Schema } from "mongoose";

export interface IAnalysis extends Document {
  analysisId: string;
  contractHash: string;
  sourceCode: string;
  fileName: string;
  status: "pending" | "analyzing" | "completed" | "failed";
  progress: number;
  currentStep: string;
  overallScore?: number;
  createdAt: Date;
  completedAt?: Date;
  userId?: string;
  errorMessage?: string;
}

const AnalysisSchema: Schema = new Schema(
  {
    analysisId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    contractHash: {
      type: String,
      required: true,
      index: true,
    },
    sourceCode: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "analyzing", "completed", "failed"],
      default: "pending",
      required: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    currentStep: {
      type: String,
      default: "Initializing analysis...",
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    userId: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
AnalysisSchema.index({ analysisId: 1, status: 1 });
AnalysisSchema.index({ contractHash: 1, createdAt: -1 });

export default mongoose.models.Analysis ||
  mongoose.model<IAnalysis>("Analysis", AnalysisSchema);
