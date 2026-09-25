import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Eye,
  Save,
  RotateCcw,
  Check,
  FileText,
  Sparkles,
  Columns
} from 'lucide-react';
import { marked } from 'marked';

interface MarkdownEditorPanelProps {
  initialMarkdown?: string;
  onSaveDraft: (newMarkdown: string) => Promise<void>;
  isReadOnly?: boolean;
}

export const MarkdownEditorPanel: React.FC<MarkdownEditorPanelProps> = ({
  initialMarkdown = '',
  onSaveDraft,
  isReadOnly = false
}) => {
  const [content, setContent] = useState(initialMarkdown);
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');

  useEffect(() => {
    setContent(initialMarkdown);
  }, [initialMarkdown]);

  useEffect(() => {
    // Parse markdown to HTML for live preview safely supporting synchronous or asynchronous return
    let isMounted = true;
    Promise.resolve(marked.parse(content || '*No content synthesized yet.*'))
      .then(html => {
        if (isMounted) setRenderedHtml(html as string);
      })
      .catch(() => {
        if (isMounted) setRenderedHtml('<p>Error rendering markdown preview</p>');
      });

    return () => {
      isMounted = false;
    };
  }, [content]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTimeMin = Math.ceil(wordCount / 200);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveDraft(content);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Discard all unsaved edits and reset to AI generated text?')) {
      setContent(initialMarkdown);
    }
  };

  return (
    <div className="flex flex-col h-[650px] rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Editor Toolbar */}
      <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-sm text-slate-200">Executive Briefing Draft Editor</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
            HITL Active
          </span>
        </div>

        {/* View Mode Controls & Actions */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                mode === 'edit'
                  ? 'bg-slate-800 text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setMode('split')}
              className={`hidden md:flex px-3 py-1 rounded-md items-center gap-1.5 transition-colors ${
                mode === 'split'
                  ? 'bg-slate-800 text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                mode === 'preview'
                  ? 'bg-slate-800 text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Reset button */}
          {!isReadOnly && content !== initialMarkdown && (
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg bg-slate-800/80 border border-slate-700/80"
              title="Reset to AI output"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Save Button */}
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving || content === initialMarkdown}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 disabled:opacity-40 transition-all active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor & Preview Body Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Markdown Textarea Editor */}
        {(mode === 'edit' || mode === 'split') && (
          <div
            className={`h-full flex flex-col ${
              mode === 'split' ? 'w-1/2 border-r border-slate-800' : 'w-full'
            }`}
          >
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={isReadOnly}
              placeholder="Draft content in Markdown format..."
              className="w-full flex-1 p-5 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-sky-900 border-none"
              spellCheck={false}
            />
          </div>
        )}

        {/* Right Side: Live HTML Rendered Preview */}
        {(mode === 'preview' || mode === 'split') && (
          <div
            className={`h-full overflow-y-auto p-6 bg-slate-900/60 selection:bg-sky-900 text-slate-200 text-sm leading-relaxed ${
              mode === 'split' ? 'w-1/2' : 'w-full'
            }`}
          >
            <div
              className="prose prose-invert prose-sky max-w-none prose-headings:font-bold prose-headings:text-slate-100 prose-h1:text-xl prose-h2:text-base prose-h2:text-sky-400 prose-table:border prose-table:border-slate-800 prose-th:bg-slate-950 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-slate-800 text-xs"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>

      {/* Editor Bottom Meta Bar */}
      <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-slate-300">{wordCount.toLocaleString()}</strong></span>
          <span>Characters: <strong className="text-slate-300">{charCount.toLocaleString()}</strong></span>
          <span>Read Time: <strong className="text-sky-400">{readingTimeMin} min</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {content !== initialMarkdown && (
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              Unsaved human edits
            </span>
          )}
          <span>Format: CommonMark</span>
        </div>
      </div>
    </div>
  );
};
