// Public API exports for the options module
export type { OptionsCoordinator } from './coordinators/optionsCoordinator';
export { createOptionsCoordinator } from './coordinators/optionsCoordinator';
export type { OptionsManager, OptionsState } from './managers/optionsManager';
export { createOptionsManager } from './managers/optionsManager';
export { useOptionsCoordinator } from './hooks/useOptionsCoordinator';
