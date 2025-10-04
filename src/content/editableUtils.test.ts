// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { replaceText } from "./editableUtils"
import type { Macro } from "../types"

describe("replaceText", () => {
  describe("in contenteditable element", () => {
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

    it("replaces buffer with macro plain text", () => {
      const macro: Macro = { id: 1, command: "/macro", text: "world", contentType: "text/plain" }
      const startPos = 6
      const selEnd = 12

      replaceText(div, macro, startPos, selEnd)

      expect(div.textContent).toBe("Hello world!")
      expect(div.innerHTML).toBe("Hello world!")
    })

    it("replaces buffer with macro HTML when element is contenteditable", () => {
      const macro: Macro = {
        id: 2,
        command: "/macro",
        text: "world", // text fallback
        html: "<b>world</b>",
        contentType: "text/html",
      }
      const startPos = 6
      const selEnd = 12

      replaceText(div, macro, startPos, selEnd)

      expect(div.innerHTML).toBe("Hello <b>world</b>!")
    })

    it("replaces buffer with macro HTML inside existing HTML content", () => {
      div.innerHTML = "Prefix <i>/macro</i> Suffix"
      const macro: Macro = {
        id: 3,
        command: "/macro",
        text: "html content",
        html: "<b>html</b> content",
        contentType: "text/html",
      }
      // "Prefix " is 7 chars, "/macro" is 6 chars
      const startPos = 7
      const selEnd = 13

      replaceText(div, macro, startPos, selEnd)

      // The replacement should happen inside the <i> tag
      expect(div.innerHTML).toBe("Prefix <i><b>html</b> content</i> Suffix")
    })

    it("replaces buffer with macro HTML inside existing HTML content v2", () => {
      div.innerHTML = "Prefix <i>begin /macro end</i> Suffix"
      const macro: Macro = {
        id: 3,
        command: "/macro",
        text: "html content",
        html: "<b>html</b> content",
        contentType: "text/html",
      }
      // "Prefix " (7) + "begin " (6) = 13. "/macro" is 6 chars.
      const startPos = 13
      const selEnd = 19

      replaceText(div, macro, startPos, selEnd)

      // The replacement should happen inside the <i> tag
      expect(div.innerHTML).toBe("Prefix <i>begin <b>html</b> content end</i> Suffix")
    })

    it("replaces a macro at the end of content within an HTML tag with plain text", () => {
      div.innerHTML = "Prefix <i>some content /macro</i>"
      const macro: Macro = {
        id: 4,
        command: "/macro",
        text: "replacement",
        contentType: "text/plain",
      }
      // "Prefix " (7) + "some content " (13) = 20. "/macro" is 6 chars.
      const startPos = 20
      const selEnd = 26

      replaceText(div, macro, startPos, selEnd)

      expect(div.innerHTML).toBe("Prefix <i>some content replacement</i>")
    })

    it("replaces a macro at the end of content within an HTML tag with html content", () => {
      div.innerHTML = "Prefix <i>some content /macro</i>"
      const macro: Macro = {
        id: 5,
        command: "/macro",
        text: "replacement", // fallback
        html: "<b>replacement</b>",
        contentType: "text/html",
      }
      // "Prefix " (7) + "some content " (13) = 20. "/macro" is 6 chars.
      const startPos = 20
      const selEnd = 26

      replaceText(div, macro, startPos, selEnd)

      // The replacement should happen inside the <i> tag, preserving the tag
      // and inserting the new HTML content.
      expect(div.innerHTML).toBe("Prefix <i>some content <b>replacement</b></i>")
    })

    
  })


  describe("in textarea element", () => {
    it("falls back to plain text replacement for an HTML macro", () => {
      const textarea = document.createElement("textarea")
      textarea.value = "Hello /macro!"
      const macro: Macro = {
        id: 2,
        command: "/macro",
        text: "world",
        html: "<b>world</b>",
        contentType: "text/html",
      }

      replaceText(textarea, macro, 6, 12)

      expect(textarea.value).toBe("Hello world!")
    })
  })
})