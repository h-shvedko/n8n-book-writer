import { z } from 'zod';
export declare const ISO17024RequirementSchema: z.ZodObject<{
    id: z.ZodString;
    clause: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    checkItems: z.ZodArray<z.ZodString, "many">;
    required: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    required: boolean;
    id: string;
    description: string;
    title: string;
    clause: string;
    checkItems: string[];
}, {
    id: string;
    description: string;
    title: string;
    clause: string;
    checkItems: string[];
    required?: boolean | undefined;
}>;
export declare const ComplianceCheckResultSchema: z.ZodObject<{
    requirementId: z.ZodString;
    clause: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<["pass", "fail", "partial", "not_applicable"]>;
    findings: z.ZodArray<z.ZodString, "many">;
    recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    score: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "pass" | "fail" | "partial" | "not_applicable";
    title: string;
    clause: string;
    requirementId: string;
    findings: string[];
    recommendations?: string[] | undefined;
    score?: number | undefined;
}, {
    status: "pass" | "fail" | "partial" | "not_applicable";
    title: string;
    clause: string;
    requirementId: string;
    findings: string[];
    recommendations?: string[] | undefined;
    score?: number | undefined;
}>;
export declare const ComplianceReportSchema: z.ZodObject<{
    contentId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
    overallStatus: z.ZodEnum<["compliant", "non_compliant", "partially_compliant"]>;
    overallScore: z.ZodNumber;
    results: z.ZodArray<z.ZodObject<{
        requirementId: z.ZodString;
        clause: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<["pass", "fail", "partial", "not_applicable"]>;
        findings: z.ZodArray<z.ZodString, "many">;
        recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        score: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "pass" | "fail" | "partial" | "not_applicable";
        title: string;
        clause: string;
        requirementId: string;
        findings: string[];
        recommendations?: string[] | undefined;
        score?: number | undefined;
    }, {
        status: "pass" | "fail" | "partial" | "not_applicable";
        title: string;
        clause: string;
        requirementId: string;
        findings: string[];
        recommendations?: string[] | undefined;
        score?: number | undefined;
    }>, "many">;
    summary: z.ZodString;
    criticalIssues: z.ZodArray<z.ZodString, "many">;
    recommendations: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    recommendations: string[];
    timestamp: string;
    overallStatus: "compliant" | "non_compliant" | "partially_compliant";
    overallScore: number;
    results: {
        status: "pass" | "fail" | "partial" | "not_applicable";
        title: string;
        clause: string;
        requirementId: string;
        findings: string[];
        recommendations?: string[] | undefined;
        score?: number | undefined;
    }[];
    summary: string;
    criticalIssues: string[];
    contentId?: string | undefined;
}, {
    recommendations: string[];
    timestamp: string;
    overallStatus: "compliant" | "non_compliant" | "partially_compliant";
    overallScore: number;
    results: {
        status: "pass" | "fail" | "partial" | "not_applicable";
        title: string;
        clause: string;
        requirementId: string;
        findings: string[];
        recommendations?: string[] | undefined;
        score?: number | undefined;
    }[];
    summary: string;
    criticalIssues: string[];
    contentId?: string | undefined;
}>;
export type ISO17024Requirement = z.infer<typeof ISO17024RequirementSchema>;
export type ComplianceCheckResult = z.infer<typeof ComplianceCheckResultSchema>;
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;
export declare const ISO17024_REQUIREMENTS: ISO17024Requirement[];
//# sourceMappingURL=iso-compliance.d.ts.map