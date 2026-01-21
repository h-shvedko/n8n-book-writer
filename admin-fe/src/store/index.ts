import { create } from 'zustand';
import { WorkflowExecution, Syllabus, ServiceStatus, IngestionFile } from '../types';

interface AppState {
  // Workflow state
  executions: WorkflowExecution[];
  currentExecution: WorkflowExecution | null;
  setExecutions: (executions: WorkflowExecution[]) => void;
  setCurrentExecution: (execution: WorkflowExecution | null) => void;
  updateNodeStatus: (executionId: string, nodeId: string, status: WorkflowExecution['nodes'][0]['status']) => void;

  // Syllabus state
  syllabus: Syllabus | null;
  setSyllabus: (syllabus: Syllabus | null) => void;
  updateSyllabus: (syllabus: Syllabus) => void;

  // Ingestion state
  ingestionFiles: IngestionFile[];
  addIngestionFile: (file: IngestionFile) => void;
  updateIngestionFile: (id: string, updates: Partial<IngestionFile>) => void;
  removeIngestionFile: (id: string) => void;
  clearIngestionFiles: () => void;

  // Service status
  serviceStatus: ServiceStatus | null;
  setServiceStatus: (status: ServiceStatus | null) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Workflow state
  executions: [],
  currentExecution: null,
  setExecutions: (executions) => set({ executions }),
  setCurrentExecution: (execution) => set({ currentExecution: execution }),
  updateNodeStatus: (executionId, nodeId, status) =>
    set((state) => ({
      executions: state.executions.map((exec) =>
        exec.id === executionId
          ? {
              ...exec,
              nodes: exec.nodes.map((node) =>
                node.id === nodeId ? { ...node, status } : node
              ),
            }
          : exec
      ),
      currentExecution:
        state.currentExecution?.id === executionId
          ? {
              ...state.currentExecution,
              nodes: state.currentExecution.nodes.map((node) =>
                node.id === nodeId ? { ...node, status } : node
              ),
            }
          : state.currentExecution,
    })),

  // Syllabus state
  syllabus: null,
  setSyllabus: (syllabus) => set({ syllabus }),
  updateSyllabus: (syllabus) => set({ syllabus }),

  // Ingestion state
  ingestionFiles: [],
  addIngestionFile: (file) =>
    set((state) => ({ ingestionFiles: [...state.ingestionFiles, file] })),
  updateIngestionFile: (id, updates) =>
    set((state) => ({
      ingestionFiles: state.ingestionFiles.map((file) =>
        file.id === id ? { ...file, ...updates } : file
      ),
    })),
  removeIngestionFile: (id) =>
    set((state) => ({
      ingestionFiles: state.ingestionFiles.filter((file) => file.id !== id),
    })),
  clearIngestionFiles: () => set({ ingestionFiles: [] }),

  // Service status
  serviceStatus: null,
  setServiceStatus: (status) => set({ serviceStatus: status }),

  // UI state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));
