import { Macro } from '../../../../types';

export type ModalCommandId = 'new' | 'edit' | 'delete' | 'settings';

export interface ModalCommand {
  id: ModalCommandId;
  command: string;
  description: string;
  isParametric: boolean;
}

export const MODAL_COMMANDS: ModalCommand[] = [
  { id: 'new',      command: ':new',      description: 'Create a new macro',    isParametric: false },
  { id: 'edit',     command: ':edit',     description: 'Edit a macro',          isParametric: true  },
  { id: 'delete',   command: ':delete',   description: 'Delete a macro',        isParametric: true  },
  { id: 'settings', command: ':settings', description: 'Open settings',         isParametric: false },
];

export type ParsedModalQuery =
  | { mode: 'search' }
  | { mode: 'discovery'; commands: ModalCommand[] }
  | { mode: 'instant';   command: ModalCommand }
  | { mode: 'awaiting';  command: ModalCommand }
  | { mode: 'parametric'; command: ModalCommand; param: string };

export function parseModalQuery(raw: string, prefixes: string[]): ParsedModalQuery {
  if (!raw.startsWith(':')) return { mode: 'search' };

  if (raw === ':') {
    return { mode: 'discovery', commands: MODAL_COMMANDS };
  }

  const cmd = MODAL_COMMANDS.find(c => raw.startsWith(c.command));
  if (!cmd) {
    // Partial ':' or unknown command — show discovery filtered by what's typed
    const filtered = MODAL_COMMANDS.filter(c => c.command.startsWith(raw));
    return { mode: 'discovery', commands: filtered };
  }

  const rest = raw.slice(cmd.command.length);

  if (!cmd.isParametric) {
    return { mode: 'instant', command: cmd };
  }

  // Parametric command — needs a macro prefix to follow
  if (!rest) return { mode: 'awaiting', command: cmd };

  if (prefixes.some(p => rest.startsWith(p))) {
    return { mode: 'parametric', command: cmd, param: rest };
  }

  // Non-prefix char after command — treat as still awaiting (swallow invalid continuation)
  return { mode: 'awaiting', command: cmd };
}
