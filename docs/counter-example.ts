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

// ============ managers/displayManager.ts ============
// Manager - handles the DOM details
export function createDisplayManager() {
  const element = document.getElementById('counter-display')!
  
  return {
    updateDisplay(value: number) {
      element.textContent = String(value)
      element.classList.add('updated')
      setTimeout(() => element.classList.remove('updated'), 300)
    },
    
    showError(message: string) {
      element.textContent = message
      element.classList.add('error')
    },
    
    destroy() {
      element.remove()
    }
  }
}

// ============ coordinators/displayCoordinator.ts ============
// Coordinator - business logic
export function createDisplayCoordinator(): CounterActions {
  const displayManager = createDisplayManager()
  
  return {
    onIncrement(newValue) {
      // Coordinator decides what to do
      if (newValue > 100) {
        displayManager.showError('Too high!')
      } else {
        displayManager.updateDisplay(newValue)
      }
    },
    
    onDecrement(newValue) {
      if (newValue < 0) {
        displayManager.showError('Cannot go negative!')
      } else {
        displayManager.updateDisplay(newValue)
      }
    },
    
    onReset() {
      displayManager.updateDisplay(0)
    }
  }
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
