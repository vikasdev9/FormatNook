import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EncoderDecoderWorkspace } from '../components/EncoderDecoderWorkspace';

vi.mock('@/lib/download', () => ({
  downloadFile: vi.fn(),
  downloadDataUrl: vi.fn(),
}));

vi.mock('@/lib/clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/tools/base64-encode',
  useSearchParams: () => new URLSearchParams(),
}));

describe('EncoderDecoderWorkspace Component Redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders redesigned two-tier toolbar with primary actions and format pills', () => {
    render(
      <EncoderDecoderWorkspace
        toolId="text-to-base64"
        direction="encode"
        defaultSample="Hello, FormatNook!"
      />
    );

    // Primary action buttons
    expect(screen.getByTestId('btn-encode')).toBeInTheDocument();
    expect(screen.getByTestId('btn-decode')).toBeInTheDocument();
    expect(screen.getByTestId('btn-swap')).toBeInTheDocument();
    expect(screen.getByTestId('btn-reset')).toBeInTheDocument();

    // Format selection pills
    expect(screen.getByTestId('btn-format-base64-text')).toBeInTheDocument();
    expect(screen.getByTestId('btn-format-base64-file')).toBeInTheDocument();
    expect(screen.getByTestId('btn-format-url')).toBeInTheDocument();
    expect(screen.getByTestId('btn-format-hex')).toBeInTheDocument();
    expect(screen.getByTestId('btn-format-html-entities')).toBeInTheDocument();

    // Secondary options toolbar for Base64 Text
    expect(screen.getByTestId('checkbox-url-safe')).toBeInTheDocument();

    // Standardized 40px panel headers
    expect(screen.getByText(/input text \/ payload/i)).toBeInTheDocument();
    expect(screen.getByText(/encoded output/i)).toBeInTheDocument();

    // Split resizer
    const resizer = screen.getByRole('separator', { name: /resize encoder input and output panels/i });
    expect(resizer).toBeInTheDocument();
  });

  it('switches formats and displays format-specific secondary options', () => {
    render(
      <EncoderDecoderWorkspace
        toolId="text-to-base64"
        direction="encode"
        defaultSample="Hello, World!"
      />
    );

    // Switch to URL format
    fireEvent.click(screen.getByTestId('btn-format-url'));
    expect(screen.getByTestId('toggle-url-component')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-url-full')).toBeInTheDocument();

    // Switch to Hex format
    fireEvent.click(screen.getByTestId('btn-format-hex'));
    expect(screen.getByTestId('select-hex-delimiter')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-hex-uppercase')).toBeInTheDocument();

    // Switch to HTML Entities format
    fireEvent.click(screen.getByTestId('btn-format-html-entities'));
    expect(screen.getByTestId('toggle-html-named')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-html-numeric')).toBeInTheDocument();
  });

  it('encodes URL strings correctly via toolbar controls', () => {
    render(
      <EncoderDecoderWorkspace
        toolId="text-to-base64"
        direction="encode"
      />
    );

    // Switch to URL format
    fireEvent.click(screen.getByTestId('btn-format-url'));

    const textareas = screen.getAllByRole('textbox');
    const inputArea = textareas[0] as HTMLTextAreaElement;

    fireEvent.change(inputArea, { target: { value: 'https://example.com/search?q=hello world' } });
    fireEvent.click(screen.getByTestId('btn-encode'));

    const outputArea = textareas[1] as HTMLTextAreaElement;
    expect(outputArea.value).toContain('https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world');
  });

  it('encodes Hex strings correctly via toolbar controls', () => {
    render(
      <EncoderDecoderWorkspace
        toolId="text-to-base64"
        direction="encode"
      />
    );

    // Switch to Hex format
    fireEvent.click(screen.getByTestId('btn-format-hex'));

    const textareas = screen.getAllByRole('textbox');
    const inputArea = textareas[0] as HTMLTextAreaElement;

    fireEvent.change(inputArea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByTestId('btn-encode'));

    const outputArea = textareas[1] as HTMLTextAreaElement;
    // 'Hello' in hex is 48 65 6c 6c 6f or 48656c6c6f
    expect(outputArea.value.replace(/\s+/g, '').toLowerCase()).toBe('48656c6c6f');
  });

  it('swaps input and output when Swap button is clicked', () => {
    render(
      <EncoderDecoderWorkspace
        toolId="text-to-base64"
        direction="encode"
      />
    );

    const textareas = screen.getAllByRole('textbox');
    const inputArea = textareas[0] as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: 'Test Swap' } });

    // Encode
    fireEvent.click(screen.getByTestId('btn-encode'));

    const outputArea = textareas[1] as HTMLTextAreaElement;
    expect(outputArea.value).toBe('VGVzdCBTd2Fw');

    // Click Swap
    fireEvent.click(screen.getByTestId('btn-swap'));

    expect(inputArea.value).toBe('VGVzdCBTd2Fw');
  });

  it('handles resizer keyboard navigation and double-click reset', () => {
    render(
      <EncoderDecoderWorkspace
        toolId="text-to-base64"
        direction="encode"
      />
    );

    const resizer = screen.getByRole('separator', { name: /resize encoder input and output panels/i });

    // Press ArrowRight to increase left panel ratio by 5
    fireEvent.keyDown(resizer, { key: 'ArrowRight' });
    expect(resizer).toHaveAttribute('aria-valuenow', '55');

    // Press ArrowLeft
    fireEvent.keyDown(resizer, { key: 'ArrowLeft' });
    expect(resizer).toHaveAttribute('aria-valuenow', '50');

    // Double-click to reset to 50
    fireEvent.doubleClick(resizer);
    expect(resizer).toHaveAttribute('aria-valuenow', '50');
  });
});
