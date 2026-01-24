import { z } from 'zod';
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
export declare const LearningObjectiveSchema: z.ZodObject<{
    id: z.ZodString;
    description: z.ZodString;
    bloomLevel: z.ZodEnum<["remember", "understand", "apply", "analyze", "evaluate", "create"]>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
    keywords?: string[] | undefined;
}, {
    id: string;
    description: string;
    bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
    keywords?: string[] | undefined;
}>;
export declare const TopicSchema: z.ZodType<Topic>;
export declare const DomainSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    weight: z.ZodNumber;
    topics: z.ZodArray<z.ZodType<Topic, z.ZodTypeDef, Topic>, "many">;
    prerequisites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    name: string;
    weight: number;
    topics: Topic[];
    prerequisites?: string[] | undefined;
}, {
    id: string;
    description: string;
    name: string;
    weight: number;
    topics: Topic[];
    prerequisites?: string[] | undefined;
}>;
export declare const SyllabusSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    certificationBody: z.ZodString;
    isoStandard: z.ZodDefault<z.ZodString>;
    lastUpdated: z.ZodString;
    domains: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        weight: z.ZodNumber;
        topics: z.ZodArray<z.ZodType<Topic, z.ZodTypeDef, Topic>, "many">;
        prerequisites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        description: string;
        name: string;
        weight: number;
        topics: Topic[];
        prerequisites?: string[] | undefined;
    }, {
        id: string;
        description: string;
        name: string;
        weight: number;
        topics: Topic[];
        prerequisites?: string[] | undefined;
    }>, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    version: string;
    certificationBody: string;
    isoStandard: string;
    lastUpdated: string;
    domains: {
        id: string;
        description: string;
        name: string;
        weight: number;
        topics: Topic[];
        prerequisites?: string[] | undefined;
    }[];
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    name: string;
    version: string;
    certificationBody: string;
    lastUpdated: string;
    domains: {
        id: string;
        description: string;
        name: string;
        weight: number;
        topics: Topic[];
        prerequisites?: string[] | undefined;
    }[];
    isoStandard?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export interface SyllabusSearchResult {
    domainId: string;
    domainName: string;
    path: string[];
    content: Domain | Topic | LearningObjective;
    matchType: 'domain' | 'topic' | 'subtopic' | 'learning_objective';
}
//# sourceMappingURL=syllabus.d.ts.map