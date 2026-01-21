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
} from 'lucide-react';
import { useAppStore } from '../store';
import { standardsApi } from '../api';
import { Syllabus, Domain, Topic, LearningObjective } from '../types';

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
        className="flex items-center gap-2 py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg group"
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        <span className="flex-1 text-gray-900 dark:text-white font-medium">{label}</span>

        <div className="hidden group-hover:flex items-center gap-1">
          {actions}
          {onAdd && (
            <button
              onClick={onAdd}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-green-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600"
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);

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

  return (
    <div>
      <TreeNode
        label={`${topic.id}: ${topic.title}`}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        onDelete={onDelete}
        level={level}
        actions={
          <button
            onClick={() => setShowObjectives(!showObjectives)}
            className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded"
          >
            {topic.learningObjectives.length} LO
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
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-600"
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

export function SyllabusEditor() {
  const { syllabus, setSyllabus, updateSyllabus } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load syllabus on mount
  const loadSyllabus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await standardsApi.getSyllabus();
      if (data) {
        setSyllabus(data);
        setMessage({ type: 'success', text: 'Syllabus loaded successfully' });
      } else {
        // Load default syllabus
        const response = await fetch('/default-syllabus.json');
        if (response.ok) {
          const defaultSyllabus = await response.json();
          setSyllabus(defaultSyllabus);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load syllabus' });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  }, [setSyllabus]);

  useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]);

  // Save syllabus
  const saveSyllabus = async () => {
    if (!syllabus) return;

    setIsSaving(true);
    try {
      const success = await standardsApi.updateSyllabus(syllabus);
      if (success) {
        setMessage({ type: 'success', text: 'Syllabus saved successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save syllabus' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save syllabus' });
    }
    setIsSaving(false);
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
            Edit certification syllabus structure and learning objectives
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSyllabus}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <label className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".json" onChange={importSyllabus} className="hidden" />
          </label>
          <button
            onClick={exportSyllabus}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
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
                  value={syllabus.lastUpdated}
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
    </div>
  );
}
