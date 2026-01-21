"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchFilterSchema = exports.DocumentMetadataSchema = void 0;
const zod_1 = require("zod");
// Metadata schema for documents
exports.DocumentMetadataSchema = zod_1.z.object({
    source: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
    author: zod_1.z.string().optional(),
    created_at: zod_1.z.string().optional(),
    document_type: zod_1.z.string().optional(),
    domain_id: zod_1.z.string().optional(),
    topic_id: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    language: zod_1.z.string().default('en'),
    chunk_index: zod_1.z.number().optional(),
    total_chunks: zod_1.z.number().optional(),
});
// Search filter schema
exports.SearchFilterSchema = zod_1.z.object({
    source: zod_1.z.string().optional(),
    document_type: zod_1.z.string().optional(),
    domain_id: zod_1.z.string().optional(),
    topic_id: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    date_from: zod_1.z.string().optional(),
    date_to: zod_1.z.string().optional(),
});
//# sourceMappingURL=index.js.map