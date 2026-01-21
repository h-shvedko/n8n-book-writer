import { ISO17024Requirement, ComplianceReport } from '../types/iso-compliance';
export declare class ComplianceService {
    private requirements;
    /**
     * Validate content against ISO 17024 requirements
     */
    validateIsoCompliance(content: string): ComplianceReport;
    /**
     * Check a single requirement against content
     */
    private checkRequirement;
    /**
     * Perform individual check
     */
    private performCheck;
    /**
     * Determine overall compliance status
     */
    private determineOverallStatus;
    /**
     * Generate summary text
     */
    private generateSummary;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Get all requirements
     */
    getRequirements(): ISO17024Requirement[];
    /**
     * Format report as Markdown
     */
    formatReportAsMarkdown(report: ComplianceReport): string;
}
export declare const complianceService: ComplianceService;
//# sourceMappingURL=compliance-service.d.ts.map