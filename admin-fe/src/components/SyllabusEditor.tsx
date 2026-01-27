import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Copy,
  List,
  X,
} from 'lucide-react';
import { useAppStore } from '../store';
import { standardsApi } from '../api';
import type { Domain, Topic, LearningObjective } from '../types';

// Bloom taxonomy levels
const BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'] as const;

interface TreeNodeProps {
  label: string;
  children?: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  onAdd?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
  level?: number;
}

function TreeNode({
  label,
  children,
  isExpanded,
  onToggle,
  onAdd,
  onDelete,
  actions,
  level = 0,
}: TreeNodeProps) {
  const hasChildren = Boolean(children);
  const indent = level * 16;

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg group cursor-pointer"
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={onToggle}
      >
        {hasChildren ? (
          <div className="p-1">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </div>
        ) : (
          <span className="w-6" />
        )}

        <span className="flex-1 text-gray-900 dark:text-white font-medium">{label}</span>

        <div className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {actions}
          {onAdd && (
            <button
              onClick={onAdd}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-green-600"
              title="Add subtopic"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && children && <div className="ml-2">{children}</div>}
    </div>
  );
}

interface LearningObjectiveEditorProps {
  objective: LearningObjective;
  onChange: (objective: LearningObjective) => void;
  onDelete: () => void;
}

