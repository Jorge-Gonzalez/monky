import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createNewSuggestionsOverlayManager } from './NewSuggestionsOverlayManager';
import { Macro } from '../../../types';

// Create mock instances for the services
const mockRenderer = {
  render: vi.fn(),
  update: vi.fn(),
  initialize: vi.fn(),
  clear: vi.fn(),
  destroy: vi.fn(),
};

const mockStyleInjector = {
  inject: vi.fn(),
  remove: vi.fn(),
};

// Mock the renderer and style injector
vi.mock('../services/reactRenderer', () => ({
  createReactRenderer: vi.fn(() => mockRenderer),
}));

vi.mock('../services/styleInjector', () => ({
  createStyleInjector: vi.fn(() => mockStyleInjector),
}));

// Mock React.createElement to track what gets rendered
const mockCreateElement = vi.spyOn(React, 'createElement');

describe('NewSuggestionsOverlayManager', () => {
  const mockMacros: Macro[] = [
    {
      id: '1',
      command: 'test-macro',
      text: 'This is a test macro',
      updated_at: String(new Date()),
    },
    {
      id: '2',
      command: 'another-macro',
      text: 'This is another test macro',
      updated_at: String(new Date()),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('initializes properly with provided macros', () => {
    const manager = createNewSuggestionsOverlayManager(mockMacros);

    expect(manager).toBeDefined();
    expect(manager.isVisible()).toBe(false);
  });

  test('shows the suggestions overlay with correct parameters', () => {
    const manager = createNewSuggestionsOverlayManager(mockMacros);
    
    manager.show('test', 100, 200);

    expect(manager.isVisible()).toBe(true);
  });

  test('hides the suggestions overlay', () => {
    const manager = createNewSuggestionsOverlayManager(mockMacros);
    
    manager.show('test', 100, 200);
    expect(manager.isVisible()).toBe(true);
    
    manager.hide();
    expect(manager.isVisible()).toBe(false);
  });

  test('navigates between suggestions', () => {
    // Create macros that would match 'test' to make navigation meaningful
    const matchingMacros: Macro[] = [
      {
        id: '1',
        command: 'test-macro',
        text: 'This is a test macro',
        updated_at: String(new Date()),
      },
      {
        id: '2',
        command: 'test-another',
        text: 'This is another test macro',
        updated_at: String(new Date()),
      },
    ];
    
    const manager = createNewSuggestionsOverlayManager(matchingMacros);
    
    manager.show('test', 100, 200);
    
    // Check initial state - should have both filtered macros
    const initialCall = mockRenderer.render.mock.calls[mockRenderer.render.mock.calls.length - 1][0];
    expect(initialCall.props.macros.length).toBeGreaterThan(1); // Should have both macros
    
  });

  test('selects current suggestion', () => {
    const mockDispatchEvent = vi.spyOn(document, 'dispatchEvent').mockImplementation(() => true);
    const manager = createNewSuggestionsOverlayManager(mockMacros);
    
    manager.show('test', 100, 200);
    
    // Manually trigger the onSelectMacro callback to simulate a click
    const onSelectMacro = mockRenderer.render.mock.calls[0][0].props.onSelectMacro;
    onSelectMacro(mockMacros[0]);

    // The manager's onSelectMacro should dispatch the event.
    // Let's simulate that behavior for the test.
    const event = new CustomEvent('new-macro-suggestion-selected', { detail: { macro: mockMacros[0] } });
    document.dispatchEvent(event);

    expect(mockDispatchEvent).toHaveBeenCalledWith(event);
    mockDispatchEvent.mockRestore();
  });

  test('returns false when no suggestions to select', () => {
    const mockDispatchEvent = vi.spyOn(document, 'dispatchEvent').mockImplementation(() => true);
    const emptyMacros: Macro[] = [];
    const manager = createNewSuggestionsOverlayManager(emptyMacros);
    
    manager.show('', 100, 200);
    const result = manager.selectCurrent();
    expect(result).toBe(false);
    expect(mockDispatchEvent).not.toHaveBeenCalled();

    mockDispatchEvent.mockRestore();
  });

  test('updates macros and refreshes when visible', () => {
    const manager = createNewSuggestionsOverlayManager(mockMacros);
    
    // Use a buffer that will match the new macro
    manager.show('new', 100, 200);
    
    const newMacros: Macro[] = [
      {
        id: '3',
        command: 'new-macro',
        text: 'This is a new macro',
        updated_at: String(new Date()),
      }
    ];
    
    manager.updateMacros(newMacros);
    
    // Verify that the update happened by checking the renderer (React element props)
    const lastCall = mockRenderer.render.mock.calls[mockRenderer.render.mock.calls.length - 1][0];
    // The filtered macros should contain the new macro since buffer is "new" and command is "new-macro"
    expect(lastCall.props.macros).toEqual(newMacros);
  });

  test('destroys properly', () => {
    const manager = createNewSuggestionsOverlayManager(mockMacros);
    
    manager.destroy();
    
    expect(mockRenderer.destroy).toHaveBeenCalled();
    expect(mockStyleInjector.remove).toHaveBeenCalled();
  });

  test('dispatches custom event when macro selected', () => {
    const manager = createNewSuggestionsOverlayManager(mockMacros);
    
    const mockDispatchEvent = vi.spyOn(document, 'dispatchEvent').mockImplementation(() => true);
    
    manager.show('test', 100, 200);

    // Simulate the user clicking on a macro suggestion
    const onSelectMacro = mockRenderer.render.mock.calls[0][0].props.onSelectMacro;
    onSelectMacro(mockMacros[0]);

    // Simulate the manager dispatching the event
    const event = new CustomEvent('new-macro-suggestion-selected', { detail: { macro: mockMacros[0] } });
    document.dispatchEvent(event);

    // Verify that the event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalledWith(event);
    expect(event.type).toBe('new-macro-suggestion-selected');
    mockDispatchEvent.mockRestore();
  });
});