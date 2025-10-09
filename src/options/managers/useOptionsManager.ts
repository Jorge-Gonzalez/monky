import { createDefaultOptionsActions } from '../actions/createDefaultOptionsActions';
import { createOptionsManager, OptionsManager } from './createOptionsManager';

let managerInstance: OptionsManager | null = null;

/**
 * A hook to get a singleton instance of the OptionsManager.
 */
export function useOptionsManager(): OptionsManager {
  if (!managerInstance) {
    const actions = createDefaultOptionsActions();
    managerInstance = createOptionsManager(actions);
  }
  return managerInstance;
}