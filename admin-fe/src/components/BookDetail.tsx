import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Layers,
  Star,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { adminApi } from '../api';
import { Book, Chapter } from '../types';

function StatusBadge({ status }: { status: Chapter['status'] }) {
  const styles = {
    draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;

  let color = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  if (score >= 8) color = 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
  else if (score >= 6) color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
  else color = 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      <Star className="w-3 h-3" />
      {score}/10
    </span>
  );
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const [expanded, setExpanded] = useState(false);

  const contentPreview = chapter.json_content
    ? typeof chapter.json_content === 'string'
      ? chapter.json_content.substring(0, 200)
      : JSON.stringify(chapter.json_content).substring(0, 200)
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                {chapter.chapter_index + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {chapter.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {chapter.chapter_id}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ScoreBadge score={chapter.editor_score} />
              <StatusBadge status={chapter.status} />
            </div>
          </div>
          <div className="ml-3 flex-shrink-0">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Content preview */}
          {contentPreview && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content Preview
              </h4>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                  {contentPreview}
                  {contentPreview.length >= 200 && '...'}
                </p>
              </div>
            </div>
          )}

          {/* Chapter summary */}
          {chapter.chapter_summary && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Summary
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {chapter.chapter_summary}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Created: {new Date(chapter.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(chapter.updated_at).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<(Book & { chapters: Chapter[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExamQuestions, setShowExamQuestions] = useState(false);

  useEffect(() => {
    async function fetchBook() {
      if (!id) return;
      setLoading(true);
      const data = await adminApi.getBook(Number(id));
      setBook(data);
      setLoading(false);
    }
    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="space-y-6">
        <Link
          to="/books"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Books
        </Link>
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Book not found
          </h2>
        </div>
      </div>
    );
  }

  const examQuestions = book.exam_questions
    ? Array.isArray(book.exam_questions)
      ? book.exam_questions
      : typeof book.exam_questions === 'object' && book.exam_questions !== null
        ? Object.values(book.exam_questions)
        : []
    : [];

  const chapters = book.chapters || [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/books"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Books
      </Link>

      {/* Book header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {book.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created: {new Date(book.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>
                  {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
                </span>
              </div>
              {book.job_id && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    Job: {book.job_id.substring(0, 8)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Chapters ({chapters.length})
        </h2>
        {chapters.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">No chapters found for this book</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chapters
              .sort((a, b) => a.chapter_index - b.chapter_index)
              .map((chapter) => (
                <ChapterCard key={chapter.id} chapter={chapter} />
              ))}
          </div>
        )}
      </div>

      {/* Exam questions */}
      {examQuestions.length > 0 && (
        <div>
          <button
            onClick={() => setShowExamQuestions(!showExamQuestions)}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            Exam Questions ({examQuestions.length})
            {showExamQuestions ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {showExamQuestions && (
            <div className="space-y-3">
              {examQuestions.map((question: any, index: number) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-600 dark:text-primary-400">
                      {index + 1}
                    </span>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {typeof question === 'string' ? question : JSON.stringify(question, null, 2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global history */}
      {book.global_history && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Global History
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {book.global_history}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
