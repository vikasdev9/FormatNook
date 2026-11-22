import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageToolsWorkspace } from '../components/ImageToolsWorkspace';

describe('ImageToolsWorkspace Component (Phase B Foundation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL methods
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-image-url');
      window.URL.revokeObjectURL = vi.fn();

      // Mock canvas toBlob and getContext
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 100 }),
        fillText: vi.fn(),
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn(),
        }),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
      } as unknown as CanvasRenderingContext2D);

      HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => {
        cb(new Blob(['mock-bytes'], { type: 'image/png' }));
      });
    }
  });

  it('renders the initial empty state with high-contrast dropzone and action buttons', () => {
    render(<ImageToolsWorkspace initialTab="crop" />);

    expect(screen.getByTestId('image-tools-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('image-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('btn-browse-files')).toBeInTheDocument();
    expect(screen.getByTestId('btn-load-sample')).toBeInTheDocument();
    expect(screen.getByText(/100% Client-Side Privacy/i)).toBeInTheDocument();
  });

  it('loads sample demo image and renders toolbar, 40px headers, and inspector', async () => {
    // Mock Image onload trigger
    const originalImage = window.Image;
    window.Image = class MockImage {
      naturalWidth = 1200;
      naturalHeight = 800;
      width = 1200;
      height = 800;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    } as unknown as typeof Image;

    render(<ImageToolsWorkspace initialTab="crop" />);

    const loadSampleBtn = screen.getByTestId('btn-load-sample');
    fireEvent.click(loadSampleBtn);

    await waitFor(() => {
      expect(screen.getByTestId('image-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('image-canvas-viewport')).toBeInTheDocument();
      expect(screen.getByTestId('image-inspector')).toBeInTheDocument();
    });

    // Verify standardized 40px panel headers
    expect(screen.getByText(/Preview Canvas/i)).toBeInTheDocument();
    expect(screen.getByText(/Adjustment Inspector/i)).toBeInTheDocument();

    // Verify all tool navigation tabs
    expect(screen.getByTestId('tab-crop')).toBeInTheDocument();
    expect(screen.getByTestId('tab-resize')).toBeInTheDocument();
    expect(screen.getByTestId('tab-rotate')).toBeInTheDocument();
    expect(screen.getByTestId('tab-compress')).toBeInTheDocument();
    expect(screen.getByTestId('tab-convert')).toBeInTheDocument();
    expect(screen.getByTestId('tab-watermark')).toBeInTheDocument();
    expect(screen.getByTestId('tab-metadata')).toBeInTheDocument();
    expect(screen.getByTestId('tab-colors')).toBeInTheDocument();

    window.Image = originalImage;
  });

  it('switches tool tabs and mounts the corresponding adjustment inspector section', async () => {
    const originalImage = window.Image;
    window.Image = class MockImage {
      naturalWidth = 1200;
      naturalHeight = 800;
      width = 1200;
      height = 800;
      onload: (() => void) | null = null;
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    } as unknown as typeof Image;

    render(<ImageToolsWorkspace initialTab="crop" />);
    fireEvent.click(screen.getByTestId('btn-load-sample'));

    await waitFor(() => {
      expect(screen.getByTestId('inspector-crop')).toBeInTheDocument();
    });

    // Switch to Resize
    fireEvent.click(screen.getByTestId('tab-resize'));
    expect(screen.getByTestId('inspector-resize')).toBeInTheDocument();

    // Switch to Rotate
    fireEvent.click(screen.getByTestId('tab-rotate'));
    expect(screen.getByTestId('inspector-rotate')).toBeInTheDocument();

    // Switch to Compress
    fireEvent.click(screen.getByTestId('tab-compress'));
    expect(screen.getByTestId('inspector-compress')).toBeInTheDocument();

    // Switch to Convert
    fireEvent.click(screen.getByTestId('tab-convert'));
    expect(screen.getByTestId('inspector-convert')).toBeInTheDocument();

    // Switch to Watermark
    fireEvent.click(screen.getByTestId('tab-watermark'));
    expect(screen.getByTestId('inspector-watermark')).toBeInTheDocument();

    // Switch to Metadata
    fireEvent.click(screen.getByTestId('tab-metadata'));
    expect(screen.getByTestId('inspector-metadata')).toBeInTheDocument();

    // Switch to Colors
    fireEvent.click(screen.getByTestId('tab-colors'));
    expect(screen.getByTestId('inspector-colors')).toBeInTheDocument();

    window.Image = originalImage;
  });

  it('toggles before/after split comparison view', async () => {
    const originalImage = window.Image;
    window.Image = class MockImage {
      naturalWidth = 1200;
      naturalHeight = 800;
      width = 1200;
      height = 800;
      onload: (() => void) | null = null;
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    } as unknown as typeof Image;

    render(<ImageToolsWorkspace initialTab="crop" />);
    fireEvent.click(screen.getByTestId('btn-load-sample'));

    await waitFor(() => {
      expect(screen.getByTestId('image-preview-single')).toBeInTheDocument();
    });

    // Click compare button in toolbar
    const compareBtn = screen.getByTestId('btn-toggle-compare');
    fireEvent.click(compareBtn);

    expect(screen.getByTestId('image-compare-view')).toBeInTheDocument();
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Processed')).toBeInTheDocument();

    window.Image = originalImage;
  });

  it('triggers crop download with cropped filename suffix', async () => {
    const originalImage = window.Image;
    window.Image = class MockImage {
      naturalWidth = 1200;
      naturalHeight = 800;
      width = 1200;
      height = 800;
      onload: (() => void) | null = null;
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    } as unknown as typeof Image;

    render(<ImageToolsWorkspace initialTab="crop" />);
    fireEvent.click(screen.getByTestId('btn-load-sample'));

    await waitFor(() => {
      expect(screen.getByTestId('image-crop-overlay')).toBeInTheDocument();
    });

    // Select 1:1 square aspect ratio preset
    const squarePreset = screen.getByText('1:1 Square');
    fireEvent.click(squarePreset);

    // Mock document.body.appendChild to inspect the download anchor
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    // Click download button
    const downloadBtn = screen.getByTestId('btn-download-inspector');
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      const anchor = appendSpy.mock.calls
        .map((call) => call[0] as HTMLElement)
        .find((el) => el.tagName === 'A' && (el as HTMLAnchorElement).download);
      expect(anchor).toBeDefined();
      expect((anchor as HTMLAnchorElement).download).toContain('-cropped');
    });

    appendSpy.mockRestore();
    window.Image = originalImage;
  });
});
