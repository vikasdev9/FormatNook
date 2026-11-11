import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonWorkspace } from '../components/JsonWorkspace';

describe('JsonWorkspace Resizer Interaction & Accessibility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders resizer separator with correct ARIA attributes', () => {
    render(<JsonWorkspace />);
    const resizer = screen.getByTestId('workspace-panels-resizer');

    expect(resizer).toBeInTheDocument();
    expect(resizer).toHaveAttribute('role', 'separator');
    expect(resizer).toHaveAttribute('aria-orientation', 'vertical');
    expect(resizer).toHaveAttribute('aria-valuenow', '50');
    expect(resizer).toHaveAttribute('aria-valuemin', '20');
    expect(resizer).toHaveAttribute('aria-valuemax', '80');
    expect(resizer).toHaveAttribute('tabindex', '0');
  });

  it('adjusts panel ratio via keyboard ArrowLeft and ArrowRight keys', () => {
    render(<JsonWorkspace />);
    const resizer = screen.getByTestId('workspace-panels-resizer');

    // ArrowLeft decreases ratio
    fireEvent.keyDown(resizer, { key: 'ArrowLeft' });
    expect(resizer).toHaveAttribute('aria-valuenow', '48');

    // ArrowRight increases ratio
    fireEvent.keyDown(resizer, { key: 'ArrowRight' });
    expect(resizer).toHaveAttribute('aria-valuenow', '50');

    // Shift + ArrowRight increases by 10
    fireEvent.keyDown(resizer, { key: 'ArrowRight', shiftKey: true });
    expect(resizer).toHaveAttribute('aria-valuenow', '60');

    // Home resets to 50
    fireEvent.keyDown(resizer, { key: 'Home' });
    expect(resizer).toHaveAttribute('aria-valuenow', '50');
  });

  it('clamps ratio within minimum 20% and maximum 80% limits', () => {
    render(<JsonWorkspace />);
    const resizer = screen.getByTestId('workspace-panels-resizer');

    // Decrease below minimum
    for (let i = 0; i < 20; i++) {
      fireEvent.keyDown(resizer, { key: 'ArrowLeft', shiftKey: true });
    }
    expect(Number(resizer.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(20);

    // Increase above maximum
    for (let i = 0; i < 20; i++) {
      fireEvent.keyDown(resizer, { key: 'ArrowRight', shiftKey: true });
    }
    expect(Number(resizer.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(80);
  });

  it('handles pointer down and resets ratio on double click', () => {
    render(<JsonWorkspace />);
    const resizer = screen.getByTestId('workspace-panels-resizer');

    // Pointer down event
    fireEvent.pointerDown(resizer, { pointerId: 1, pointerType: 'touch', clientX: 300 });

    // Double-click resets
    fireEvent.doubleClick(resizer);
    expect(resizer).toHaveAttribute('aria-valuenow', '50');
  });
});

