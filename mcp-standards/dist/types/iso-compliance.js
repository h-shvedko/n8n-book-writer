"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISO17024_REQUIREMENTS = exports.ComplianceReportSchema = exports.ComplianceCheckResultSchema = exports.ISO17024RequirementSchema = void 0;
const zod_1 = require("zod");
// ISO 17024 Compliance Requirements
exports.ISO17024RequirementSchema = zod_1.z.object({
    id: zod_1.z.string(),
    clause: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    checkItems: zod_1.z.array(zod_1.z.string()),
    required: zod_1.z.boolean().default(true),
});
exports.ComplianceCheckResultSchema = zod_1.z.object({
    requirementId: zod_1.z.string(),
    clause: zod_1.z.string(),
    title: zod_1.z.string(),
    status: zod_1.z.enum(['pass', 'fail', 'partial', 'not_applicable']),
    findings: zod_1.z.array(zod_1.z.string()),
    recommendations: zod_1.z.array(zod_1.z.string()).optional(),
    score: zod_1.z.number().min(0).max(100).optional(),
});
exports.ComplianceReportSchema = zod_1.z.object({
    contentId: zod_1.z.string().optional(),
    timestamp: zod_1.z.string(),
    overallStatus: zod_1.z.enum(['compliant', 'non_compliant', 'partially_compliant']),
    overallScore: zod_1.z.number().min(0).max(100),
    results: zod_1.z.array(exports.ComplianceCheckResultSchema),
    summary: zod_1.z.string(),
    criticalIssues: zod_1.z.array(zod_1.z.string()),
    recommendations: zod_1.z.array(zod_1.z.string()),
});
// ISO 17024 Requirements Definition
exports.ISO17024_REQUIREMENTS = [
    {
        id: 'REQ-001',
        clause: '8.2',
        title: 'Examination Development',
        description: 'Examinations shall be designed to assess competence',
        checkItems: [
            'Content aligns with defined competencies',
            'Questions are clear and unambiguous',
            'Difficulty levels are appropriate',
            'Content is current and relevant',
        ],
        required: true,
    },
    {
        id: 'REQ-002',
        clause: '8.3',
        title: 'Examination Security',
        description: 'Procedures shall be in place to ensure examination security',
        checkItems: [
            'Content is protected from unauthorized access',
            'No leaked examination content',
            'Secure delivery mechanisms described',
        ],
        required: true,
    },
    {
        id: 'REQ-003',
        clause: '9.2',
        title: 'Competence Assessment',
        description: 'Assessment methods shall be valid and reliable',
        checkItems: [
            'Clear assessment criteria defined',
            'Learning objectives are measurable',
            'Assessment aligns with learning objectives',
            'Bloom taxonomy levels are appropriate',
        ],
        required: true,
    },
    {
        id: 'REQ-004',
        clause: '9.3',
        title: 'Fairness and Validity',
        description: 'Assessment shall be fair and without bias',
        checkItems: [
            'Content is culturally neutral',
            'Language is inclusive',
            'No discriminatory content',
            'Accessible to all candidates',
        ],
        required: true,
    },
    {
        id: 'REQ-005',
        clause: '9.4',
        title: 'Documentation Requirements',
        description: 'All assessment activities shall be documented',
        checkItems: [
            'Learning objectives documented',
            'Assessment criteria documented',
            'Grading rubrics provided',
            'References and sources cited',
        ],
        required: true,
    },
    {
        id: 'REQ-006',
        clause: '10.1',
        title: 'Content Accuracy',
        description: 'Content shall be accurate and up-to-date',
        checkItems: [
            'Technical accuracy verified',
            'Information is current',
            'No outdated references',
            'Industry best practices followed',
        ],
        required: true,
    },
    {
        id: 'REQ-007',
        clause: '10.2',
        title: 'Learning Path Structure',
        description: 'Content shall follow a logical learning progression',
        checkItems: [
            'Prerequisites clearly defined',
            'Logical topic sequencing',
            'Progressive difficulty',
            'Building on prior knowledge',
        ],
        required: true,
    },
];
//# sourceMappingURL=iso-compliance.js.map