"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyllabusSchema = exports.DomainSchema = exports.TopicSchema = exports.LearningObjectiveSchema = void 0;
const zod_1 = require("zod");
// Zod schemas for validation
exports.LearningObjectiveSchema = zod_1.z.object({
    id: zod_1.z.string(),
    description: zod_1.z.string(),
    bloomLevel: zod_1.z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
});
// Use z.ZodType to properly type recursive schema
exports.TopicSchema = zod_1.z.lazy(() => zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    learningObjectives: zod_1.z.array(exports.LearningObjectiveSchema),
    subtopics: zod_1.z.array(exports.TopicSchema).optional(),
    estimatedHours: zod_1.z.number().optional(),
    resources: zod_1.z.array(zod_1.z.string()).optional(),
}));
exports.DomainSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    weight: zod_1.z.number().min(0).max(100),
    topics: zod_1.z.array(exports.TopicSchema),
    prerequisites: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.SyllabusSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    version: zod_1.z.string(),
    certificationBody: zod_1.z.string(),
    isoStandard: zod_1.z.string().default('ISO/IEC 17024'),
    lastUpdated: zod_1.z.string(),
    domains: zod_1.z.array(exports.DomainSchema),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
//# sourceMappingURL=syllabus.js.map