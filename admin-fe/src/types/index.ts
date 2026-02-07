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

// Ingested file record from database
export interface IngestedFileRecord {
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

// Vector DB document
export interface VectorDocument {
  id: string;
  text: string;
  metadata: DocumentMetadata;
  ingestedAt?: string;
}

// Source statistics
export interface SourceStats {
  source: string;
  count: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Job tracking types
export interface Job {
  id: string;
  syllabus_name: string;
  strategy: string;
  target_audience: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_chapters: number;
  completed_chapters: number;
  current_workflow: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Book types
export interface Book {
  id: number;
  job_id: string;
  title: string;
  json_content: any;
  exam_questions: any;
  global_history: string | null;
  created_at: string;
  chapter_count?: number;
}

// Chapter types
export interface Chapter {
  id: number;
  book_id: number | null;
  job_id: string;
  chapter_id: string;
  title: string;
  chapter_index: number;
  json_content: any;
  exam_questions: any;
  chapter_summary: string | null;
  editor_score: number | null;
  status: 'draft' | 'approved';
  created_at: string;
  updated_at: string;
}

// Workflow log types
export interface WorkflowLog {
  id: number;
  job_id: string;
  workflow_name: string;
  chapter_id: string | null;
  status: 'started' | 'completed' | 'failed';
  input_summary: string | null;
  output_summary: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}
