import { z } from 'zod';
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
export declare const TopicSchema: any;
export declare const DomainSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    weight: z.ZodNumber;
    topics: z.ZodArray<any, "many">;
    prerequisites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    name: string;
    weight: number;
    topics: any[];
    prerequisites?: string[] | undefined;
}, {
    id: string;
    description: string;
    name: string;
    weight: number;
    topics: any[];
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
        topics: z.ZodArray<any, "many">;
        prerequisites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        description: string;
        name: string;
        weight: number;
        topics: any[];
        prerequisites?: string[] | undefined;
    }, {
        id: string;
        description: string;
        name: string;
        weight: number;
        topics: any[];
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
        topics: any[];
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
        topics: any[];
        prerequisites?: string[] | undefined;
    }[];
    isoStandard?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type LearningObjective = z.infer<typeof LearningObjectiveSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Domain = z.infer<typeof DomainSchema>;
export type Syllabus = z.infer<typeof SyllabusSchema>;
export interface SyllabusSearchResult {
    domainId: string;
    domainName: string;
    path: string[];
    content: Domain | Topic | LearningObjective;
    matchType: 'domain' | 'topic' | 'subtopic' | 'learning_objective';
}
//# sourceMappingURL=syllabus.d.ts.map