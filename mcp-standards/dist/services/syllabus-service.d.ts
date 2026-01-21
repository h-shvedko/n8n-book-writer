import { Syllabus, Domain, SyllabusSearchResult } from '../types/syllabus';
export declare class SyllabusService {
    private syllabus;
    /**
     * Load syllabus from JSON data
     */
    loadSyllabus(data: unknown): void;
    /**
     * Get the current syllabus
     */
    getSyllabus(): Syllabus | null;
    /**
     * Deep search for a domain by ID
     */
    getSyllabusSection(domainId: string): SyllabusSearchResult[];
    /**
     * Recursive search through topics
     */
    private searchTopics;
    /**
     * Get all domains
     */
    getAllDomains(): Domain[];
    /**
     * Get domain by exact ID
     */
    getDomainById(domainId: string): Domain | undefined;
    /**
     * Search syllabus by keyword
     */
    searchByKeyword(keyword: string): SyllabusSearchResult[];
    private searchTopicsByKeyword;
    /**
     * Update syllabus section (for editor)
     */
    updateSection(domainId: string, updatedDomain: Domain): boolean;
    /**
     * Export syllabus as JSON
     */
    exportAsJson(): string;
    /**
     * Export syllabus as Markdown
     */
    exportAsMarkdown(): string;
    private topicsToMarkdown;
}
export declare const syllabusService: SyllabusService;
//# sourceMappingURL=syllabus-service.d.ts.map