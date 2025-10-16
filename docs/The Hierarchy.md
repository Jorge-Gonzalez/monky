The Hierarchy:

┌─────────────────┐
│   Detector      │  ← Core logic (counts, detects macros)
│  (Pure logic)   │
└────────┬────────┘
         │ calls actions
         │
┌────────▼────────┐
│  Coordinator    │  ← Business logic (when to show, validation)
│ (Orchestrator)  │
└────────┬────────┘
         │ calls methods
         │
┌────────▼────────┐
│    Manager      │  ← Implementation details (DOM, React, storage)
│   (Worker)      │
└─────────────────┘