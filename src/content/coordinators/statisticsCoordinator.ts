import { DetectorActions } from "../actions/detectorActions";
import { defaultDetectorActions } from "../actions/detectorDefaults";

type MacroStats = Map<string, number>

export function createStatisticsCoordinator() {

    const macroUsageStats : MacroStats = new Map()

    const actions: DetectorActions = {
        ...defaultDetectorActions,
        
        onMacroCommitted(macroId: string) {
            if (macroUsageStats.has(macroId)) {
                macroUsageStats.set(macroId, macroUsageStats.get(macroId)! + 1)
            } else {
                macroUsageStats.set(macroId, 1)
            }
        },
    }

    return {

        ...actions,
    
        // Extra methods beyond DetectorActions

        getUsageCount(macroId: string): number {
        return macroUsageStats.get(macroId) || 0
        },
        
        getAllStats(): Map<string, number> {
        return new Map(macroUsageStats) // Return a copy
        },
        
        clearStats(): void {
        macroUsageStats.clear()
        }
    }

}

export type StatisticsCoordinator = ReturnType<typeof createStatisticsCoordinator>