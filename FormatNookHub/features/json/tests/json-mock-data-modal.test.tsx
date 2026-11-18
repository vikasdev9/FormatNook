import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JsonMockDataModal } from '../components/JsonMockDataModal';

describe('JsonMockDataModal Component', () => {
  const sampleJson = JSON.stringify({
    id: 10,
    name: 'Sarah Connor',
    email: 'sarah@resistance.org',
    price: 49.99,
  });

  const onInsertMock = vi.fn();
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders correctly when open with source tabs, controls, rules, and actions', () => {
    render(
      <JsonMockDataModal
        isOpen={true}
        onClose={onCloseMock}
        currentJsonText={sampleJson}
        onInsertIntoEditor={onInsertMock}
      />
    );

    expect(screen.getByTestId('json-mock-data-modal')).toBeInTheDocument();
    expect(screen.getByTestId('mock-source-sample')).toBeInTheDocument();
    expect(screen.getByTestId('mock-source-preset')).toBeInTheDocument();
    expect(screen.getByTestId('mock-source-schema')).toBeInTheDocument();
    expect(screen.getByTestId('mock-record-count-input')).toBeInTheDocument();
    expect(screen.getByTestId('mock-seed-input')).toBeInTheDocument();
    expect(screen.getByTestId('mock-rules-table')).toBeInTheDocument();
    expect(screen.getByTestId('mock-generate-btn')).toBeInTheDocument();
    expect(screen.getByTestId('mock-insert-editor-btn')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <JsonMockDataModal
        isOpen={false}
        onClose={onCloseMock}
        currentJsonText={sampleJson}
        onInsertIntoEditor={onInsertMock}
      />
    );

    expect(screen.queryByTestId('json-mock-data-modal')).not.toBeInTheDocument();
  });

  it('switches between source tabs and displays preset selectors', async () => {
    render(
      <JsonMockDataModal
        isOpen={true}
        onClose={onCloseMock}
        currentJsonText={sampleJson}
        onInsertIntoEditor={onInsertMock}
      />
    );

    // Switch to Presets
    const presetTab = screen.getByTestId('mock-source-preset');
    fireEvent.click(presetTab);

    expect(screen.getByTestId('mock-preset-users')).toBeInTheDocument();
    expect(screen.getByTestId('mock-preset-products')).toBeInTheDocument();

    // Select Products preset
    fireEvent.click(screen.getByTestId('mock-preset-products'));

    // Switch to Schema
    const schemaTab = screen.getByTestId('mock-source-schema');
    fireEvent.click(schemaTab);
    expect(screen.getByTestId('mock-schema-textarea')).toBeInTheDocument();
  });

  it('updates rule type when category dropdown changes', () => {
    render(
      <JsonMockDataModal
        isOpen={true}
        onClose={onCloseMock}
        currentJsonText={sampleJson}
        onInsertIntoEditor={onInsertMock}
      />
    );

    const nameSelect = screen.getByTestId('rule-type-select-name');
    expect(nameSelect).toBeInTheDocument();

    fireEvent.change(nameSelect, { target: { value: 'company' } });
    expect(nameSelect).toHaveValue('company');
  });

  it('copies generated output to clipboard', async () => {
    render(
      <JsonMockDataModal
        isOpen={true}
        onClose={onCloseMock}
        currentJsonText={sampleJson}
        onInsertIntoEditor={onInsertMock}
      />
    );

    const copyBtn = screen.getByTestId('mock-copy-btn');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('inserts generated mock data into JSON Workspace editor and closes modal', () => {
    render(
      <JsonMockDataModal
        isOpen={true}
        onClose={onCloseMock}
        currentJsonText={sampleJson}
        onInsertIntoEditor={onInsertMock}
      />
    );

    const insertBtn = screen.getByTestId('mock-insert-editor-btn');
    fireEvent.click(insertBtn);

    expect(onInsertMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('closes modal when close button is clicked', () => {
    render(
      <JsonMockDataModal
        isOpen={true}
        onClose={onCloseMock}
        currentJsonText={sampleJson}
        onInsertIntoEditor={onInsertMock}
      />
    );

    const closeBtn = screen.getByTestId('mock-modal-close-btn');
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
