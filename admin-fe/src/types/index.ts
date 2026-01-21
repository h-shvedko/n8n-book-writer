// Workflow types
export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  startedAt: string;
  finishedAt?: string;
  nodes: WorkflowNode[];
  currentNode?: string;
  data?: Record<string, unknown>;
}

// Syllabus types
export interface LearningObjective {
  id: string;
  description: string;
  bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  keywords?: string[];
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  learningObjectives: LearningObjective[];
  subtopics?: Topic[];
  estimatedHours?: number;
  resources?: string[];
}

export interface Domain {
  id: string;
  name: string;
  description: string;
  weight: number;
  topics: Topic[];
  prerequisites?: string[];
}

export interface Syllabus {
  id: string;
  name: string;
  version: string;
  certificationBody: string;
  isoStandard: string;
  lastUpdated: string;
  domains: Domain[];
  metadata?: Record<string, unknown>;
}

// Ingestion types
export interface IngestionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  metadata?: DocumentMetadata;
}

export interface DocumentMetadata {
  source?: string;
  title?: string;
  author?: string;
  documentType?: string;
  domainId?: string;
  topicId?: string;
  tags?: string[];
  language?: string;
}

// Service status
export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unavailable';
  qdrantConnected: boolean;
  collectionExists: boolean;
  documentCount: number;
  lastCheck: string;
  error?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
