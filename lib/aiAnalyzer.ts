import OpenAI from "openai";
import Vulnerability from "../models/Vulnerability";

interface AIVulnerabilityFinding {
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
  aiExplanation?: string;
}

interface VulnAnalysisResult {
  type: string;
  severity: string;
  title: string;
  description: string;
  line: number;
  column: number;
  codeSnippet: string;
  recommendation: string;
  confidence: number;
  functionName?: string;
  aiExplanation?: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Analysis prompts for different vulnerability types
const VULNERABILITY_ANALYSIS_PROMPT = `
You are an expert smart contract security auditor. Analyze the provided Solidity code for security vulnerabilities.

Focus on these critical areas:
1. Reentrancy attacks and state changes after external calls
2. Access control vulnerabilities and privilege escalation
3. Integer overflow/underflow and arithmetic issues
4. Unchecked external calls and return value handling
5. Gas limit issues and denial of service attacks
6. Logic errors and business logic flaws
7. Oracle manipulation and price feed attacks
8. Flash loan vulnerabilities
9. MEV (Maximal Extractable Value) vulnerabilities
10. Signature replay attacks

For each vulnerability found, provide:
- Type of vulnerability
- Severity level (critical/high/medium/low)
- Affected line number (estimate if needed)
- Code snippet showing the issue
- Detailed explanation of the vulnerability
- Specific remediation steps
- Confidence level (0.0 to 1.0)

Return your analysis as a JSON array of vulnerability objects with this structure:
{
  "vulnerabilities": [
    {
      "type": "vulnerability_type",
      "severity": "critical|high|medium|low",
      "title": "Brief title",
      "description": "Detailed description",
      "line": number,
      "column": 0,
      "codeSnippet": "relevant code",
      "recommendation": "specific fix",
      "confidence": 0.0-1.0,
      "functionName": "function name if applicable",
      "aiExplanation": "detailed AI explanation"
    }
  ]
}

Only return valid JSON. If no vulnerabilities are found, return {"vulnerabilities": []}.
`;

export async function generateAIAnalysis(
  sourceCode: string,
  analysisId: string
): Promise<AIVulnerabilityFinding[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI API key not provided, skipping AI analysis");
      return [];
    }

    console.log(`Starting AI analysis for ${analysisId}`);

    // Split large contracts into chunks if needed (OpenAI token limits)
    const codeChunks = splitCodeIntoChunks(sourceCode, 4000);
    const allVulnerabilities: AIVulnerabilityFinding[] = [];

    for (let i = 0; i < codeChunks.length; i++) {
      const chunk = codeChunks[i];
      console.log(`Analyzing chunk ${i + 1}/${codeChunks.length}`);

      try {
        const vulnerabilities = await analyzeCodeChunk(chunk, i * 50); // Offset line numbers
        allVulnerabilities.push(...vulnerabilities);
      } catch (error) {
        console.error(`Error analyzing chunk ${i + 1}:`, error);
        // Continue with other chunks even if one fails
      }
    }

    // Save AI findings to database
    await saveAIFindings(allVulnerabilities, analysisId);

    console.log(
      `AI analysis completed for ${analysisId}, found ${allVulnerabilities.length} issues`
    );
    return allVulnerabilities;
  } catch (error) {
    console.error("AI analysis failed:", error);
    return [];
  }
}

async function analyzeCodeChunk(
  codeChunk: string,
  lineOffset: number
): Promise<AIVulnerabilityFinding[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Use GPT-4 for better analysis
      messages: [
        {
          role: "system",
          content: VULNERABILITY_ANALYSIS_PROMPT,
        },
        {
          role: "user",
          content: `Analyze this Solidity code for security vulnerabilities:\n\n\`\`\`solidity\n${codeChunk}\n\`\`\``,
        },
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    const analysisResult = JSON.parse(response);
    const vulnerabilities = analysisResult.vulnerabilities || [];

    // Adjust line numbers with offset and validate
    return vulnerabilities
      .map((vuln: VulnAnalysisResult) => ({
        type: vuln.type || "unknown",
        severity: validateSeverity(vuln.severity),
        title: vuln.title || "AI-detected vulnerability",
        description: vuln.description || "No description provided",
        line: (vuln.line || 1) + lineOffset,
        column: vuln.column || 0,
        codeSnippet: vuln.codeSnippet || "",
        recommendation:
          vuln.recommendation || "Review and fix the identified issue",
        confidence: Math.max(0, Math.min(1, vuln.confidence || 0.5)),
        functionName: vuln.functionName,
        aiExplanation: vuln.aiExplanation || vuln.description,
      }))
      .filter((vuln: AIVulnerabilityFinding) => vuln.severity); // Filter out invalid severities
  } catch (error) {
    console.error("Error in AI analysis:", error);
    return [];
  }
}

function splitCodeIntoChunks(code: string, maxChunkSize: number): string[] {
  const lines = code.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    if (
      currentChunk.length + line.length > maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk);
      currentChunk = line + "\n";
    } else {
      currentChunk += line + "\n";
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [code];
}

function validateSeverity(
  severity: string
): "critical" | "high" | "medium" | "low" | null {
  const validSeverities = ["critical", "high", "medium", "low"];
  const normalizedSeverity = severity?.toLowerCase();
  return validSeverities.includes(normalizedSeverity)
    ? (normalizedSeverity as "critical" | "high" | "medium" | "low")
    : null;
}

async function saveAIFindings(
  vulnerabilities: AIVulnerabilityFinding[],
  analysisId: string
): Promise<void> {
  try {
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
        source: "ai_analysis",
        aiExplanation: vuln.aiExplanation,
      });

      await vulnerability.save();
    }
  } catch (error) {
    console.error("Error saving AI findings:", error);
  }
}

// Enhanced analysis for specific vulnerability patterns
export async function performTargetedAIAnalysis(
  sourceCode: string,
  vulnerabilityType: string
): Promise<AIVulnerabilityFinding[]> {
  const targetedPrompts: Record<string, string> = {
    reentrancy: `
      Focus specifically on reentrancy vulnerabilities:
      - External calls before state changes
      - Cross-function reentrancy
      - Read-only reentrancy
      - Reentrancy through callbacks
    `,
    access_control: `
      Focus on access control issues:
      - Missing or weak access modifiers
      - Privilege escalation possibilities
      - Role-based access control flaws
      - Function visibility issues
    `,
    economic: `
      Focus on economic vulnerabilities:
      - Price manipulation attacks
      - Oracle manipulation
      - Flash loan vulnerabilities
      - MEV extraction possibilities
    `,
  };

  const specificPrompt =
    targetedPrompts[vulnerabilityType] || targetedPrompts.reentrancy;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `${VULNERABILITY_ANALYSIS_PROMPT}\n\nSpecific focus: ${specificPrompt}`,
        },
        {
          role: "user",
          content: `Analyze this Solidity code with specific focus on ${vulnerabilityType}:\n\n\`\`\`solidity\n${sourceCode}\n\`\`\``,
        },
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      const result = JSON.parse(response);
      return result.vulnerabilities || [];
    }

    return [];
  } catch (error) {
    console.error(
      `Targeted AI analysis failed for ${vulnerabilityType}:`,
      error
    );
    return [];
  }
}
