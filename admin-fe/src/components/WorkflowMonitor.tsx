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

  // Use ref to track current execution ID to avoid re-creating fetchExecutions on selection change
  const currentExecutionIdRef = useRef<string | null>(null);

  // Keep ref in sync with current execution
  useEffect(() => {
    currentExecutionIdRef.current = currentExecution?.id ?? null;
  }, [currentExecution]);

  // Fetch executions - does not depend on currentExecution to prevent jumping
  const fetchExecutions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await n8nApi.getExecutions();
      setExecutions(data);

      // Update current execution if it exists (use ref to avoid dependency)
      const currentId = currentExecutionIdRef.current;
      if (currentId) {
        const updated = data.find((e) => e.id === currentId);
        if (updated) {
          setCurrentExecution(updated);
        }
      } else if (data.length > 0) {
        setCurrentExecution(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    }
    setIsRefreshing(false);
  }, [setExecutions, setCurrentExecution]);

  // Auto-refresh effect
  useEffect(() => {
    fetchExecutions();

    if (autoRefresh) {
      const interval = setInterval(fetchExecutions, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchExecutions]);

  const runningCount = executions.filter((e) => e.status === 'running').length;

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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{runningCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Running</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {executions.filter((e) => e.status === 'success').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {executions.filter((e) => e.status === 'error').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {executions.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Execution List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Executions
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {executions.map((execution) => (
              <ExecutionItem
                key={execution.id}
                execution={execution}
                isSelected={currentExecution?.id === execution.id}
                onClick={() => setCurrentExecution(execution)}
              />
            ))}
            {executions.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No executions found</p>
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
    </div>
  );
}
