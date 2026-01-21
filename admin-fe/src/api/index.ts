import { Syllabus, WorkflowExecution, ServiceStatus, DocumentMetadata } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const N8N_API_BASE = import.meta.env.VITE_N8N_API_BASE || '/api/n8n';
const MCP_RESEARCH_BASE = import.meta.env.VITE_MCP_RESEARCH_BASE || '/api/mcp-research';
const MCP_STANDARDS_BASE = import.meta.env.VITE_MCP_STANDARDS_BASE || '/api/mcp-standards';

// Helper function for API calls
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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

  async search(query: string, limit = 10): Promise<any[]> {
    const response = await fetchApi<any>(`${MCP_RESEARCH_BASE}/search`, {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
    return response.results || [];
  },
};

// MCP Standards API
export const standardsApi = {
  async getSyllabus(): Promise<Syllabus | null> {
    try {
      const response = await fetchApi<any>(`${MCP_STANDARDS_BASE}/syllabus`);
      return response;
    } catch {
      return null;
    }
  },

  async updateSyllabus(syllabus: Syllabus): Promise<boolean> {
    try {
      await fetchApi(`${MCP_STANDARDS_BASE}/syllabus`, {
        method: 'POST',
        body: JSON.stringify(syllabus),
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
