import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BeautifierWorkspace } from '../components/BeautifierWorkspace';

vi.mock('@/lib/download', () => ({
  downloadFile: vi.fn(),
  downloadDataUrl: vi.fn(),
}));

vi.mock('@/lib/clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

describe('BeautifierWorkspace Component Redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders two-tier toolbar with primary actions, format pills, and panel headers', () => {
    render(
      <BeautifierWorkspace
        language="javascript"
        defaultSample="function test(){return 42;}"
        outputFileName="test.js"
        mimeType="application/javascript"
        fileExtensions={['.js']}
      />
    );

    // Primary action buttons
    expect(screen.getByTestId('btn-format')).toBeInTheDocument();
    expect(screen.getByTestId('btn-minify')).toBeInTheDocument();
    expect(screen.getByTestId('btn-validate')).toBeInTheDocument();
    expect(screen.getByTestId('btn-reset')).toBeInTheDocument();
    expect(screen.getByTestId('btn-shortcuts')).toBeInTheDocument();

    // Format selection pills
    expect(screen.getByTestId('btn-format-javascript')).toBeInTheDocument();
    expect(screen.getByTestId('btn-format-html')).toBeInTheDocument();
    expect(screen.getByTestId('btn-format-css')).toBeInTheDocument();
    expect(screen.getByTestId('btn-format-sql')).toBeInTheDocument();

    // Secondary options: JS quotes and shared indent
    expect(screen.getByTestId('select-indent')).toBeInTheDocument();
    expect(screen.getByTestId('select-quotes')).toBeInTheDocument();

    // Standardized 40px panel headers
    expect(screen.getByText(/Input \(JavaScript\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Output \(Beautified\)/i)).toBeInTheDocument();

    // Accessible split resizer
    const resizer = screen.getByRole('separator', {
      name: /resize beautifier input and output panels/i,
    });
    expect(resizer).toBeInTheDocument();
  });

  it('switches languages in-place and renders format-relevant secondary options', () => {
    render(
      <BeautifierWorkspace
        language="javascript"
        defaultSample="const x = 1;"
        outputFileName="formatted.js"
        mimeType="application/javascript"
        fileExtensions={['.js']}
      />
    );

    // Switch to HTML
    fireEvent.click(screen.getByTestId('btn-format-html'));
    expect(screen.getByText(/Input \(HTML\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-html-comments')).toBeInTheDocument();

    // Switch to CSS
    fireEvent.click(screen.getByTestId('btn-format-css'));
    expect(screen.getByText(/Input \(CSS\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-css-comments')).toBeInTheDocument();

    // Switch to SQL
    fireEvent.click(screen.getByTestId('btn-format-sql'));
    expect(screen.getByText(/Input \(SQL\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('select-sql-keyword-case')).toBeInTheDocument();
  });

  it('executes Minify mode when Minify button is clicked', () => {
    render(
      <BeautifierWorkspace
        language="css"
        defaultSample={'.card { background: #fff; margin: 10px; }'}
        outputFileName="formatted.css"
        mimeType="text/css"
        fileExtensions={['.css']}
      />
    );

    const minifyBtn = screen.getByTestId('btn-minify');
    fireEvent.click(minifyBtn);

    expect(screen.getByText(/Output \(Minified\)/i)).toBeInTheDocument();
  });

  it('executes Validate mode and shows syntax status badge', () => {
    render(
      <BeautifierWorkspace
        language="javascript"
        defaultSample="function valid() { return true; }"
        outputFileName="formatted.js"
        mimeType="application/javascript"
        fileExtensions={['.js']}
      />
    );

    const validateBtn = screen.getByTestId('btn-validate');
    fireEvent.click(validateBtn);

    expect(screen.getByText(/Output \(Validated\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('beautifier-status-badge')).toBeInTheDocument();
    expect(screen.getByText(/Valid Syntax/i)).toBeInTheDocument();
  });

  it('clears editors when Clear button is clicked', () => {
    render(
      <BeautifierWorkspace
        language="javascript"
        defaultSample="const clearMe = true;"
        outputFileName="formatted.js"
        mimeType="application/javascript"
        fileExtensions={['.js']}
      />
    );

    const resetBtn = screen.getByTestId('btn-reset');
    fireEvent.click(resetBtn);

    expect(screen.getAllByText(/0 lines • 0 chars/i).length).toBe(2);
  });

  it('handles resizer keyboard navigation and double-click reset', () => {
    render(
      <BeautifierWorkspace
        language="javascript"
        defaultSample="const a = 1;"
        outputFileName="test.js"
        mimeType="application/javascript"
        fileExtensions={['.js']}
      />
    );

    const resizer = screen.getByRole('separator', {
      name: /resize beautifier input and output panels/i,
    });

    // Press ArrowRight to increase left panel ratio by 5
    fireEvent.keyDown(resizer, { key: 'ArrowRight' });
    expect(resizer).toHaveAttribute('aria-valuenow', '55');

    // Press ArrowLeft to decrease back to 50
    fireEvent.keyDown(resizer, { key: 'ArrowLeft' });
    expect(resizer).toHaveAttribute('aria-valuenow', '50');

    // Double-click resets to 50
    fireEvent.doubleClick(resizer);
    expect(resizer).toHaveAttribute('aria-valuenow', '50');
  });

  it('switches mobile view tabs without losing state', () => {
    render(
      <BeautifierWorkspace
        language="html"
        defaultSample="<div>Hello</div>"
        outputFileName="formatted.html"
        mimeType="text/html"
        fileExtensions={['.html']}
      />
    );

    const inputTab = screen.getByTestId('tab-mobile-input');
    fireEvent.click(inputTab);
    expect(inputTab).toHaveClass('active');

    const outputTab = screen.getByTestId('tab-mobile-output');
    fireEvent.click(outputTab);
    expect(outputTab).toHaveClass('active');

    const bothTab = screen.getByTestId('tab-mobile-both');
    fireEvent.click(bothTab);
    expect(bothTab).toHaveClass('active');
  });
});
