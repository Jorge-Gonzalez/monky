# Monky Content Directory - Macro Detection Functionality

```mermaid
graph TB
    subgraph "Main Entry Point"
        main["main.ts"]
    end
    
    subgraph "Macro Detection System"
        detector["macroEngine/macroDetector.ts"]
        detector_core["macroEngine/detector-core.ts"]
        editableUtils["macroEngine/replacement/editableUtils.ts"]
        keyUtils["macroEngine/keyUtils.ts"]
        tabKeyIntegration["macroEngine/tabKeyIntegration.test.ts"]
        
        detector --> detector_core
        detector --> editableUtils
        detector --> keyUtils
    end
    
    subgraph "Action Handlers"
        actions["actions/detectorActions.ts"]
        defaults["actions/detectorDefaults.ts"]
        compActions["actions/compositeActions.ts"]
        analytics["actions/analyticsActions.ts"]
    end
    
    subgraph "Coordination System"
        suggestions_coordinator["coordinators/SuggestionsCoordinator.ts"]
        modal_coordinator["coordinators/ModalCoordinator.ts"]
        statistics["coordinators/statisticsCoordinator.ts"]
    end
    
    subgraph "Overlay System"
        overlays_index["overlays/index.ts"]
        
        subgraph "Modal System (Search, Settings, Editor)"
            modal_manager["overlays/modal/modalManager.ts"]
            modal_ui["overlays/modal/ui/*"]
            modal_views["overlays/views/*"]
        end
        
        subgraph "Suggestions Overlay"
            suggestions_manager["overlays/suggestionsOverlay/SuggestionsOverlayManager.ts"]
            suggestions_ui["overlays/suggestionsOverlay/ui/*"]
            suggestions_hooks["overlays/suggestionsOverlay/hooks/*"]
            suggestions_utils["overlays/suggestionsOverlay/utils/*"]
            suggestions_styles["overlays/suggestionsOverlay/SuggestionsOverlayStyles.ts"]
        end
        
        subgraph "Overlay Services"
            react_renderer["overlays/services/reactRenderer.ts"]
            style_injector["overlays/services/styleInjector.ts"]
            focus_manager["overlays/services/focusManager.ts"]
        end
        
        subgraph "Overlay Hooks"
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
    main --> suggestions_coordinator
    main --> modal_coordinator
    main --> storage
    
    detector --> suggestions_coordinator
    detector --> modal_coordinator
    
    suggestions_coordinator --> suggestions_manager
    modal_coordinator --> modal_manager
    
    suggestions_manager --> react_renderer
    suggestions_manager --> style_injector
    suggestions_manager --> suggestions_ui
    
    modal_manager --> react_renderer
    modal_manager --> style_injector
    modal_manager --> modal_ui
    modal_manager --> modal_views
    
    %% Data flow
    storage -.->|"loads macros"| main
    storage -.->|"listens for changes"| detector
    detector -.->|"sends detection events"| suggestions_coordinator
    detector -.->|"detects system macros"| system_macros
    
    %% Action flow
    actions -.->|"defines"| detector
    actions -.->|"defines"| suggestions_coordinator
    
    %% Styling
    suggestions_styles --> suggestions_manager
    
    %% Hooks and utilities
    use_auto_focus --> suggestions_ui
    use_auto_focus --> modal_ui

    style main fill:#e1f5fe
    style "Macro Detection System" fill:#f3e5f5
    style "Overlay System" fill:#e8f5e8
    style "Coordination System" fill:#fff3e0
    style detector fill:#ffcdd2,stroke:#e91e63,stroke-width:2px
    style suggestions_coordinator fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style modal_coordinator fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style suggestions_manager fill:#fff9c4,stroke:#ffeb3b,stroke-width:2px
    style modal_manager fill:#fff9c4,stroke:#ffeb3b,stroke-width:2px
```

## Macro Detection Flow

1. **Main Initialization** (`main.ts`)
   - Loads macros from storage
   - Initializes macro detector and coordinators (Suggestions, Modal)
   - Sets up state management with useMacroStore

2. **Macro Detection** (`macroEngine/macroDetector.ts`)
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
   - **Suggestions Overlay**: Shows filtered macro list as you type near the caret
   - **Modal System**: Full screen overlays for Search, Settings, and Macro Editing

5. **Coordination**
   - `SuggestionsCoordinator` manages the real-time suggestions overlay
   - `ModalCoordinator` manages the unified modal system (Search, Editor, Settings)

## Key Files by Functionality

- **Detection Logic**: `macroEngine/macroDetector.ts`, `macroEngine/detector-core.ts`
- **Text Input Handling**: `macroEngine/replacement/editableUtils.ts`
- **Keyboard Events**: `macroEngine/keyUtils.ts`
- **Suggestions Management**: `overlays/suggestionsOverlay/SuggestionsOverlayManager.ts`
- **Modal Management**: `overlays/modal/modalManager.ts`
- **Event Coordination**: `coordinators/SuggestionsCoordinator.ts`, `coordinators/ModalCoordinator.ts`
- **Macro Storage**: `storage/macroStorage.ts`

This architecture enables the extension to detect macro prefixes as users type in any text input, display relevant suggestions, and allow users to select macros or perform system commands.