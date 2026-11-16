import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';

describe('KeyboardShortcutsModal Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly with accessible dialog attributes when isOpen is true', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('filters shortcuts by category tab', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

    // Click JSON tab
    const jsonTab = screen.getByRole('button', { name: 'JSON' });
    fireEvent.click(jsonTab);

    expect(screen.getByText('Format JSON')).toBeInTheDocument();
    expect(screen.getByText('Minify JSON')).toBeInTheDocument();
    expect(screen.queryByText('Command Menu & Search')).not.toBeInTheDocument();
  });

  it('filters shortcuts by search text input', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/filter shortcuts/i);
    fireEvent.change(searchInput, { target: { value: 'XPath' } });

    expect(screen.getByText('XPath Explorer')).toBeInTheDocument();
    expect(screen.queryByText('Format JSON')).not.toBeInTheDocument();
  });

  it('calls onClose when "Got It" or Close button is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    const gotItBtn = screen.getByRole('button', { name: /got it/i });
    fireEvent.click(gotItBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText(/close dialog/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('supports custom testId for backward compatibility', () => {
    render(
      <KeyboardShortcutsModal
        isOpen={true}
        onClose={vi.fn()}
        testId="json-shortcuts-modal"
      />
    );

    expect(screen.getByTestId('json-shortcuts-modal')).toBeInTheDocument();
  });
});
