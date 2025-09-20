// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getSelection } from "./editableUtils"

describe("getSelection (contenteditable)", () => {
  let div: HTMLDivElement

  beforeEach(() => {
    div = document.createElement("div")
    div.contentEditable = "true"
    document.body.appendChild(div)
  })

  afterEach(() => {
    document.body.removeChild(div)
  })

  it("should return correct offsets in a multi-node structure", () => {
    div.innerHTML = "one <b>two</b> three"
    // cursor at "one <b>t|wo</b> three"
    const b = div.querySelector("b")!
    const textNodeInB = b.childNodes[0] as Text

    const sel = window.getSelection()!
    const range = document.createRange()
    range.setStart(textNodeInB, 1)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)

    const selection = getSelection(div)
    expect(selection).toEqual({ start: 5, end: 5 })
  })

  it("should return correct offsets when selection is in an element node", () => {
    div.innerHTML = "one <b>two</b> three"
    // The children are: text "one ", element <b>, text " three"
    // We are setting the selection before the <b> element, which is child index 1.

    const sel = window.getSelection()!
    const range = document.createRange()
    range.setStart(div, 1)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)

    const selection = getSelection(div)

    // The offset should be the length of "one ", which is 4.
    // The old implementation would have incorrectly returned 1.
    expect(selection).toEqual({ start: 4, end: 4 })
  })
})