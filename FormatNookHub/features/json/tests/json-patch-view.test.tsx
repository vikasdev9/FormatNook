import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonPatchWorkspaceView } from '../components/JsonPatchWorkspaceView';

describe('JsonPatchWorkspaceView Component', () => {
  const onApplyMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders JSON Patch view with mode pills, format select, and editors', () => {
    render(<JsonPatchWorkspaceView onApplyResultToWorkspace={onApplyMock} />);

    expect(screen.getByTestId('json-patch-view')).toBeInTheDocument();
    expect(screen.getByTestId('patch-mode-generate')).toBeInTheDocument();
    expect(screen.getByTestId('patch-mode-apply')).toBeInTheDocument();
    expect(screen.getByTestId('patch-format-select')).toBeInTheDocument();
    expect(screen.getByTestId('patch-original-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('patch-modified-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('patch-result-textarea')).toBeInTheDocument();
  });

  it('generates RFC 6902 patch and shows summary stats', () => {
    render(<JsonPatchWorkspaceView onApplyResultToWorkspace={onApplyMock} />);

    const generateBtn = screen.getByTestId('patch-generate-btn');
    fireEvent.click(generateBtn);

    expect(screen.getByTestId('patch-summary-stats')).toBeInTheDocument();
    const resultTextarea = screen.getByTestId('patch-result-textarea') as HTMLTextAreaElement;
    expect(resultTextarea.value).toContain('"op":');
  });

  it('switches format between RFC 6902 and RFC 7386 Merge Patch', () => {
    render(<JsonPatchWorkspaceView onApplyResultToWorkspace={onApplyMock} />);

    const formatSelect = screen.getByTestId('patch-format-select');
    fireEvent.change(formatSelect, { target: { value: 'rfc7386' } });

    const generateBtn = screen.getByTestId('patch-generate-btn');
    fireEvent.click(generateBtn);

    const resultTextarea = screen.getByTestId('patch-result-textarea') as HTMLTextAreaElement;
    // RFC 7386 is an object, not array of ops
    expect(resultTextarea.value.trim().startsWith('{')).toBe(true);
  });

  it('switches to Apply Patch mode and applies patch to original document', () => {
    render(<JsonPatchWorkspaceView onApplyResultToWorkspace={onApplyMock} />);

    // Switch to Apply Mode
    const applyModePill = screen.getByTestId('patch-mode-apply');
    fireEvent.click(applyModePill);

    expect(screen.getByTestId('patch-input-textarea')).toBeInTheDocument();
    const applyBtn = screen.getByTestId('patch-apply-btn');
    fireEvent.click(applyBtn);

    const resultTextarea = screen.getByTestId('patch-result-textarea') as HTMLTextAreaElement;
    expect(resultTextarea.value).toBeDefined();
  });

  it('copies generated output to clipboard and applies to workspace', () => {
    render(<JsonPatchWorkspaceView onApplyResultToWorkspace={onApplyMock} />);

    const copyBtn = screen.getByTestId('patch-copy-btn');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    const insertBtn = screen.getByTestId('patch-insert-workspace-btn');
    fireEvent.click(insertBtn);
    expect(onApplyMock).toHaveBeenCalled();
  });
});
