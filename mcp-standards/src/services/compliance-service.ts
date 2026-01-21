import {
  ISO17024Requirement,
  ComplianceCheckResult,
  ComplianceReport,
  ISO17024_REQUIREMENTS,
} from '../types/iso-compliance';

export class ComplianceService {
  private requirements: ISO17024Requirement[] = ISO17024_REQUIREMENTS;

  /**
   * Validate content against ISO 17024 requirements
   */
  validateIsoCompliance(content: string): ComplianceReport {
    const results: ComplianceCheckResult[] = [];
    const criticalIssues: string[] = [];
    let totalScore = 0;
    let checkedRequirements = 0;

    for (const requirement of this.requirements) {
      const result = this.checkRequirement(content, requirement);
      results.push(result);

      if (result.status === 'fail' && requirement.required) {
        criticalIssues.push(`${requirement.clause} ${requirement.title}: ${result.findings.join('; ')}`);
      }

      if (result.score !== undefined) {
        totalScore += result.score;
        checkedRequirements++;
      }
    }

    const overallScore = checkedRequirements > 0
      ? Math.round(totalScore / checkedRequirements)
      : 0;

    const overallStatus = this.determineOverallStatus(results, criticalIssues);

    const report: ComplianceReport = {
      timestamp: new Date().toISOString(),
      overallStatus,
      overallScore,
      results,
      summary: this.generateSummary(results, overallScore),
      criticalIssues,
      recommendations: this.generateRecommendations(results),
    };

    return report;
  }

  /**
   * Check a single requirement against content
   */
  private checkRequirement(content: string, requirement: ISO17024Requirement): ComplianceCheckResult {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let passedChecks = 0;
    const contentLower = content.toLowerCase();

    for (const checkItem of requirement.checkItems) {
      const checkResult = this.performCheck(contentLower, checkItem, requirement);

      if (checkResult.passed) {
        passedChecks++;
      } else {
        findings.push(checkResult.finding);
        if (checkResult.recommendation) {
          recommendations.push(checkResult.recommendation);
        }
      }
    }

    const score = Math.round((passedChecks / requirement.checkItems.length) * 100);

    let status: 'pass' | 'fail' | 'partial' | 'not_applicable';
    if (score >= 80) {
      status = 'pass';
    } else if (score >= 50) {
      status = 'partial';
    } else if (score === 0 && content.length < 50) {
      status = 'not_applicable';
    } else {
      status = 'fail';
    }

    return {
      requirementId: requirement.id,
      clause: requirement.clause,
      title: requirement.title,
      status,
      findings,
      recommendations,
      score,
    };
  }

  /**
   * Perform individual check
   */
  private performCheck(
    content: string,
    checkItem: string,
    requirement: ISO17024Requirement
  ): { passed: boolean; finding: string; recommendation?: string } {
    // Content alignment checks
    if (checkItem.toLowerCase().includes('competenc')) {
      const hasCompetency = content.includes('competenc') ||
                           content.includes('skill') ||
                           content.includes('ability') ||
                           content.includes('capable');
      return {
        passed: hasCompetency,
        finding: hasCompetency ? '' : 'No competency alignment found',
        recommendation: hasCompetency ? undefined : 'Define clear competencies that content addresses',
      };
    }

    // Learning objectives checks
    if (checkItem.toLowerCase().includes('learning objective')) {
      const hasObjectives = content.includes('objective') ||
                           content.includes('will be able to') ||
                           content.includes('understand') ||
                           content.includes('demonstrate');
      return {
        passed: hasObjectives,
        finding: hasObjectives ? '' : 'No clear learning objectives found',
        recommendation: hasObjectives ? undefined : 'Add measurable learning objectives using action verbs',
      };
    }

    // Bloom taxonomy checks
    if (checkItem.toLowerCase().includes('bloom')) {
      const bloomVerbs = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create',
                         'define', 'explain', 'implement', 'compare', 'assess', 'design'];
      const hasBloom = bloomVerbs.some(verb => content.includes(verb));
      return {
        passed: hasBloom,
        finding: hasBloom ? '' : 'Bloom taxonomy levels not evident',
        recommendation: hasBloom ? undefined : 'Use action verbs aligned with Bloom taxonomy levels',
      };
    }

    // Assessment criteria checks
    if (checkItem.toLowerCase().includes('assessment') || checkItem.toLowerCase().includes('criteria')) {
      const hasCriteria = content.includes('assess') ||
                         content.includes('evaluat') ||
                         content.includes('criteria') ||
                         content.includes('rubric') ||
                         content.includes('grading');
      return {
        passed: hasCriteria,
        finding: hasCriteria ? '' : 'No assessment criteria found',
        recommendation: hasCriteria ? undefined : 'Define clear assessment criteria and rubrics',
      };
    }

    // Documentation checks
    if (checkItem.toLowerCase().includes('document')) {
      const hasDocumentation = content.includes('document') ||
                               content.includes('reference') ||
                               content.includes('source') ||
                               content.includes('citation');
      return {
        passed: hasDocumentation,
        finding: hasDocumentation ? '' : 'Documentation references missing',
        recommendation: hasDocumentation ? undefined : 'Include proper documentation and references',
      };
    }

