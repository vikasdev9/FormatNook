import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UuidWorkspace } from '../components/UuidWorkspace';

describe('UuidWorkspace Component', () => {
  it('renders the UUID workspace with generator panel and default batch', () => {
    render(<UuidWorkspace />);

    expect(screen.getByTestId('uuid-workspace')).toBeDefined();
    expect(screen.getByTestId('uuid-generator-panel')).toBeDefined();
    expect(screen.getByTestId('uuid-quantity-input')).toBeDefined();
    expect(screen.getByTestId('btn-generate-uuids')).toBeDefined();
    expect(screen.getByTestId('badge-total-uuids').textContent).toContain('10 total');
  });

  it('generates new UUIDs when clicking Generate button or presets', () => {
    render(<UuidWorkspace />);

    // Click 25 preset
    const preset25 = screen.getByTestId('preset-25');
    fireEvent.click(preset25);
    expect(screen.getByTestId('badge-total-uuids').textContent).toContain('25 total');

    // Click Generate UUIDs button
    const generateBtn = screen.getByTestId('btn-generate-uuids');
    fireEvent.click(generateBtn);
    expect(screen.getByTestId('uuid-results-container')).toBeDefined();
  });

  it('updates presentation formatting when toggling uppercase and braces', () => {
    render(<UuidWorkspace />);

    const uppercaseCheckbox = screen.getByTestId('opt-uppercase');
    fireEvent.click(uppercaseCheckbox);

    expect(screen.getByTestId('uuid-value-0').textContent).toMatch(/^[0-9A-F-]+$/);

    const bracesCheckbox = screen.getByTestId('opt-braces');
    fireEvent.click(bracesCheckbox);

    const bracedValue = screen.getByTestId('uuid-value-0').textContent;
    expect(bracedValue?.startsWith('{')).toBe(true);
    expect(bracedValue?.endsWith('}')).toBe(true);
  });

  it('switches between all 5 workspace tabs', () => {
    render(<UuidWorkspace />);

    // Validator Tab
    fireEvent.click(screen.getByTestId('tab-validator'));
    expect(screen.getByTestId('uuid-validator-panel')).toBeDefined();
    expect(screen.getByTestId('stat-total')).toBeDefined();

    // Converter Tab
    fireEvent.click(screen.getByTestId('tab-converter'));
    expect(screen.getByTestId('uuid-converter-panel')).toBeDefined();

    // Deduplicator Tab
    fireEvent.click(screen.getByTestId('tab-deduplicator'));
    expect(screen.getByTestId('uuid-deduplicator-panel')).toBeDefined();

    // Info Tab
    fireEvent.click(screen.getByTestId('tab-info'));
    expect(screen.getByTestId('uuid-info-panel')).toBeDefined();

    // Back to Generator Tab
    fireEvent.click(screen.getByTestId('tab-generator'));
    expect(screen.getByTestId('uuid-generator-panel')).toBeDefined();
  });

  it('clears generated results when clicking Clear button', () => {
    render(<UuidWorkspace />);

    const clearBtn = screen.getByTestId('btn-clear-uuids');
    fireEvent.click(clearBtn);

    expect(screen.getByText(/No UUIDs generated yet/i)).toBeDefined();
    expect(screen.getByTestId('badge-total-uuids').textContent).toContain('0 total');
  });
});
