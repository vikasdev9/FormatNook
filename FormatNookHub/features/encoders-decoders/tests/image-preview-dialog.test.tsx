import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImagePreviewDialog } from '@/components/workspace/ImagePreviewDialog';
import { FilePreview } from '../components/FilePreview';
import { Base64RepairImagePreview } from '../components/Base64RepairImagePreview';

describe('ImagePreviewDialog', () => {
  const sampleUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ImagePreviewDialog
        isOpen={false}
        onClose={vi.fn()}
        imageUrl={sampleUrl}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with image and viewing controls when isOpen is true', () => {
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={vi.fn()}
        imageUrl={sampleUrl}
        alt="Test Image"
      />
    );

    // Dialog role and label
    const dialog = screen.getByRole('dialog', { name: 'Image Preview' });
    expect(dialog).toBeInTheDocument();

    // Required controls exist
    expect(screen.getByTestId('btn-close-preview-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('btn-zoom-out')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('100%');
    expect(screen.getByTestId('btn-zoom-in')).toBeInTheDocument();
    expect(screen.getByTestId('btn-zoom-fit')).toBeInTheDocument();
    expect(screen.getByTestId('btn-zoom-100')).toBeInTheDocument();
    expect(screen.getByTestId('btn-zoom-reset')).toBeInTheDocument();

    // Image element exists
    const img = screen.getByTestId('preview-image-element');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', sampleUrl);
    expect(img).toHaveAttribute('alt', 'Test Image');
  });

  it('strictly displays NO metadata, mime-type, dimensions, file size, or exif panels', () => {
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={vi.fn()}
        imageUrl={sampleUrl}
        initialDimensions={{ width: 1024, height: 768 }}
      />
    );

    // Dialog text content should ONLY have "Image Preview", "Fit", "100%", "Reset", and zoom percent
    const dialog = screen.getByRole('dialog', { name: 'Image Preview' });
    const textContent = dialog.textContent || '';

    // No file info or metadata
    expect(textContent).not.toMatch(/image\/png/i);
    expect(textContent).not.toMatch(/image\/jpeg/i);
    expect(textContent).not.toMatch(/mime/i);
    expect(textContent).not.toMatch(/\d+\s*KB/i);
    expect(textContent).not.toMatch(/\d+\s*MB/i);
    expect(textContent).not.toMatch(/\d+\s*bytes/i);
    expect(textContent).not.toMatch(/1024\s*[x×]\s*768/i);
    expect(textContent).not.toMatch(/aspect\s*ratio/i);
    expect(textContent).not.toMatch(/exif/i);
    expect(textContent).not.toMatch(/details/i);
  });

  it('increments zoom by 25% and clamps at 500%', () => {
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={vi.fn()}
        imageUrl={sampleUrl}
      />
    );

    const zoomInBtn = screen.getByTestId('btn-zoom-in');
    const zoomText = screen.getByTestId('zoom-percentage');

    expect(zoomText).toHaveTextContent('100%');

    fireEvent.click(zoomInBtn);
    expect(zoomText).toHaveTextContent('125%');

    fireEvent.click(zoomInBtn);
    expect(zoomText).toHaveTextContent('150%');

    // Click up to max 500%
    for (let i = 0; i < 20; i++) {
      fireEvent.click(zoomInBtn);
    }
    expect(zoomText).toHaveTextContent('500%');
    expect(zoomInBtn).toBeDisabled();
  });

  it('decrements zoom by 25% and clamps at 25%', () => {
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={vi.fn()}
        imageUrl={sampleUrl}
      />
    );

    const zoomOutBtn = screen.getByTestId('btn-zoom-out');
    const zoomText = screen.getByTestId('zoom-percentage');

    expect(zoomText).toHaveTextContent('100%');

    fireEvent.click(zoomOutBtn);
    expect(zoomText).toHaveTextContent('75%');

    fireEvent.click(zoomOutBtn);
    expect(zoomText).toHaveTextContent('50%');

    fireEvent.click(zoomOutBtn);
    expect(zoomText).toHaveTextContent('25%');
    expect(zoomOutBtn).toBeDisabled();

    // Extra click does not go below 25%
    fireEvent.click(zoomOutBtn);
    expect(zoomText).toHaveTextContent('25%');
  });

  it('sets zoom to 100% when 100% button is clicked', () => {
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={vi.fn()}
        imageUrl={sampleUrl}
      />
    );

    const zoomInBtn = screen.getByTestId('btn-zoom-in');
    const actualSizeBtn = screen.getByTestId('btn-zoom-100');
    const zoomText = screen.getByTestId('zoom-percentage');

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);
    expect(zoomText).toHaveTextContent('150%');

    fireEvent.click(actualSizeBtn);
    expect(zoomText).toHaveTextContent('100%');
  });

  it('resets zoom when Reset button is clicked', () => {
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={vi.fn()}
        imageUrl={sampleUrl}
      />
    );

    const zoomInBtn = screen.getByTestId('btn-zoom-in');
    const resetBtn = screen.getByTestId('btn-zoom-reset');
    const zoomText = screen.getByTestId('zoom-percentage');

    fireEvent.click(zoomInBtn);
    expect(zoomText).toHaveTextContent('125%');

    fireEvent.click(resetBtn);
    expect(zoomText).toHaveTextContent('100%');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={handleClose}
        imageUrl={sampleUrl}
      />
    );

    fireEvent.click(screen.getByTestId('btn-close-preview-dialog'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('responds to keyboard shortcuts (+, -, 0, 1, Escape)', () => {
    const handleClose = vi.fn();
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={handleClose}
        imageUrl={sampleUrl}
      />
    );

    const zoomText = screen.getByTestId('zoom-percentage');

    // Zoom In with '+'
    fireEvent.keyDown(window, { key: '+' });
    expect(zoomText).toHaveTextContent('125%');

    // Zoom Out with '-'
    fireEvent.keyDown(window, { key: '-' });
    expect(zoomText).toHaveTextContent('100%');

    // Zoom In with '='
    fireEvent.keyDown(window, { key: '=' });
    expect(zoomText).toHaveTextContent('125%');

    // Set 100% with '1'
    fireEvent.keyDown(window, { key: '1' });
    expect(zoomText).toHaveTextContent('100%');

    // Fit with '0'
    fireEvent.keyDown(window, { key: '0' });
    expect(zoomText).toHaveTextContent('100%');

    // Close with 'Escape'
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('supports drag-to-pan pointer and mouse events', () => {
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={vi.fn()}
        imageUrl={sampleUrl}
      />
    );

    const container = screen.getByTestId('preview-viewport-container');
    const img = screen.getByTestId('preview-image-element');

    // Initial transform
    expect(img.style.transform).toContain('translate(0px, 0px)');

    // Mouse drag
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.mouseMove(container, { clientX: 150, clientY: 130 });
    expect(img.style.transform).toContain('translate(50px, 30px)');

    fireEvent.mouseUp(container);
  });

  it('renders a separate backdrop that closes when clicked outside the dialog card', () => {
    const handleClose = vi.fn();
    render(
      <ImagePreviewDialog
        isOpen={true}
        onClose={handleClose}
        imageUrl={sampleUrl}
      />
    );

    const backdrop = screen.getByTestId('image-preview-backdrop');
    const dialog = screen.getByRole('dialog', { name: 'Image Preview' });
    expect(backdrop).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();

    // Clicking inside the dialog card does not close
    fireEvent.click(dialog);
    expect(handleClose).not.toHaveBeenCalled();

    // Clicking directly on the backdrop closes
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('FilePreview & Base64RepairImagePreview Discoverability', () => {
  const sampleUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('FilePreview renders Click to enlarge hint on decoded image and opens dialog on click', () => {
    render(
      <FilePreview
        mediaUrl={sampleUrl}
        mimeType="image/png"
        fileName="test.png"
        fileSize={70}
        onDownload={vi.fn()}
      />
    );

    const hint = screen.getByTestId('click-to-enlarge-hint');
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent(/click to enlarge/i);

    const trigger = screen.getByTestId('btn-open-preview-dialog');
    expect(trigger).toHaveAttribute('aria-label', 'Open image preview');

    // Dialog is initially closed
    expect(screen.queryByTestId('image-preview-dialog')).not.toBeInTheDocument();

    // Click opens modal
    fireEvent.click(trigger);
    expect(screen.getByTestId('image-preview-dialog')).toBeInTheDocument();

    // Close dialog
    fireEvent.click(screen.getByTestId('btn-close-preview-dialog'));
    expect(screen.queryByTestId('image-preview-dialog')).not.toBeInTheDocument();
  });

  it('FilePreview opens modal on keyboard Enter and Space keys', () => {
    render(
      <FilePreview
        mediaUrl={sampleUrl}
        mimeType="image/png"
        fileName="test.png"
        fileSize={70}
        onDownload={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('btn-open-preview-dialog');

    // Enter key opens dialog
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByTestId('image-preview-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-close-preview-dialog'));

    // Space key opens dialog
    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.getByTestId('image-preview-dialog')).toBeInTheDocument();
  });
});
