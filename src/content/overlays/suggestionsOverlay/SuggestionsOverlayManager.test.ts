import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSuggestionsOverlayManager } from './SuggestionsOverlayManager';
import { Macro, EditableEl } from '../../../types';

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

// Mock the editable utils
vi.mock('../../macroEngine/replacement/editableUtils', () => ({
  getActiveEditable: vi.fn(),
  getSelection: vi.fn(),
}));

vi.mock('../../macroEngine/replacement/macroReplacement', () => ({
  replaceText: vi.fn(),
}));

// Mock the caret position utility
vi.mock('./utils/caretPosition', () => ({
  getCaretCoordinates: vi.fn(),
}));

// Mock the popup positioning utility
vi.mock('./utils/popupPositioning', () => ({
  calculateOptimalPosition: vi.fn(),
}));

import { getActiveEditable, getSelection } from '../../macroEngine/replacement/editableUtils';
import { replaceText } from '../../macroEngine/replacement/macroReplacement';
import { getCaretCoordinates } from './utils/caretPosition'; // This import is correct
import { calculateOptimalPosition } from './utils/popupPositioning';

describe('SuggestionsOverlayManager', () => {
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
    {
      id: '3',
      command: 'test-another',
      text: 'Yet another test',
      updated_at: String(new Date()),
    },
  ];

  let mockElement: EditableEl;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock input element
    mockElement = document.createElement('input') as EditableEl;
    (mockElement as HTMLInputElement).value = 'test text';
    document.body.appendChild(mockElement);
    
    // Setup default mock implementations
    vi.mocked(getActiveEditable).mockReturnValue(mockElement);
    vi.mocked(getSelection).mockReturnValue({ start: 0, end: 0 });
    vi.mocked(getCaretCoordinates).mockReturnValue({ x: 100, y: 200 });
    vi.mocked(calculateOptimalPosition).mockImplementation((coords) => ({ ...coords, placement: 'bottom' }));
  });

  afterEach(() => {
    if (mockElement && document.body.contains(mockElement)) {
      document.body.removeChild(mockElement);
    }
  });

  describe('Initialization', () => {
    test('initializes properly with provided macros', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);

      expect(manager).toBeDefined();
      expect(manager.isVisible()).toBe(false);
      expect(mockStyleInjector.inject).toHaveBeenCalledTimes(1);
      expect(mockRenderer.initialize).toHaveBeenCalledTimes(1);
    });

    test('exposes correct public API', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);

      expect(manager).toHaveProperty('show');
      expect(manager).toHaveProperty('showAll');
      expect(manager).toHaveProperty('hide');
      expect(manager).toHaveProperty('updateMacros');
      expect(manager).toHaveProperty('isVisible');
      expect(manager).toHaveProperty('destroy');
    });
  });

  describe('Show/Hide Functionality', () => {
    test('shows the suggestions overlay in filter mode', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      manager.show('test', 100, 200);

      expect(manager.isVisible()).toBe(true);
      expect(mockRenderer.render).toHaveBeenCalled();
      
      const renderCall = mockRenderer.render.mock.calls[0][0];
      expect(renderCall.props.filterBuffer).toBe('test');
      expect(renderCall.props.mode).toBe('filter');
      expect(renderCall.props.position).toEqual({ x: 100, y: 200 });
      expect(renderCall.props.isVisible).toBe(true);
    });

    test('shows the suggestions overlay in showAll mode', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      manager.showAll(150, 250);

      expect(manager.isVisible()).toBe(true);
      expect(mockRenderer.render).toHaveBeenCalled();
      
      const renderCall = mockRenderer.render.mock.calls[0][0];
      expect(renderCall.props.filterBuffer).toBe('');
      expect(renderCall.props.mode).toBe('showAll');
      expect(renderCall.props.position).toEqual({ x: 150, y: 250 });
      expect(renderCall.props.isVisible).toBe(true);
    });

    test('shows the suggestions overlay in showAll mode with buffer context', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      manager.showAll(150, 250, '/s');

      expect(manager.isVisible()).toBe(true);
      expect(mockRenderer.render).toHaveBeenCalled();
      
      const renderCall = mockRenderer.render.mock.calls[0][0];
      expect(renderCall.props.filterBuffer).toBe('/s');
      expect(renderCall.props.mode).toBe('showAll');
      expect(renderCall.props.position).toEqual({ x: 150, y: 250 });
      expect(renderCall.props.isVisible).toBe(true);
    });

    test('calculates cursor position automatically if not provided', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      // Mock getCaretCoordinates to return specific coords
      vi.mocked(getCaretCoordinates).mockReturnValue({ x: 300, y: 400 });
      
      manager.show('test');

      const renderCall = mockRenderer.render.mock.calls[0][0];
      expect(renderCall.props.position).toEqual({ x: 300, y: 400 });
      expect(getCaretCoordinates).toHaveBeenCalledWith(mockElement);
    });

    test('calculates cursor position for showAll if not provided', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      vi.mocked(getCaretCoordinates).mockReturnValue({ x: 350, y: 450 });
      
      manager.showAll();

      const renderCall = mockRenderer.render.mock.calls[0][0];
      expect(renderCall.props.position).toEqual({ x: 350, y: 450 });
      expect(getCaretCoordinates).toHaveBeenCalledWith(mockElement);
    });

    test('does not show when no active element found', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      vi.mocked(getActiveEditable).mockReturnValue(null);
      
      manager.show('test', 100, 200);

      expect(manager.isVisible()).toBe(false);
      expect(mockRenderer.render).not.toHaveBeenCalled();
    });

    test('hides the suggestions overlay', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      manager.show('test', 100, 200);
      expect(manager.isVisible()).toBe(true);
      
      manager.hide();
      
      expect(manager.isVisible()).toBe(false);
      expect(mockRenderer.clear).toHaveBeenCalledTimes(1);
    });

    test('does nothing when hiding already hidden overlay', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      manager.hide();
      
      expect(mockRenderer.clear).not.toHaveBeenCalled();
    });
  });

  describe('Macro Selection', () => {
    test('handles macro selection in filter mode', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      (mockElement as HTMLInputElement).value = 'test';
      
      manager.show('test', 100, 200);
      
      // Get the onSelectMacro callback
      const renderCall = mockRenderer.render.mock.calls[0][0];
      const onSelectMacro = renderCall.props.onSelectMacro;
      
      // Simulate selecting a macro
      onSelectMacro(mockMacros[0]);

      expect(replaceText).toHaveBeenCalledWith(
        mockElement,
        mockMacros[0],
        0, // triggerIndex
        4  // triggerIndex + trigger.length
      );
      expect(manager.isVisible()).toBe(false);
    });

    test('handles macro selection in showAll mode', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      vi.mocked(getSelection).mockReturnValue({ start: 5, end: 5 });
      
      manager.showAll(100, 200);
      
      const renderCall = mockRenderer.render.mock.calls[0][0];
      const onSelectMacro = renderCall.props.onSelectMacro;
      
      onSelectMacro(mockMacros[0]);

      expect(replaceText).toHaveBeenCalledWith(
        mockElement,
        mockMacros[0],
        5,
        5
      );
      expect(manager.isVisible()).toBe(false);
    });

    test('handles macro selection in showAll mode with buffer context - saves trigger properly', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      (mockElement as HTMLInputElement).value = '/s something';
      
      vi.mocked(getSelection).mockReturnValue({ start: 2, end: 2 });
      
      // Show all with buffer context (simulating Tab key pressed after typing /s)
      manager.showAll(100, 200, '/s');
      
      const renderCall = mockRenderer.render.mock.calls[0][0];
      const onSelectMacro = renderCall.props.onSelectMacro;
      
      onSelectMacro(mockMacros[0]);

      // Should replace from start of trigger (/s) to current position
      expect(replaceText).toHaveBeenCalledWith(
        mockElement,
        mockMacros[0],
        0, // Start of '/s'
        2  // Current position
      );
      expect(manager.isVisible()).toBe(false);
    });

    test('handles selection when savedState element is null', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);

      
      // Show the overlay to capture the onSelectMacro callback
      manager.show('test', 100, 200);
      const renderCall = mockRenderer.render.mock.calls[0][0];
      const onSelectMacro = renderCall.props.onSelectMacro;

      // Now, hide the manager, which will clear the savedState.
      manager.hide();
      
      // Now, call the captured callback. `savedState` is now null.
      onSelectMacro(mockMacros[0]);

      expect(replaceText).not.toHaveBeenCalled();
      expect(manager.isVisible()).toBe(false);
    });

    test('handles selection when trigger not found in content', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      (mockElement as HTMLInputElement).value = 'different text';
      
      manager.show('test', 100, 200);
      
      const renderCall = mockRenderer.render.mock.calls[0][0];
      const onSelectMacro = renderCall.props.onSelectMacro;
      
      onSelectMacro(mockMacros[0]);

      // replaceText should not be called when trigger is not found
      expect(replaceText).not.toHaveBeenCalled();
      expect(manager.isVisible()).toBe(false);
    });
  });

  describe('Close Handler', () => {
    test('calls hide when onClose is triggered', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      manager.show('test', 100, 200);
      
      const renderCall = mockRenderer.render.mock.calls[0][0];
      const onClose = renderCall.props.onClose;
      
      onClose();

      expect(manager.isVisible()).toBe(false);
      expect(mockRenderer.clear).toHaveBeenCalled();
    });
  });

  describe('Update Macros', () => {
    test('updates macros and re-renders when visible', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      manager.show('new', 100, 200);
      
      const newMacros: Macro[] = [
        {
          id: '4',
          command: 'new-macro',
          text: 'This is a new macro',
          updated_at: String(new Date()),
        }
      ];
      
      const renderCallsBefore = mockRenderer.render.mock.calls.length;
      
      manager.updateMacros(newMacros);
      
      expect(mockRenderer.render.mock.calls.length).toBe(renderCallsBefore + 1);
      
      const lastCall = mockRenderer.render.mock.calls[mockRenderer.render.mock.calls.length - 1][0];
      expect(lastCall.props.macros).toEqual(newMacros);
    });

    test('updates macros but does not re-render when hidden', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      const newMacros: Macro[] = [
        {
          id: '4',
          command: 'new-macro',
          text: 'This is a new macro',
          updated_at: String(new Date()),
        }
      ];
      
      const renderCallsBefore = mockRenderer.render.mock.calls.length;
      
      manager.updateMacros(newMacros);
      
      // Should not trigger additional render when hidden
      expect(mockRenderer.render.mock.calls.length).toBe(renderCallsBefore);
    });

    test('uses updated macros in next show call', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      const newMacros: Macro[] = [
        {
          id: '4',
          command: 'updated-macro',
          text: 'This is an updated macro',
          updated_at: String(new Date()),
        }
      ];
      
      manager.updateMacros(newMacros);
      manager.show('updated', 100, 200);
      
      const renderCall = mockRenderer.render.mock.calls[mockRenderer.render.mock.calls.length - 1][0];
      expect(renderCall.props.macros).toEqual(newMacros);
    });
  });

  describe('Destroy', () => {
    test('cleans up resources properly', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      manager.show('test', 100, 200);
      manager.destroy();
      
      expect(mockRenderer.destroy).toHaveBeenCalledTimes(1);
      expect(mockStyleInjector.remove).toHaveBeenCalledTimes(1);
      expect(manager.isVisible()).toBe(false);
    });

    test('can destroy without showing first', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      expect(() => manager.destroy()).not.toThrow();
      expect(mockRenderer.destroy).toHaveBeenCalledTimes(1);
      expect(mockStyleInjector.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Passed to Component', () => {
    test('passes all required props to component', () => {
      const manager = createSuggestionsOverlayManager(mockMacros);
      
      manager.show('test', 100, 200);
      
      const renderCall = mockRenderer.render.mock.calls[0][0];
      const props = renderCall.props;
      
      expect(props).toHaveProperty('macros');
      expect(props).toHaveProperty('filterBuffer');
      expect(props).toHaveProperty('mode');
      expect(props).toHaveProperty('position');
      expect(props).toHaveProperty('isVisible');
      expect(props).toHaveProperty('onSelectMacro');
      expect(props).toHaveProperty('onClose');
      
      expect(typeof props.onSelectMacro).toBe('function');
      expect(typeof props.onClose).toBe('function');
    });
  });
});