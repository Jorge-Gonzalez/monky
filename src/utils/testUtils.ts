import { EditableEl } from "../types"

/**
 * Helper function to simulate typing in an element
 * Updates content BEFORE dispatching keydown event so detector can see it
 * 
 * Special handling for trigger characters (space, enter):
 * - If str ends with ' ' (space), it types the content then triggers with space
 * - If str ends with 'Enter', it types the content then triggers with enter
 * - This better reflects real user behavior where triggers don't become part of content
 */
export function typeIn(element: EditableEl, str: string) {
  element.focus()
  
  // Check if string ends with trigger characters
  let content = str
  let triggerKey: string | null = null
  
  if (str.endsWith(' ')) {
    content = str.slice(0, -1)  // Remove trailing space
    triggerKey = ' '
  } else if (str.endsWith('Enter')) {
    content = str.slice(0, -5)  // Remove 'Enter'
    triggerKey = 'Enter'
  }
  
  // First, type the content characters
  for (const key of content) {
    // IMPORTANT: Update content BEFORE dispatching keydown
    // The macro detector reads content during keydown, so it must be updated first
    
    if (element.isContentEditable || (element as HTMLElement).contentEditable === 'true') {
      let selection = window.getSelection()
      let range: Range
      
      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
      } else {
        // No selection exists, create one at the end
        selection = window.getSelection()!
        range = document.createRange()
        
        // Find the last position in the contentEditable
        if (element.childNodes.length > 0) {
          const lastNode = element.childNodes[element.childNodes.length - 1]
          if (lastNode.nodeType === Node.TEXT_NODE) {
            range.setStart(lastNode, (lastNode as Text).length)
          } else {
            range.setStartAfter(lastNode)
          }
        } else {
          range.setStart(element, 0)
        }
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      
      // Delete any selected content
      range.deleteContents()
      
      // Insert the new character
      const textNode = document.createTextNode(key)
      range.insertNode(textNode)
      
      // Move cursor after the inserted character
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      // For input/textarea, manipulate value and selection
      const start = element.selectionStart || 0
      const end = element.selectionEnd || 0
      element.value = element.value.substring(0, start) + key + element.value.substring(end)
      element.selectionStart = element.selectionEnd = start + 1
    }
    
    // NOW dispatch keydown event (content is already updated)
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  }
  
  // If there's a trigger character, dispatch it separately
  // This simulates the user pressing space/enter AFTER typing the macro
  if (triggerKey) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: triggerKey, bubbles: true }))
  }
  
  // Dispatch input event at the end
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
}
