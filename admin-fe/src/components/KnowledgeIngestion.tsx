import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Database,
} from 'lucide-react';
import { useAppStore } from '../store';
import { researchApi } from '../api';
import { IngestionFile, DocumentMetadata } from '../types';

// Generate unique ID
function generateId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Read file as text
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
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

  // Check service status on mount
  const checkStatus = useCallback(async () => {
    const status = await researchApi.getStatus();
    setServiceStatus(status);
  }, [setServiceStatus]);

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const ingestionFile: IngestionFile = {
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          progress: 0,
          metadata: {
            source: file.name,
            documentType: file.type.includes('pdf')
              ? 'pdf'
              : file.type.includes('word')
              ? 'docx'
              : 'text',
          },
        };
        addIngestionFile(ingestionFile);
      }
    },
    [addIngestionFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
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
        updateIngestionFile(file.id, { status: 'processing', progress: 10 });

        // Get file from name (in a real app, we'd store the File object)
        // For demo, we'll simulate with a placeholder
        const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
        const actualFile = Array.from(fileInput?.files || []).find((f) => f.name === file.name);

        if (!actualFile) {
          throw new Error('File not found');
        }

        updateIngestionFile(file.id, { progress: 30 });

        // Read file content
        const text = await readFileAsText(actualFile);
        updateIngestionFile(file.id, { progress: 50 });

        // Ingest via API
        const result = await researchApi.ingestDocument(text, file.metadata || {});
        updateIngestionFile(file.id, {
          status: 'completed',
          progress: 100,
          metadata: {
            ...file.metadata,
            source: result.documentId,
          },
        });
      } catch (error) {
        updateIngestionFile(file.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setIsProcessing(false);
    await checkStatus();
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

      {/* Service Status */}
      {serviceStatus && (
        <div
          className={`p-4 rounded-lg ${
            serviceStatus.status === 'healthy'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : serviceStatus.status === 'degraded'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database
                className={`w-5 h-5 ${
                  serviceStatus.status === 'healthy'
                    ? 'text-green-500'
                    : serviceStatus.status === 'degraded'
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Vector Database: {serviceStatus.status.toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {serviceStatus.documentCount} documents indexed
                </p>
              </div>
            </div>
            {serviceStatus.error && (
              <p className="text-sm text-red-600 dark:text-red-400">{serviceStatus.error}</p>
            )}
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
          or click to browse (PDF, DOCX, TXT, MD)
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
                onRemove={() => removeIngestionFile(file.id)}
                onUpdateMetadata={(metadata) =>
                  updateIngestionFile(file.id, { metadata })
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
