import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Timer,
} from 'lucide-react';
import { adminApi } from '../api';
import { Job, WorkflowLog } from '../types';

function StatusBadge({ status }: { status: Job['status'] }) {
  const styles: Record<Job['status'], string> = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 animate-pulse',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  };

  const icons: Record<Job['status'], React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    running: <Activity className="w-3 h-3" />,
    completed: <CheckCircle className="w-3 h-3" />,
    failed: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function LogStatusBadge({ status }: { status: WorkflowLog['status'] }) {
  const styles: Record<WorkflowLog['status'], string> = {
    started: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-500 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
        {completed}/{total}
      </span>
    </div>
  );
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '-';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = end - start;

  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.round((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatDurationMs(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const handleExpand = async () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (newExpanded && logs.length === 0) {
      setLogsLoading(true);
      const data = await adminApi.getJobLogs(job.id);
      setLogs(data);
      setLogsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={handleExpand}
        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Job ID */}
          <div className="min-w-0 w-28 flex-shrink-0">
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
              {job.id.substring(0, 8)}...
            </p>
          </div>

          {/* Syllabus name */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {job.syllabus_name}
            </h3>
            {job.target_audience && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {job.target_audience}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="flex-shrink-0">
            <StatusBadge status={job.status} />
          </div>

          {/* Progress */}
          <div className="w-36 flex-shrink-0">
            <ProgressBar completed={job.completed_chapters} total={job.total_chapters} />
          </div>

          {/* Current workflow */}
          <div className="w-32 flex-shrink-0">
            {job.current_workflow ? (
              <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                {job.current_workflow}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">-</p>
            )}
          </div>

          {/* Duration */}
          <div className="w-20 flex-shrink-0 text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDuration(job.started_at, job.completed_at)}
            </p>
          </div>

          {/* Expand icon */}
          <div className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded: Workflow logs */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Workflow Logs
          </h4>

          {logsLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            </div>
          )}

          {!logsLoading && logs.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No workflow logs found for this job
            </p>
          )}

          {!logsLoading && logs.length > 0 && (
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-4 top-2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                        log.status === 'completed'
                          ? 'bg-green-500'
                          : log.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                      }`}
                    />

                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.workflow_name}
                          </span>
                          <LogStatusBadge status={log.status} />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDurationMs(log.duration_ms)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {log.chapter_id && (
                          <span>Chapter: {log.chapter_id}</span>
                        )}
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                          {log.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsRefreshing(true);
    const data = await adminApi.getJobs();
    setJobs(data);
    setIsRefreshing(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();

    // Auto-refresh every 5 seconds if there are running jobs
    intervalRef.current = setInterval(() => {
      // Check if there are running jobs that need updates
      setJobs((currentJobs) => {
        const hasRunning = currentJobs.some((j) => j.status === 'running');
        if (hasRunning) {
          fetchJobs();
        }
        return currentJobs;
      });
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchJobs]);

  const runningCount = jobs.filter((j) => j.status === 'running').length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Activity className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Job Monitor
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track content generation jobs and their workflow execution
          </p>
        </div>
        <button
          onClick={fetchJobs}
          disabled={isRefreshing}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobs.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{failedCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No jobs yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Jobs will appear here when content generation workflows are triggered.
          </p>
        </div>
      )}

      {/* Table header */}
      {!loading && jobs.length > 0 && (
        <div>
          <div className="px-4 py-2 flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="w-28 flex-shrink-0">Job ID</div>
            <div className="flex-1">Syllabus</div>
            <div className="w-24 flex-shrink-0">Status</div>
            <div className="w-36 flex-shrink-0">Progress</div>
            <div className="w-32 flex-shrink-0">Current Step</div>
            <div className="w-20 flex-shrink-0 text-right">Duration</div>
            <div className="w-4 flex-shrink-0" />
          </div>

          <div className="space-y-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
