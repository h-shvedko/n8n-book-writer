export interface ToolResult {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}
/**
 * Handle get_syllabus_section tool call
 */
export declare function handleGetSyllabusSection(args: unknown): ToolResult;
/**
 * Handle validate_iso_compliance tool call
 */
export declare function handleValidateIsoCompliance(args: unknown): ToolResult;
/**
 * Handle search_syllabus tool call
 */
export declare function handleSearchSyllabus(args: unknown): ToolResult;
/**
 * Handle get_all_domains tool call
 */
export declare function handleGetAllDomains(args: unknown): ToolResult;
/**
 * Handle load_syllabus tool call
 */
export declare function handleLoadSyllabus(args: unknown): ToolResult;
/**
 * Handle export_syllabus tool call
 */
export declare function handleExportSyllabus(args: unknown): ToolResult;
/**
 * Handle get_iso_requirements tool call
 */
export declare function handleGetIsoRequirements(args: unknown): ToolResult;
//# sourceMappingURL=handlers.d.ts.map