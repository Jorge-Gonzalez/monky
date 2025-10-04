// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { replaceText } from "./editableUtils"
import type { Macro } from "./detector-core"
import { getSelection } from "./editableUtils"

describe("replaceText (contenteditable) - multi-node", () => {
  let div: HTMLDivElement

  beforeEach(() => {
    div = document.createElement("div")
    div.contentEditable = "true"
    document.body.appendChild(div)
  })

  afterEach(() => {
    document.body.removeChild(div)
  })

  it("replaces a macro inside a nested element (using absolute offsets)", () => {
    // make focusable in jsdom (not strictly required for this test)
    div.tabIndex = 0
    div.appendChild(document.createTextNode("Hello "))
    const span = document.createElement("span")
    span.textContent = "/macro"
    div.appendChild(span)
    div.appendChild(document.createTextNode("!"))
    const macro: Macro = { id: 1, command: "/macro", text: "world" }

    // Compute absolute offsets: "Hello " = 6, "/macro" = 6 chars
    const start = 6
    const end = 12

    // Call replaceText directly with absolute offsets (avoids jsdom selection flakiness)
    replaceText(div, macro, start, end)

    expect(div.textContent).toBe("Hello world!")
  })

  // it("replaces a macro that spans across multiple elements", () => {
  //   div.innerHTML = "one <b>/ma</b><i>cro</i> two"
  //   const macro: Macro = { id: 1, command: "/macro", text: "replacement" }

  //   // "one " = 4, "/ma" = 3, "cro" = 3. Total length of /macro is 6.
  //   // start is after "one " -> 4
  //   // end is start + length of "/macro" -> 4 + 6 = 10
  //   const start = 4
  //   const end = 10

  //   replaceText(div, macro, start, end)

  //   // The <b> and <i> tags should be removed and replaced by the text.
  //   expect(div.innerHTML).toBe("one replacement two")
  //   expect(div.textContent).toBe("one replacement two")

  //   // Check cursor position. It should be after "one replacement"
  //   const selection = getSelection(div)
  //   expect(selection).not.toBeNull()
  //   expect(selection?.start).toBe("one replacement".length)
  //   expect(selection?.end).toBe("one replacement".length)
  // })
})