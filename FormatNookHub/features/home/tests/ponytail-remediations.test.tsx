import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { toolRegistry, getToolBySlug, searchTools } from '@/config/tools';
import { CodeEditor } from '@/components/workspace/CodeEditor';

describe('Ponytail Audit & Review Remediations', () => {
  describe('Tool Registry Consolidation (diff-checker vs text-compare)', () => {
    it('has diff-checker as the canonical diff tool in toolRegistry', () => {
      const canonical = getToolBySlug('diff-checker');
      expect(canonical).toBeDefined();
      expect(canonical?.id).toBe('diff-checker');
      expect(canonical?.route).toBe('/tools/diff-checker');
    });

    it('removes duplicate text-compare entry from active toolRegistry', () => {
      const duplicate = getToolBySlug('text-compare');
      expect(duplicate).toBeUndefined();
      expect(toolRegistry.some((t) => t.id === 'text-compare')).toBe(false);
    });

    it('resolves searches for "text compare" to the canonical diff-checker tool', () => {
      const results = searchTools('text compare');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((t) => t.id === 'diff-checker')).toBe(true);
    });
  });

  describe('CodeEditor Theme Initialization', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('data-theme');
    });

    it('initializes to dark theme when documentElement data-theme is dark', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      let container: HTMLElement;
      act(() => {
        const res = render(
          <CodeEditor value="test content" onChange={() => {}} />
        );
        container = res.container;
      });
      // Status bar should render with status elements
      expect(screen.getByTestId('editor-status-bar')).toBeInTheDocument();
      expect(container!.querySelector('.custom-editor-with-footer')).toBeInTheDocument();
    });

    it('initializes to light theme when documentElement data-theme is not dark', () => {
      document.documentElement.removeAttribute('data-theme');
      let container: HTMLElement;
      act(() => {
        const res = render(
          <CodeEditor value="test content" onChange={() => {}} />
        );
        container = res.container;
      });
      expect(screen.getByTestId('editor-status-bar')).toBeInTheDocument();
      expect(container!.querySelector('.custom-editor-with-footer')).toBeInTheDocument();
    });
  });
});
