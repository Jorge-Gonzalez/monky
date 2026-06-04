import React from 'react';
import { useMacroStore } from '../../store/useMacroStore';
import { useThemeColors } from './useThemeColors';

/**
 * Applies the current theme + color theme (from the store) to a container ref.
 * The one-liner each themed root (modal, popup, suggestions overlay) uses instead
 * of reciting the store reads + useThemeColors call.
 */
export function useAppliedTheme(ref: React.RefObject<HTMLElement | null>, enabled = true) {
  const theme = useMacroStore(s => s.config.theme);
  const colorTheme = useMacroStore(s => s.config.colorTheme);
  useThemeColors(ref, theme, enabled, colorTheme);
}
