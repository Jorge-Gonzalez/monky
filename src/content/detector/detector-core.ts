import { defaultMacroConfig } from '../../config/defaults';
import type { Macro, CoreState } from '../../types';

// Handles one step of the macro string capturing and comparing process to match against a list of macros
// Returns the next state based on the current state and the new key pressed
// If no match is possible, returns inactive state
// If Backspace is pressed, removes last character from buffer or deactivates if buffer is empty
// If a non-character key is pressed, deactivates
// If a character key is pressed, adds to buffer and checks for matches
// If not active, only activates if the key is a prefix of any macro command
export function updateStateOnKey(
  state: CoreState,
  key: string,
  macros: Macro[],
  prefixes: string[] = defaultMacroConfig.prefixes
): CoreState {
  const matches = (p: string) => macros.some(m => m.command.startsWith(p))

  if (key === "Backspace") {
    if (!state.buffer) return { active: false, buffer: "" }
    const buffer = state.buffer.slice(0, -1)
    if (!buffer) return { active: false, buffer: "" }

    const isActive = matches(buffer) || prefixes.includes(buffer)
    return { active: isActive, buffer }
  }

  if (key.length === 1) {
    // If there is a buffer, append to it. Otherwise, start a new buffer with the key.
    const newBuffer = state.buffer ? state.buffer + key : key
    // If we are starting a new buffer, it must begin with a valid prefix.
    if (!state.buffer && !prefixes.includes(key)) return { active: false, buffer: "" }
    const isActive = matches(newBuffer) || prefixes.includes(newBuffer)
    return { active: isActive, buffer: newBuffer }
  }

  // Other keys cancel
  return { active: false, buffer: "" }
}

// Checks if the current buffer exactly matches any macro command
export function isExact(state: CoreState, macros: Macro[]) {
  return !!macros.find(macro => macro.command === state.buffer)
}
