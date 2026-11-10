import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TextDiffWorkspace } from '../components/TextDiffWorkspace';
import * as downloadModule from '@/lib/download';
import * as clipboardModule from '@/lib/clipboard';

// Mock clipboard and download helpers
vi.mock('@/lib/download', () => ({
  downloadFile: vi.fn(),
  downloadDataUrl: vi.fn(),
}));

vi.mock('@/lib/clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

describe('TextDiffWorkspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workspace with toolbar, editors, statistics, and diff viewer', () => {
    render(<TextDiffWorkspace />);

    // Editors are visible
    expect(screen.getByTestId('editor-original')).toBeInTheDocument();
    expect(screen.getByTestId('editor-modified')).toBeInTheDocument();

    // Primary action buttons are visible
    expect(screen.getByTestId('btn-compare')).toBeInTheDocument();
    expect(screen.getByTestId('btn-swap')).toBeInTheDocument();
    expect(screen.getByTestId('btn-clear')).toBeInTheDocument();
    expect(screen.getByTestId('btn-copy-diff')).toBeInTheDocument();
    expect(screen.getByTestId('btn-download-diff')).toBeInTheDocument();

    // Statistics are visible for initial sample
    expect(screen.getByTestId('stat-total-lines')).toBeInTheDocument();
    expect(screen.getByTestId('stat-added-lines')).toBeInTheDocument();
    expect(screen.getByTestId('stat-removed-lines')).toBeInTheDocument();
  });

  it('clears both editors and shows empty state when Clear button is clicked', () => {
    render(<TextDiffWorkspace />);

    const clearBtn = screen.getByTestId('btn-clear');
    fireEvent.click(clearBtn);

    const origTextarea = screen.getByTestId('textarea-original-editor') as HTMLTextAreaElement;
    const modTextarea = screen.getByTestId('textarea-modified-editor') as HTMLTextAreaElement;

    expect(origTextarea.value).toBe('');
    expect(modTextarea.value).toBe('');
    expect(screen.getByTestId('diff-empty-state')).toBeInTheDocument();
  });

  it('swaps original and modified contents when Swap button is clicked', () => {
    render(<TextDiffWorkspace />);

    const origTextarea = screen.getByTestId('textarea-original-editor') as HTMLTextAreaElement;
    const modTextarea = screen.getByTestId('textarea-modified-editor') as HTMLTextAreaElement;

    fireEvent.change(origTextarea, { target: { value: 'Text Alpha' } });
    fireEvent.change(modTextarea, { target: { value: 'Text Beta' } });

    const swapBtn = screen.getByTestId('btn-swap');
    fireEvent.click(swapBtn);

    expect(origTextarea.value).toBe('Text Beta');
    expect(modTextarea.value).toBe('Text Alpha');
  });

  it('displays identical text banner when both inputs have matching content', () => {
    render(<TextDiffWorkspace />);

    const origTextarea = screen.getByTestId('textarea-original-editor') as HTMLTextAreaElement;
    const modTextarea = screen.getByTestId('textarea-modified-editor') as HTMLTextAreaElement;

    fireEvent.change(origTextarea, { target: { value: 'Identical Content\nLine Two' } });
    fireEvent.change(modTextarea, { target: { value: 'Identical Content\nLine Two' } });

    expect(screen.getByTestId('banner-identical-text')).toBeInTheDocument();
    expect(screen.getByText(/No differences found!/i)).toBeInTheDocument();
  });

  it('toggles settings panel and updates comparison options', () => {
    render(<TextDiffWorkspace />);

    // Open settings panel
    const settingsToggle = screen.getByTestId('btn-toggle-settings');
    fireEvent.click(settingsToggle);

    expect(screen.getByTestId('checkbox-ignore-case')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-ignore-whitespace')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-ignore-blank-lines')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-ignore-trailing-spaces')).toBeInTheDocument();

    // Check ignore-case checkbox
    const origTextarea = screen.getByTestId('textarea-original-editor') as HTMLTextAreaElement;
    const modTextarea = screen.getByTestId('textarea-modified-editor') as HTMLTextAreaElement;

    fireEvent.change(origTextarea, { target: { value: 'SAMPLE TEXT' } });
    fireEvent.change(modTextarea, { target: { value: 'sample text' } });

    // Without ignore case: not identical
    expect(screen.queryByTestId('banner-identical-text')).not.toBeInTheDocument();

    // Toggle ignore case
    const ignoreCaseBox = screen.getByTestId('checkbox-ignore-case');
    fireEvent.click(ignoreCaseBox);

    // Now should be identical
    expect(screen.getByTestId('banner-identical-text')).toBeInTheDocument();
  });

  it('switches between Side-by-Side and Inline view modes', () => {
    render(<TextDiffWorkspace />);

    // Initial is split
    expect(screen.getByTestId('view-split-container')).toBeInTheDocument();

    // Click inline view
    const inlineBtn = screen.getByTestId('btn-view-inline');
    fireEvent.click(inlineBtn);

    expect(screen.getByTestId('view-inline-container')).toBeInTheDocument();

    // Switch back
    const splitBtn = screen.getByTestId('btn-view-side-by-side');
    fireEvent.click(splitBtn);

    expect(screen.getByTestId('view-split-container')).toBeInTheDocument();
  });

  it('triggers download when Download Diff button is clicked', () => {
    render(<TextDiffWorkspace />);

    const downloadBtn = screen.getByTestId('btn-download-diff');
    fireEvent.click(downloadBtn);

    expect(downloadModule.downloadFile).toHaveBeenCalledWith(
      expect.stringContaining('--- original.txt'),
      'text-diff.txt',
      'text/plain'
    );
  });

  it('triggers clipboard copy when Copy Diff button is clicked', async () => {
    render(<TextDiffWorkspace />);

    const copyBtn = screen.getByTestId('btn-copy-diff');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(clipboardModule.copyToClipboard).toHaveBeenCalledWith(
        expect.stringContaining('--- original.txt')
      );
    });
  });

  it('supports format selection and prettify button', () => {
    render(<TextDiffWorkspace />);

    // Format select is rendered
    const formatSelect = screen.getByTestId('select-diff-format') as HTMLSelectElement;
    expect(formatSelect).toBeInTheDocument();
    fireEvent.change(formatSelect, { target: { value: 'json' } });
    expect(formatSelect.value).toBe('json');

    // Prettify button works
    const origTextarea = screen.getByTestId('textarea-original-editor') as HTMLTextAreaElement;
    fireEvent.change(origTextarea, { target: { value: '{"a":1,"b":2}' } });

    const prettifyBtn = screen.getByTestId('btn-prettify');
    fireEvent.click(prettifyBtn);

    expect(origTextarea.value).toContain('  "a": 1');
  });
});

