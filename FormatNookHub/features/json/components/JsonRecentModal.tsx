'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Bookmark,
  Trash2,
  Download,
  Upload,
  Plus,
  ArrowRight,
  Clock,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  getRecentFiles,
  removeRecentFile,
  clearRecentFiles,
  getSnippets,
  saveSnippet,
  deleteSnippet,
  exportSnippets,
  importSnippets,
} from '../services/json-storage-service';
import { JsonRecentFile, JsonSnippet } from '../types/json.types';
import { formatByteSize } from '@/lib/file-reader';
import { downloadFile } from '@/lib/download';

interface JsonRecentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  onLoadContent: (content: string, name?: string) => void;
}

export function JsonRecentModal({
  isOpen,
  onClose,
  currentContent,
  onLoadContent,
}: JsonRecentModalProps) {
  const [activeTab, setActiveTab] = useState<'recents' | 'snippets'>('recents');
  const [recents, setRecents] = useState<JsonRecentFile[]>([]);
  const [snippets, setSnippets] = useState<JsonSnippet[]>([]);
  const [isSavingSnippet, setIsSavingSnippet] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetDesc, setSnippetDesc] = useState('');
  const [snippetTags, setSnippetTags] = useState('');
  const [snippetSearch, setSnippetSearch] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const refreshData = () => {
    setRecents(getRecentFiles());
    setSnippets(getSnippets());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setIsSavingSnippet(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearRecents = () => {
    clearRecentFiles();
    setRecents([]);
  };

  const handleRemoveRecent = (id: string) => {
    removeRecentFile(id);
    setRecents(getRecentFiles());
  };

  const handleSaveSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snippetTitle.trim()) return;

    const tags = snippetTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const result = saveSnippet(snippetTitle, snippetDesc, tags, currentContent);
    if (!result.success) {
      setSaveError(result.error || 'Failed to save snippet due to browser storage quota.');
      return;
    }

    setSaveError(null);
    setSaveSuccessMsg('Snippet saved successfully to favorites.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    setSnippetTitle('');
    setSnippetDesc('');
    setSnippetTags('');
    setIsSavingSnippet(false);
    setSnippets(getSnippets());
  };

  const handleDeleteSnippet = (id: string) => {
    deleteSnippet(id);
    setSnippets(getSnippets());
  };

  const handleExportSnippets = () => {
    const json = exportSnippets();
    downloadFile(json, 'formatnook-snippets.json', 'application/json');
  };

  const handleImportSnippets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        importSnippets(text);
        setSnippets(getSnippets());
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredSnippets = snippets.filter((s) => {
    if (!snippetSearch.trim()) return true;
    const q = snippetSearch.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="json-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="json-recent-modal"
    >
      <div className="json-modal-card json-recent-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="json-modal-header">
          <div className="json-modal-tabs">
            <button
              className={`modal-tab-btn ${activeTab === 'recents' ? 'active' : ''}`}
              onClick={() => setActiveTab('recents')}
              data-testid="tab-recents"
            >
              <History size={15} />
              <span>Recent Files ({recents.length})</span>
            </button>
            <button
              className={`modal-tab-btn ${activeTab === 'snippets' ? 'active' : ''}`}
              onClick={() => setActiveTab('snippets')}
              data-testid="tab-snippets"
            >
              <Bookmark size={15} />
              <span>Favorites & Snippets ({snippets.length})</span>
            </button>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="json-modal-body">
          {activeTab === 'recents' ? (
            <div className="recents-container">
              <div className="recents-header-row">
                <span className="text-secondary text-sm">
                  Recently loaded files stored safely on your device.
                </span>
                {recents.length > 0 && (
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={handleClearRecents}
                    data-testid="btn-clear-recents"
                  >
                    <Trash2 size={12} />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {recents.length === 0 ? (
                <div className="empty-storage-state">
                  <Clock size={24} className="text-muted" />
                  <p>No recent files tracked yet. Load or drop a JSON file to see it here.</p>
                </div>
              ) : (
                <div className="recents-list">
                  {recents.map((item) => (
                    <div key={item.id} className="recent-item-card" data-testid="recent-file-item">
                      <div className="recent-info">
                        <div className="recent-title">{item.name}</div>
                        <div className="recent-meta">
                          <span>{formatByteSize(item.sizeBytes)}</span> &bull;{' '}
                          <span>{item.lineCount} lines</span> &bull;{' '}
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="recent-snippet-preview">{item.previewSnippet}</div>
                      </div>
                      <div className="recent-actions">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => {
                            onLoadContent(item.previewSnippet, item.name);
                            onClose();
                          }}
                          title="Load this recent content"
                          data-testid={`btn-load-recent-${item.id}`}
                        >
                          <span>Load</span>
                          <ArrowRight size={12} />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-danger"
                          onClick={() => handleRemoveRecent(item.id)}
                          title="Remove from history"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="snippets-container">
              {/* Snippets Actions Bar */}
              <div className="snippets-toolbar">
                <input
                  type="text"
                  className="input-xs"
                  placeholder="Search saved snippets..."
                  value={snippetSearch}
                  onChange={(e) => setSnippetSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => setIsSavingSnippet(!isSavingSnippet)}
                  data-testid="btn-toggle-save-snippet"
                >
                  <Plus size={12} />
                  <span>Save Current</span>
                </button>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={handleExportSnippets}
                  title="Export snippets to JSON file"
                >
                  <Download size={12} />
                  <span>Export</span>
                </button>
                <label className="btn btn-secondary btn-xs" style={{ cursor: 'pointer', margin: 0 }}>
                  <Upload size={12} />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportSnippets}
                  />
                </label>
              </div>

              {/* Status Feedback Messages */}
              {saveSuccessMsg && (
                <div
                  role="status"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--color-success-bg)',
                    color: 'var(--color-success)',
                    border: '1px solid var(--color-success-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    margin: '0.75rem 0',
                  }}
                >
                  <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {saveError && (
                <div
                  role="alert"
                  data-testid="snippet-storage-error"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--color-error-bg)',
                    color: 'var(--color-error)',
                    border: '1px solid var(--color-error-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    margin: '0.75rem 0',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Save Snippet Drawer Form */}
              {isSavingSnippet && (
                <form className="save-snippet-card" onSubmit={handleSaveSnippet}>
                  <div className="snippet-form-title">Save Current JSON as Favorite Snippet</div>
                  <input
                    type="text"
                    className="input-xs"
                    placeholder="Snippet Title (e.g. Auth Token Payload)"
                    value={snippetTitle}
                    onChange={(e) => setSnippetTitle(e.target.value)}
                    required
                    data-testid="input-snippet-title"
                  />
                  <input
                    type="text"
                    className="input-xs"
                    placeholder="Short description (optional)"
                    value={snippetDesc}
                    onChange={(e) => setSnippetDesc(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-xs"
                    placeholder="Tags separated by comma (e.g. auth, dev, jwt)"
                    value={snippetTags}
                    onChange={(e) => setSnippetTags(e.target.value)}
                  />
                  <div className="snippet-form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => setIsSavingSnippet(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-xs"
                      data-testid="btn-confirm-save-snippet"
                    >
                      Save Snippet
                    </button>
                  </div>
                </form>
              )}

              {/* Snippets List */}
              {filteredSnippets.length === 0 ? (
                <div className="empty-storage-state">
                  <FileText size={24} className="text-muted" />
                  <p>No snippets found. Click &quot;Save Current&quot; to bookmark reusable JSON templates.</p>
                </div>
              ) : (
                <div className="snippets-list">
                  {filteredSnippets.map((snp) => (
                    <div key={snp.id} className="snippet-item-card" data-testid="snippet-item">
                      <div className="snippet-info">
                        <div className="snippet-header">
                          <span className="snippet-title">{snp.title}</span>
                          <span className="snippet-date">
                            {new Date(snp.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {snp.description && (
                          <div className="snippet-desc">{snp.description}</div>
                        )}
                        {snp.tags.length > 0 && (
                          <div className="snippet-tags">
                            {snp.tags.map((t, idx) => (
                              <span key={idx} className="snippet-tag-badge">
                                <Tag size={10} />
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="snippet-actions">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => {
                            onLoadContent(snp.content, snp.title);
                            onClose();
                          }}
                          title="Insert this snippet into editor"
                          data-testid={`btn-load-snippet-${snp.id}`}
                        >
                          <span>Insert</span>
                          <ArrowRight size={12} />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-danger"
                          onClick={() => handleDeleteSnippet(snp.id)}
                          title="Delete snippet"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="json-modal-footer">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

