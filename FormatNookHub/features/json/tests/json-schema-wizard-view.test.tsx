import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JsonSchemaWizardView } from '../components/JsonSchemaWizardView';

describe('JsonSchemaWizardView Component', () => {
  const sampleJson = JSON.stringify({
    id: 1,
    name: 'Sample Item',
    active: true,
  });

  const onApplyMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders schema wizard controls, draft options, editor, and validation area', () => {
    render(
      <JsonSchemaWizardView
        inputJson={sampleJson}
        onApplyJsonToWorkspace={onApplyMock}
      />
    );

    expect(screen.getByTestId('json-schema-wizard-view')).toBeInTheDocument();
    expect(screen.getByTestId('schema-draft-select')).toBeInTheDocument();
    expect(screen.getByTestId('schema-opt-required')).toBeInTheDocument();
    expect(screen.getByTestId('schema-opt-enums')).toBeInTheDocument();
    expect(screen.getByTestId('schema-opt-formats')).toBeInTheDocument();
    expect(screen.getByTestId('schema-editor-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('schema-validation-results')).toBeInTheDocument();
  });

  it('generates schema when draft option is changed', () => {
    render(
      <JsonSchemaWizardView
        inputJson={sampleJson}
        onApplyJsonToWorkspace={onApplyMock}
      />
    );

    const draftSelect = screen.getByTestId('schema-draft-select');
    fireEvent.change(draftSelect, { target: { value: 'draft-07' } });

    const genBtn = screen.getByTestId('schema-generate-btn');
    fireEvent.click(genBtn);

    const textarea = screen.getByTestId('schema-editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('draft-07');
  });

  it('validates JSON against schema and displays validation status card', () => {
    render(
      <JsonSchemaWizardView
        inputJson={sampleJson}
        onApplyJsonToWorkspace={onApplyMock}
      />
    );

    const revalidateBtn = screen.getByTestId('schema-revalidate-btn');
    fireEvent.click(revalidateBtn);

    // Initial generated schema matches sampleJson -> should be valid
    expect(screen.getByTestId('schema-valid-card')).toBeInTheDocument();
  });

  it('generates sample JSON conforming to schema and applies to workspace', () => {
    render(
      <JsonSchemaWizardView
        inputJson={sampleJson}
        onApplyJsonToWorkspace={onApplyMock}
      />
    );

    const sampleBtn = screen.getByTestId('schema-sample-btn');
    fireEvent.click(sampleBtn);

    expect(onApplyMock).toHaveBeenCalled();
  });

  it('copies schema text to clipboard', async () => {
    render(
      <JsonSchemaWizardView
        inputJson={sampleJson}
        onApplyJsonToWorkspace={onApplyMock}
      />
    );

    const copyBtn = screen.getByTestId('schema-copy-btn');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
