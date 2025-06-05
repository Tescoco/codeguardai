import connectToDatabase from "./mongodb";
import Analysis from "../models/Analysis";
import Vulnerability from "../models/Vulnerability";
import Report from "../models/Report";
import { generateAIAnalysis } from "./aiAnalyzer";
import { calculateSecurityScore } from "./scoring";

// Vulnerability detection patterns
export const VULNERABILITY_PATTERNS = {
  reentrancy: [
    /\.call\s*\(/gi,
    /\.transfer\s*\(/gi,
    /\.send\s*\(/gi,
    /\.delegatecall\s*\(/gi,
  ],
  accessControl: [
    /function\s+\w+.*public/gi,
    /function\s+\w+.*external/gi,
    /onlyOwner/gi,
    /require\s*\(\s*msg\.sender/gi,
  ],
  integerOverflow: [/\+\+/g, /--/g, /\+\=/g, /-\=/g, /\*\=/g, /\/\=/g],
  uncheckedCall: [
    /\.call\s*\([^)]*\)\s*;/gi,
    /\.send\s*\([^)]*\)\s*;/gi,
    /\.transfer\s*\([^)]*\)\s*;/gi,
  ],
  txOrigin: [/tx\.origin/gi],
  timestampDependence: [
    /now\s*[<>=]/gi,
    /block\.timestamp\s*[<>=]/gi,
    /block\.number\s*[<>=]/gi,
  ],
};

interface VulnerabilityFinding {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  line: number;
  column: number;
  codeSnippet: string;
  recommendation: string;
  confidence: number;
  functionName?: string;
}

interface ContractInfo {
  contracts: string[];
  functions: string[];
  modifiers: string[];
  lineCount: number;
}

export async function startAnalysis(analysisId: string): Promise<void> {
  try {
    await connectToDatabase();

    // Update status to analyzing
    await Analysis.findOneAndUpdate(
      { analysisId },
      {
        status: "analyzing",
        progress: 10,
        currentStep: "Starting contract analysis...",
      }
    );

    const analysis = await Analysis.findOne({ analysisId });
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    const sourceCode = analysis.sourceCode;

    // Step 1: Parse contract structure (20%)
    await updateProgress(analysisId, 20, "Parsing contract structure...");
    const contractInfo = parseContract(sourceCode);

    // Step 2: Static analysis (40%)
    await updateProgress(analysisId, 40, "Running static analysis...");
    const staticVulnerabilities = await runStaticAnalysis(
      sourceCode,
      analysisId
    );

    // Step 3: AI analysis (70%)
    await updateProgress(analysisId, 70, "Running AI-powered analysis...");
    const aiVulnerabilities = await generateAIAnalysis(sourceCode, analysisId);

    // Combine and deduplicate findings
    await updateProgress(analysisId, 85, "Combining analysis results...");
    const combinedVulnerabilities = combineVulnerabilityFindings(
      staticVulnerabilities,
      aiVulnerabilities
    );

    // Step 4: Generate report (90%)
    await updateProgress(analysisId, 90, "Generating comprehensive report...");
    const securityScore = calculateSecurityScore(
      combinedVulnerabilities,
      sourceCode
    );
    await generateReport(
      analysisId,
      combinedVulnerabilities,
      securityScore,
      contractInfo
    );

    // Step 5: Complete (100%)
    await Analysis.findOneAndUpdate(
      { analysisId },
      {
        status: "completed",
        progress: 100,
        currentStep: "Analysis complete",
        completedAt: new Date(),
        overallScore: securityScore,
      }
    );
  } catch (error) {
    console.error(`Analysis failed for ${analysisId}:`, error);
    await Analysis.findOneAndUpdate(
      { analysisId },
      {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      }
    );
  }
}

async function updateProgress(
  analysisId: string,
  progress: number,
  step: string
): Promise<void> {
  await Analysis.findOneAndUpdate(
    { analysisId },
    { progress, currentStep: step }
  );
}

export function parseContract(sourceCode: string): ContractInfo {
  const lines = sourceCode.split("\n");
  const contracts: string[] = [];
  const functions: string[] = [];
  const modifiers: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Extract contract names
    const contractMatch = trimmed.match(/contract\s+(\w+)/i);
    if (contractMatch) {
      contracts.push(contractMatch[1]);
    }

    // Extract function names
    const functionMatch = trimmed.match(/function\s+(\w+)/i);
    if (functionMatch) {
      functions.push(functionMatch[1]);
    }

    // Extract modifier names
    const modifierMatch = trimmed.match(/modifier\s+(\w+)/i);
    if (modifierMatch) {
      modifiers.push(modifierMatch[1]);
    }
  });

  return {
    contracts,
    functions,
    modifiers,
    lineCount: lines.length,
  };
}

