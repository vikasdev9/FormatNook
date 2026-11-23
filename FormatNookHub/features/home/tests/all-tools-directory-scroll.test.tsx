import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllToolsDirectory } from '@/components/home/AllToolsDirectory';

describe('AllToolsDirectory Scrollable Filter & Option Menu Suite', () => {
  it('renders scrollable category filters container and all category tabs', () => {
    const { container } = render(<AllToolsDirectory />);

    const filterContainer = container.querySelector('.directory-filters');
    expect(filterContainer).not.toBeNull();

    const tabs = container.querySelectorAll('.filter-tab');
    // "All Categories" + 11 distinct categories = 12 tabs
    expect(tabs.length).toBeGreaterThanOrEqual(12);

    const allTab = tabs[0];
    expect(allTab.textContent).toContain('All Categories');
    expect(allTab.classList.contains('active')).toBe(true);
  });

  it('renders the responsive category option select dropdown', () => {
    const { container } = render(<AllToolsDirectory />);

    const select = container.querySelector('.directory-mobile-select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe('all');

    const options = select.querySelectorAll('option');
    expect(options.length).toBeGreaterThanOrEqual(12);
  });

  it('synchronizes selection between option dropdown and category tabs', () => {
    const { container } = render(<AllToolsDirectory />);

    const select = container.querySelector('.directory-mobile-select') as HTMLSelectElement;
    expect(select).not.toBeNull();

    // Select "image" category from option menu
    fireEvent.change(select, { target: { value: 'image' } });
    expect(select.value).toBe('image');

    // The Image Utilities tab should now be active
    const tabs = Array.from(container.querySelectorAll('.filter-tab'));
    const imageTab = tabs.find((t) => t.textContent?.includes('Image Utilities'));
    expect(imageTab).toBeDefined();
    expect(imageTab?.classList.contains('active')).toBe(true);

    // All Categories tab should not be active
    const allTab = tabs[0];
    expect(allTab.classList.contains('active')).toBe(false);
  });

  it('updates selection when clicking a category tab', () => {
    const { container } = render(<AllToolsDirectory />);

    const tabs = Array.from(container.querySelectorAll('.filter-tab'));
    const jsonTab = tabs.find((t) => t.textContent?.includes('JSON Tools'));
    expect(jsonTab).toBeDefined();

    fireEvent.click(jsonTab!);
    expect(jsonTab?.classList.contains('active')).toBe(true);

    const select = container.querySelector('.directory-mobile-select') as HTMLSelectElement;
    expect(select.value).toBe('json');
  });

  it('filters tool cards by keyword search query', () => {
    const { container } = render(<AllToolsDirectory />);

    const searchInput = screen.getByPlaceholderText(/Filter tools by keyword/i);
    expect(searchInput).toBeDefined();

    fireEvent.change(searchInput, { target: { value: 'watermark' } });

    // Should match Watermark tool
    expect(screen.getAllByText(/Watermark/i).length).toBeGreaterThanOrEqual(1);
  });
});
