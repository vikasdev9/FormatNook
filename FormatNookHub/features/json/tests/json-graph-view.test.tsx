import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JsonGraphView } from '../components/JsonGraphView';

describe('JsonGraphView Component', () => {
  const mockData = {
    user: {
      id: 42,
      name: 'Alice Cooper',
      isActive: true,
      roles: ['admin', 'developer'],
    },
    settings: {
      theme: 'dark',
    },
  };

  beforeEach(() => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders the graph visualizer container, toolbar, canvas, and stats', () => {
    render(<JsonGraphView data={mockData} isDark={true} />);

    expect(screen.getByTestId('json-graph-visualizer')).toBeInTheDocument();
    expect(screen.getByTestId('json-graph-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('json-graph-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('json-graph-stats')).toBeInTheDocument();

    // Check stats rendering
    expect(screen.getByTestId('json-graph-stats')).toHaveTextContent('nodes');
    expect(screen.getByTestId('json-graph-stats')).toHaveTextContent('depth');
  });

  it('filters and highlights nodes when searching', async () => {
    render(<JsonGraphView data={mockData} isDark={true} />);

    const searchInput = screen.getByTestId('json-graph-search-input');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(screen.getByTestId('json-graph-search-count')).toBeInTheDocument();
    expect(screen.getByTestId('json-graph-search-count')).toHaveTextContent('1 match');
  });

  it('displays JSONPath inspector when a node is selected and allows copying', async () => {
    render(<JsonGraphView data={mockData} isDark={true} />);

    // Inspector should be visible initially (defaults to root)
    expect(screen.getByTestId('json-graph-inspector')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-jsonpath')).toHaveTextContent('$');

    // Click Copy JSONPath
    const copyPathBtn = screen.getByTestId('inspector-copy-path');
    fireEvent.click(copyPathBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('$');
    await waitFor(() => {
      expect(screen.getByText('Copied Path')).toBeInTheDocument();
    });

    // Click Copy Value
    const copyValBtn = screen.getByTestId('inspector-copy-value');
    fireEvent.click(copyValBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('handles zoom in, zoom out, fit to screen, and reset zoom controls', () => {
    render(<JsonGraphView data={mockData} isDark={true} />);

    const zoomInBtn = screen.getByTestId('json-graph-zoom-in');
    const zoomOutBtn = screen.getByTestId('json-graph-zoom-out');
    const fitScreenBtn = screen.getByTestId('json-graph-fit-screen');
    const resetZoomBtn = screen.getByTestId('json-graph-reset-zoom');

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    fireEvent.click(fitScreenBtn);
    fireEvent.click(resetZoomBtn);

    // Zoom badge should exist and show percentage
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it('supports expand all and collapse all actions', () => {
    render(<JsonGraphView data={mockData} isDark={true} />);

    const collapseAllBtn = screen.getByTestId('json-graph-collapse-all');
    fireEvent.click(collapseAllBtn);

    const expandAllBtn = screen.getByTestId('json-graph-expand-all');
    fireEvent.click(expandAllBtn);
  });

  it('toggles the export menu with SVG and PNG download options', () => {
    render(<JsonGraphView data={mockData} isDark={true} />);

    const exportBtn = screen.getByTestId('json-graph-export-btn');
    fireEvent.click(exportBtn);

    expect(screen.getByTestId('json-graph-export-menu')).toBeInTheDocument();
    expect(screen.getByTestId('json-graph-export-svg')).toBeInTheDocument();
    expect(screen.getByTestId('json-graph-export-png')).toBeInTheDocument();
  });
});
