* * *

The Mangaer Pattern. Core Concepts & Their Relationships
--------------------------------------------------------

### 1\. **Interface** (`DetectorActions`)

```ts

  export interface DetectorActions {
    onMacroCommitted(macroId: string): void
    onDetectionStarted(buffer: string): void
    // ... other methods
  }
```

**What it is:** A **contract** - a list of methods that must exist.

**Why it exists:** So the detector knows "I can call these methods, and they'll exist."

**Analogy:** Like a power outlet. It defines the shape of the plug, not what device plugs in.

* * *

### 2\. **Detector** (`createMacroDetector`)

```ts

  function createMacroDetector(actions: DetectorActions) {
    // When something happens...
    actions.onMacroCommitted('macro-123')
  }
```

**What it is:** The **core logic** that detects macros and calls actions.

**What it needs:** Something that implements `DetectorActions` - it doesn't care what.

**What it does:** Calls the action methods when events happen.

**Analogy:** Like a washing machine. It has a power plug (needs actions), and it calls them when it does work.

* * *

### 3\. **Coordinator** (`createSuggestionsCoordinator`, `createStatisticsCoordinator`)

```ts

  function createSuggestionsCoordinator(): DetectorActions {
    return {
      onMacroCommitted(macroId) {
        suggestionsOverlayManager.hide()
      },
      // ... implements all required methods
    }
  }
```

**What it is:** A **specific implementation** of `DetectorActions`.

**What it does:** Defines what actually happens when actions are called.

**Why multiple coordinators:** Different coordinators do different things!

*   Suggestions coordinator → shows/hides UI
*   Statistics coordinator → tracks numbers

**Analogy:** Like different appliances (TV, lamp, phone charger) that all plug into the same outlet.

* * *

### 4\. **Manager** (`suggestionsOverlayManager`)

```ts

  const suggestionsOverlayManager = {
    show(buffer: string) { /* show UI */ },
    hide() { /* hide UI */ },
    isVisible() { /* return state */ }
  }
```

**What it is:** Manages a **specific piece of UI** (the overlay).

**What it does:** Direct operations on DOM/React components.

**Who calls it:** Coordinators call managers.

**Analogy:** Like the TV screen itself - the coordinator is the remote control.

* * *

The Data Flow:
--------------

  User types → Detector detects → Calls actions → Coordinator responds → Manager updates UI

**Concrete example:**

  User types "/sig" 
    ↓
  Detector: "I see a macro pattern!"
    ↓
  Detector calls: actions.onDetectionStarted("/sig")
    ↓
  SuggestionsCoordinator: onDetectionStarted() {
    suggestionsOverlayManager.show("/sig")
  }
    ↓
  Manager: Shows the suggestions overlay on screen

* * *

Why This Pattern?
-----------------

### **Without coordinators (bad):**

```ts

  function createMacroDetector() {
    // Detector directly touches UI - tightly coupled!
    suggestionsOverlayManager.show(buffer)
    statisticsService.track(macroId)
  }
```

### **With coordinators (good):**

```ts

  function createMacroDetector(actions: DetectorActions) {
    // Detector just calls actions - decoupled!
    actions.onDetectionStarted(buffer)
    actions.onMacroCommitted(macroId)
  }
```

Now the detector doesn't know about UI, statistics, or anything - it just calls actions!

* * *

Your Statistics Coordinator Role:
---------------------------------

```ts

  function createStatisticsCoordinator() {
    const stats = new Map()
  
    // Implements the DetectorActions interface
    return {
      onMacroCommitted(macroId) {
        // Detector will call this
        stats.set(macroId, (stats.get(macroId) || 0) + 1)
      },
      onDetectionStarted() {},  // Required by interface (no-op)
      // ... all other required methods
      
      // BONUS: Extra methods beyond the interface
      getStats() { return stats }
    }
  }
```

* * *

Key Insight:
------------

*   **Interface** = The contract (what methods must exist)
*   **Detector** = Calls the methods (doesn't care who implements them)
*   **Coordinator** = Implements the methods (does the actual work)
*   **Manager** = Helper that coordinator uses (manages specific things)

* * *

Counter Example:
----------------

```ts

// ============ actions/counterActions.ts ============
// The API - list of admissible interactions
export interface CounterActions {
  onIncrement(newValue: number): void
  onDecrement(newValue: number): void
  onReset(): void
}

// ============ counter/counter.ts ============
// The Detector (core logic) - uses the API
export function createCounter(actions: CounterActions) {
  let count = 0

  return {
    increment() {
      count++
      actions.onIncrement(count)  // Notify via API
    },
    
    decrement() {
      count--
      actions.onDecrement(count)  // Notify via API
    },
    
    reset() {
      count = 0
      actions.onReset()  // Notify via API
    },
    
    getCount() {
      return count
    }
  }
}

// ============ coordinators/displayCoordinator.ts ============
// Coordinator - implements the API (updates UI)
export function createDisplayCoordinator() {
  const actions: CounterActions = {
    onIncrement(newValue) {
      console.log(`✅ Counter increased to: ${newValue}`)
      document.getElementById('display')!.textContent = String(newValue)
    },
    
    onDecrement(newValue) {
      console.log(`⬇️ Counter decreased to: ${newValue}`)
      document.getElementById('display')!.textContent = String(newValue)
    },
    
    onReset() {
      console.log(`🔄 Counter reset!`)
      document.getElementById('display')!.textContent = '0'
    }
  }

  return actions
}

// ============ coordinators/historyCoordinator.ts ============
// Another coordinator - tracks history
export function createHistoryCoordinator() {
  const history: number[] = []

  const actions: CounterActions = {
    onIncrement(newValue) {
      history.push(newValue)
    },
    
    onDecrement(newValue) {
      history.push(newValue)
    },
    
    onReset() {
      history.length = 0  // Clear history
    }
  }

  return {
    ...actions,
    getHistory() {
      return [...history]  // Return copy
    }
  }
}

// ============ coordinators/compositeActions.ts ============
// Combine multiple coordinators
export function createCompositeActions(...handlers: CounterActions[]): CounterActions {
  return {
    onIncrement(newValue) {
      handlers.forEach(h => h.onIncrement(newValue))
    },
    onDecrement(newValue) {
      handlers.forEach(h => h.onDecrement(newValue))
    },
    onReset() {
      handlers.forEach(h => h.onReset())
    }
  }
}

// ============ main.ts ============
// Wire everything together
const displayCoordinator = createDisplayCoordinator()
const historyCoordinator = createHistoryCoordinator()

const combined = createCompositeActions(
  displayCoordinator,
  historyCoordinator
)

const counter = createCounter(combined)

// Use it
counter.increment()  // Both coordinators respond!
// Console: "✅ Counter increased to: 1"
// Display updates
// History records: [1]

counter.increment()
// Console: "✅ Counter increased to: 2"
// Display updates
// History records: [1, 2]

counter.reset()
// Console: "🔄 Counter reset!"
// Display shows: 0
// History cleared

console.log(historyCoordinator.getHistory())  // []

```
