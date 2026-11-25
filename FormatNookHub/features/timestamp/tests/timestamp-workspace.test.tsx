import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimestampWorkspace } from '../components/TimestampWorkspace';

describe('TimestampWorkspace Component', () => {
  it('renders live epoch clock header and primary tab panels', () => {
    render(<TimestampWorkspace />);

    expect(screen.getByTestId('timestamp-workspace')).toBeDefined();
    expect(screen.getByTestId('live-epoch-clock')).toBeDefined();
    expect(screen.getByTestId('live-epoch-seconds')).toBeDefined();
    expect(screen.getByTestId('panel-ts-to-date')).toBeDefined();
    expect(screen.getByTestId('input-timestamp')).toBeDefined();
  });

  it('switches between tabs cleanly', () => {
    render(<TimestampWorkspace />);

    // Date to TS Tab
    fireEvent.click(screen.getByTestId('tab-date-to-ts'));
    expect(screen.getByTestId('panel-date-to-ts')).toBeDefined();
    expect(screen.getByTestId('input-date')).toBeDefined();

    // Cheat Sheet Tab
    fireEvent.click(screen.getByTestId('tab-cheat-sheet'));
    expect(screen.getByTestId('panel-cheat-sheet')).toBeDefined();
    expect(screen.getByText(/Year 2038 Overflow/i)).toBeDefined();

    // Back to TS to Date Tab
    fireEvent.click(screen.getByTestId('tab-ts-to-date'));
    expect(screen.getByTestId('panel-ts-to-date')).toBeDefined();
  });

  it('converts timestamp to date and allows changing timezone', () => {
    render(<TimestampWorkspace />);

    const tsInput = screen.getByTestId('input-timestamp');
    fireEvent.change(tsInput, { target: { value: '1711234567' } });

    expect(screen.getByTestId('ts-results-container')).toBeDefined();
    expect(screen.getByText(/2024-03-23T22:56:07.000Z/i)).toBeDefined();

    // Change timezone
    const tzSelect = screen.getByTestId('select-timezone');
    fireEvent.change(tzSelect, { target: { value: 'Asia/Tokyo' } });
    expect(screen.getByTestId('target-tz-result')).toBeDefined();
  });

  it('converts human date to unix timestamp in date-to-ts tab', () => {
    render(<TimestampWorkspace />);

    fireEvent.click(screen.getByTestId('tab-date-to-ts'));
    const dateInput = screen.getByTestId('input-date');

    fireEvent.change(dateInput, { target: { value: '2024-03-23T22:56:07.000Z' } });

    expect(screen.getByTestId('date-results-container')).toBeDefined();
    expect(screen.getByTestId('result-seconds').textContent).toBe('1711234567');
  });

  it('displays user error message for malformed timestamp input', () => {
    render(<TimestampWorkspace />);

    const tsInput = screen.getByTestId('input-timestamp');
    fireEvent.change(tsInput, { target: { value: 'not-a-number' } });

    expect(screen.getByText(/Invalid numeric timestamp format/i)).toBeDefined();
  });
});
