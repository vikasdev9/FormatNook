import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllToolsDirectory } from '@/components/home/AllToolsDirectory';

describe('AllToolsDirectory Scrollable Filter Suite', () => {
  it('renders scrollable category filters container and all category tabs', () => {
    const { container } = render(<AllToolsDirectory />);

    const filterContainer = container.querySelector('.directory-filters');
    expect(filterContainer).not.toBeNull();

    const tabs = container.querySelectorAll('.filter-tab');
    // "All Categories" + 10 distinct categories = 11 tabs
    expect(tabs.length).toBeGreaterThanOrEqual(11);

    const allTab = tabs[0];
    expect(allTab.textContent).toContain('All Categories');
    expect(allTab.classList.contains('active')).toBe(true);
  });

  it('does NOT render a mobile option select dropdown (keeps pills scroller)', () => {
    const { container } = render(<AllToolsDirectory />);

    const select = container.querySelector('.directory-mobile-select');
    expect(select).toBeNull();
  });

  it('updates selection when clicking a category tab', () => {
    const { container } = render(<AllToolsDirectory />);

    const tabs = Array.from(container.querySelectorAll('.filter-tab'));
    const jsonTab = tabs.find((t) => t.textContent?.includes('JSON Tools'));
    expect(jsonTab).toBeDefined();

    fireEvent.click(jsonTab!);
    expect(jsonTab?.classList.contains('active')).toBe(true);

    // All Categories tab should no longer be active
    const allTab = tabs[0];
    expect(allTab.classList.contains('active')).toBe(false);
  });

  it('filters tool cards by keyword search query', () => {
    const { container } = render(<AllToolsDirectory />);

    const searchInput = screen.getByPlaceholderText(/Filter tools by keyword/i);
    expect(searchInput).toBeDefined();

    fireEvent.change(searchInput, { target: { value: 'watermark' } });

    // Should match Watermark tool
    expect(screen.getAllByText(/Watermark/i).length).toBeGreaterThanOrEqual(1);
  });

  it('handles mouse drag and wheel interaction on the scroll container', () => {
    const { container } = render(<AllToolsDirectory />);
    const filterContainer = container.querySelector('.directory-filters') as HTMLDivElement;
    expect(filterContainer).not.toBeNull();

    // Wheel event
    fireEvent.wheel(filterContainer, { deltaY: 100, deltaX: 0 });

    // Mouse drag events
    fireEvent.mouseDown(filterContainer, { clientX: 200, pageX: 200 });
    fireEvent.mouseMove(filterContainer, { clientX: 100, pageX: 100 });
    expect(filterContainer.classList.contains('is-dragging')).toBe(true);

    fireEvent.mouseUp(filterContainer);
    expect(filterContainer.classList.contains('is-dragging')).toBe(false);
  });
});
