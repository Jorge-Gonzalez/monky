import { createOptionsManager } from '../managers/optionsManager';
import { createOptionsCoordinator, OptionsCoordinator } from '../coordinators/optionsCoordinator';

/**
 * Singleton instance of the options coordinator
 * Shared across all components that use this hook
 */
let coordinatorInstance: OptionsCoordinator | null = null;

/**
 * Hook to access the options coordinator
 * Returns a singleton instance that persists across renders and components
 */
export function useOptionsCoordinator(): OptionsCoordinator {
  if (!coordinatorInstance) {
    const manager = createOptionsManager();
    coordinatorInstance = createOptionsCoordinator(manager);
  }

  return coordinatorInstance;
}
