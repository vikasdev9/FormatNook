/**
 * Centralized Keyboard Shortcuts Cheat Sheet Modal
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

'use client';

import React, { useState, useMemo } from 'react';
import { X, Keyboard, Search } from 'lucide-react';
import { SHORTCUT_REGISTRY, formatShortcutBadges, isMacPlatform } from '../config/shortcut-registry';
import { ShortcutCategory } from '../types/shortcut.types';
import { useModalShortcuts } from '../hooks/useKeyboardShortcuts';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: ShortcutCategory | 'all';
  testId?: string;
}

const CATEGORIES: { id: ShortcutCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Shortcuts' },
  { id: 'global', label: 'Global' },
  { id: 'json', label: 'JSON' },
  { id: 'base64', label: 'Base64' },
  { id: 'yaml', label: 'YAML' },
  { id: 'xml', label: 'XML' },
  { id: 'diff', label: 'Diff' },
  { id: 'beautifiers', label: 'Beautifiers' },
  { id: 'editor', label: 'Editor' },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  initialCategory = 'all',
  testId = 'keyboard-shortcuts-modal',
}: KeyboardShortcutsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const isMac = useMemo(() => isMacPlatform(), []);

  // Register with modal stack
  useModalShortcuts('keyboard-shortcuts-modal', isOpen, onClose);

  const filteredShortcuts = useMemo(() => {
    return SHORTCUT_REGISTRY.filter((s) => {
      // Category filter
      if (selectedCategory !== 'all' && s.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        const matchesKey = s.key.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesKey;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="json-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid={testId}
    >
      <div
        className="json-modal-card json-shortcuts-modal-card"
        style={{ maxWidth: '680px', width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="json-modal-header" style={{ flexShrink: 0 }}>
          <div className="json-modal-title">
            <Keyboard size={18} className="text-accent" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Category Tabs & Search Bar */}
        <div style={{ padding: '0.75rem 1.25rem 0', flexShrink: 0 }}>
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-subtle)',
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{
                width: '100%',
                paddingLeft: '2.25rem',
                fontSize: '0.8125rem',
                height: '36px',
                borderRadius: 'var(--radius-sm, 6px)',
              }}
              placeholder="Filter shortcuts (e.g. format, validate, minify)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter shortcuts"
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.375rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'none',
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', whiteSpace: 'nowrap' }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body / Shortcuts Table */}
        <div className="json-modal-body" style={{ flex: '1 1 auto', overflowY: 'auto', padding: '0 1.25rem 1rem' }}>
          <div className="shortcuts-table-container">
            <table className="shortcuts-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>Shortcut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredShortcuts.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No shortcuts found matching &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredShortcuts.map((item) => {
                    const badges = formatShortcutBadges(item, isMac);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="shortcut-keys" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            {badges.map((b, bIdx) => (
                              <React.Fragment key={bIdx}>
                                <kbd className="shortcut-badge">{b}</kbd>
                                {bIdx < badges.length - 1 && <span className="key-plus">+</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {item.description}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="json-modal-footer" style={{ flexShrink: 0, padding: '0.75rem 1.25rem' }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
