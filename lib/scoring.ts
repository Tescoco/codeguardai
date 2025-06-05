interface VulnerabilityFinding {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
}

export function calculateSecurityScore(
  vulnerabilities: VulnerabilityFinding[],
  sourceCode: string
): number {
  let baseScore = 100;

  // Deduct points based on vulnerability severity
  vulnerabilities.forEach((vuln) => {
    const confidenceMultiplier = vuln.confidence;

    switch (vuln.severity) {
      case "critical":
        baseScore -= Math.round(40 * confidenceMultiplier);
        break;
      case "high":
        baseScore -= Math.round(25 * confidenceMultiplier);
        break;
      case "medium":
        baseScore -= Math.round(15 * confidenceMultiplier);
        break;
      case "low":
        baseScore -= Math.round(5 * confidenceMultiplier);
        break;
    }
  });

  // Add bonus points for good practices
  const bonusPoints = calculateBonusPoints(sourceCode);
  baseScore += bonusPoints;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, baseScore));
}

function calculateBonusPoints(sourceCode: string): number {
  let bonus = 0;

  // Check for security best practices
  const practices = {
    hasReentrancyGuard: /ReentrancyGuard|nonReentrant/i.test(sourceCode),
    hasAccessControl: /onlyOwner|Ownable|AccessControl/i.test(sourceCode),
    hasEvents: /event\s+\w+/i.test(sourceCode),
    hasModifiers: /modifier\s+\w+/i.test(sourceCode),
    hasRequireStatements: /require\s*\(/i.test(sourceCode),
    hasSafemath: /SafeMath|using\s+SafeMath/i.test(sourceCode),
    isSolidity08Plus: /pragma\s+solidity\s+[\^~]?0\.[8-9]/i.test(sourceCode),
    hasNatSpec: /@notice|@dev|@param|@return/i.test(sourceCode),
    hasLicense: /SPDX-License-Identifier/i.test(sourceCode),
  };

  // Award bonus points for each good practice
  Object.values(practices).forEach((hasPractice) => {
    if (hasPractice) bonus += 2;
  });

  // Additional checks
  if (practices.isSolidity08Plus && !practices.hasSafemath) {
    // Solidity 0.8+ has built-in overflow protection
    bonus += 3;
  }

  if (practices.hasNatSpec) {
    // Well-documented code
    bonus += 3;
  }

  if (practices.hasLicense) {
    // Proper licensing
    bonus += 1;
  }

  // Penalty for complexity
  const functionCount = (sourceCode.match(/function\s+\w+/g) || []).length;
  const contractCount = (sourceCode.match(/contract\s+\w+/g) || []).length;

  if (functionCount > 20) {
    bonus -= 2; // Complex contracts are harder to audit
  }

  if (contractCount > 3) {
    bonus -= 1; // Multiple contracts in one file
  }

  return Math.max(0, bonus); // Bonus can't be negative
}

export function categorizeRisk(
  score: number
): "low" | "medium" | "high" | "critical" {
  if (score >= 90) return "low";
  if (score >= 70) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

export function generateScoreExplanation(
  score: number,
  vulnerabilities: VulnerabilityFinding[]
): string {
  const riskLevel = categorizeRisk(score);
  const vulnCounts = {
    critical: vulnerabilities.filter((v) => v.severity === "critical").length,
    high: vulnerabilities.filter((v) => v.severity === "high").length,
    medium: vulnerabilities.filter((v) => v.severity === "medium").length,
    low: vulnerabilities.filter((v) => v.severity === "low").length,
  };

  let explanation = `Security score: ${score}/100 (${riskLevel} risk)\n\n`;

  if (vulnCounts.critical > 0) {
    explanation += `⚠️ Critical issues found (${vulnCounts.critical}) - immediate attention required\n`;
  }

  if (vulnCounts.high > 0) {
    explanation += `🔴 High severity issues (${vulnCounts.high}) - should be fixed before deployment\n`;
  }

  if (vulnCounts.medium > 0) {
    explanation += `🟡 Medium severity issues (${vulnCounts.medium}) - recommended to fix\n`;
  }

  if (vulnCounts.low > 0) {
    explanation += `🟢 Low severity issues (${vulnCounts.low}) - minor improvements\n`;
  }

  if (vulnerabilities.length === 0) {
    explanation += `✅ No vulnerabilities detected by static analysis\n`;
  }

  // Risk level explanations
  switch (riskLevel) {
    case "low":
      explanation +=
        "\n✅ This contract shows good security practices with minimal risks.";
      break;
    case "medium":
      explanation +=
        "\n⚠️ This contract has moderate security concerns that should be addressed.";
      break;
    case "high":
      explanation +=
        "\n🔴 This contract has significant security vulnerabilities requiring fixes.";
      break;
    case "critical":
      explanation +=
        "\n💥 This contract has critical security flaws and should not be deployed without major fixes.";
      break;
  }

  return explanation;
}
