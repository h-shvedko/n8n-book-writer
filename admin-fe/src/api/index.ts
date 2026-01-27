import { Syllabus, WorkflowExecution, ServiceStatus, DocumentMetadata, IngestedFileRecord } from '../types';

const N8N_API_BASE = import.meta.env.VITE_N8N_API_BASE || '/api/n8n';
const MCP_RESEARCH_BASE = import.meta.env.VITE_MCP_RESEARCH_BASE || '/api/mcp-research';
const MCP_STANDARDS_BASE = import.meta.env.VITE_MCP_STANDARDS_BASE || '/api/mcp-standards';
const MCP_AUTH_TOKEN = import.meta.env.VITE_MCP_AUTH_TOKEN || '';

// Helper function for API calls with optional auth
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  // Add auth token if available
  if (MCP_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${MCP_AUTH_TOKEN}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// n8n API
export const n8nApi = {
  async getExecutions(): Promise<WorkflowExecution[]> {
    try {
      const response = await fetchApi<{ data: unknown[] }>(`${N8N_API_BASE}/executions?includeData=true&limit=10`);
      return (response.data || []).map(mapN8nExecution);
    } catch {
      // Return mock data if n8n is not available
      return [];
    }
  },

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    try {
      const response = await fetchApi<unknown>(`${N8N_API_BASE}/executions/${id}?includeData=true`);
      return mapN8nExecution(response);
    } catch {
      return null;
    }
  },

  async getActiveWorkflows(): Promise<{ id: string; name: string; active: boolean }[]> {
    try {
      const response = await fetchApi<{ data: unknown[] }>(`${N8N_API_BASE}/workflows`);
      return (response.data || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        active: w.active,
      }));
    } catch {
      return [];
    }
  },
};

