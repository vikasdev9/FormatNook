'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface YamlShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YamlShortcutsModal({ isOpen, onClose }: YamlShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl / ⌘ + Enter', desc: 'Beautify & format current YAML' },
    { key: 'Ctrl / ⌘ + Shift + V', desc: 'Validate YAML syntax and diagnostics' },
    { key: 'Ctrl / ⌘ + Shift + M', desc: 'Minify YAML into compact flow style' },
    { key: 'Ctrl / ⌘ + Shift + C', desc: 'Copy current output to clipboard' },
    { key: 'Esc', desc: 'Close any active modal or search box' },
    { key: 'F11 / Fullscreen btn', desc: 'Toggle immersive fullscreen view' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Keyboard size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>YAML Workspace Shortcuts</h3>
          </div>
          <button type="button" className="btn-icon-subtle" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {shortcuts.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s.desc}</span>
                <kbd
                  style={{
                    padding: '2px 8px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--text-primary)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