export async function runStaticAnalysis(
  sourceCode: string,
  analysisId: string
): Promise<VulnerabilityFinding[]> {
  const vulnerabilities: VulnerabilityFinding[] = [];
  const lines = sourceCode.split("\n");

  // Detect reentrancy vulnerabilities
  vulnerabilities.push(...detectReentrancy(lines));

  // Detect access control issues
  vulnerabilities.push(...detectAccessControl(lines));

  // Detect integer overflow/underflow
  vulnerabilities.push(...detectIntegerOverflow(lines));

  // Detect unchecked external calls
  vulnerabilities.push(...detectUncheckedCalls(lines));

  // Detect tx.origin usage
  vulnerabilities.push(...detectTxOrigin(lines));

  // Detect timestamp dependence
  vulnerabilities.push(...detectTimestampDependence(lines));

  // Save vulnerabilities to database
  for (const vuln of vulnerabilities) {
    const vulnerability = new Vulnerability({
      analysisId,
      type: vuln.type,
      severity: vuln.severity,
      title: vuln.title,
      description: vuln.description,
      location: {
        line: vuln.line,
        column: vuln.column,
        function: vuln.functionName,
      },
      codeSnippet: vuln.codeSnippet,
      recommendation: vuln.recommendation,
      confidence: vuln.confidence,
      source: "static_analysis",
    });

    await vulnerability.save();
  }

  return vulnerabilities;
}

function detectReentrancy(lines: string[]): VulnerabilityFinding[] {
  const vulnerabilities: VulnerabilityFinding[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for external calls that could lead to reentrancy
    if (
      VULNERABILITY_PATTERNS.reentrancy.some((pattern) => pattern.test(trimmed))
    ) {
      // Simple heuristic: if there's a state change after an external call, it's potentially vulnerable
      const hasStateChange = checkForStateChangesAfter(lines, index);

      if (hasStateChange || trimmed.includes(".call(")) {
        vulnerabilities.push({
          type: "reentrancy",
          severity: trimmed.includes(".call(") ? "critical" : "high",
          title: "Potential Reentrancy Vulnerability",
          description:
            "External call found that could potentially allow reentrancy attacks. Ensure state changes happen before external calls.",
          line: index + 1,
          column:
            trimmed.indexOf(".call") ||
            trimmed.indexOf(".transfer") ||
            trimmed.indexOf(".send") ||
            0,
          codeSnippet: trimmed,
          recommendation:
            "Use the Checks-Effects-Interactions pattern. Update state before making external calls, or use reentrancy guards.",
          confidence: 0.7,
        });
      }
    }
  });

  return vulnerabilities;
}

function detectAccessControl(lines: string[]): VulnerabilityFinding[] {
  const vulnerabilities: VulnerabilityFinding[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for public/external functions without access control
    if (/function\s+\w+.*(?:public|external)/i.test(trimmed)) {
      const functionName = trimmed.match(/function\s+(\w+)/i)?.[1] || "unknown";

      // Skip common safe functions
      if (
        ["view", "pure", "constructor"].some((keyword) =>
          trimmed.includes(keyword)
        )
      ) {
        return;
      }

      // Check if function has access control
      const hasAccessControl = checkForAccessControl(lines, index);

      if (!hasAccessControl) {
        vulnerabilities.push({
          type: "access_control",
          severity: "medium",
          title: "Missing Access Control",
          description: `Public/external function '${functionName}' lacks proper access control mechanisms.`,
          line: index + 1,
          column: 0,
          codeSnippet: trimmed,
          recommendation:
            "Add appropriate access control modifiers (onlyOwner, requireRole, etc.) or make the function internal/private if not needed externally.",
          confidence: 0.6,
          functionName,
        });
      }
    }
  });

  return vulnerabilities;
}

