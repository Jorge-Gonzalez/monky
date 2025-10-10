// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMacroSearch } from './useMacroSearch';
import { Macro } from '../../../types';

const mockMacros: Macro[] = [
  { id: '1', command: '/sig', text: 'My Signature', contentType: 'text/plain' },
  { id: '2', command: '/bug', text: 'Bug report template', contentType: 'text/plain' },
  { id: '3', command: '/feat', text: 'Feature request template', contentType: 'text/plain' },
];

describe('useMacroSearch Hook', () => {
  it('should return all macros when the search query is empty', () => {
    const { result } = renderHook(() => useMacroSearch(mockMacros, ''));
    expect(result.current.length).toBe(3);
    expect(result.current.map(m => m.command)).toEqual(['/sig', '/bug', '/feat']);
  });

  it('should filter macros by command', () => {
    const { result } = renderHook(() => useMacroSearch(mockMacros, '/bug'));
    expect(result.current.length).toBe(1);
    expect(result.current[0].command).toBe('/bug');
  });

  it('should filter macros by text', () => {
    const { result } = renderHook(() => useMacroSearch(mockMacros, 'template'));
    expect(result.current.length).toBe(2);
    expect(result.current.map(m => m.command)).toEqual(['/bug', '/feat']);
  });

  it('should be case-insensitive', () => {
    const { result } = renderHook(() => useMacroSearch(mockMacros, 'SIGNATURE'));
    expect(result.current.length).toBe(1);
    expect(result.current[0].command).toBe('/sig');
  });

  it('should return an empty array if no macros match', () => {
    const { result } = renderHook(() => useMacroSearch(mockMacros, 'nonexistent'));
    expect(result.current.length).toBe(0);
  });

  it('should re-calculate when the query changes', () => {
    let query = 'bug';
    const { result, rerender } = renderHook(() => useMacroSearch(mockMacros, query));

    // Initial render
    expect(result.current.length).toBe(1);
    expect(result.current[0].command).toBe('/bug');

    // Rerender with a new query
    query = 'feat';
    rerender();

    expect(result.current.length).toBe(1);
    expect(result.current[0].command).toBe('/feat');
  });
});