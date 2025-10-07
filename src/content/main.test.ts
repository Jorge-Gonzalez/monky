// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// Mock the storage and its listeners
vi.mock("./macroStorage", async () => {
  const original = await vi.importActual<typeof import("./macroStorage")>("./macroStorage")
  return {
    ...original,
    loadMacros: vi.fn().mockResolvedValue([
      { id: "1", command: "/sig", text: "My Signature" },
      { id: "2", command: "/brb", text: "Be right back" },
      { id: "3", command: "/signature", text: "My Full Signature" },
    ]),
    listenMacrosChange: vi.fn(),
  }
})

vi.mock('./overlays', () => ({
  suggestionsOverlayManager: {
    isVisible: vi.fn().mockReturnValue(true), // Simulate overlay is visible when typing
    selectCurrent: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    navigate: vi.fn(),
  },
  searchOverlayManager: {},
}))

import { suggestionsOverlayManager } from './overlays'
import { useMacroStore } from "../store/useMacroStore"
// Import the content script logic after mocks are set up.
// The `init()` call inside index.ts will use the mocked `loadMacros`.
import { init, cleanupMacroSystem } from './main'

describe("Content Script: Macro Replacement", () => {
  // Helper to simulate typing a character
  const typeIn = (el: HTMLElement | HTMLInputElement | HTMLTextAreaElement, key: string) => {
    // For contenteditable, we need to manually manage the selection to simulate
    // typing at the end of the content.
    if (
      el instanceof HTMLElement &&
      (el.isContentEditable || el.contentEditable === "true")
    ) {
      const range = document.createRange()
      const sel = window.getSelection()!
      range.selectNodeContents(el)
      range.collapse(false) // false collapses to the end
      sel.removeAllRanges()
      sel.addRange(range)
    }

    // Dispatch the keydown event. The listener is on `window`, but we dispatch on the target.
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
    el.dispatchEvent(event)

    // Manually simulate the browser's default action if the event was not prevented.
    if (!event.defaultPrevented) {
      if (key === "Backspace") {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
          el.value = el.value.slice(0, -1)
        else
          el.textContent = el.textContent!.slice(0, -1)
      } else if (key.length === 1) {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
          el.value += key
        else
          el.textContent += key
      }
    }
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    await init()
    // Set default prefixes for the store
    useMacroStore.setState(s => ({ config: { ...s.config, prefixes: ["/"] } }))

    // Spy on createElement to add a mock for scrollIntoView.
    // This is needed because JSDOM doesn't implement it.
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag, options) => {
      const element = originalCreateElement(tag, options);
      element.scrollIntoView = vi.fn();
      return element
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    cleanupMacroSystem()
  })

  describe("Manual Mode (useCommitKeys: true)", () => {
    beforeEach(() => {
      useMacroStore.setState(s => ({ config: { ...s.config, useCommitKeys: true } }))
    })

    describe("in contenteditable", () => {
      let div: HTMLDivElement

      beforeEach(() => {
        div = document.createElement("div")
        div.contentEditable = "true"
        document.body.appendChild(div)
        div.focus()
      })

      afterEach(() => {
        document.body.removeChild(div)
      })

      it("should replace macro on space key commit", () => {
        div.textContent = "Hello "
        typeIn(div, "/")
        typeIn(div, "s")
        typeIn(div, "i")
        typeIn(div, "g")
        expect(div.textContent).toBe("Hello /sig")
        typeIn(div, " ")
        expect(div.textContent).toBe("Hello My Signature")
      })

      it("should replace macro on Enter key commit", () => {
        div.textContent = "Typing... "
        typeIn(div, "/")
        typeIn(div, "b")
        typeIn(div, "r")
        typeIn(div, "b")
        expect(div.textContent).toBe("Typing... /brb")
        typeIn(div, "Enter")
        expect(div.textContent).toBe("Typing... Be right back")
      })

      it("should allow correcting a typo with backspace before manual commit", () => {
        div.textContent = "Hello "
        typeIn(div, "/")
        typeIn(div, "s")
        typeIn(div, "i")
        typeIn(div, "x") // typo
        expect(div.textContent).toBe("Hello /six")

        typeIn(div, "Backspace") // remove the 'x'
        expect(div.textContent).toBe("Hello /si")

        typeIn(div, "g")
        expect(div.textContent).toBe("Hello /sig")

        // When overlay is visible, selectCurrent should return true to commit
        vi.mocked(suggestionsOverlayManager.selectCurrent).mockReturnValue(true)
        typeIn(div, " ") // commit with space
        expect(div.textContent).toBe("Hello My Signature")
      })
    })

    describe("in textarea", () => {
      let textarea: HTMLTextAreaElement

      beforeEach(() => {
        textarea = document.createElement("textarea")
        document.body.appendChild(textarea)
        textarea.focus()
      })

      afterEach(() => {
        document.body.removeChild(textarea)
      })

      it("should replace macro on space key commit", () => {
        textarea.value = "Note: "
        typeIn(textarea, "/")
        typeIn(textarea, "s")
        typeIn(textarea, "i")
        typeIn(textarea, "g")
        expect(textarea.value).toBe("Note: /sig")
        typeIn(textarea, " ")
        expect(textarea.value).toBe("Note: My Signature")
      })
    })
  })

  describe("Automatic Mode (useCommitKeys: false)", () => {
    let div: HTMLDivElement

    beforeEach(() => {
      useMacroStore.setState(s => ({ config: { ...s.config, useCommitKeys: false } }))
      div = document.createElement("div")
      div.contentEditable = "true"
      document.body.appendChild(div)
      div.focus()
    })

    afterEach(() => {
      document.body.removeChild(div)
    })

    it("should replace macro immediately if it's not a prefix of another macro", () => {
      div.textContent = "I will "
      typeIn(div, "/")
      typeIn(div, "b")
      typeIn(div, "r")
      typeIn(div, "b")
      expect(div.textContent).toBe("I will Be right back")
    })

    it("should replace macro after a delay if it is a prefix of another macro", () => {
      div.textContent = "My "
      typeIn(div, "/")
      typeIn(div, "s")
      typeIn(div, "i")
      typeIn(div, "g")
      expect(div.textContent).toBe("My /sig") // Not replaced yet

      vi.advanceTimersByTime(1900)
      expect(div.textContent).toBe("My My Signature")
    })

    it("should replace longer macro immediately", () => {
      div.textContent = "My "
      typeIn(div, "/")
      typeIn(div, "s")
      typeIn(div, "i")
      typeIn(div, "g")
      typeIn(div, "n")
      typeIn(div, "a")
      typeIn(div, "t")
      typeIn(div, "u")
      typeIn(div, "r")
      typeIn(div, "e")
      expect(div.textContent).toBe("My My Full Signature")
    })

    it("should not auto-commit while backspace is being used", () => {
      // This test is from the old suite and is relevant for automatic mode
      div.textContent = "Hello "
      typeIn(div, "/")
      typeIn(div, "s")
      typeIn(div, "i")
      typeIn(div, "g") // buffer is now "/sig", which is an exact match
      expect(div.textContent).toBe("Hello /sig")

      // An auto-commit timer should be scheduled
      vi.advanceTimersByTime(1800) // just before CONFIRM_DELAY_MS = 1850

      typeIn(div, "Backspace") // user hits backspace
      expect(div.textContent).toBe("Hello /si")

      // The timer should have been cancelled. We advance past the original timeout.
      vi.advanceTimersByTime(100) // total time is now 1900ms
      // The text should NOT have been replaced
      expect(div.textContent).toBe("Hello /si")

      typeIn(div, "g") // user re-types 'g'
      expect(div.textContent).toBe("Hello /sig")

      // A new timer should be scheduled. Let's let it fire.
      vi.advanceTimersByTime(1900)
      expect(div.textContent).toBe("Hello My Signature")
    })
  })
})