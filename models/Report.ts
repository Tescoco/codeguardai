import mongoose, { Document, Schema } from "mongoose";

export interface ISummary {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface IGasOptimization {
  type: string;
  description: string;
  estimatedSavings: string;
  location: {
    line: number;
    function?: string;
  };
  recommendation: string;
}

export interface IBestPractice {
  category: string;
  description: string;
  status: "passed" | "failed" | "warning";
  recommendation?: string;
}

export interface IReport extends Document {
  analysisId: string;
  summary: ISummary;
  recommendations: string[];
  gasOptimizations: IGasOptimization[];
  bestPractices: IBestPractice[];
  executiveSummary: string;
  technicalNotes: string[];
  riskAssessment: {
    overallRisk: "low" | "medium" | "high" | "critical";
    keyRisks: string[];
    mitigationPriority: string[];
  };
  complianceChecks: {
    erc20: boolean;
    erc721: boolean;
    erc1155: boolean;
    accessControl: boolean;
    upgradeability: boolean;
  };
  generatedAt: Date;
}

const SummarySchema: Schema = new Schema(
  {
    totalIssues: { type: Number, required: true, default: 0 },
    criticalCount: { type: Number, required: true, default: 0 },
    highCount: { type: Number, required: true, default: 0 },
    mediumCount: { type: Number, required: true, default: 0 },
    lowCount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const GasOptimizationSchema: Schema = new Schema(
  {
    type: { type: String, required: true },
    description: { type: String, required: true },
    estimatedSavings: { type: String, required: true },
    location: {
      line: { type: Number, required: true },
      function: { type: String },
    },
    recommendation: { type: String, required: true },
  },
  { _id: false }
);

const BestPracticeSchema: Schema = new Schema(
  {
    category: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["passed", "failed", "warning"],
      required: true,
    },
    recommendation: { type: String },
  },
  { _id: false }
);

const ReportSchema: Schema = new Schema(
  {
    analysisId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    summary: {
      type: SummarySchema,
      required: true,
    },
    recommendations: [
      {
        type: String,
        required: true,
      },
    ],
    gasOptimizations: [GasOptimizationSchema],
    bestPractices: [BestPracticeSchema],
    executiveSummary: {
      type: String,
      required: true,
    },
    technicalNotes: [
      {
        type: String,
      },
    ],
    riskAssessment: {
      overallRisk: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        required: true,
      },
      keyRisks: [
        {
          type: String,
        },
      ],
      mitigationPriority: [
        {
          type: String,
        },
      ],
    },
    complianceChecks: {
      erc20: { type: Boolean, default: false },
      erc721: { type: Boolean, default: false },
      erc1155: { type: Boolean, default: false },
      accessControl: { type: Boolean, default: false },
      upgradeability: { type: Boolean, default: false },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
ReportSchema.index({ analysisId: 1 });
ReportSchema.index({ "riskAssessment.overallRisk": 1, generatedAt: -1 });

export default mongoose.models.Report ||
  mongoose.model<IReport>("Report", ReportSchema);
