import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  RefreshCw,
  User,
  FileText,
  Search,
  Pen,
  CheckSquare,
} from 'lucide-react';
import { useAppStore } from '../store';
import { n8nApi } from '../api';
import { WorkflowExecution, WorkflowNode } from '../types';

// Agent icons mapping
const AGENT_ICONS: Record<string, typeof User> = {
  Architect: FileText,
  Researcher: Search,
  Writer: Pen,
  Editor: CheckSquare,
};

interface NodeCardProps {
  node: WorkflowNode;
  isActive: boolean;
}

function NodeCard({ node, isActive }: NodeCardProps) {
  const Icon = AGENT_ICONS[node.name] || User;

  const statusStyles = {
    idle: 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600',
    running: 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400 ring-opacity-50',
    completed: 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  };

  const iconStyles = {
    idle: 'text-gray-400',
    running: 'text-blue-500 animate-pulse',
    completed: 'text-green-500',
    error: 'text-red-500',
  };

  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
        statusStyles[node.status]
      } ${isActive ? 'scale-105 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            node.status === 'running'
              ? 'bg-blue-100 dark:bg-blue-800'
              : node.status === 'completed'
              ? 'bg-green-100 dark:bg-green-800'
              : node.status === 'error'
              ? 'bg-red-100 dark:bg-red-800'
              : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <Icon className={`w-6 h-6 ${iconStyles[node.status]}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{node.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {node.status === 'running'
              ? 'Processing...'
              : node.status === 'completed'
              ? 'Done'
              : node.status === 'error'
              ? 'Failed'
              : 'Waiting'}
          </p>
        </div>
        <div>
          {node.status === 'running' && (
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
          )}
          {node.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {node.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
        </div>
      </div>

      {node.error && (
        <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{node.error}</p>
        </div>
      )}

      {/* Connection line */}
      {node.status !== 'error' && (
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />
      )}
    </div>
  );
}

interface ExecutionItemProps {
  execution: WorkflowExecution;
  isSelected: boolean;
  onClick: () => void;
}

function ExecutionItem({ execution, isSelected, onClick }: ExecutionItemProps) {
  const statusIcon = {
    running: <Activity className="w-4 h-4 text-blue-500 animate-pulse" />,
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
    waiting: <Clock className="w-4 h-4 text-yellow-500" />,
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left rounded-lg border transition-colors ${
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {statusIcon[execution.status]}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {execution.workflowName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: {execution.id.substring(0, 8)}...
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(execution.startedAt).toLocaleTimeString()}
          </p>
          {execution.currentNode && (
            <p className="text-xs text-blue-500">{execution.currentNode}</p>
          )}
        </div>
      </div>
    </button>
  );
}

export function WorkflowMonitor() {
  const { executions, setExecutions, currentExecution, setCurrentExecution } = useAppStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'success' | 'error'>('all');
  const [showWorkflowStarter, setShowWorkflowStarter] = useState(false);
  const [activeWorkflows, setActiveWorkflows] = useState<Array<{ id: string; name: string; active: boolean; webhookId?: string }>>([]);
  const [reactivatingWorkflow, setReactivatingWorkflow] = useState<string | null>(null);

  // Use ref to track current execution ID to avoid re-creating fetchExecutions on selection change
  const currentExecutionIdRef = useRef<string | null>(null);

  // Reactivate workflow to register webhooks
  const reactivateWorkflow = async (workflowId: string) => {
    setReactivatingWorkflow(workflowId);
    try {
      // Deactivate then activate to refresh webhooks
      await n8nApi.activateWorkflow(workflowId, false);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await n8nApi.activateWorkflow(workflowId, true);
      await fetchActiveWorkflows();
    } catch (error) {
      console.error('Failed to reactivate workflow:', error);
    }
    setReactivatingWorkflow(null);
  };

  // Keep ref in sync with current execution
  useEffect(() => {
    currentExecutionIdRef.current = currentExecution?.id ?? null;
  }, [currentExecution]);

  // Fetch executions - does not depend on currentExecution to prevent jumping
  const fetchExecutions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Fetch both executions and workflows in parallel
      const [executionsData, workflowsData] = await Promise.all([
        n8nApi.getExecutions(),
        n8nApi.getActiveWorkflows().catch(() => []), // Fallback to empty if fails
      ]);

      // Create workflow name map
      const workflowNames = new Map(
        workflowsData.map((w) => [w.id, w.name])
      );

      // Enrich executions with workflow names
      const enrichedData = executionsData.map((exec) => ({
        ...exec,
        workflowName: workflowNames.get(exec.workflowId) || exec.workflowName || `Workflow ${exec.workflowId}`,
      }));

      setExecutions(enrichedData);

      // Update current execution if it exists (use ref to avoid dependency)
      const currentId = currentExecutionIdRef.current;
      if (currentId) {
        const updated = enrichedData.find((e) => e.id === currentId);
        if (updated) {
          setCurrentExecution(updated);
        }
      } else if (enrichedData.length > 0) {
        setCurrentExecution(enrichedData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    }
    setIsRefreshing(false);
  }, [setExecutions, setCurrentExecution]);

  // Fetch active workflows for starter
  const fetchActiveWorkflows = useCallback(async () => {
    try {
      const workflows = await n8nApi.getActiveWorkflows();
      // Filter only workflows with form triggers (webhookId present)
      const withForms = workflows.filter((w) => w.webhookId);
      setActiveWorkflows(withForms);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    fetchExecutions();
    fetchActiveWorkflows();

    if (autoRefresh) {
      const interval = setInterval(fetchExecutions, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchExecutions, fetchActiveWorkflows]);

  const runningCount = executions.filter((e) => e.status === 'running').length;
  const successCount = executions.filter((e) => e.status === 'success').length;
  const errorCount = executions.filter((e) => e.status === 'error').length;

  // Filter executions based on status filter
  const filteredExecutions = statusFilter === 'all'
    ? executions
    : executions.filter((e) => e.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workflow Monitor
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track n8n workflow executions in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchExecutions}
            disabled={isRefreshing}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats - Clickable Filters */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('running')}
          className={`text-left bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all hover:shadow-md ${
            statusFilter === 'running'
              ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{runningCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Running</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('success')}
          className={`text-left bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all hover:shadow-md ${
            statusFilter === 'success'
              ? 'border-green-500 dark:border-green-400 ring-2 ring-green-200 dark:ring-green-800'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{successCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('error')}
          className={`text-left bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all hover:shadow-md ${
            statusFilter === 'error'
              ? 'border-red-500 dark:border-red-400 ring-2 ring-red-200 dark:ring-red-800'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{errorCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`text-left bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all hover:shadow-md ${
            statusFilter === 'all'
              ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-200 dark:ring-primary-800'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{executions.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            </div>
          </div>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Execution List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Executions
              {statusFilter !== 'all' && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({statusFilter})
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowWorkflowStarter(true)}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Workflow
            </button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredExecutions.map((execution) => (
              <ExecutionItem
                key={execution.id}
                execution={execution}
                isSelected={currentExecution?.id === execution.id}
                onClick={() => setCurrentExecution(execution)}
              />
            ))}
            {filteredExecutions.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No {statusFilter !== 'all' ? statusFilter : ''} executions found</p>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline View */}
        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Agent Pipeline
          </h2>

          {currentExecution ? (
            <div className="space-y-6">
              {/* Workflow Info */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {currentExecution.workflowName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Started: {new Date(currentExecution.startedAt).toLocaleString()}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentExecution.status === 'running'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : currentExecution.status === 'success'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  }`}
                >
                  {currentExecution.status.toUpperCase()}
                </div>
              </div>

              {/* Pipeline Visualization */}
              <div className="flex items-center gap-8 overflow-x-auto pb-4">
                {currentExecution.nodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    isActive={currentExecution.currentNode === node.id}
                  />
                ))}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentExecution.nodes.filter((n) => n.status === 'completed').length} /{' '}
                    {currentExecution.nodes.length} agents
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-500"
                    style={{
                      width: `${
                        (currentExecution.nodes.filter((n) => n.status === 'completed').length /
                          currentExecution.nodes.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select an execution to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Starter Modal */}
      {showWorkflowStarter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Start Workflow</h2>
              <button
                onClick={() => setShowWorkflowStarter(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeWorkflows.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No active workflows with form triggers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select a workflow to start. The form will open in n8n.
                  </p>
                  {activeWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {workflow.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {workflow.id}</p>
                          {workflow.webhookId && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                              Form: /form/{workflow.webhookId}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {workflow.webhookId ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <a
                              href={`http://localhost:5678/form/${workflow.webhookId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Open Form
                            </a>
                            <a
                              href={`http://localhost:5678/workflow/${workflow.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg transition-colors"
                            >
                              Edit Workflow
                            </a>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                              <strong>Form not loading?</strong> The workflow may need to be reactivated to register the webhook.
                            </p>
                            <button
                              onClick={() => reactivateWorkflow(workflow.id)}
                              disabled={reactivatingWorkflow === workflow.id}
                              className="w-full px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-xs rounded transition-colors flex items-center justify-center gap-2"
                            >
                              {reactivatingWorkflow === workflow.id ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Reactivating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3" />
                                  Reactivate Workflow
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                          This workflow doesn't have a form trigger configured.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowWorkflowStarter(false)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