function LearningObjectiveEditor({
  objective,
  onChange,
  onDelete,
}: LearningObjectiveEditorProps) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={objective.id}
          onChange={(e) => onChange({ ...objective, id: e.target.value })}
          className="px-2 py-1 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white w-32"
          placeholder="LO-ID"
        />
        <div className="flex items-center gap-2">
          <select
            value={objective.bloomLevel}
            onChange={(e) =>
              onChange({ ...objective, bloomLevel: e.target.value as typeof BLOOM_LEVELS[number] })
            }
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
          >
            {BLOOM_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={onDelete}
            className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <textarea
        value={objective.description}
        onChange={(e) => onChange({ ...objective, description: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white resize-none"
        rows={2}
        placeholder="Learning objective description"
      />
      <input
        type="text"
        value={objective.keywords?.join(', ') || ''}
        onChange={(e) =>
          onChange({
            ...objective,
            keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
          })
        }
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
        placeholder="Keywords (comma-separated)"
      />
    </div>
  );
}

interface TopicEditorProps {
  topic: Topic;
  onChange: (topic: Topic) => void;
  onDelete: () => void;
  level: number;
}

function TopicEditor({ topic, onChange, onDelete, level }: TopicEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Auto-expand for easier editing

  const addObjective = () => {
    const newObjective: LearningObjective = {
      id: `LO-${topic.id}-${topic.learningObjectives.length + 1}`,
      description: '',
      bloomLevel: 'understand',
    };
    onChange({
      ...topic,
      learningObjectives: [...topic.learningObjectives, newObjective],
    });
  };

  const updateObjective = (index: number, objective: LearningObjective) => {
    const objectives = [...topic.learningObjectives];
    objectives[index] = objective;
    onChange({ ...topic, learningObjectives: objectives });
  };

  const deleteObjective = (index: number) => {
    onChange({
      ...topic,
      learningObjectives: topic.learningObjectives.filter((_, i) => i !== index),
    });
  };

  // Subtopic management
  const addSubtopic = () => {
    const subtopics = topic.subtopics || [];
    const newSubtopic: Topic = {
      id: `${topic.id}.${subtopics.length + 1}`,
      title: 'New Subtopic',
      learningObjectives: [],
    };
    onChange({
      ...topic,
      subtopics: [...subtopics, newSubtopic] as Topic[],
    });
  };

  const updateSubtopic = (index: number, subtopic: Topic) => {
    const subtopics = [...(topic.subtopics || [])];
    subtopics[index] = subtopic;
    onChange({ ...topic, subtopics: subtopics as Topic[] });
  };

  const deleteSubtopic = (index: number) => {
    onChange({
      ...topic,
      subtopics: (topic.subtopics || []).filter((_, i) => i !== index) as Topic[],
    });
  };

  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

  return (
    <div>
      <TreeNode
        label={`${topic.id}: ${topic.title}`}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        onAdd={addSubtopic}
        onDelete={onDelete}
        level={level}
        actions={
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded"
          >
            {topic.learningObjectives.length} LO
            {hasSubtopics && ` • ${topic.subtopics!.length} ST`}
          </button>
        }
      >
        {isExpanded && (
          <div className="ml-4 space-y-2 py-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={topic.id}
                onChange={(e) => onChange({ ...topic, id: e.target.value })}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white w-24"
                placeholder="ID"
              />
              <input
                type="text"
                value={topic.title}
                onChange={(e) => onChange({ ...topic, title: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
                placeholder="Title"
              />
              <input
                type="number"
                value={topic.estimatedHours || ''}
                onChange={(e) =>
                  onChange({ ...topic, estimatedHours: parseInt(e.target.value) || undefined })
                }
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white w-20"
                placeholder="Hours"
              />
            </div>

            <textarea
              value={topic.description || ''}
              onChange={(e) => onChange({ ...topic, description: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white resize-none"
              rows={2}
              placeholder="Description"
            />

            {/* Learning Objectives */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Learning Objectives ({topic.learningObjectives.length})
                </span>
                <button
                  onClick={addObjective}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {topic.learningObjectives.map((objective, index) => (
                <LearningObjectiveEditor
                  key={objective.id}
                  objective={objective}
                  onChange={(obj) => updateObjective(index, obj)}
                  onDelete={() => deleteObjective(index)}
                />
              ))}
            </div>

            {/* Subtopics - Recursive */}
            {hasSubtopics && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subtopics ({topic.subtopics!.length})
                </h5>
                {topic.subtopics!.map((subtopic, index) => (
                  <TopicEditor
                    key={subtopic.id}
                    topic={subtopic}
                    onChange={(t) => updateSubtopic(index, t)}
                    onDelete={() => deleteSubtopic(index)}
                    level={level + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </TreeNode>
    </div>
  );
}

interface DomainEditorProps {
  domain: Domain;
  onChange: (domain: Domain) => void;
  onDelete: () => void;
}

function DomainEditor({ domain, onChange, onDelete }: DomainEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const addTopic = () => {
    const newTopic: Topic = {
      id: `${domain.id}.${domain.topics.length + 1}`,
      title: 'New Topic',
      learningObjectives: [],
    };
    onChange({
      ...domain,
      topics: [...domain.topics, newTopic],
    });
  };

  const updateTopic = (index: number, topic: Topic) => {
    const topics = [...domain.topics];
    topics[index] = topic;
    onChange({ ...domain, topics });
  };

  const deleteTopic = (index: number) => {
    onChange({
      ...domain,
      topics: domain.topics.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">{domain.id}</span>
            <span className="text-gray-700 dark:text-gray-300">{domain.name}</span>
            <span className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded">
              {domain.weight}%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{domain.description}</p>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={addTopic}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-green-600"
            title="Add topic"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-600"
            title="Delete domain"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
          {/* Domain fields */}
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              value={domain.id}
              onChange={(e) => onChange({ ...domain, id: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              placeholder="Domain ID"
            />
            <input
              type="text"
              value={domain.name}
              onChange={(e) => onChange({ ...domain, name: e.target.value })}
              className="col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              placeholder="Domain Name"
            />
            <input
              type="number"
              value={domain.weight}
              onChange={(e) => onChange({ ...domain, weight: parseInt(e.target.value) || 0 })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              placeholder="Weight %"
              min={0}
              max={100}
            />
          </div>

          <textarea
            value={domain.description}
            onChange={(e) => onChange({ ...domain, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white resize-none"
            rows={2}
            placeholder="Description"
          />

          {/* Topics */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Topics ({domain.topics.length})
            </h4>
            {domain.topics.map((topic, index) => (
              <TopicEditor
                key={topic.id}
                topic={topic}
                onChange={(t) => updateTopic(index, t)}
                onDelete={() => deleteTopic(index)}
                level={0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SyllabusListModalProps {
  syllabuses: Array<{
    id: string;
    name: string;
    version: string;
    certificationBody: string;
    domainCount: number;
    lastUpdated: string;
  }>;
  currentSyllabusId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function SyllabusListModal({
  syllabuses,
  currentSyllabusId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onClose,
}: SyllabusListModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Syllabuses</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {syllabuses.map((syllabus) => (
              <div
                key={syllabus.id}
                className={`p-4 border rounded-lg flex items-center justify-between ${
                  syllabus.id === currentSyllabusId
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{syllabus.name}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      v{syllabus.version}
                    </span>
                    {syllabus.id === currentSyllabusId && (
                      <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {syllabus.certificationBody} • {syllabus.domainCount} domains
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Updated: {new Date(syllabus.lastUpdated).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelect(syllabus.id)}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onDuplicate(syllabus.id)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(syllabus.id)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {syllabuses.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No syllabuses found. Create one to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCreate}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Syllabus
          </button>
        </div>
      </div>
    </div>
  );
}

export function SyllabusEditor() {
  const { syllabus, setSyllabus, updateSyllabus } = useAppStore();
  const [syllabuses, setSyllabuses] = useState<Array<{
    id: string;
    name: string;
    version: string;
    certificationBody: string;
    domainCount: number;
    lastUpdated: string;
    createdAt: string;
  }>>([]);
  const [showSyllabusList, setShowSyllabusList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load syllabuses list
  const loadSyllabusesList = useCallback(async () => {
    try {
      const list = await standardsApi.listSyllabuses();
      setSyllabuses(list);
    } catch (error) {
      console.error('Failed to load syllabuses list:', error);
    }
  }, []);

  // Load a specific syllabus
  const loadSyllabus = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const data = await standardsApi.getSyllabusById(id);
      if (data) {
        setSyllabus(data);
        setMessage({ type: 'success', text: 'Syllabus loaded successfully' });
      } else {
        setMessage({ type: 'error', text: 'Syllabus not found' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load syllabus' });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  }, [setSyllabus]);

  // Load on mount
  useEffect(() => {
    loadSyllabusesList();
    // Try to load the default syllabus
    standardsApi.getSyllabus().then((data) => {
      if (data) {
        setSyllabus(data);
      }
    });
  }, [loadSyllabusesList, setSyllabus]);

  // Save syllabus
  const saveSyllabus = async () => {
    if (!syllabus) return;

    setIsSaving(true);
    try {
      const success = await standardsApi.updateSyllabus(syllabus.id, syllabus);
      if (success) {
        setMessage({ type: 'success', text: 'Syllabus saved successfully' });
        await loadSyllabusesList();
      } else {
        setMessage({ type: 'error', text: 'Failed to save syllabus' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save syllabus' });
    }
    setIsSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // Create new syllabus
  const createSyllabus = async () => {
    const name = prompt('Enter syllabus name:');
    if (!name) return;

    const certificationBody = prompt('Enter certification body:', 'WPI');
    if (!certificationBody) return;

    try {
      const newSyllabus = await standardsApi.createSyllabus(name, certificationBody);
      if (newSyllabus) {
        setSyllabus(newSyllabus);
        await loadSyllabusesList();
        setShowSyllabusList(false);
        setMessage({ type: 'success', text: 'Syllabus created successfully' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to create syllabus' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // Duplicate syllabus
  const duplicateSyllabus = async (sourceId: string) => {
    const name = prompt('Enter name for the duplicate:');
    if (!name) return;

    try {
      const duplicate = await standardsApi.duplicateSyllabus(sourceId, name);
      if (duplicate) {
        setSyllabus(duplicate);
        await loadSyllabusesList();
        setShowSyllabusList(false);
        setMessage({ type: 'success', text: 'Syllabus duplicated successfully' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to duplicate syllabus' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // Delete syllabus
  const deleteSyllabus = async (id: string) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;

    try {
      const success = await standardsApi.deleteSyllabus(id);
      if (success) {
        await loadSyllabusesList();
        if (syllabus?.id === id) {
          setSyllabus(null);
        }
        setMessage({ type: 'success', text: 'Syllabus deleted successfully' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete syllabus' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // Export syllabus
  const exportSyllabus = () => {
    if (!syllabus) return;

    const blob = new Blob([JSON.stringify(syllabus, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${syllabus.id}-${syllabus.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import syllabus
  const importSyllabus = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setSyllabus(data);
        setMessage({ type: 'success', text: 'Syllabus imported successfully' });
      } catch {
        setMessage({ type: 'error', text: 'Invalid syllabus file' });
      }
      setTimeout(() => setMessage(null), 3000);
    };
    reader.readAsText(file);
  };

  // Update domain
  const updateDomain = (index: number, domain: Domain) => {
    if (!syllabus) return;
    const domains = [...syllabus.domains];
    domains[index] = domain;
    updateSyllabus({ ...syllabus, domains, lastUpdated: new Date().toISOString() });
  };

  // Delete domain
  const deleteDomain = (index: number) => {
    if (!syllabus) return;
    updateSyllabus({
      ...syllabus,
      domains: syllabus.domains.filter((_, i) => i !== index),
      lastUpdated: new Date().toISOString(),
    });
  };

  // Add domain
  const addDomain = () => {
    if (!syllabus) return;
    const newDomain: Domain = {
      id: `D${syllabus.domains.length + 1}`,
      name: 'New Domain',
      description: '',
      weight: 0,
      topics: [],
    };
    updateSyllabus({
      ...syllabus,
      domains: [...syllabus.domains, newDomain],
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Syllabus Editor</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {syllabus
              ? `Editing: ${syllabus.name} (v${syllabus.version})`
              : 'Select or create a syllabus to begin'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSyllabusList(true)}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            Manage ({syllabuses.length})
          </button>
          <label className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".json" onChange={importSyllabus} className="hidden" />
          </label>
          <button
            onClick={exportSyllabus}
            disabled={!syllabus}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={saveSyllabus}
            disabled={isSaving || !syllabus}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )}

      {/* Syllabus Editor */}
      {syllabus && !isLoading && (
        <div className="space-y-6">
          {/* Syllabus Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Syllabus Information
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={syllabus.name}
                  onChange={(e) => updateSyllabus({ ...syllabus, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={syllabus.version}
                  onChange={(e) => updateSyllabus({ ...syllabus, version: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ISO Standard
                </label>
                <input
                  type="text"
                  value={syllabus.isoStandard}
                  onChange={(e) => updateSyllabus({ ...syllabus, isoStandard: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Certification Body
                </label>
                <input
                  type="text"
                  value={syllabus.certificationBody}
                  onChange={(e) =>
                    updateSyllabus({ ...syllabus, certificationBody: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Updated
                </label>
                <input
                  type="text"
                  value={new Date(syllabus.lastUpdated).toLocaleString()}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Domains */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Domains ({syllabus.domains.length})
              </h2>
              <button
                onClick={addDomain}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Domain
              </button>
            </div>

            <div className="space-y-3">
              {syllabus.domains.map((domain, index) => (
                <DomainEditor
                  key={domain.id}
                  domain={domain}
                  onChange={(d) => updateDomain(index, d)}
                  onDelete={() => deleteDomain(index)}
                />
              ))}
            </div>

            {syllabus.domains.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No domains defined. Click "Add Domain" to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Syllabus Selected */}
      {!syllabus && !isLoading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-4">No syllabus selected</p>
          <button
            onClick={() => setShowSyllabusList(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Manage Syllabuses
          </button>
        </div>
      )}

      {/* Syllabus List Modal */}
      {showSyllabusList && (
        <SyllabusListModal
          syllabuses={syllabuses}
          currentSyllabusId={syllabus?.id || null}
          onSelect={(id) => {
            loadSyllabus(id);
            setShowSyllabusList(false);
          }}
          onCreate={createSyllabus}
          onDuplicate={duplicateSyllabus}
          onDelete={deleteSyllabus}
          onClose={() => setShowSyllabusList(false)}
        />
      )}
    </div>
  );
}
