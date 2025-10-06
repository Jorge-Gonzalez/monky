import type { Macro, EditableEl } from '../types'

export function getActiveEditable(target: EventTarget | null): EditableEl {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    if (target.type === "password") return null
    return target
  }
  if (target instanceof HTMLElement && (target.isContentEditable || target.contentEditable === "true")) {
    return target
  }
  return null
}

/**
 * Given a root node and a character offset, finds the text node and offset within
 * that text node that corresponds to the character offset.
 */
function findTextNodeForOffset(root: Node, offset: number): { node: Text; offsetInNode: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  let currentNode: Node | null = walker.nextNode()
  let accumulatedOffset = 0
  while (currentNode) {
    const nodeLength = (currentNode.textContent ?? "").length
    if (accumulatedOffset + nodeLength >= offset) {
      const offsetInNode = offset - accumulatedOffset
      // If we are at the very end of a text node, and there's a next text node,
      // it's more accurate to return the beginning of the next node. This handles
      // cases where the selection starts exactly between two nodes.
      if (offsetInNode === nodeLength) {
        const nextNode = walker.nextNode()
        if (nextNode) return { node: nextNode as Text, offsetInNode: 0 }
      }
      return { node: currentNode as Text, offsetInNode }
    }
    accumulatedOffset += nodeLength
    currentNode = walker.nextNode()
  }
  return null
}

/**
 * Calculates the absolute character offset of a selection point (container + offset)
 * within a root node.
 */
function getAbsoluteOffset(root: Node, container: Node, offsetInContainer: number): number {
  const range = document.createRange()
  range.selectNodeContents(root)
  // This can throw an error if the container is not a descendant of the root.
  // It's a programmer error if that happens, so we'll let it throw.
  range.setEnd(container, offsetInContainer)
  return range.toString().length
}

export function getSelection(el: EditableEl): { start: number; end: number } | null {
  if (!el) return null
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 }
  }
  if (el instanceof HTMLElement && (el.isContentEditable || el.contentEditable === "true")) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    const start = getAbsoluteOffset(el, range.startContainer, range.startOffset)
    const end = getAbsoluteOffset(el, range.endContainer, range.endOffset)
    return { start, end }
  }
  return null
}

/**
 * Replaces text and sets the cursor in an <input> or <textarea> element.
 */
function replaceTextInInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  macro: Macro,
  startPos: number,
  selEnd: number,
) {
  const value = el.value
  const before = value.slice(0, startPos)
  const after = value.slice(selEnd)
  
  // For input/textarea, use the properly formatted text property
  // The text property should already contain formatted content (with line breaks, bullets, etc.)
  let replacementText = macro.text
  
  // Only extract from HTML if text property is missing or empty
  if ((!macro.text || macro.text.trim() === '') && macro.contentType === 'text/html' && macro.html) {
    // Create a temporary element to extract plain text from HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = macro.html
    replacementText = tempDiv.textContent || tempDiv.innerText || ''
  }
  
  el.value = before + replacementText + after

  const caretPosition = before.length + replacementText.length
  el.setSelectionRange(caretPosition, caretPosition)
}

/**
 * Sets the cursor position to be right after the given node.
 */
function setCursorAfterNode(node: Node) {
  const selection = window.getSelection()
  if (!selection) return

  selection.removeAllRanges()
  const range = document.createRange()
  range.setStartAfter(node)
  range.collapse(true)
  selection.addRange(range)
}

/**
 * Sets the cursor position in a contenteditable element at a given absolute character offset.
 */
function setCursorAtOffset(root: Node, offset: number) {
  const selection = window.getSelection()
  if (!selection) return

  const target = findTextNodeForOffset(root, offset)
  if (target) {
    selection.removeAllRanges()
    const range = document.createRange()
    range.setStart(target.node, target.offsetInNode)
    range.collapse(true)
    selection.addRange(range)
  }
}

/**
 * Replaces text in a contenteditable element using various strategies.
 */
