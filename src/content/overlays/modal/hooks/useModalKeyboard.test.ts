// @vitest-environment jsdom
import { renderHook, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useModalKeyboard } from './useModalKeyboard';
import type { ModalView } from '../types';

describe('useModalKeyboard', () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onViewChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onViewChange = vi.fn();
  });

  const render = (view: ModalView = 'search', active = true) =>
    renderHook(() => useModalKeyboard(active, onClose, view, onViewChange));

  // ── Escape ────────────────────────────────────────────────────────────────

  it('calls onClose on Escape', () => {
    render();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does nothing when inactive', () => {
    render('search', false);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onClose).not.toHaveBeenCalled();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  // ── Tab cycling ───────────────────────────────────────────────────────────

  it('ArrowRight advances: search → editor', () => {
    render('search');
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onViewChange).toHaveBeenCalledWith('editor');
  });

  it('ArrowRight advances: editor → settings', () => {
    render('editor');
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onViewChange).toHaveBeenCalledWith('settings');
  });

  it('ArrowRight wraps: settings → search', () => {
    render('settings');
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onViewChange).toHaveBeenCalledWith('search');
  });

  it('ArrowLeft goes back: editor → search', () => {
    render('editor');
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(onViewChange).toHaveBeenCalledWith('search');
  });

  it('ArrowLeft wraps backwards: search → settings', () => {
    render('search');
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(onViewChange).toHaveBeenCalledWith('settings');
  });

  // ── isEditing guard ───────────────────────────────────────────────────────

  it('ignores ArrowRight when an <input> is focused', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    render();
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(onViewChange).not.toHaveBeenCalled();
    input.remove();
  });

  it('ignores ArrowLeft when a <textarea> is focused', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    render();
    fireEvent.keyDown(textarea, { key: 'ArrowLeft' });
    expect(onViewChange).not.toHaveBeenCalled();
    textarea.remove();
  });

  it('ignores arrow keys when a contenteditable element is focused', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    // jsdom doesn't compute isContentEditable from the attribute — patch the getter
    // directly to match what a real browser returns for contenteditable="true".
    Object.defineProperty(div, 'isContentEditable', { get: () => true, configurable: true });
    render();
    fireEvent.keyDown(div, { key: 'ArrowRight' });
    expect(onViewChange).not.toHaveBeenCalled();
    div.remove();
  });

  it('navigates when a non-editable element is focused', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    render('search');
    fireEvent.keyDown(div, { key: 'ArrowRight' });
    expect(onViewChange).toHaveBeenCalledWith('editor');
    div.remove();
  });

  // ── Escape from non-search views ─────────────────────────────────────────

  it('calls onClose on Escape when currentView is editor', () => {
    render('editor');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape when currentView is settings', () => {
    render('settings');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
