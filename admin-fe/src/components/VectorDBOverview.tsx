import { useCallback, useState, useEffect } from 'react';
import {
  Database,
  FileText,
  Trash2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Eye,
  X,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { researchApi } from '../api';
import { VectorDocument, SourceStats, ServiceStatus } from '../types';
import { KnowledgeIngestion } from './KnowledgeIngestion';

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

// Truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

interface DocumentDetailModalProps {
  document: VectorDocument;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function DocumentDetailModal({ document, onClose, onDelete }: DocumentDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setIsDeleting(true);
    try {
      await onDelete(document.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Document Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Metadata */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Metadata</h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{document.id}</p>
              </div>
              {document.metadata.source && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Source</p>
                  <p className="text-sm text-gray-900 dark:text-white">{document.metadata.source}</p>
                </div>
              )}
              {document.metadata.title && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Title</p>
                  <p className="text-sm text-gray-900 dark:text-white">{document.metadata.title}</p>
                </div>
              )}
              {document.metadata.documentType && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                  <p className="text-sm text-gray-900 dark:text-white">{document.metadata.documentType}</p>
                </div>
              )}
              {document.metadata.domainId && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Domain ID</p>
                  <p className="text-sm text-gray-900 dark:text-white">{document.metadata.domainId}</p>
                </div>
              )}
              {document.metadata.topicId && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Topic ID</p>
                  <p className="text-sm text-gray-900 dark:text-white">{document.metadata.topicId}</p>
                </div>
              )}
              {document.ingestedAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ingested At</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(document.ingestedAt)}</p>
                </div>
              )}
              {document.metadata.tags && document.metadata.tags.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {document.metadata.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Content</h4>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-sans">
                {document.text}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface SourceItemProps {
  source: SourceStats;
  onDeleteAll: (source: string) => void;
  isDeleting: boolean;
}

function SourceItem({ source, onDeleteAll, isDeleting }: SourceItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <FolderOpen className="w-4 h-4 text-gray-400" />
        <div>
          <p className="font-medium text-gray-900 dark:text-white truncate max-w-md" title={source.source}>
            {source.source}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{source.count} chunks</p>
        </div>
      </div>
      <button
        onClick={() => onDeleteAll(source.source)}
        disabled={isDeleting}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
        title="Delete all chunks from this source"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

type TabType = 'overview' | 'documents' | 'ingestion';

export function VectorDBOverview() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [documents, setDocuments] = useState<VectorDocument[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [nextOffset, setNextOffset] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VectorDocument | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [textSearch, setTextSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [deletingSource, setDeletingSource] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(true);

  // Load service status
  const loadStatus = useCallback(async () => {
    try {
      const status = await researchApi.getStatus();
      setServiceStatus(status);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  }, []);

  // Load source statistics
  const loadSourceStats = useCallback(async () => {
    try {
      const sources = await researchApi.getSourceStats();
      setSourceStats(sources);
    } catch (error) {
      console.error('Error loading source stats:', error);
    }
  }, []);

  // Load documents
  const loadDocuments = useCallback(async (reset: boolean = true) => {
    if (reset) {
      setIsLoading(true);
      setDocuments([]);
      setNextOffset(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await researchApi.browseDocuments({
        limit: 20,
        offset: reset ? null : nextOffset,
        source: sourceFilter || undefined,
      });

      if (reset) {
        setDocuments(result.documents);
      } else {
        setDocuments((prev) => [...prev, ...result.documents]);
      }
      setTotalDocuments(result.total);
      setNextOffset(result.nextOffset);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [nextOffset, sourceFilter]);

  // Initial load
  useEffect(() => {
    loadStatus();
    loadSourceStats();
  }, [loadStatus, loadSourceStats]);

  // Debounce text search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(textSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [textSearch]);

  // Load documents when tab changes or filter changes
  useEffect(() => {
    if (activeTab === 'documents') {
      loadDocuments(true);
    }
  }, [activeTab, sourceFilter, debouncedSearch]);

  // Delete single document
  const handleDeleteDocument = async (id: string) => {
    const success = await researchApi.deleteDocument(id);
    if (success) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setTotalDocuments((prev) => prev - 1);
      await loadStatus();
      await loadSourceStats();
    }
  };

  // Delete all documents by source
  const handleDeleteBySource = async (source: string) => {
    if (!confirm(`Are you sure you want to delete all ${sourceStats.find(s => s.source === source)?.count || 0} chunks from "${source}"?`)) {
      return;
    }

    setDeletingSource(source);
    try {
      await researchApi.deleteDocumentsBySource(source);
      await Promise.all([loadStatus(), loadSourceStats(), loadDocuments(true)]);
    } catch (error) {
      console.error('Error deleting by source:', error);
    } finally {
      setDeletingSource(null);
    }
  };

  // Refresh all data
  const handleRefresh = async () => {
    await Promise.all([loadStatus(), loadSourceStats()]);
    if (activeTab === 'documents') {
      await loadDocuments(true);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Database },
    { id: 'documents' as TabType, label: 'Documents', icon: FileText },
    { id: 'ingestion' as TabType, label: 'Ingestion', icon: Upload },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vector Database
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and browse the Qdrant vector database
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Banner */}
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
                  Qdrant: {serviceStatus.status.toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {serviceStatus.documentCount.toLocaleString()} documents indexed
                </p>
              </div>
            </div>
            {serviceStatus.error && (
              <p className="text-sm text-red-600 dark:text-red-400">{serviceStatus.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {serviceStatus?.documentCount.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Sources</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sourceStats.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Collection</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {serviceStatus?.collectionExists ? 'Active' : 'Not Created'}
              </p>
            </div>
          </div>

          {/* Sources Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => setShowSources(!showSources)}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sources ({sourceStats.length})
                </h2>
              </div>
              {showSources ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {showSources && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                {sourceStats.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No sources found
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sourceStats.map((source) => (
                      <SourceItem
                        key={source.source}
                        source={source}
                        onDeleteAll={handleDeleteBySource}
                        isDeleting={deletingSource === source.source}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Search/Filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={textSearch}
                onChange={(e) => setTextSearch(e.target.value)}
                placeholder="Search in content..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Sources</option>
              {sourceStats.map((source) => (
                <option key={source.source} value={source.source}>
                  {source.source} ({source.count})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {totalDocuments.toLocaleString()} documents
            </p>
          </div>

          {/* Documents Table */}
          {(() => {
            // Client-side filter for text search
            const filteredDocs = debouncedSearch
              ? documents.filter(doc =>
                  doc.text.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                  doc.metadata.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                  doc.metadata.source?.toLowerCase().includes(debouncedSearch.toLowerCase())
                )
              : documents;

            return (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {debouncedSearch ? `No documents matching "${debouncedSearch}"` : 'No documents found'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Content Preview
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Ingested
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-900 dark:text-white max-w-md truncate" title={doc.text}>
                                {truncateText(doc.text, 100)}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              <span className="truncate max-w-xs inline-block" title={doc.metadata.source}>
                                {doc.metadata.source || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {doc.metadata.documentType || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {doc.ingestedAt ? formatDate(doc.ingestedAt) : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedDocument(doc)}
                                  className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
                                  title="View details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this document?')) {
                                      handleDeleteDocument(doc.id);
                                    }
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Load More */}
                {nextOffset && !isLoading && !debouncedSearch && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button
                      onClick={() => loadDocuments(false)}
                      disabled={isLoadingMore}
                      className="px-4 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                      {isLoadingMore ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      Load More
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'ingestion' && <KnowledgeIngestion />}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDelete={handleDeleteDocument}
        />
      )}
    </div>
  );
}