function replaceTextInContentEditable(el: HTMLElement, macro: Macro, startPos: number, selEnd: number) {
  const isInsertingHTML = macro.contentType === 'text/html' && macro.html
  
  // Strategy 1: Fast path for elements with a single text node.
  const firstChild = el.firstChild
  if (firstChild && firstChild.nodeType === Node.TEXT_NODE && el.childNodes.length === 1) {
    const textNode = firstChild as Text
    const before = textNode.data.slice(0, startPos)
    const after = textNode.data.slice(selEnd)    
    if (isInsertingHTML) {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = macro.html
      const nodesToInsert = Array.from(tempDiv.childNodes)
      const lastNode = nodesToInsert[nodesToInsert.length - 1]
      
      textNode.data = before // Keep text before the macro
      let currentNode: Node = textNode // Track the node we just inserted after
      let finalNode: Node = textNode
      
      nodesToInsert.forEach(node => {
        // Insert after the current node
        el.insertBefore(node, currentNode.nextSibling)
        currentNode = node // Update reference to the node we just inserted
        finalNode = node
      })
      
      // Insert the "after" text after the last inserted node
      if (after) {
        el.insertBefore(document.createTextNode(after), finalNode.nextSibling)
      }
      setCursorAfterNode(finalNode)
    } else {
      textNode.data = before + macro.text + after
      setCursorAtOffset(el, before.length + macro.text.length)
    }
    return
  }

  // Strategy 2: DOM-aware replacement for complex HTML structures.
  const start = findTextNodeForOffset(el, startPos)
  const end = findTextNodeForOffset(el, selEnd)

  if (start && end) {
    const isInsertingHTML = macro.contentType === 'text/html' && macro.html

    // Special handling for replacement within a single text node
    if (start.node === end.node) {
      const textNode = start.node
      const parent = textNode.parentNode
      
      // Split the text node at the start and end positions
      const beforeText = textNode.data.substring(0, start.offsetInNode)
      const afterText = textNode.data.substring(end.offsetInNode)
      
      if (isInsertingHTML) {
        // Parse the HTML to insert
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = macro.html
        const nodesToInsert = Array.from(tempDiv.childNodes)
        const lastNode = nodesToInsert[nodesToInsert.length - 1]
        
        // Replace the original text node with: before + HTML nodes + after
        if (parent) {
          // Insert before text only if not empty
          if (beforeText) {
            parent.insertBefore(document.createTextNode(beforeText), textNode)
          }
          // Insert HTML nodes
          nodesToInsert.forEach(node => parent.insertBefore(node, textNode))
          // Insert after text only if not empty  
          if (afterText) {
            parent.insertBefore(document.createTextNode(afterText), textNode)
          }
          // Remove the original text node
          parent.removeChild(textNode)
          
          if (lastNode) {
            setCursorAfterNode(lastNode)
          }
        }
      } else {
        // Plain text replacement - just update the text node
        textNode.data = beforeText + macro.text + afterText
        setCursorAtOffset(el, startPos + macro.text.length)
      }
      return
    }
    
    // Special case: end is at position 0 of next node (selection ends exactly at node boundary)
    // In this case, we're replacing from start to the end of the start node
    if (start.node !== end.node && end.offsetInNode === 0) {
      const textNode = start.node
      const parent = textNode.parentNode
      
      const beforeText = textNode.data.substring(0, start.offsetInNode)
      // afterText is empty because we're replacing to the end of this node
      
      if (isInsertingHTML) {
        // Parse the HTML to insert
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = macro.html
        const nodesToInsert = Array.from(tempDiv.childNodes)
        const lastNode = nodesToInsert[nodesToInsert.length - 1]
        
        // Replace within the parent element
        if (parent) {
          if (beforeText) {
            parent.insertBefore(document.createTextNode(beforeText), textNode)
          }
          nodesToInsert.forEach(node => parent.insertBefore(node, textNode))
          parent.removeChild(textNode)
          
          if (lastNode) {
            setCursorAfterNode(lastNode)
          }
        }
      } else {
        // Plain text replacement
        if (parent) {
          const newText = beforeText + macro.text
          const newTextNode = document.createTextNode(newText)
          parent.insertBefore(newTextNode, textNode)
          parent.removeChild(textNode)
          setCursorAtOffset(el, startPos + macro.text.length)
        }
      }
      return
    }

    // For non-HTML or multi-node selections, use range-based approach
    const range = document.createRange()
    range.setStart(start.node, start.offsetInNode)
    range.setEnd(end.node, end.offsetInNode)

    // If the end of the range is at the very end of a text node,
    // and that text node is the only child of its parent,
    // expand the range to include the parent element itself.
    // This helps delete tags like <i>cro</i> instead of just leaving <i></i>.
    // But don't do this when inserting HTML, as we want to preserve the parent structure.
    if (!isInsertingHTML) {
      // If the selection spans the entire content of a parent element, expand the range to include that parent.
      if (start.offsetInNode === 0 && start.node.parentNode && start.node.parentNode !== el && start.node.parentNode.childNodes.length === 1) {
        range.setStartBefore(start.node.parentNode)
      }

      // Same check for the end of the range.
      if (end.offsetInNode === end.node.length && end.node.parentNode && end.node.parentNode !== el && end.node.parentNode.childNodes.length === 1) {
        range.setEndAfter(end.node.parentNode)
      }
    }

    range.deleteContents()

    if (isInsertingHTML) {
      // Insert as HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = macro.html
      const fragment = document.createDocumentFragment()
      let lastNode: Node | null = null
      while (tempDiv.firstChild) {
        lastNode = tempDiv.firstChild
        fragment.appendChild(lastNode)
      }
      
      range.insertNode(fragment)
      if (lastNode) {
        setCursorAfterNode(lastNode)
      }
    } else {
      // Insert as plain text
      const insertedNode = document.createTextNode(macro.text)
      range.insertNode(insertedNode)
      setCursorAfterNode(insertedNode)
    }
    return;
  }

  // Strategy 3: Fallback using execCommand.
  // This is a last resort if the DOM-aware logic fails.
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    // We can't trust startPos if findTextNodeForOffset failed,
    // so we re-select based on the current cursor position and command length.
    const commandLength = selEnd - startPos
    range.setStart(range.endContainer, range.endOffset - commandLength)
    range.deleteContents()
    // execCommand is simpler than insertNode for this fallback case.
    document.execCommand("insertText", false, macro.text)
  }
}

/**
 * Replaces a range of text in an editable element with the text from a macro.
 * It handles <input>, <textarea>, and contenteditable elements.
 */
export function replaceText(el: EditableEl, macro: Macro, startPos: number, selEnd: number) {
  if (!el) return

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    replaceTextInInput(el, macro, startPos, selEnd)
  } else if (el instanceof HTMLElement && (el.isContentEditable || el.contentEditable === "true")) {
    replaceTextInContentEditable(el, macro, startPos, selEnd)
  }

  // All paths should dispatch an input event to notify listeners of the change.
  el.dispatchEvent(new Event("input", { bubbles: true }))
}