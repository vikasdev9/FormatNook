'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface JsonShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], description: 'Beautify / Format JSON with chosen indent' },
  { keys: ['Ctrl', 'Shift', 'M'], description: 'Minify JSON (compact single line)' },
  { keys: ['Ctrl', 'Shift', 'V'], description: 'Validate JSON syntax and lint errors' },
  { keys: ['Ctrl', 'Shift', 'R'], description: 'Open Auto-Repair preview' },
  { keys: ['Ctrl', 'F'], description: 'Find / Search within editor or tree view' },
  { keys: ['Ctrl', 'H'], description: 'Find and Replace in Monaco editor' },
  { keys: ['Ctrl', 'Z'], description: 'Undo last edit' },
  { keys: ['Ctrl', 'Y'], description: 'Redo last edit' },
  { keys: ['Esc'], description: 'Close any active modal or panel' },
];

export function JsonShortcutsModal({ isOpen, onClose }: JsonShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="json-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="json-shortcuts-modal"
    >
      <div className="json-modal-card json-shortcuts-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="json-modal-header">
          <div className="json-modal-title">
            <Keyboard size={18} className="text-accent" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="json-modal-body">
          <div className="shortcuts-table-container">
            <table className="shortcuts-table">
              <thead>
                <tr>
                  <th>Shortcut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUTS.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="shortcut-keys">
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="shortcut-badge">{k}</kbd>
                            {kIdx < item.keys.length - 1 && <span className="key-plus">+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="json-modal-footer">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