    // Clear and unambiguous checks
    if (checkItem.toLowerCase().includes('clear') || checkItem.toLowerCase().includes('unambiguous')) {
      // Check for overly complex sentences (simplified heuristic)
      const sentences = content.split(/[.!?]+/);
      const avgLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
      const isClear = avgLength < 30; // Average sentence length under 30 words
      return {
        passed: isClear,
        finding: isClear ? '' : 'Content may be too complex or ambiguous',
        recommendation: isClear ? undefined : 'Simplify language and use shorter sentences',
      };
    }

    // Accessibility checks
    if (checkItem.toLowerCase().includes('accessible')) {
      // Basic accessibility check - no overly technical jargon without explanation
      const hasExplanations = content.includes('meaning') ||
                              content.includes('that is') ||
                              content.includes('i.e.') ||
                              content.includes('for example');
      return {
        passed: hasExplanations,
        finding: hasExplanations ? '' : 'Content may not be accessible to all learners',
        recommendation: hasExplanations ? undefined : 'Add explanations for technical terms',
      };
    }

    // Fairness and bias checks
    if (checkItem.toLowerCase().includes('bias') || checkItem.toLowerCase().includes('fair') || checkItem.toLowerCase().includes('discriminat')) {
      // Check for potentially biased language (simplified)
      const biasedTerms = ['always', 'never', 'everyone knows', 'obviously', 'simply'];
      const hasBias = biasedTerms.some(term => content.includes(term));
      return {
        passed: !hasBias,
        finding: hasBias ? 'Potentially biased language detected' : '',
        recommendation: hasBias ? 'Review content for inclusive and neutral language' : undefined,
      };
    }

    // Prerequisites checks
    if (checkItem.toLowerCase().includes('prerequisite')) {
      const hasPrereqs = content.includes('prerequisite') ||
                         content.includes('prior knowledge') ||
                         content.includes('before starting') ||
                         content.includes('required background');
      return {
        passed: hasPrereqs,
        finding: hasPrereqs ? '' : 'Prerequisites not clearly defined',
        recommendation: hasPrereqs ? undefined : 'Specify required prior knowledge or prerequisites',
      };
    }

    // Default check - content length and structure
    const hasStructure = content.length > 100 && content.includes('\n');
    return {
      passed: hasStructure,
      finding: hasStructure ? '' : `Check item not verified: ${checkItem}`,
      recommendation: hasStructure ? undefined : 'Ensure content is well-structured and complete',
    };
  }

  /**
   * Determine overall compliance status
   */
  private determineOverallStatus(
    results: ComplianceCheckResult[],
    criticalIssues: string[]
  ): 'compliant' | 'non_compliant' | 'partially_compliant' {
    if (criticalIssues.length > 0) {
      return 'non_compliant';
    }

    const passCount = results.filter(r => r.status === 'pass').length;
    const totalRequired = results.filter(r => r.status !== 'not_applicable').length;

    if (passCount === totalRequired) {
      return 'compliant';
    } else if (passCount >= totalRequired * 0.7) {
      return 'partially_compliant';
    }
    return 'non_compliant';
  }

  /**
   * Generate summary text
   */
  private generateSummary(results: ComplianceCheckResult[], overallScore: number): string {
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    const partialCount = results.filter(r => r.status === 'partial').length;

    return `ISO 17024 Compliance Check Complete. Overall Score: ${overallScore}%. ` +
           `Passed: ${passCount}, Failed: ${failCount}, Partial: ${partialCount} requirements. ` +
           `${failCount > 0 ? 'Action required to address failed requirements.' : 'Content meets basic compliance standards.'}`;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(results: ComplianceCheckResult[]): string[] {
    const recommendations: string[] = [];

    for (const result of results) {
      if (result.status !== 'pass' && result.recommendations) {
        recommendations.push(...result.recommendations);
      }
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Get all requirements
   */
  getRequirements(): ISO17024Requirement[] {
    return this.requirements;
  }

  /**
   * Format report as Markdown
   */
  formatReportAsMarkdown(report: ComplianceReport): string {
    let md = `# ISO 17024 Compliance Report\n\n`;
    md += `**Generated:** ${report.timestamp}\n`;
    md += `**Overall Status:** ${report.overallStatus.replace('_', ' ').toUpperCase()}\n`;
    md += `**Overall Score:** ${report.overallScore}%\n\n`;
    md += `## Summary\n\n${report.summary}\n\n`;

    if (report.criticalIssues.length > 0) {
      md += `## Critical Issues\n\n`;
      for (const issue of report.criticalIssues) {
        md += `- ${issue}\n`;
      }
      md += '\n';
    }

    md += `## Detailed Results\n\n`;
    for (const result of report.results) {
      const statusEmoji = {
        pass: 'PASS',
        fail: 'FAIL',
        partial: 'PARTIAL',
        not_applicable: 'N/A',
      }[result.status];

      md += `### ${result.clause} - ${result.title} [${statusEmoji}]\n\n`;
      md += `**Score:** ${result.score ?? 'N/A'}%\n\n`;

      if (result.findings.length > 0) {
        md += `**Findings:**\n`;
        for (const finding of result.findings) {
          md += `- ${finding}\n`;
        }
        md += '\n';
      }

      if (result.recommendations && result.recommendations.length > 0) {
        md += `**Recommendations:**\n`;
        for (const rec of result.recommendations) {
          md += `- ${rec}\n`;
        }
        md += '\n';
      }
    }

    if (report.recommendations.length > 0) {
      md += `## Overall Recommendations\n\n`;
      for (const rec of report.recommendations) {
        md += `- ${rec}\n`;
      }
    }

    return md;
  }
}

// Singleton instance
export const complianceService = new ComplianceService();
