// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { replaceText } from "./editableUtils"
import type { Macro } from "./detector-core"

describe("replaceText (contenteditable)", () => {
  let div: HTMLDivElement

  beforeEach(() => {
    div = document.createElement("div")
    div.contentEditable = "true"
    div.textContent = "Hello /macro!"
    document.body.appendChild(div)
  })

  afterEach(() => {
    document.body.removeChild(div)
  })

  it("replaces buffer with macro text in contenteditable", () => {
    const macro: Macro = { id: 1, command: "/macro", text: "world" }
    const startPos = 6
    const selEnd = 12

    const textNode = div.childNodes[0]
    const range = document.createRange()
    range.setStart(textNode, startPos)
    range.setEnd(textNode, selEnd)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)

    // debug selection
    console.log("range.toString():", range.toString())
    console.log("before textContent:", div.textContent)
    console.log("childNodes before:", Array.from(div.childNodes).map(n => n.textContent))

    // call the function under test
    replaceText(div, macro, startPos, selEnd)

    // debug result
    console.log("after textContent:", div.textContent)
    console.log("childNodes after:", Array.from(div.childNodes).map(n => n.textContent))

    expect(div.textContent).toBe("Hello world!")
  })
})