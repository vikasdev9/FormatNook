import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CsvWorkspace } from '../components/CsvWorkspace';

describe('CsvWorkspace Component Suite', () => {
  it('renders the CSV workspace with default e-commerce sample dataset', () => {
    const { container } = render(<CsvWorkspace />);

    expect(screen.getByTestId('csv-workspace')).toBeDefined();
    expect(screen.getByTestId('select-sample-csv')).toBeDefined();
    expect(screen.getByTestId('btn-upload-file')).toBeDefined();
    expect(screen.getByTestId('btn-download-json')).toBeDefined();

    const textarea = screen.getByTestId('csv-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('Wireless Noise-Canceling Headphones');
  });

  it('switches between workspace tabs properly', () => {
    const { container } = render(<CsvWorkspace />);

    // Switch to Table Preview tab
    const previewTab = screen.getByTestId('tab-preview');
    fireEvent.click(previewTab);
    expect(screen.getByTestId('csv-preview-table-container')).toBeDefined();
    expect(screen.getByTestId('meta-total-rows').textContent).toBe('4');

    // Switch to Conversion Options tab
    const settingsTab = screen.getByTestId('tab-settings');
    fireEvent.click(settingsTab);
    expect(screen.getByTestId('csv-settings-panel')).toBeDefined();

    // Switch to JSON Output tab
    const outputTab = screen.getByTestId('tab-output');
    fireEvent.click(outputTab);
    expect(screen.getByTestId('csv-output-pane')).toBeDefined();
    expect(screen.getByTestId('output-mode-badge').textContent).toBe('ARRAY-OF-OBJECTS');
  });

  it('changes sample dataset and updates parsed output', () => {
    render(<CsvWorkspace />);

    const sampleSelect = screen.getByTestId('select-sample-csv');
    fireEvent.change(sampleSelect, { target: { value: 'nested' } });

    const textarea = screen.getByTestId('csv-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('Ada Lovelace');
    expect(textarea.value).toContain('user.address.city');
  });

  it('clears CSV input when clicking clear button', () => {
    render(<CsvWorkspace />);

    const clearBtn = screen.getByTestId('btn-clear-csv');
    fireEvent.click(clearBtn);

    const textarea = screen.getByTestId('csv-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('updates options when changing delimiter and output mode', () => {
    render(<CsvWorkspace initialTab="settings" />);

    const delimiterSelect = screen.getByTestId('select-delimiter');
    fireEvent.change(delimiterSelect, { target: { value: ';' } });

    const outputModeSelect = screen.getByTestId('select-output-mode');
    fireEvent.change(outputModeSelect, { target: { value: 'array-of-arrays' } });

    // Switch to Output tab
    fireEvent.click(screen.getByTestId('tab-output'));
    expect(screen.getByTestId('output-mode-badge').textContent).toBe('ARRAY-OF-ARRAYS');
  });
});
