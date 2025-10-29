import { EditableEl } from "../../../types"
import { findTextNodeForOffset } from "./editableUtils"

/**
 * Metadata stored in the marker element for undo functionality
 */
export interface MacroMarkerData {
  macroId: string
  originalCommand: string
  insertedAt: number // timestamp
  isHtml: boolean
}

/**
 * Result of inserting content with a marker
 */
export interface InsertionResult {
  markerElement: HTMLElement
  insertedTextLength: number
}

const MARKER_ELEMENT_TAG = 'span'
const MARKER_ATTRIBUTE = 'data-macro-marker'
const MARKER_ID_ATTRIBUTE = 'data-macro-id'

/**
 * Creates a marker element that wraps replaced content for undo functionality.
 * Uses a semantic span with data attributes and 'display: contents' for transparency.
 */
function createMarkerElement(data: MacroMarkerData): HTMLSpanElement {
  const marker = document.createElement(MARKER_ELEMENT_TAG)

  // Mark this element as a macro marker
  marker.setAttribute(MARKER_ATTRIBUTE, 'true')
  marker.setAttribute(MARKER_ID_ATTRIBUTE, data.macroId)

  // Store metadata for undo
  marker.dataset.originalCommand = data.originalCommand
  marker.dataset.insertedAt = String(data.insertedAt)
  marker.dataset.isHtml = String(data.isHtml)

  // Make the wrapper transparent to layout - it should not affect rendering
  // 'display: contents' makes the element's children render as if they were
  // direct children of the element's parent
  marker.style.display = 'contents'

  return marker
}

/**
 * Retrieves metadata from a marker element
 */
function getMarkerData(marker: HTMLElement): MacroMarkerData | null {
  const macroId = marker.getAttribute(MARKER_ID_ATTRIBUTE)
  const originalCommand = marker.dataset.originalCommand
  const insertedAt = marker.dataset.insertedAt
  const isHtml = marker.dataset.isHtml

  if (!macroId || !originalCommand || !insertedAt || !isHtml) {
    return null
  }

  return {
    macroId,
    originalCommand,
    insertedAt: parseInt(insertedAt, 10),
    isHtml: isHtml === 'true'
  }
}

/**
 * Finds all macro markers in a contenteditable element
 */
function findMarkers(element: EditableEl): HTMLElement[] {
  if (!element || !('querySelector' in element)) return []

  const markers = element.querySelectorAll(`[${MARKER_ATTRIBUTE}="true"]`)
  return Array.from(markers) as HTMLElement[]
}

/**
 * Finds the most recently inserted marker in an element
 */
function findMostRecentMarker(element: EditableEl): HTMLElement | null {
  const markers = findMarkers(element)

  if (markers.length === 0) return null

  // Sort by insertion time (newest first)
  return markers.sort((a, b) => {
    const aData = getMarkerData(a)
    const bData = getMarkerData(b)
    if (!aData || !bData) return 0
    return bData.insertedAt - aData.insertedAt
  })[0]
}

/**
 * Replaces content in a contenteditable element and wraps it with a marker.
 * This is the PRIMARY function for replacing macros with rich text content.
 *
 * @param element - The contenteditable element
 * @param startPos - Start position in textContent
 * @param endPos - End position in textContent
 * @param contentHtml - HTML string to insert (can be plain text)
 * @param markerData - Metadata for undo functionality
 * @returns InsertionResult with the marker element and text length
 */
