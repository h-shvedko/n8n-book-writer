import { z } from 'zod';

// TypeScript interfaces (defined first for recursive types)
export interface LearningObjective {
  id: string;
  description: string;
  bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  keywords?: string[];
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  learningObjectives: LearningObjective[];
  subtopics?: Topic[];
  estimatedHours?: number;
  resources?: string[];
}

export interface Domain {
  id: string;
  name: string;
  description: string;
  weight: number;
  topics: Topic[];
  prerequisites?: string[];
}

export interface Syllabus {
  id: string;
  name: string;
  version: string;
  certificationBody: string;
  isoStandard: string;
  lastUpdated: string;
  domains: Domain[];
  metadata?: Record<string, unknown>;
}

// Zod schemas for validation
export const LearningObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  bloomLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']),
  keywords: z.array(z.string()).optional(),
});

// Use z.ZodType to properly type recursive schema
export const TopicSchema: z.ZodType<Topic> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    learningObjectives: z.array(LearningObjectiveSchema),
    subtopics: z.array(TopicSchema).optional(),
    estimatedHours: z.number().optional(),
    resources: z.array(z.string()).optional(),
  })
);

export const DomainSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  weight: z.number().min(0).max(100),
  topics: z.array(TopicSchema),
  prerequisites: z.array(z.string()).optional(),
});

export const SyllabusSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  certificationBody: z.string(),
  isoStandard: z.string().default('ISO/IEC 17024'),
  lastUpdated: z.string(),
  domains: z.array(DomainSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Search result type
export interface SyllabusSearchResult {
  domainId: string;
  domainName: string;
  path: string[];
  content: Domain | Topic | LearningObjective;
  matchType: 'domain' | 'topic' | 'subtopic' | 'learning_objective';
}
