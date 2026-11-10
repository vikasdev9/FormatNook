'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Sparkles, ArrowRight } from 'lucide-react';
import { toolRegistry } from '@/config/tools';
import { ToolDefinition } from '@/types/tool';
import { IconRenderer } from './IconRenderer';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global key listener for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredTools: ToolDefinition[] = React.useMemo(() => {
    if (!query.trim()) {
      // Show implemented tools first
      return toolRegistry.filter((t) => t.status === 'implemented').slice(0, 8);
    }
    const q = query.toLowerCase().trim();
    return toolRegistry.filter((t) => {
      return (
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q)) ||
        t.searchAliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [query]);

  const handleSelect = (tool: ToolDefinition) => {
    if (tool.status === 'implemented') {
      router.push(tool.route);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredTools.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredTools[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-search-header">
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            className="modal-search-input"
            placeholder="Search tools, formats, utilities... (e.g. JSON, Base64, SQL)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <button className="btn-icon" onClick={onClose} aria-label="Close search">
            <X size={16} />
          </button>
        </div>

        <div className="modal-search-results">
          <div className="modal-search-group-title">
            {query.trim() ? `Search Results (${filteredTools.length})` : 'Popular & Available Tools'}
          </div>

          {filteredTools.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No tools matching &quot;{query}&quot;. Try searching for &quot;JSON&quot;, &quot;Base64&quot;, or &quot;XML&quot;.
            </div>
          ) : (
            filteredTools.map((tool, index) => (
              <div
                key={tool.id}
                className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(tool)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="search-result-info">
                  <IconRenderer name={tool.icon} size={18} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tool.name}</div>
                    <div className="search-result-desc">{tool.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {tool.status === 'planned' ? (
                    <span className="badge badge-neutral">Coming Soon</span>
                  ) : (
                    <ArrowRight size={14} color="var(--text-subtle)" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-search-footer">
          <div>
            <span>Use </span>
            <kbd className="search-shortcut-badge">↑</kbd> <kbd className="search-shortcut-badge">↓</kbd>
            <span> to navigate, </span>
            <kbd className="search-shortcut-badge">Enter</kbd>
            <span> to select</span>
          </div>
          <div>
            <kbd className="search-shortcut-badge">Esc</kbd> <span>to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
