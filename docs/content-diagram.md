# Monky Content Directory - Macro Detection Functionality

```mermaid
graph TB
    subgraph "Main Entry Point"
        main["main.ts"]
    end
    
    subgraph "Macro Detection System"
        detector["detector/macroDetector.ts"]
        detector_core["detector/detector-core.ts"]
        editableUtils["detector/editableUtils.ts"]
        keyUtils["detector/keyUtils.ts"]
        tabKeyIntegration["detector/tabKeyIntegration.test.ts"]
        
        detector --> detector_core
        detector --> editableUtils
        detector --> keyUtils
    end
    
    subgraph "Action Handlers"
        actions["actions/detectorActions.ts"]
        defaults["actions/detectorDefaults.ts"]
    end
    
    subgraph "Coordination System"
        coordinator["coordinators/NewSuggestionsCoordinator.ts"]
        statistics["coordinators/statisticsCoordinator.ts"]
        compActions["coordinators/compositeActions.ts"]
        analytics["coordinators/analyticsActions.ts"]
    end
    
    subgraph "Overlay System"
        overlays_index["overlays/index.ts"]
        
        subgraph "New Suggestions Overlay"
            new_suggestions_manager["overlays/newSuggestionsOverlay/NewSuggestionsOverlayManager.ts"]
            new_suggestions_ui["overlays/newSuggestionsOverlay/ui/*"]
            new_suggestions_hooks["overlays/newSuggestionsOverlay/hooks/*"]
            new_suggestions_utils["overlays/newSuggestionsOverlay/utils/*"]
            new_suggestions_styles["overlays/newSuggestionsOverlay/NewSuggestionsOverlayStyles.ts"]
        end
        
        subgraph "Search Overlay"
            search_manager["overlays/searchOverlay/searchOverlayManager.ts"]
            search_ui["overlays/searchOverlay/ui/*"]
            search_styles["overlays/searchOverlay/searchOverlayStyles.ts"]
        end
        
        subgraph "Suggestions Overlay"
            suggestions_manager["overlays/suggestionsOverlay/suggestionsOverlayManager.ts"]
            suggestions_ui["overlays/suggestionsOverlay/ui/*"]
            suggestions_styles["overlays/suggestionsOverlay/suggestionsOverlayStyles.ts"]
        end
        
        subgraph "Overlay Services"
            react_renderer["overlays/services/reactRenderer.ts"]
            style_injector["overlays/services/styleInjector.ts"]
            focus_manager["overlays/services/focusManager.ts"]
            macro_inserter["overlays/services/macroInserter.ts"]
        end
        
        subgraph "Overlay Hooks"
            compose_effects["overlays/hooks/composeEffects.ts"]
            use_auto_focus["overlays/hooks/useAutoFocus.ts"]
        end
    end
    
    subgraph "Storage System"
        storage["storage/macroStorage.ts"]
    end
    
    subgraph "System Macros"
        system_macros["systemMacros/systemMacros.ts"]
    end
    
    %% Connections showing the flow
    main --> detector
    main --> coordinator
    main --> storage
    
    detector --> coordinator
    coordinator --> new_suggestions_manager
    new_suggestions_manager --> react_renderer
    new_suggestions_manager --> style_injector
    new_suggestions_manager --> new_suggestions_ui
    
    search_manager --> react_renderer
    search_manager --> style_injector
    search_manager --> focus_manager
    search_manager --> macro_inserter
    search_manager --> search_ui
    
    suggestions_manager --> react_renderer
    suggestions_manager --> style_injector
    suggestions_manager --> suggestions_ui
    
    %% Data flow
    storage -.->|"loads macros"| main
    storage -.->|"listens for changes"| detector
    detector -.->|"sends detection events"| coordinator
    coordinator -.->|"shows overlays"| new_suggestions_manager
    coordinator -.->|"shows search overlay"| search_manager
    coordinator -.->|"shows suggestions"| suggestions_manager
    detector -.->|"detects system macros"| system_macros
    
    %% Action flow
    actions -.->|"defines"| detector
    actions -.->|"defines"| coordinator
    
    %% Styling
    new_suggestions_styles --> new_suggestions_manager
    suggestions_styles --> suggestions_manager
    search_styles --> search_manager
    
    %% Hooks and utilities
    compose_effects --> new_suggestions_ui
    use_auto_focus --> new_suggestions_ui
    new_suggestions_utils --> new_suggestions_manager

    style main fill:#e1f5fe
    style "Macro Detection System" fill:#f3e5f5
    style "Overlay System" fill:#e8f5e8
    style "Coordination System" fill:#fff3e0
    style detector fill:#ffcdd2,stroke:#e91e63,stroke-width:2px
    style coordinator fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style new_suggestions_manager fill:#fff9c4,stroke:#ffeb3b,stroke-width:2px
    style search_manager fill:#d1c4e9,stroke:#9c27b0,stroke-width:2px
```

## Macro Detection Flow

1. **Main Initialization** (`main.ts`)
   - Loads macros from storage
   - Initializes macro detector and coordinator
   - Sets up state management with useMacroStore

2. **Macro Detection** (`detector/macroDetector.ts`)
   - Listens for keyboard events on text input elements
   - Tracks user typing in "buffer" to detect macro prefixes (like "/")
   - Detects when user types potential macro commands
   - Handles Tab key to trigger macro suggestions overlay
   - Manages state between detection and replacement

3. **User Interactions**
   - **Typing**: When user types a prefix (like "/"), detector starts tracking
   - **Tab Key**: Shows all available macros in a fuzzy-searchable overlay
   - **Navigation Keys** (↑↓): Navigate through macro suggestions
   - **Commit Keys** (Space/Enter): Replace macro with content
   - **Escape**: Cancel current detection

4. **Overlay System**
   - **New Suggestions Overlay**: Shows filtered macro list as you type
   - **Search Overlay**: Full macro search functionality when pressing Tab
   - **Suggestions Overlay**: Traditional suggestions dropdown

5. **Coordination**
   - `NewSuggestionsCoordinator` manages communication between detector and overlays
   - Handles click-outside-to-close functionality
   - Manages macro data flow between components

## Key Files by Functionality

- **Detection Logic**: `detector/macroDetector.ts`, `detector/detector-core.ts`
- **Text Input Handling**: `detector/editableUtils.ts`
- **Keyboard Events**: `detector/keyUtils.ts`
- **Overlay Management**: `overlays/newSuggestionsOverlay/NewSuggestionsOverlayManager.ts`
- **UI Components**: `overlays/*/ui/*`
- **Event Coordination**: `coordinators/NewSuggestionsCoordinator.ts`
- **Macro Storage**: `storage/macroStorage.ts`

This architecture enables the extension to detect macro prefixes as users type in any text input, display relevant suggestions, and allow users to select macros using Tab for full search or arrow keys for navigation.