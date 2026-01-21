import { z } from 'zod';

// ISO 17024 Compliance Requirements
export const ISO17024RequirementSchema = z.object({
  id: z.string(),
  clause: z.string(),
  title: z.string(),
  description: z.string(),
  checkItems: z.array(z.string()),
  required: z.boolean().default(true),
});

export const ComplianceCheckResultSchema = z.object({
  requirementId: z.string(),
  clause: z.string(),
  title: z.string(),
  status: z.enum(['pass', 'fail', 'partial', 'not_applicable']),
  findings: z.array(z.string()),
  recommendations: z.array(z.string()).optional(),
  score: z.number().min(0).max(100).optional(),
});

export const ComplianceReportSchema = z.object({
  contentId: z.string().optional(),
  timestamp: z.string(),
  overallStatus: z.enum(['compliant', 'non_compliant', 'partially_compliant']),
  overallScore: z.number().min(0).max(100),
  results: z.array(ComplianceCheckResultSchema),
  summary: z.string(),
  criticalIssues: z.array(z.string()),
  recommendations: z.array(z.string()),
});

// TypeScript types
export type ISO17024Requirement = z.infer<typeof ISO17024RequirementSchema>;
export type ComplianceCheckResult = z.infer<typeof ComplianceCheckResultSchema>;
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;

// ISO 17024 Requirements Definition
export const ISO17024_REQUIREMENTS: ISO17024Requirement[] = [
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
