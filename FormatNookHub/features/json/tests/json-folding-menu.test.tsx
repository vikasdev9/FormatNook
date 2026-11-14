import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonFoldingMenu } from '../components/JsonFoldingMenu';

describe('JsonFoldingMenu Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button and remains closed by default', () => {
    render(
      <JsonFoldingMenu
        onExpandAll={vi.fn()}
        onCollapseAll={vi.fn()}
        onFoldLevel={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('json-folding-menu-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('json-folding-menu-dropdown')).not.toBeInTheDocument();
  });

  it('opens dropdown on click and displays all actions', () => {
    render(
      <JsonFoldingMenu
        onExpandAll={vi.fn()}
        onCollapseAll={vi.fn()}
        onFoldLevel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('json-folding-menu-trigger'));

    expect(screen.getByTestId('json-folding-menu-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('action-expand-all')).toBeInTheDocument();
    expect(screen.getByTestId('action-collapse-all')).toBeInTheDocument();

    for (let lvl = 1; lvl <= 5; lvl++) {
      expect(screen.getByTestId(`action-fold-level-${lvl}`)).toBeInTheDocument();
    }
  });

  it('invokes onExpandAll and closes menu when clicking Expand All', () => {
    const onExpandAll = vi.fn();
    render(
      <JsonFoldingMenu
        onExpandAll={onExpandAll}
        onCollapseAll={vi.fn()}
        onFoldLevel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('json-folding-menu-trigger'));
    fireEvent.click(screen.getByTestId('action-expand-all'));

    expect(onExpandAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('json-folding-menu-dropdown')).not.toBeInTheDocument();
  });

  it('invokes onCollapseAll and closes menu when clicking Collapse All', () => {
    const onCollapseAll = vi.fn();
    render(
      <JsonFoldingMenu
        onExpandAll={vi.fn()}
        onCollapseAll={onCollapseAll}
        onFoldLevel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('json-folding-menu-trigger'));
    fireEvent.click(screen.getByTestId('action-collapse-all'));

    expect(onCollapseAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('json-folding-menu-dropdown')).not.toBeInTheDocument();
  });

  it('invokes onFoldLevel with level number and closes menu', () => {
    const onFoldLevel = vi.fn();
    render(
      <JsonFoldingMenu
        onExpandAll={vi.fn()}
        onCollapseAll={vi.fn()}
        onFoldLevel={onFoldLevel}
      />
    );

    fireEvent.click(screen.getByTestId('json-folding-menu-trigger'));
    fireEvent.click(screen.getByTestId('action-fold-level-2'));

    expect(onFoldLevel).toHaveBeenCalledWith(2);
    expect(screen.queryByTestId('json-folding-menu-dropdown')).not.toBeInTheDocument();
  });

  it('displays active state for the selected fold level', () => {
    render(
      <JsonFoldingMenu
        onExpandAll={vi.fn()}
        onCollapseAll={vi.fn()}
        onFoldLevel={vi.fn()}
        activeFoldLevel={3}
      />
    );

    fireEvent.click(screen.getByTestId('json-folding-menu-trigger'));

    const level3Item = screen.getByTestId('action-fold-level-3');
    expect(level3Item).toHaveClass('active');
    expect(level3Item.textContent).toContain('Active');
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <JsonFoldingMenu
          onExpandAll={vi.fn()}
          onCollapseAll={vi.fn()}
          onFoldLevel={vi.fn()}
        />
      </div>
    );

    fireEvent.click(screen.getByTestId('json-folding-menu-trigger'));
    expect(screen.getByTestId('json-folding-menu-dropdown')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(screen.queryByTestId('json-folding-menu-dropdown')).not.toBeInTheDocument();
  });

  it('closes dropdown on Escape key', () => {
    render(
      <JsonFoldingMenu
        onExpandAll={vi.fn()}
        onCollapseAll={vi.fn()}
        onFoldLevel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('json-folding-menu-trigger'));
    expect(screen.getByTestId('json-folding-menu-dropdown')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('json-folding-menu-dropdown')).not.toBeInTheDocument();
  });
});
