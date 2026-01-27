export interface IngestedFile {
    id: number;
    fileName: string;
    title: string;
    fileSize: number;
    fileType: string;
    chunksCreated: number;
    chunksIngested: number;
    chunksErrored: number;
    domainId?: string;
    topicId?: string;
    category?: string;
    language: string;
    status: 'completed' | 'partial' | 'failed';
    createdAt: string;
    updatedAt: string;
}
export interface CreateIngestedFileInput {
    fileName: string;
    title: string;
    fileSize: number;
    fileType: string;
    chunksCreated: number;
    chunksIngested: number;
    chunksErrored: number;
    domainId?: string;
    topicId?: string;
    category?: string;
    language: string;
}
declare class IngestionDatabase {
    private db;
    private initialized;
    constructor();
    private init;
    addFile(input: CreateIngestedFileInput): IngestedFile;
    getFile(id: number): IngestedFile | null;
    listFiles(options?: {
        limit?: number;
        offset?: number;
        category?: string;
        status?: string;
    }): {
        files: IngestedFile[];
        total: number;
    };
    deleteFile(id: number): boolean;
    getStats(): {
        totalFiles: number;
        totalChunks: number;
        byCategory: {
            category: string;
            count: number;
        }[];
        byStatus: {
            status: string;
            count: number;
        }[];
    };
    close(): void;
}
export declare function getIngestionDb(): IngestionDatabase;
export {};
//# sourceMappingURL=ingestion-db.d.ts.map