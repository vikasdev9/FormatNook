import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CodeEditor, CodeEditorActions } from '@/components/workspace/CodeEditor';
import { JsonWorkspace } from '../components/JsonWorkspace';

const TEST_JSON = `{
  "app": "FormatNook",
  "developer": {
    "name": "Alex",
    "city": "Mumbai"
  },
  "tags": [
    "utility",
    "developer"
  ]
}`;

describe('Mode-Independent JSON Expand & Collapse', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Standalone Editor Folding', () => {
    it('renders folding toggle buttons in gutter for objects and arrays in standalone mode', () => {
      render(
        <CodeEditor
          value={TEST_JSON}
          language="json"
          useMonaco={false}
          readOnly={false}
          footerLabel="TestEditor"
        />
      );

      // Line 1 is root object
      expect(screen.getByTestId('fold-toggle-line-1')).toBeInTheDocument();
      // Line 3 is developer object
      expect(screen.getByTestId('fold-toggle-line-3')).toBeInTheDocument();
      // Line 7 is tags array
      expect(screen.getByTestId('fold-toggle-line-7')).toBeInTheDocument();
    });

    it('collapses an individual object on clicking gutter button in standalone mode', () => {
      render(
        <CodeEditor
          value={TEST_JSON}
          language="json"
          useMonaco={false}
          readOnly={false}
          footerLabel="TestEditor"
        />
      );

      const foldDevBtn = screen.getByTestId('fold-toggle-line-3');
      fireEvent.click(foldDevBtn);

      // Collapsed summary pill should appear
      const pill = screen.getByTestId('fold-pill-line-3');
      expect(pill).toBeInTheDocument();
      expect(pill.textContent).toContain('2 props');

      // The toggle button should now indicate expand (ChevronRight)
      expect(screen.getByTestId('fold-toggle-line-3')).toHaveAttribute('aria-label', 'Expand line 3');
    });

    it('expands a previously collapsed object on clicking the summary pill', () => {
      render(
        <CodeEditor
          value={TEST_JSON}
          language="json"
          useMonaco={false}
          readOnly={false}
          footerLabel="TestEditor"
        />
      );

      // Collapse line 3
      fireEvent.click(screen.getByTestId('fold-toggle-line-3'));
      expect(screen.getByTestId('fold-pill-line-3')).toBeInTheDocument();

      // Click pill to expand
      fireEvent.click(screen.getByTestId('fold-pill-line-3'));
      expect(screen.queryByTestId('fold-pill-line-3')).not.toBeInTheDocument();
    });

    it('collapses an individual array on clicking gutter button in standalone mode', () => {
      render(
        <CodeEditor
          value={TEST_JSON}
          language="json"
          useMonaco={false}
          readOnly={false}
          footerLabel="TestEditor"
        />
      );

      const foldTagsBtn = screen.getByTestId('fold-toggle-line-7');
      fireEvent.click(foldTagsBtn);

      const pill = screen.getByTestId('fold-pill-line-7');
      expect(pill).toBeInTheDocument();
      expect(pill.textContent).toContain('2 items');
    });

    it('exposes CodeEditorActions in standalone mode via onEditorReady', () => {
      let actions: CodeEditorActions | null = null;
      render(
        <CodeEditor
          value={TEST_JSON}
          language="json"
          useMonaco={false}
          readOnly={false}
          footerLabel="TestEditor"
          onEditorReady={(act) => {
            actions = act;
          }}
        />
      );

      expect(actions).not.toBeNull();
      expect(typeof actions!.foldAll).toBe('function');
      expect(typeof actions!.unfoldAll).toBe('function');
      expect(typeof actions!.foldLevel).toBe('function');
    });

    it('calls foldAll and collapse all objects and arrays in standalone mode', () => {
      let actions: CodeEditorActions | null = null;
      render(
        <CodeEditor
          value={TEST_JSON}
          language="json"
          useMonaco={false}
          readOnly={false}
          footerLabel="TestEditor"
          onEditorReady={(act) => {
            actions = act;
          }}
        />
      );

      act(() => {
        actions!.foldAll();
      });

      // Line 1 (root) is collapsed
      expect(screen.getByTestId('fold-pill-line-1')).toBeInTheDocument();

      // Unfold all
      act(() => {
        actions!.unfoldAll();
      });
      expect(screen.queryByTestId('fold-pill-line-1')).not.toBeInTheDocument();
    });

    it('preserves line numbers and indentation without mutating original JSON', () => {
      const onChange = vi.fn();
      render(
        <CodeEditor
          value={TEST_JSON}
          language="json"
          useMonaco={false}
          readOnly={false}
          footerLabel="TestEditor"
          onChange={onChange}
        />
      );

      // Folding must NEVER trigger onChange or delete text!
      fireEvent.click(screen.getByTestId('fold-toggle-line-3'));
      expect(onChange).not.toHaveBeenCalled();

      // Unfolding must NEVER trigger onChange
      fireEvent.click(screen.getByTestId('fold-toggle-line-3'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Mode Switching and Synchronization in JsonWorkspace', () => {
    it('executes Expand All and Collapse All toolbar actions in standalone mode without forcing Monaco', () => {
      render(<JsonWorkspace />);

      // Verify initial mode is Standalone (useMonaco: false by default)
      const monacoBtn = screen.getByTestId('toggle-monaco-btn');
      expect(monacoBtn.textContent).toContain('Standard');

      // Open folding dropdown menu
      const foldTrigger = screen.getByTestId('json-folding-menu-trigger');
      fireEvent.click(foldTrigger);

      // Click Collapse All
      const collapseAllBtn = screen.getByTestId('action-collapse-all');
      fireEvent.click(collapseAllBtn);

      // Verify that the editor REMAINED in Standard mode and did NOT force Monaco
      expect(monacoBtn.textContent).toContain('Standard');

      // Verify root collapsed pill is visible in standalone editor
      expect(screen.getAllByTestId('fold-pill-line-1').length).toBeGreaterThan(0);

      // Click Expand All
      fireEvent.click(foldTrigger);
      const expandAllBtn = screen.getByTestId('action-expand-all');
      fireEvent.click(expandAllBtn);

      expect(screen.queryAllByTestId('fold-pill-line-1')).toHaveLength(0);
    });

    it('preserves collapsed state across mode switches', () => {
      render(<JsonWorkspace />);

      // In Standalone mode, collapse the developer object (line 4 in default sample)
      const foldDevBtn = screen.getAllByTestId('fold-toggle-line-4')[0];
      fireEvent.click(foldDevBtn);

      // Collapsed pill is active in Standalone
      expect(screen.getAllByTestId('fold-pill-line-4').length).toBeGreaterThan(0);

      // Switch to Monaco Mode
      const toggleMonacoBtn = screen.getByTestId('toggle-monaco-btn');
      fireEvent.click(toggleMonacoBtn);
      expect(toggleMonacoBtn.textContent).toContain('Monaco');

      // Switch back to Standalone Mode
      fireEvent.click(toggleMonacoBtn);
      expect(toggleMonacoBtn.textContent).toContain('Standard');

      // The collapsed developer object on line 4 must STILL be collapsed!
      expect(screen.getAllByTestId('fold-pill-line-4').length).toBeGreaterThan(0);
    });

    it('handles depth-based folding (Level 2) in standalone mode', () => {
      render(<JsonWorkspace />);

      const foldTrigger = screen.getByTestId('json-folding-menu-trigger');
      fireEvent.click(foldTrigger);

      // Select Level 2
      const level2Btn = screen.getByTestId('action-fold-level-2');
      fireEvent.click(level2Btn);

      // Level 1 (line 1) should stay expanded, while Level 2 (line 4) should be collapsed
      expect(screen.queryAllByTestId('fold-pill-line-1')).toHaveLength(0);
      expect(screen.getAllByTestId('fold-pill-line-4').length).toBeGreaterThan(0);
    });
  });
});

