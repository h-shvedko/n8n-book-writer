import { z } from 'zod';
export declare const GetSyllabusSectionInputSchema: z.ZodObject<{
    domain_id: z.ZodString;
    output_format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
}, "strip", z.ZodTypeAny, {
    domain_id: string;
    output_format: "json" | "markdown";
}, {
    domain_id: string;
    output_format?: "json" | "markdown" | undefined;
}>;
export declare const ValidateIsoComplianceInputSchema: z.ZodObject<{
    content: z.ZodString;
    output_format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
}, "strip", z.ZodTypeAny, {
    output_format: "json" | "markdown";
    content: string;
}, {
    content: string;
    output_format?: "json" | "markdown" | undefined;
}>;
export declare const SearchSyllabusInputSchema: z.ZodObject<{
    keyword: z.ZodString;
    output_format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
}, "strip", z.ZodTypeAny, {
    output_format: "json" | "markdown";
    keyword: string;
}, {
    keyword: string;
    output_format?: "json" | "markdown" | undefined;
}>;
export declare const UpdateSyllabusSectionInputSchema: z.ZodObject<{
    domain_id: z.ZodString;
    domain_data: z.ZodString;
}, "strip", z.ZodTypeAny, {
    domain_id: string;
    domain_data: string;
}, {
    domain_id: string;
    domain_data: string;
}>;
export declare const LoadSyllabusInputSchema: z.ZodObject<{
    syllabus_json: z.ZodString;
}, "strip", z.ZodTypeAny, {
    syllabus_json: string;
}, {
    syllabus_json: string;
}>;
export declare const GetRequirementsInputSchema: z.ZodObject<{
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
            domain_id: {
                type: string;
                description: string;
            };
            output_format: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            content?: undefined;
            keyword?: undefined;
            syllabus_json?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            content: {
                type: string;
                description: string;
            };
            output_format: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            domain_id?: undefined;
            keyword?: undefined;
            syllabus_json?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            keyword: {
                type: string;
                description: string;
            };
            output_format: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            domain_id?: undefined;
            content?: undefined;
            syllabus_json?: undefined;
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
                description: string;
            };
            domain_id?: undefined;
            content?: undefined;
            keyword?: undefined;
            syllabus_json?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            syllabus_json: {
                type: string;
                description: string;
            };
            domain_id?: undefined;
            output_format?: undefined;
            content?: undefined;
            keyword?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            domain_id?: undefined;
            output_format?: undefined;
            content?: undefined;
            keyword?: undefined;
            syllabus_json?: undefined;
        };
        required?: undefined;
    };
})[];
export type GetSyllabusSectionInput = z.infer<typeof GetSyllabusSectionInputSchema>;
export type ValidateIsoComplianceInput = z.infer<typeof ValidateIsoComplianceInputSchema>;
export type SearchSyllabusInput = z.infer<typeof SearchSyllabusInputSchema>;
export type UpdateSyllabusSectionInput = z.infer<typeof UpdateSyllabusSectionInputSchema>;
export type LoadSyllabusInput = z.infer<typeof LoadSyllabusInputSchema>;
//# sourceMappingURL=schemas.d.ts.map