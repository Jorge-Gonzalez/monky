// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { replaceText } from "./editableUtils"
import type { Macro } from "./detector-core"

describe("replaceText (input/textarea)", () => {
  let input: HTMLInputElement
  let textarea: HTMLTextAreaElement

  beforeEach(() => {
    input = document.createElement("input")
    input.type = "text"
    document.body.appendChild(input)

    textarea = document.createElement("textarea")
    document.body.appendChild(textarea)
  })

  afterEach(() => {
    document.body.removeChild(input)
    document.body.removeChild(textarea)
  })

  it("replaces text in an input element and sets cursor", () => {
    const macro: Macro = { id: 1, command: "/cmd", text: "command" }
    input.value = "some text /cmd here"
    const startPos = 10
    const selEnd = 14

    replaceText(input, macro, startPos, selEnd)

    expect(input.value).toBe("some text command here")
    expect(input.selectionStart).toBe(10 + "command".length)
    expect(input.selectionEnd).toBe(10 + "command".length)
  })

  it("replaces text in a textarea element and sets cursor", () => {
    const macro: Macro = { id: 1, command: "/bye", text: "goodbye" }
    textarea.value = "Well, /bye for now"
    const startPos = 6
    const selEnd = 10

    replaceText(textarea, macro, startPos, selEnd)

    expect(textarea.value).toBe("Well, goodbye for now")
    expect(textarea.selectionStart).toBe(6 + "goodbye".length)
    expect(textarea.selectionEnd).toBe(6 + "goodbye".length)
  })

  it("replaces text at the end of an input", () => {
    const macro: Macro = { id: 1, command: "/end", text: "THE END" }
    input.value = "This is the /end"
    const startPos = 12
    const selEnd = 16

    replaceText(input, macro, startPos, selEnd)

    expect(input.value).toBe("This is the THE END")
    expect(input.selectionStart).toBe(12 + "THE END".length)
    expect(input.selectionEnd).toBe(12 + "THE END".length)
  })
})