export function replaceWithMarker(
  element: HTMLElement,
  startPos: number,
  endPos: number,
  contentHtml: string,
  markerData: MacroMarkerData
): InsertionResult | null {
  if (!element) return null
  if (!element.isContentEditable && element.contentEditable !== 'true') return null

  const selection = window.getSelection()
  if (!selection) return null

  try {
    // Ensure element has at least one text node
    if (element.childNodes.length === 0 || element.textContent === null) {
      element.textContent = ''
    }

    // Find the DOM nodes at the specified positions
    const start = findTextNodeForOffset(element, startPos)
    const end = findTextNodeForOffset(element, endPos)

    if (!start || !end) {
      console.error('[RichTextReplacement] Could not find text nodes at positions', startPos, endPos)
      return null
    }

    // Create a range for the content to be replaced
    const range = document.createRange()
    range.setStart(start.node, start.offsetInNode)
    range.setEnd(end.node, end.offsetInNode)

    // Delete the original content
    range.deleteContents()

    // Create the marker wrapper
    const marker = createMarkerElement(markerData)

    // Parse and insert the content into the marker
    if (markerData.isHtml) {
      // For HTML content, parse and append as DOM nodes
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = contentHtml

      // Move all parsed nodes into the marker
      while (tempDiv.firstChild) {
        marker.appendChild(tempDiv.firstChild)
      }
    } else {
      // For plain text, create a text node
      marker.textContent = contentHtml
    }

    // Insert the marker at the range position
    range.insertNode(marker)

    // Move cursor after the marker
    range.setStartAfter(marker)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)

    // Calculate the text length of inserted content
    const insertedTextLength = marker.textContent?.length || 0

    return {
      markerElement: marker,
      insertedTextLength
    }
  } catch (error) {
    console.error('[RichTextReplacement] Error in replaceWithMarker:', error)
    return null
  }
}

/**
 * Undoes the most recent macro insertion by finding and removing the marker.
 * Restores the original command text.
 *
 * @param element - The contenteditable element
 * @returns true if undo was successful, false otherwise
 */
export function undoMostRecentInsertion(element: EditableEl): boolean {
  if (!element) return false
  if (!element.isContentEditable && element.contentEditable !== 'true') return false

  const marker = findMostRecentMarker(element)
  if (!marker) return false

  const markerData = getMarkerData(marker)
  if (!markerData) return false

  try {
    const selection = window.getSelection()
    if (!selection) return false

    // Create a text node with the original command
    const originalText = document.createTextNode(markerData.originalCommand)

    // Replace the marker with the original text
    marker.replaceWith(originalText)

    // Place cursor after the restored command
    const range = document.createRange()
    range.setStartAfter(originalText)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)

    return true
  } catch (error) {
    console.error('[RichTextReplacement] Error in undoMostRecentInsertion:', error)
    return false
  }
}

/**
 * Undoes a specific marker by its macro ID
 *
 * @param element - The contenteditable element
 * @param macroId - The ID of the macro to undo
 * @returns true if undo was successful, false otherwise
 */
export function undoSpecificInsertion(element: EditableEl, macroId: string): boolean {
  if (!element || !('querySelector' in element)) return false

  const marker = element.querySelector(`[${MARKER_ID_ATTRIBUTE}="${macroId}"]`) as HTMLElement
  if (!marker) return false

  const markerData = getMarkerData(marker)
  if (!markerData) return false

  try {
    // Create a text node with the original command
    const originalText = document.createTextNode(markerData.originalCommand)

    // Replace the marker with the original text
    marker.replaceWith(originalText)

    return true
  } catch (error) {
    console.error('[RichTextReplacement] Error in undoSpecificInsertion:', error)
    return false
  }
}

/**
 * Removes all macro markers from an element (useful for cleanup)
 *
 * @param element - The contenteditable element
 */
export function removeAllMarkers(element: EditableEl): void {
  const markers = findMarkers(element)

  markers.forEach(marker => {
    // Replace marker with its contents (unwrap)
    const fragment = document.createDocumentFragment()
    while (marker.firstChild) {
      fragment.appendChild(marker.firstChild)
    }
    marker.replaceWith(fragment)
  })
}

/**
 * Checks if an element has any macro markers
 *
 * @param element - The contenteditable element
 * @returns true if the element contains macro markers
 */
export function hasMarkers(element: EditableEl): boolean {
  return findMarkers(element).length > 0
}

/**
 * Gets the count of macro markers in an element
 *
 * @param element - The contenteditable element
 * @returns the number of macro markers
 */
export function getMarkerCount(element: EditableEl): number {
  return findMarkers(element).length
}
