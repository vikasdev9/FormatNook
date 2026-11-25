import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WordCounterWorkspace } from '../components/WordCounterWorkspace';

describe('WordCounterWorkspace Component', () => {
  it('renders the workspace with initial text and live statistics badges', () => {
    render(<WordCounterWorkspace />);

    expect(screen.getByTestId('word-counter-workspace')).toBeDefined();
    expect(screen.getByTestId('badge-word-count')).toBeDefined();
    expect(screen.getByTestId('badge-char-count')).toBeDefined();
    expect(screen.getByTestId('main-text-input')).toBeDefined();
    expect(screen.getByTestId('live-stats-panel')).toBeDefined();
  });

  it('updates live statistics dynamically when user edits text', () => {
    render(<WordCounterWorkspace />);

    const textarea = screen.getByTestId('main-text-input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Fast and private developer tools.' } });

    expect(screen.getByTestId('badge-word-count').textContent).toContain('5 words');
    expect(screen.getByTestId('badge-char-count').textContent).toContain('33 chars');
  });

  it('switches between workspace tabs cleanly', () => {
    render(<WordCounterWorkspace />);

    // Switch to Readability tab
    const readabilityTab = screen.getByTestId('tab-readability');
    fireEvent.click(readabilityTab);
    expect(screen.getByTestId('readability-panel')).toBeDefined();
    expect(screen.getByTestId('reading-ease-score')).toBeDefined();

    // Switch to Keyword Density tab
    const keywordsTab = screen.getByTestId('tab-keywords');
    fireEvent.click(keywordsTab);
    expect(screen.getByTestId('keyword-density-panel')).toBeDefined();

    // Switch to Social Media tab
    const socialTab = screen.getByTestId('tab-social');
    fireEvent.click(socialTab);
    expect(screen.getByTestId('social-media-panel')).toBeDefined();
    expect(screen.getByTestId('social-card-x')).toBeDefined();

    // Switch to Text Cleaner tab
    const cleanerTab = screen.getByTestId('tab-cleaner');
    fireEvent.click(cleanerTab);
    expect(screen.getByTestId('text-cleaner-panel')).toBeDefined();
  });

  it('adjusts reading and speaking speeds via sliders', () => {
    render(<WordCounterWorkspace />);

    const readingInput = screen.getByLabelText(/Reading speed in words per minute/i) as HTMLInputElement;
    fireEvent.change(readingInput, { target: { value: '300' } });
    expect(readingInput.value).toBe('300');
  });

  it('applies cleaned text back to the main editor when user confirms', () => {
    render(<WordCounterWorkspace />);

    // Switch to Cleaner tab
    fireEvent.click(screen.getByTestId('tab-cleaner'));

    // Select uppercase action
    fireEvent.click(screen.getByTestId('action-uppercase'));

    // Apply to editor
    const applyBtn = screen.getByTestId('btn-apply-cleaned');
    fireEvent.click(applyBtn);

    const textarea = screen.getByTestId('main-text-input') as HTMLTextAreaElement;
    expect(textarea.value).toContain('FORMATNOOK');
  });

  it('clears editor text and resets statistics when ResetButton is clicked', () => {
    render(<WordCounterWorkspace />);

    const clearBtn = screen.getByTestId('btn-reset');
    fireEvent.click(clearBtn);

    const textarea = screen.getByTestId('main-text-input') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    expect(screen.getByTestId('badge-word-count').textContent).toContain('0 words');
    expect(screen.getByTestId('badge-char-count').textContent).toContain('0 chars');
  });
});
