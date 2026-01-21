import { z } from 'zod';
export declare const FilterMetadataSchema: z.ZodObject<{
    source: z.ZodOptional<z.ZodString>;
    document_type: z.ZodOptional<z.ZodString>;
    domain_id: z.ZodOptional<z.ZodString>;
    topic_id: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    source?: string | undefined;
    document_type?: string | undefined;
    domain_id?: string | undefined;
    topic_id?: string | undefined;
    tags?: string[] | undefined;
}, {
    source?: string | undefined;
    document_type?: string | undefined;
    domain_id?: string | undefined;
    topic_id?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const IngestMetadataSchema: z.ZodObject<{
    source: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    document_type: z.ZodOptional<z.ZodString>;
    domain_id: z.ZodOptional<z.ZodString>;
    topic_id: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    language: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    language: string;
    source?: string | undefined;
    document_type?: string | undefined;
    domain_id?: string | undefined;
    topic_id?: string | undefined;
    tags?: string[] | undefined;
    title?: string | undefined;
    author?: string | undefined;
}, {
    source?: string | undefined;
    document_type?: string | undefined;
    domain_id?: string | undefined;
    topic_id?: string | undefined;
    tags?: string[] | undefined;
    title?: string | undefined;
    author?: string | undefined;
    language?: string | undefined;
}>;
export declare const HybridSearchInputSchema: z.ZodObject<{
    query: z.ZodString;
    filter_metadata: z.ZodOptional<z.ZodObject<{
        source: z.ZodOptional<z.ZodString>;
        document_type: z.ZodOptional<z.ZodString>;
        domain_id: z.ZodOptional<z.ZodString>;
        topic_id: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    }, {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    }>>;
    limit: z.ZodDefault<z.ZodNumber>;
    vector_weight: z.ZodDefault<z.ZodNumber>;
    keyword_weight: z.ZodDefault<z.ZodNumber>;
    output_format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    vector_weight: number;
    keyword_weight: number;
    output_format: "json" | "markdown";
    filter_metadata?: {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    } | undefined;
}, {
    query: string;
    filter_metadata?: {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    } | undefined;
    limit?: number | undefined;
    vector_weight?: number | undefined;
    keyword_weight?: number | undefined;
    output_format?: "json" | "markdown" | undefined;
}>;
export declare const IngestAndEmbedInputSchema: z.ZodObject<{
    text: z.ZodString;
    metadata: z.ZodObject<{
        source: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodString>;
        document_type: z.ZodOptional<z.ZodString>;
        domain_id: z.ZodOptional<z.ZodString>;
        topic_id: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        language: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
        title?: string | undefined;
        author?: string | undefined;
    }, {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
        title?: string | undefined;
        author?: string | undefined;
        language?: string | undefined;
    }>;
    output_format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
}, "strip", z.ZodTypeAny, {
    output_format: "json" | "markdown";
    text: string;
    metadata: {
        language: string;
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
        title?: string | undefined;
        author?: string | undefined;
    };
}, {
    text: string;
    metadata: {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
        title?: string | undefined;
        author?: string | undefined;
        language?: string | undefined;
    };
    output_format?: "json" | "markdown" | undefined;
}>;
export declare const VectorSearchInputSchema: z.ZodObject<{
    query: z.ZodString;
    filter_metadata: z.ZodOptional<z.ZodObject<{
        source: z.ZodOptional<z.ZodString>;
        document_type: z.ZodOptional<z.ZodString>;
        domain_id: z.ZodOptional<z.ZodString>;
        topic_id: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    }, {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    }>>;
    limit: z.ZodDefault<z.ZodNumber>;
    output_format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    output_format: "json" | "markdown";
    filter_metadata?: {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    } | undefined;
}, {
    query: string;
    filter_metadata?: {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    } | undefined;
    limit?: number | undefined;
    output_format?: "json" | "markdown" | undefined;
}>;
export declare const DeleteDocumentsInputSchema: z.ZodObject<{
    filter_metadata: z.ZodObject<{
        source: z.ZodOptional<z.ZodString>;
        document_type: z.ZodOptional<z.ZodString>;
        domain_id: z.ZodOptional<z.ZodString>;
        topic_id: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    }, {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    filter_metadata: {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    };
}, {
    filter_metadata: {
        source?: string | undefined;
        document_type?: string | undefined;
        domain_id?: string | undefined;
        topic_id?: string | undefined;
        tags?: string[] | undefined;
    };
}>;
export declare const GetStatusInputSchema: z.ZodObject<{
    output_format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
}, "strip", z.ZodTypeAny, {
    output_format: "json" | "markdown";
}, {
    output_format?: "json" | "markdown" | undefined;
}>;
export declare const TOOL_DEFINITIONS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            filter_metadata: {
                type: string;
                properties: {
                    source: {
                        type: string;
                        description: string;
                    };
                    document_type: {
                        type: string;
                        description: string;
                    };
                    domain_id: {
                        type: string;
                        description: string;
                    };
                    topic_id: {
                        type: string;
                        description: string;
                    };
                    tags: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                };
                description: string;
            };
            limit: {
                type: string;
                default: number;
                description: string;
            };
            vector_weight: {
                type: string;
                default: number;
                description: string;
            };
            keyword_weight: {
                type: string;
                default: number;
                description: string;
            };
            output_format: {
                type: string;
                enum: string[];
                default: string;
            };
            text?: undefined;
            metadata?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            text: {
                type: string;
                description: string;
            };
            metadata: {
                type: string;
                properties: {
                    source: {
                        type: string;
                        description: string;
                    };
                    title: {
                        type: string;
                        description: string;
                    };
                    author: {
                        type: string;
                        description: string;
                    };
                    document_type: {
                        type: string;
                        description: string;
                    };
                    domain_id: {
                        type: string;
                        description: string;
                    };
                    topic_id: {
                        type: string;
                        description: string;
                    };
                    tags: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                    language: {
                        type: string;
                        default: string;
                        description: string;
                    };
                };
                description: string;
            };
            output_format: {
                type: string;
                enum: string[];
                default: string;
            };
            query?: undefined;
            filter_metadata?: undefined;
            limit?: undefined;
            vector_weight?: undefined;
            keyword_weight?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            filter_metadata: {
                type: string;
                properties: {
                    source: {
                        type: string;
                        description?: undefined;
                    };
                    document_type: {
                        type: string;
                        description?: undefined;
                    };
                    domain_id: {
                        type: string;
                        description?: undefined;
                    };
                    topic_id: {
                        type: string;
                        description?: undefined;
                    };
                    tags: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description?: undefined;
                    };
                };
                description?: undefined;
            };
            limit: {
                type: string;
                default: number;
                description?: undefined;
            };
            output_format: {
                type: string;
                enum: string[];
                default: string;
            };
            vector_weight?: undefined;
            keyword_weight?: undefined;
            text?: undefined;
            metadata?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            filter_metadata: {
                type: string;
                properties: {
                    source: {
                        type: string;
                        description?: undefined;
                    };
                    document_type: {
                        type: string;
                        description?: undefined;
                    };
                    domain_id: {
                        type: string;
                        description?: undefined;
                    };
                    topic_id: {
                        type: string;
                        description?: undefined;
                    };
                    tags: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description?: undefined;
                    };
                };
                description: string;
            };
            query?: undefined;
            limit?: undefined;
            vector_weight?: undefined;
            keyword_weight?: undefined;
            output_format?: undefined;
            text?: undefined;
            metadata?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            output_format: {
                type: string;
                enum: string[];
                default: string;
            };
            query?: undefined;
            filter_metadata?: undefined;
            limit?: undefined;
            vector_weight?: undefined;
            keyword_weight?: undefined;
            text?: undefined;
            metadata?: undefined;
        };
        required?: undefined;
    };
})[];
export type HybridSearchInput = z.infer<typeof HybridSearchInputSchema>;
export type IngestAndEmbedInput = z.infer<typeof IngestAndEmbedInputSchema>;
export type VectorSearchInput = z.infer<typeof VectorSearchInputSchema>;
export type DeleteDocumentsInput = z.infer<typeof DeleteDocumentsInputSchema>;
export type FilterMetadata = z.infer<typeof FilterMetadataSchema>;
export type IngestMetadata = z.infer<typeof IngestMetadataSchema>;
//# sourceMappingURL=schemas.d.ts.map