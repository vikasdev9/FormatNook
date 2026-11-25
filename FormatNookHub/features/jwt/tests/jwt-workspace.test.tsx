import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JwtWorkspace } from '../components/JwtWorkspace';

describe('JwtWorkspace Component', () => {
  it('renders the JWT workspace with initial sample token and valid format badge', () => {
    render(<JwtWorkspace />);

    expect(screen.getByTestId('jwt-workspace')).toBeDefined();
    expect(screen.getByTestId('jwt-raw-input')).toBeDefined();
    expect(screen.getByTestId('badge-jwt-valid')).toBeDefined();
    expect(screen.getByTestId('jwt-security-warning')).toBeDefined();
    expect(screen.getByTestId('jwt-overview-panel')).toBeDefined();
  });

  it('updates live decoded claims when user edits the token input', () => {
    render(<JwtWorkspace />);

    const textarea = screen.getByTestId('jwt-raw-input') as HTMLTextAreaElement;

    // Paste an invalid token
    fireEvent.change(textarea, { target: { value: 'not.a.valid.jwt.token' } });

    expect(screen.getByTestId('badge-jwt-invalid')).toBeDefined();
    expect(screen.getByTestId('jwt-errors-container')).toBeDefined();
  });

  it('switches between all 8 workspace tabs', () => {
    render(<JwtWorkspace />);

    // Header Tab
    fireEvent.click(screen.getByTestId('tab-header'));
    expect(screen.getByTestId('jwt-header-panel')).toBeDefined();
    expect(screen.getByTestId('header-json-textarea')).toBeDefined();

    // Payload Tab
    fireEvent.click(screen.getByTestId('tab-payload'));
    expect(screen.getByTestId('jwt-payload-panel')).toBeDefined();
    expect(screen.getByTestId('payload-json-textarea')).toBeDefined();

    // Expiry Tab
    fireEvent.click(screen.getByTestId('tab-expiry'));
    expect(screen.getByTestId('jwt-expiry-panel')).toBeDefined();
    expect(screen.getByTestId('clock-skew-slider')).toBeDefined();

    // Signature Tab
    fireEvent.click(screen.getByTestId('tab-signature'));
    expect(screen.getByTestId('jwt-signature-panel')).toBeDefined();

    // Reference Tab
    fireEvent.click(screen.getByTestId('tab-reference'));
    expect(screen.getByTestId('jwt-reference-panel')).toBeDefined();

    // Converter Tab
    fireEvent.click(screen.getByTestId('tab-converter'));
    expect(screen.getByTestId('jwt-converter-panel')).toBeDefined();

    // Cleaner Tab
    fireEvent.click(screen.getByTestId('tab-cleaner'));
    expect(screen.getByTestId('jwt-cleaner-panel')).toBeDefined();

    // Back to Overview
    fireEvent.click(screen.getByTestId('tab-overview'));
    expect(screen.getByTestId('jwt-overview-panel')).toBeDefined();
  });

  it('clears token input and resets decoded state when ResetButton is clicked', () => {
    render(<JwtWorkspace />);

    const clearBtn = screen.getByTestId('btn-reset');
    fireEvent.click(clearBtn);

    const textarea = screen.getByTestId('jwt-raw-input') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    expect(screen.getByText(/Ready for input/i)).toBeDefined();
  });
});
