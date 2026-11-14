import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AllToolsDirectory } from '@/components/home/AllToolsDirectory';
import CategoryPage from '@/app/category/[slug]/page';
import EncodersDecodersDirectoryPage from '@/app/tools/encoders-decoders/page';

describe('AllToolsDirectory Component Contrast & Visibility', () => {
  it('renders all tool cards with solid opacity (no washed out opacity: 0.75)', () => {
    const { container } = render(<AllToolsDirectory />);

    const roadmapCards = container.querySelectorAll('.tool-card-roadmap');
    expect(roadmapCards.length).toBeGreaterThan(0);

    roadmapCards.forEach((card) => {
      const htmlEl = card as HTMLElement;
      // Opacity must NOT be 0.75 (which causes faint washed out text)
      expect(htmlEl.style.opacity).not.toBe('0.75');
      expect(card.classList.contains('tool-card-roadmap')).toBe(true);
    });
  });

  it('renders "In Roadmap" status with high-contrast text-secondary and bold weight', () => {
    const { container } = render(<AllToolsDirectory />);

    const roadmapBadges = Array.from(container.querySelectorAll('span')).filter((s) =>
      s.textContent?.includes('In Roadmap')
    );
    expect(roadmapBadges.length).toBeGreaterThan(0);

    roadmapBadges.forEach((badge) => {
      const htmlEl = badge as HTMLElement;
      expect(htmlEl.style.color).toBe('var(--text-secondary)');
      expect(htmlEl.style.fontWeight).toBe('600');
    });
  });

  it('renders "Available" status with bold success weight', () => {
    const { container } = render(<AllToolsDirectory />);

    const availableBadges = Array.from(container.querySelectorAll('span')).filter((s) =>
      s.textContent?.includes('Available')
    );
    expect(availableBadges.length).toBeGreaterThan(0);

    availableBadges.forEach((badge) => {
      const htmlEl = badge as HTMLElement;
      expect(htmlEl.style.color).toBe('var(--color-success)');
      expect(htmlEl.style.fontWeight).toBe('600');
    });
  });

  it('renders category badges without shrinking font size', () => {
    const { container } = render(<AllToolsDirectory />);

    const categoryBadges = container.querySelectorAll('.badge-neutral');
    expect(categoryBadges.length).toBeGreaterThan(0);

    categoryBadges.forEach((badge) => {
      const htmlEl = badge as HTMLElement;
      // Font size must not be forced down to 0.6875rem
      expect(htmlEl.style.fontSize).not.toBe('0.6875rem');
    });
  });
});

describe('CategoryPage Roadmap & Text Visibility', () => {
  it('renders planned tools in category page with solid opacity and high-contrast status', () => {
    // Render developer category which has planned tools
    const { container } = render(<CategoryPage params={{ slug: 'developer' }} />);

    const roadmapCards = container.querySelectorAll('.tool-card-roadmap');
    expect(roadmapCards.length).toBeGreaterThan(0);

    roadmapCards.forEach((card) => {
      const htmlEl = card as HTMLElement;
      expect(htmlEl.style.opacity).not.toBe('0.75');
      expect(card.classList.contains('tool-card-roadmap')).toBe(true);
    });

    const roadmapStatuses = Array.from(container.querySelectorAll('span')).filter((s) =>
      s.textContent?.includes('In Roadmap')
    );
    expect(roadmapStatuses.length).toBeGreaterThan(0);
    roadmapStatuses.forEach((span) => {
      const htmlEl = span as HTMLElement;
      expect(htmlEl.style.color).toBe('var(--text-secondary)');
      expect(htmlEl.style.fontWeight).toBe('600');
    });
  });
});

describe('EncodersDecodersDirectoryPage Accessibility', () => {
  it('renders search input with accessible aria-label and id', () => {
    render(<EncodersDecodersDirectoryPage />);
    const searchInput = screen.getByLabelText(/search encoders and decoders/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('id', 'encoder-search-input');
  });

  it('renders privacy shield badge with responsive class', () => {
    const { container } = render(<EncodersDecodersDirectoryPage />);
    const filterBar = container.querySelector('.encoder-filter-bar');
    const badge = container.querySelector('.encoder-privacy-badge');
    expect(filterBar).toBeInTheDocument();
    expect(badge).toBeInTheDocument();
  });
});
