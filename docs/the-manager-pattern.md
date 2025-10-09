# Monky's Data Flow & State Management: The Manager Pattern

This document outlines the "Manager" pattern used throughout the Monky extension for state management and business logic. It is divided into two parts: a general explanation of the pattern, and a specific look at its implementation within this project.

---

## Part 1: The Manager Pattern - A General Overview

### The Goal

The primary goal of this pattern is to achieve a clean **separation of concerns**:

*   **UI Components (React):** Should be as "dumb" as possible. Their job is to render the UI based on props and state, and to call functions when the user interacts with them.
*   **Business Logic (Managers):** All the "how" of the application—how to fetch data, how to save settings, how to validate input—is handled outside of the UI components.

This separation makes the code easier to test, reason about, and refactor.

### Core Concepts

*   **Manager:** A plain JavaScript object that acts as the central controller for a feature or view. It holds the state, exposes methods to manipulate that state (actions), and provides a way for the UI to subscribe to state changes.
*   **Actions:** Functions that contain the actual business logic. They are created separately and passed to the manager when it's initialized. This keeps the manager itself lean and focused on state and subscriptions.
*   **State:** The data that a feature needs to operate. It is kept private within the manager and is only exposed via `getState()` or through subscriptions.
*   **View (Component):** A React component that uses a manager to get its data and perform actions.

### Unidirectional Data Flow

The pattern enforces a predictable, one-way data flow:

**UI (Interaction) ➞ Manager (Method Call) ➞ Actions (Handler) ➞ Store (Update) ➞ Manager (Notification) ➞ UI (Re-render)**

---

## Part 2: Implementation in the Monky Extension

There are two variations of this pattern used in the project, depending on the needs of the view.

### Pattern A: Hook-based (For Isolated Views)

This pattern is used for self-contained views like the extension's **Popup**. A custom React hook provides a single, lifecycle-managed instance of the manager to the component.

**How it works:**

1.  A `use[Feature]Manager` hook is created (e.g., `usePopupManager`).
2.  This hook is responsible for creating the manager instance and its actions *only once*.
3.  It uses a `useEffect` hook to call the manager's `destroy()` method when the component unmounts, cleaning up any listeners.
4.  The UI component calls this hook to get the manager.
5.  The component uses `useState` and `useEffect` to subscribe to the manager's state changes.

**Example (`Popup.tsx`):**

```ts
import { usePopupManager } from '../managers/usePopupManager';

export default function Popup() {
  // 1. Get the manager instance from the hook
  const manager = usePopupManager();

  // 2. Initialize local state with the manager's current state
  const [state, setState] = useState(manager.getState());

  // 3. Subscribe to future changes
  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe; // Unsubscribe on cleanup
  }, [manager]);

  // 4. Render UI based on state and call manager actions
  return (
    <div>
      <ThemeSwitcher /> {/* This child also uses the hook to call manager.setTheme() */}
      <MacroSearch macros={state.macros} />
    </div>
  );
}
```

### Pattern B: Prop-based (For Complex/Shared Views)

This pattern is used for more complex views like the **Options** page, where a parent component orchestrates several child components that need to share state and actions.

**How it works:**

1.  A **parent container component** (e.g., `Options.tsx`) creates the manager instance.
2.  The parent subscribes to the manager's state changes.
3.  The parent renders **child components**, passing down:
    *   The `manager` instance itself (so children can call actions).
    *   Slices of the state as individual props (e.g., `prefixes`, `useCommitKeys`).

**Example (`PrefixEditor.tsx` as a child component):**

```ts
// The PrefixEditor component receives what it needs as props.
export default function PrefixEditor({ manager, prefixes }) {

  const handleToggle = (prefix) => {
    // It calls actions on the manager passed via props.
    const newPrefixes = /* ... */;
    manager.setPrefixes(newPrefixes);
  };

  // It renders UI based on the state slice passed via props.
  return <button checked={prefixes.includes('/')}>/</button>;
}
```

