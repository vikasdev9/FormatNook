'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronsDown, ChevronsUp, Layers } from 'lucide-react';

interface JsonFoldingMenuProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onFoldLevel?: (level: number) => void;
  activeLevel?: number | null;
  activeFoldLevel?: number | null;
  disabled?: boolean;
}

export function JsonFoldingMenu({
  onExpandAll,
  onCollapseAll,
  onFoldLevel,
  activeLevel,
  activeFoldLevel,
  disabled = false,
}: JsonFoldingMenuProps) {
  const currentActiveLevel = activeFoldLevel !== undefined ? activeFoldLevel : activeLevel;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="json-folding-menu-container"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        className={`btn-subtle-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Fold or Unfold JSON objects and arrays"
        data-testid="json-folding-menu-trigger"
      >
        <Layers size={13} style={{ display: 'inline', marginRight: '4px' }} />
        <span>Expand / Collapse</span>
        <ChevronDown size={12} style={{ marginLeft: '3px', opacity: 0.8 }} />
      </button>

      {isOpen && (
        <div
          className="json-folding-dropdown"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="folding-menu"
          data-testid="json-folding-menu-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 100,
            minWidth: '180px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <button
            type="button"
            role="menuitem"
            className="json-dropdown-item"
            onClick={() => {
              onExpandAll();
              setIsOpen(false);
            }}
            data-testid="action-expand-all"
          >
            <ChevronsDown size={14} className="text-accent" />
            <span>Expand All</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="json-dropdown-item"
            onClick={() => {
              onCollapseAll();
              setIsOpen(false);
            }}
            data-testid="action-collapse-all"
          >
            <ChevronsUp size={14} className="text-accent" />
            <span>Collapse All</span>
          </button>

          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--border-subtle)',
              margin: '3px 0',
            }}
          />

          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-secondary)',
              padding: '4px 8px 2px',
            }}
          >
            Expand to Level
          </div>

          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              type="button"
              role="menuitem"
              className={`json-dropdown-item ${currentActiveLevel === lvl ? 'active' : ''}`}
              onClick={() => {
                if (onFoldLevel) onFoldLevel(lvl);
                setIsOpen(false);
              }}
              data-testid={`action-fold-level-${lvl}`}
            >
              <span>Level {lvl}</span>
              {currentActiveLevel === lvl && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.6875rem',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                  }}
                >
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