function detectIntegerOverflow(lines: string[]): VulnerabilityFinding[] {
  const vulnerabilities: VulnerabilityFinding[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for arithmetic operations without SafeMath (for older Solidity versions)
    if (
      VULNERABILITY_PATTERNS.integerOverflow.some((pattern) =>
        pattern.test(trimmed)
      )
    ) {
      // Check if SafeMath is being used or if it's Solidity 0.8+
      const hasSafeMath = lines.some(
        (l) => l.includes("SafeMath") || l.includes("using SafeMath")
      );
      const isSolidity08Plus = lines.some(
        (l) => l.includes("pragma solidity") && /0\.[89]/.test(l)
      );

      if (!hasSafeMath && !isSolidity08Plus) {
        vulnerabilities.push({
          type: "integer_overflow",
          severity: "high",
          title: "Potential Integer Overflow/Underflow",
          description:
            "Arithmetic operation found without overflow protection in pre-0.8 Solidity.",
          line: index + 1,
          column: 0,
          codeSnippet: trimmed,
          recommendation:
            "Use SafeMath library for arithmetic operations or upgrade to Solidity 0.8+ which has built-in overflow protection.",
          confidence: 0.8,
        });
      }
    }
  });

  return vulnerabilities;
}

function detectUncheckedCalls(lines: string[]): VulnerabilityFinding[] {
  const vulnerabilities: VulnerabilityFinding[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for unchecked external calls
    if (
      VULNERABILITY_PATTERNS.uncheckedCall.some((pattern) =>
        pattern.test(trimmed)
      )
    ) {
      const hasReturnCheck =
        trimmed.includes("require(") ||
        trimmed.includes("if(") ||
        trimmed.includes("assert(");

      if (!hasReturnCheck) {
        vulnerabilities.push({
          type: "unchecked_call",
          severity: "medium",
          title: "Unchecked External Call",
          description:
            "External call return value is not checked, which could lead to silent failures.",
          line: index + 1,
          column: 0,
          codeSnippet: trimmed,
          recommendation:
            "Check the return value of external calls using require() or handle the failure case appropriately.",
          confidence: 0.9,
        });
      }
    }
  });

  return vulnerabilities;
}

function detectTxOrigin(lines: string[]): VulnerabilityFinding[] {
  const vulnerabilities: VulnerabilityFinding[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (
      VULNERABILITY_PATTERNS.txOrigin.some((pattern) => pattern.test(trimmed))
    ) {
      vulnerabilities.push({
        type: "tx_origin",
        severity: "medium",
        title: "Use of tx.origin",
        description:
          "Usage of tx.origin for authentication can be vulnerable to phishing attacks.",
        line: index + 1,
        column: trimmed.indexOf("tx.origin"),
        codeSnippet: trimmed,
        recommendation:
          "Use msg.sender instead of tx.origin for authentication and authorization checks.",
        confidence: 1.0,
      });
    }
  });

  return vulnerabilities;
}

function detectTimestampDependence(lines: string[]): VulnerabilityFinding[] {
  const vulnerabilities: VulnerabilityFinding[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (
      VULNERABILITY_PATTERNS.timestampDependence.some((pattern) =>
        pattern.test(trimmed)
      )
    ) {
      vulnerabilities.push({
        type: "timestamp_dependence",
        severity: "low",
        title: "Timestamp Dependence",
        description:
          "Contract logic depends on block timestamp or number, which can be manipulated by miners.",
        line: index + 1,
        column: 0,
        codeSnippet: trimmed,
        recommendation:
          "Avoid relying on block.timestamp or block.number for critical logic. Use block hashes or external oracles when possible.",
        confidence: 0.8,
      });
    }
  });

  return vulnerabilities;
}

// Helper functions
function checkForStateChangesAfter(
  lines: string[],
  callIndex: number
): boolean {
  // Look for state changes in the next few lines after an external call
  for (let i = callIndex + 1; i < Math.min(callIndex + 5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.includes("=") && !line.includes("==") && !line.includes("!=")) {
      return true;
    }
  }
  return false;
}

