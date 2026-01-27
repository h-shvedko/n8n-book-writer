import { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Database,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '../store';
import { researchApi } from '../api';
import { IngestionFile, DocumentMetadata, IngestedFileRecord } from '../types';

// Generate unique ID
function generateId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface MetadataFormProps {
  metadata: DocumentMetadata;
  onChange: (metadata: DocumentMetadata) => void;
}

function MetadataForm({ metadata, onChange }: MetadataFormProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title
        </label>
        <input
          type="text"
          value={metadata.title || ''}
          onChange={(e) => onChange({ ...metadata, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="Document title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Author
        </label>
        <input
          type="text"
          value={metadata.author || ''}
          onChange={(e) => onChange({ ...metadata, author: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="Author name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Domain ID
        </label>
        <input
          type="text"
          value={metadata.domainId || ''}
          onChange={(e) => onChange({ ...metadata, domainId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="e.g., D1, D2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Topic ID
        </label>
        <input
          type="text"
          value={metadata.topicId || ''}
          onChange={(e) => onChange({ ...metadata, topicId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="e.g., D1.1, D2.3"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={metadata.tags?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              ...metadata,
              tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
            })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="tag1, tag2, tag3"
        />
      </div>
    </div>
  );
}

interface FileItemProps {
  file: IngestionFile;
  onRemove: () => void;
  onUpdateMetadata: (metadata: DocumentMetadata) => void;
}

function FileItem({ file, onRemove, onUpdateMetadata }: FileItemProps) {
  const [showMetadata, setShowMetadata] = useState(false);

  const statusIcon = {
    pending: <FileText className="w-5 h-5 text-gray-400" />,
    processing: <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />,
    completed: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
  };

  const statusText = {
    pending: 'Pending',
    processing: `Processing (${file.progress}%)`,
    completed: 'Completed',
    error: file.error || 'Error',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {statusIcon[file.status]}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(file.size / 1024).toFixed(1)} KB - {statusText[file.status]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            {showMetadata ? 'Hide' : 'Metadata'}
          </button>
          <button
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {file.status === 'processing' && (
        <div className="mt-3">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        </div>
      )}

      {showMetadata && (
        <MetadataForm
          metadata={file.metadata || {}}
          onChange={onUpdateMetadata}
        />
      )}
    </div>
  );
}

interface IngestedFileHistoryItemProps {
  file: IngestedFileRecord;
  onDelete: (id: number) => void;
}

function IngestedFileHistoryItem({ file, onDelete }: IngestedFileHistoryItemProps) {
  const statusColors = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs" title={file.fileName}>
            {file.fileName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{file.title}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        {file.fileType.toUpperCase()}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        {formatFileSize(file.fileSize)}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className="text-green-600 dark:text-green-400">{file.chunksIngested}</span>
        {file.chunksErrored > 0 && (
          <span className="text-red-600 dark:text-red-400"> / {file.chunksErrored} errors</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[file.status]}`}>
          {file.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        {formatDate(file.createdAt)}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onDelete(file.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

export function KnowledgeIngestion() {
  const {
    ingestionFiles,
    addIngestionFile,
    updateIngestionFile,
    removeIngestionFile,
    serviceStatus,
    setServiceStatus,
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestedFiles, setIngestedFiles] = useState<IngestedFileRecord[]>([]);
  const [totalIngestedFiles, setTotalIngestedFiles] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [ingestionStats, setIngestionStats] = useState<{
    totalFiles: number;
    totalChunks: number;
    byCategory: { category: string; count: number }[];
    byStatus: { status: string; count: number }[];
  } | null>(null);

  // Store actual File objects in a ref (not in Zustand as File objects aren't serializable)
  const fileObjectsRef = useRef<Map<string, File>>(new Map());

  // Load ingested files history
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const [filesResponse, statsResponse] = await Promise.all([
        researchApi.getIngestedFiles({ limit: 20 }),
        researchApi.getIngestionStats(),
      ]);
      setIngestedFiles(filesResponse.files);
      setTotalIngestedFiles(filesResponse.total);
      setIngestionStats(statsResponse);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Check service status
  const checkStatus = useCallback(async () => {
    const status = await researchApi.getStatus();
    setServiceStatus(status);
  }, [setServiceStatus]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
    checkStatus();
  }, [loadHistory, checkStatus]);

  // Detect document type from file
  const getDocumentType = (file: File): string => {
    if (file.type.includes('html') || file.name.match(/\.(html|htm)$/i)) return 'html';
    if (file.type.includes('pdf') || file.name.endsWith('.pdf')) return 'pdf';
    if (file.type.includes('word') || file.name.endsWith('.docx')) return 'docx';
    if (file.name.endsWith('.md')) return 'markdown';
    return 'text';
  };

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const fileId = generateId();
        const ingestionFile: IngestionFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          progress: 0,
          metadata: {
            source: file.name,
            documentType: getDocumentType(file),
          },
        };
        // Store the actual File object in the ref
        fileObjectsRef.current.set(fileId, file);
        addIngestionFile(ingestionFile);
      }
    },
    [addIngestionFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.html', '.htm'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
  });

  // Process files
  const processFiles = async () => {
    setIsProcessing(true);

    for (const file of ingestionFiles.filter((f) => f.status === 'pending')) {
      try {
        updateIngestionFile(file.id, { status: 'processing', progress: 5 });

        // Get the actual File object from our ref
        const actualFile = fileObjectsRef.current.get(file.id);

        if (!actualFile) {
          throw new Error('File not found - please re-add the file');
        }

        // Use the new ingestFile API with progress tracking
        const result = await researchApi.ingestFile(
          actualFile,
          file.metadata || {},
          (progress) => {
            updateIngestionFile(file.id, { progress });
          }
        );

        updateIngestionFile(file.id, {
          status: 'completed',
          progress: 100,
          metadata: {
            ...file.metadata,
            source: result.fileName,
            title: result.title,
          },
        });

        // Clean up the File object from the ref after successful processing
        fileObjectsRef.current.delete(file.id);
      } catch (error) {
        updateIngestionFile(file.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setIsProcessing(false);
    await Promise.all([checkStatus(), loadHistory()]);
  };

  // Delete ingested file record
  const handleDeleteRecord = async (id: number) => {
    try {
      await researchApi.deleteIngestedFile(id);
      await loadHistory();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const pendingCount = ingestionFiles.filter((f) => f.status === 'pending').length;
  const completedCount = ingestionFiles.filter((f) => f.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Knowledge Ingestion
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Upload documents to add to the knowledge base
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={checkStatus}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Check Status
          </button>
          {pendingCount > 0 && (
            <button
              onClick={processFiles}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Process {pendingCount} File{pendingCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {ingestionStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Files</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{ingestionStats.totalFiles}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Chunks</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{ingestionStats.totalChunks}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Qdrant Documents</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{serviceStatus?.documentCount || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{ingestionStats.byCategory.length}</p>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload
          className={`w-12 h-12 mx-auto mb-4 ${
            isDragActive ? 'text-primary-500' : 'text-gray-400'
          }`}
        />
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          or click to browse (HTML, PDF, DOCX, TXT, MD)
        </p>
      </div>

      {/* File List */}
      {ingestionFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Files ({ingestionFiles.length})
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {completedCount} completed, {pendingCount} pending
            </p>
          </div>
          <div className="space-y-3">
            {ingestionFiles.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onRemove={() => {
                  fileObjectsRef.current.delete(file.id);
                  removeIngestionFile(file.id);
                }}
                onUpdateMetadata={(metadata) =>
                  updateIngestionFile(file.id, { metadata })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Ingestion History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setShowHistory(!showHistory)}
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ingestion History ({totalIngestedFiles})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                loadHistory();
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </button>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {showHistory && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by file name or title..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            {(() => {
              const filteredFiles = historySearch
                ? ingestedFiles.filter(f =>
                    f.fileName.toLowerCase().includes(historySearch.toLowerCase()) ||
                    f.title.toLowerCase().includes(historySearch.toLowerCase())
                  )
                : ingestedFiles;

              if (isLoadingHistory) {
                return (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                  </div>
                );
              }

              if (filteredFiles.length === 0) {
                return (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {historySearch ? `No files matching "${historySearch}"` : 'No files have been ingested yet'}
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Chunks
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredFiles.map((file) => (
                        <IngestedFileHistoryItem
                          key={file.id}
                          file={file}
                          onDelete={handleDeleteRecord}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