// MCP Research API
export const researchApi = {
  async getStatus(): Promise<ServiceStatus> {
    try {
      const response = await fetchApi<any>(`${MCP_RESEARCH_BASE}/status`);
      return {
        status: response.status,
        qdrantConnected: response.qdrant_connected,
        collectionExists: response.collection_exists,
        documentCount: response.document_count,
        lastCheck: response.last_check,
        error: response.error,
      };
    } catch (error) {
      return {
        status: 'unavailable',
        qdrantConnected: false,
        collectionExists: false,
        documentCount: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  },

  async ingestDocument(text: string, metadata: DocumentMetadata): Promise<{ documentId: string; chunksCreated: number }> {
    const response = await fetchApi<any>(`${MCP_RESEARCH_BASE}/ingest`, {
      method: 'POST',
      body: JSON.stringify({
        text,
        metadata: {
          source: metadata.source,
          title: metadata.title,
          author: metadata.author,
          document_type: metadata.documentType,
          domain_id: metadata.domainId,
          topic_id: metadata.topicId,
          tags: metadata.tags,
          language: metadata.language || 'en',
        },
      }),
    });

    return {
      documentId: response.document_id,
      chunksCreated: response.chunks_created,
    };
  },

  async ingestFile(
    file: File,
    metadata: DocumentMetadata,
    onProgress?: (progress: number) => void
  ): Promise<{
    success: boolean;
    fileName: string;
    title: string;
    chunksCreated: number;
    chunksIngested: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata.domainId) formData.append('domainId', metadata.domainId);
    if (metadata.topicId) formData.append('topicId', metadata.topicId);
    if (metadata.tags?.length) formData.append('category', metadata.tags[0]);
    formData.append('language', metadata.language || 'de');

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 50); // Upload is 0-50%
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (onProgress) onProgress(100);
            resolve(response);
          } catch {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || `HTTP ${xhr.status}`));
          } catch {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));

      xhr.open('POST', `${MCP_RESEARCH_BASE}/admin/ingest-file`);
      if (MCP_AUTH_TOKEN) {
        xhr.setRequestHeader('Authorization', `Bearer ${MCP_AUTH_TOKEN}`);
      }
      xhr.timeout = 600000; // 10 minute timeout for large files
      xhr.send(formData);
    });
  },

  async search(query: string, limit = 10): Promise<any[]> {
    const response = await fetchApi<any>(`${MCP_RESEARCH_BASE}/search`, {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
    return response.results || [];
  },

  async getIngestedFiles(options: { limit?: number; offset?: number; category?: string; status?: string } = {}): Promise<{
    files: IngestedFileRecord[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.category) params.append('category', options.category);
    if (options.status) params.append('status', options.status);

    const response = await fetchApi<any>(`${MCP_RESEARCH_BASE}/admin/ingested-files?${params.toString()}`);
    return response;
  },

  async getIngestionStats(): Promise<{
    totalFiles: number;
    totalChunks: number;
    byCategory: { category: string; count: number }[];
    byStatus: { status: string; count: number }[];
  }> {
    return fetchApi<any>(`${MCP_RESEARCH_BASE}/admin/ingestion-stats`);
  },

  async deleteIngestedFile(id: number): Promise<void> {
    await fetchApi<any>(`${MCP_RESEARCH_BASE}/admin/ingested-files/${id}`, {
      method: 'DELETE',
    });
  },

  // Vector DB Document Management
  async browseDocuments(options: {
    limit?: number;
    offset?: string | null;
    source?: string;
    documentType?: string;
  } = {}): Promise<{
    documents: Array<{
      id: string;
      text: string;
      metadata: DocumentMetadata;
      ingestedAt?: string;
    }>;
    nextOffset: string | null;
    total: number;
  }> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset);
    if (options.source) params.append('source', options.source);
    if (options.documentType) params.append('document_type', options.documentType);

    const response = await fetchApi<any>(`${MCP_RESEARCH_BASE}/admin/documents?${params.toString()}`);
    return {
      documents: response.documents.map((doc: any) => ({
        id: doc.id,
        text: doc.text,
        metadata: doc.metadata,
        ingestedAt: doc.ingested_at,
      })),
      nextOffset: response.nextOffset,
      total: response.total,
    };
  },

  async getDocument(id: string): Promise<{
    id: string;
    text: string;
    metadata: DocumentMetadata;
    ingestedAt?: string;
  } | null> {
    try {
      const response = await fetchApi<any>(`${MCP_RESEARCH_BASE}/admin/documents/${id}`);
      return {
        id: response.id,
        text: response.text,
        metadata: response.metadata,
        ingestedAt: response.ingested_at,
      };
    } catch {
      return null;
    }
  },

  async deleteDocument(id: string): Promise<boolean> {
    try {
      await fetchApi<any>(`${MCP_RESEARCH_BASE}/admin/documents/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch {
      return false;
    }
  },

  async deleteDocumentsBySource(source: string): Promise<{ deletedCount: number }> {
    const response = await fetchApi<any>(`${MCP_RESEARCH_BASE}/admin/documents/by-source/${encodeURIComponent(source)}`, {
      method: 'DELETE',
    });
    return { deletedCount: response.deleted_count };
  },

  async getSourceStats(): Promise<Array<{ source: string; count: number }>> {
    const response = await fetchApi<any>(`${MCP_RESEARCH_BASE}/admin/source-stats`);
    return response.sources;
  },
};

// MCP Standards API
export const standardsApi = {
  // List all syllabuses
  async listSyllabuses(): Promise<Array<{
    id: string;
    name: string;
    version: string;
    certificationBody: string;
    domainCount: number;
    lastUpdated: string;
    createdAt: string;
  }>> {
    try {
      const response = await fetchApi<any>(`${MCP_STANDARDS_BASE}/syllabuses`);
      return response.syllabuses || [];
    } catch {
      return [];
    }
  },

  // Create a new syllabus
  async createSyllabus(name: string, certificationBody: string): Promise<Syllabus | null> {
    try {
      const response = await fetchApi<Syllabus>(`${MCP_STANDARDS_BASE}/syllabuses`, {
        method: 'POST',
        body: JSON.stringify({ name, certificationBody }),
      });
      return response;
    } catch {
      return null;
    }
  },

  // Duplicate a syllabus
  async duplicateSyllabus(sourceId: string, newName: string): Promise<Syllabus | null> {
    try {
      const response = await fetchApi<Syllabus>(`${MCP_STANDARDS_BASE}/syllabuses/${sourceId}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ name: newName }),
      });
      return response;
    } catch {
      return null;
    }
  },

  // Get a specific syllabus
  async getSyllabusById(id: string): Promise<Syllabus | null> {
    try {
      const response = await fetchApi<Syllabus>(`${MCP_STANDARDS_BASE}/syllabuses/${id}`);
      return response;
    } catch {
      return null;
    }
  },

  // Update a syllabus
  async updateSyllabus(id: string, syllabus: Syllabus): Promise<boolean> {
    try {
      await fetchApi(`${MCP_STANDARDS_BASE}/syllabuses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(syllabus),
      });
      return true;
    } catch {
      return false;
    }
  },

  // Delete a syllabus
  async deleteSyllabus(id: string): Promise<boolean> {
    try {
      await fetchApi(`${MCP_STANDARDS_BASE}/syllabuses/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch {
      return false;
    }
  },

  // Legacy: Get current in-memory syllabus
  async getSyllabus(): Promise<Syllabus | null> {
    try {
      const response = await fetchApi<any>(`${MCP_STANDARDS_BASE}/syllabus`);
      return response;
    } catch {
      return null;
    }
  },

  // Activate a syllabus for MCP tools
  async activateSyllabus(id: string): Promise<boolean> {
    try {
      await fetchApi(`${MCP_STANDARDS_BASE}/syllabuses/${id}/activate`, {
        method: 'POST',
      });
      return true;
    } catch {
      return false;
    }
  },

  async validateContent(content: string): Promise<any> {
    const response = await fetchApi<any>(`${MCP_STANDARDS_BASE}/call`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'validate_iso_compliance',
        arguments: { content, output_format: 'json' },
      }),
    });
    return JSON.parse(response.content[0].text);
  },
};

// Map n8n execution to our type
function mapN8nExecution(data: any): WorkflowExecution {
  const nodes: WorkflowExecution['nodes'] = [];

  if (data.data?.resultData?.runData) {
    for (const [nodeName, nodeData] of Object.entries(data.data.resultData.runData)) {
      const nodeInfo = (nodeData as any[])[0];
      nodes.push({
        id: nodeName,
        name: nodeName,
        type: nodeInfo?.source?.[0]?.type || 'unknown',
        status: nodeInfo?.error ? 'error' : 'completed',
        startedAt: nodeInfo?.startTime,
        completedAt: nodeInfo?.endTime,
        error: nodeInfo?.error?.message,
      });
    }
  }

  return {
    id: data.id,
    workflowId: data.workflowId,
    workflowName: data.workflowData?.name || 'Unknown Workflow',
    status: data.finished ? (data.stoppedAt ? 'success' : 'error') : 'running',
    startedAt: data.startedAt,
    finishedAt: data.stoppedAt,
    nodes,
    currentNode: nodes.find((n) => n.status === 'running')?.id,
  };
}