function checkForAccessControl(
  lines: string[],
  functionIndex: number
): boolean {
  // Check function definition and body for access control
  const functionLine = lines[functionIndex];

  // Check for modifiers in function definition
  if (/only\w+|require\s*\(/i.test(functionLine)) {
    return true;
  }

  // Check function body for access control
  for (
    let i = functionIndex + 1;
    i < Math.min(functionIndex + 10, lines.length);
    i++
  ) {
    const line = lines[i].trim();
    if (line.includes("}")) break; // End of function
    if (/require\s*\(\s*msg\.sender|only\w+|_checkRole|hasRole/i.test(line)) {
      return true;
    }
  }

  return false;
}

async function generateReport(
  analysisId: string,
  vulnerabilities: VulnerabilityFinding[],
  securityScore: number,
  contractInfo: ContractInfo
): Promise<void> {
  const summary = {
    totalIssues: vulnerabilities.length,
    criticalCount: vulnerabilities.filter((v) => v.severity === "critical")
      .length,
    highCount: vulnerabilities.filter((v) => v.severity === "high").length,
    mediumCount: vulnerabilities.filter((v) => v.severity === "medium").length,
    lowCount: vulnerabilities.filter((v) => v.severity === "low").length,
  };

  const recommendations = generateRecommendations(vulnerabilities);
  const gasOptimizations = generateGasOptimizations(contractInfo);
  const bestPractices = generateBestPractices(contractInfo, vulnerabilities);
  const riskAssessment = generateRiskAssessment(vulnerabilities, securityScore);

  const report = new Report({
    analysisId,
    summary,
    recommendations,
    gasOptimizations,
    bestPractices,
    executiveSummary: generateExecutiveSummary(summary, securityScore),
    technicalNotes: [],
    riskAssessment,
    complianceChecks: {
      erc20: false, // TODO: Implement compliance checks
      erc721: false,
      erc1155: false,
      accessControl: summary.criticalCount === 0 && summary.highCount < 2,
      upgradeability: false,
    },
  });

  await report.save();
}

function generateRecommendations(
  vulnerabilities: VulnerabilityFinding[]
): string[] {
  const recommendations = new Set<string>();

  vulnerabilities.forEach((vuln) => {
    recommendations.add(vuln.recommendation);
  });

  return Array.from(recommendations);
}

// Helper function to combine and deduplicate findings
function combineVulnerabilityFindings(
  staticFindings: VulnerabilityFinding[],
  aiFindings: VulnerabilityFinding[]
): VulnerabilityFinding[] {
  const combined = [...staticFindings];

  // Add AI findings that don't duplicate static findings
  for (const aiFinding of aiFindings) {
    const isDuplicate = staticFindings.some(
      (staticFinding) =>
        staticFinding.type === aiFinding.type &&
        Math.abs(staticFinding.line - aiFinding.line) <= 2 // Allow 2-line tolerance
    );

    if (!isDuplicate) {
      combined.push({
        type: aiFinding.type,
        severity: aiFinding.severity,
        title: aiFinding.title,
        description: aiFinding.description,
        line: aiFinding.line,
        column: aiFinding.column,
        codeSnippet: aiFinding.codeSnippet,
        recommendation: aiFinding.recommendation,
        confidence: aiFinding.confidence,
        functionName: aiFinding.functionName,
      });
    }
  }

  return combined;
}

function generateGasOptimizations(_contractInfo: ContractInfo): unknown[] {
  // TODO: Implement gas optimization detection
  return [];
}

function generateBestPractices(
  _contractInfo: ContractInfo,
  _vulnerabilities: VulnerabilityFinding[]
): unknown[] {
  // TODO: Implement best practices checking
  return [];
}

function generateRiskAssessment(
  vulnerabilities: VulnerabilityFinding[],
  securityScore: number
) {
  const criticalCount = vulnerabilities.filter(
    (v) => v.severity === "critical"
  ).length;
  const highCount = vulnerabilities.filter((v) => v.severity === "high").length;

  let overallRisk: "low" | "medium" | "high" | "critical";

  if (criticalCount > 0) {
    overallRisk = "critical";
  } else if (highCount > 2) {
    overallRisk = "high";
  } else if (highCount > 0 || securityScore < 70) {
    overallRisk = "medium";
  } else {
    overallRisk = "low";
  }

  const keyRisks = vulnerabilities
    .filter((v) => ["critical", "high"].includes(v.severity))
    .map((v) => v.title);

  const mitigationPriority = vulnerabilities
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 5)
    .map((v) => v.recommendation);

  return {
    overallRisk,
    keyRisks,
    mitigationPriority,
  };
}

interface SummaryData {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

function generateExecutiveSummary(
  summary: SummaryData,
  securityScore: number
): string {
  return `Security analysis completed with an overall score of ${securityScore}/100. 
  Found ${summary.totalIssues} total issues: ${summary.criticalCount} critical, 
  ${summary.highCount} high, ${summary.mediumCount} medium, and ${
    summary.lowCount
  } low severity. 
  ${
    securityScore >= 80
      ? "The contract shows good security practices with minor issues to address."
      : securityScore >= 60
      ? "The contract has moderate security concerns that should be addressed."
      : "The contract has significant security vulnerabilities that require immediate attention."
  }`;
}
