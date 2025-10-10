import { DetectorActions } from "./detectorActions";

/**
 * Default no-op implementations for DetectorActions interface.
 * Use this as a base when creating coordinators that only need to override specific methods.
 */
export const defaultDetectorActions: DetectorActions = {
    onDetectionStarted: () => {},
    onDetectionUpdated: () => {},
    onDetectionCancelled: () => {},
    onCommitRequested: () => false,
    onNavigationRequested: () => false,
    onCancelRequested: () => false,
    onMacroCommitted: () => {},
}