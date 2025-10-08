## Unidirectional data fow

Here is a breakdown of the new data flow direction:

**UI (Interaction) ➞ Manager (Method Call) ➞ Actions (Handler) ➞ Store (Update) ➞ Manager (Notification) ➞ UI (Re-render)**

Let's walk through it step-by-step, using the theme change as an example:

1. **User Interaction (UI):** The user clicks the "dark mode" button inside the _Popup_ component.
  ```ts
  // in Popup.tsx
  <button onClick={() => handleThemeChange('dark')}>🌙</button>
  ```
2. **Manager Method Call (UI ➞ Manager):** The _handleThemeChange_ function calls the _setTheme_ method on the manager instance that was passed into the _Popup_ component as a prop.
  ```ts
  // in Popup.tsx
  const handleThemeChange = (theme) => {
    manager.setTheme(theme); // The UI tells the manager what to do.
  };
  ```

3. **Action Handler (Manager ➞ Actions):** The _PopupManager_ doesn't contain the logic itself. It delegates the task to the _actions_ object it was created with. It calls _actions.onThemeChanged('dark')_.
```ts
// in createPopupManager.ts
setTheme(theme) {
  actions.onThemeChanged(theme); // The manager invokes the action.
}
```
4. **Store Update (Actions ➞ Store):** The _createDefaultPopupActions_ implementation receives this call and interacts directly with the _useMacroStore_ to update the global state.
```ts
// in createDefaultPopupActions.ts
onThemeChanged(theme) {
  useMacroStore.getState().setTheme(theme); // The action updates the store.
}
```
5. **Store Notification (Store ➞ Manager):** The _useMacroStore_ (Zustand) updates its state and notifies all its subscribers of the change. The _PopupManager_ is one of those subscribers.
```ts
// in createPopupManager.ts
const unsubscribeStore = useMacroStore.subscribe(() => {
  notifySubscribers(); // The manager is notified by the store.
});
```
6. **UI Re-render (Manager ➞ UI):** The _PopupManager_'s _notifySubscribers_ function is called, which in turn calls the _setState_ function inside the _Popup_ component with the fresh state. This triggers a re-render of the _Popup_ component and its children with the new data (e.g., the updated theme).
```ts
 Show full code block 
// in Popup.tsx
React.useEffect(() => {
  // The manager notifies the UI, which updates its local state and re-renders.
  const unsubscribe = manager.subscribe(setState); 
  return unsubscribe;
}, [manager]);
```
**Key Takeaway**

The most significant change is that the **UI components are now decoupled from the global store**. They only know about the _manager_, which provides a clean and stable API for both actions (like _setTheme_) and data (_getState_). This makes the _Popup_ component more reusable, easier to test, and less concerned with how or where the application state is managed.
