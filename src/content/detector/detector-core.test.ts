import { describe, it, expect, beforeEach } from "vitest"
import { updateStateOnKey, isExact, CoreState, Macro } from "./detector-core"

const macros: Macro[] = [
  { id: 1, command: "/sig", text: "Saludos" },
  { id: 2, command: "/bye", text: "Adios" },
]
let s: CoreState

describe("detector-core: updateStateOnKey", () => {
  beforeEach(() => {
    s = { active: false, buffer: "" }
  })

  it("starts detection when prefix typed", () => {
    const nextState = updateStateOnKey(s, "/", macros)
    expect(nextState.active).toBe(true)
    expect(nextState.buffer).toBe("/")
  })

  it("should not start detection when the character is not a prefix", () => {
    const nextState = updateStateOnKey(s, "A", macros)
    expect(nextState.active).toBe(false)
    expect(nextState.buffer).toBe("")
  })

  it("extends buffer with printable chars", () => {
    s = updateStateOnKey(s, "/", macros)
    s = updateStateOnKey(s, "s", macros)
    s = updateStateOnKey(s, "i", macros)
    expect(s.active).toBe(true)
    expect(s.buffer).toBe("/si")
  })

  it("cancels when prefix no longer matches", () => {
    s = updateStateOnKey(s, "/", macros)
    s = updateStateOnKey(s, "x", macros)
    expect(s.active).toBe(false)
  })

  it("backspace reduces buffer and can cancel", () => {
    s = updateStateOnKey(s, "/", macros)
    s = updateStateOnKey(s, "s", macros)
    s = updateStateOnKey(s, "i", macros)
    s = updateStateOnKey(s, "Backspace", macros)
    expect(s.active).toBe(true)
    expect(s.buffer).toBe("/s")
    s = updateStateOnKey(s, "Backspace", macros)
    expect(s.active).toBe(true)
    expect(s.buffer).toBe("/")
    s = updateStateOnKey(s, "Backspace", macros)
    expect(s.active).toBe(false)
  })
})

describe("detector-core: isExact", () => {
  it("returns true when buffer exactly matches a macro command", () => {
    const state: CoreState = { active: true, buffer: "/sig" }
    expect(isExact(state, macros)).toBe(true)
  })

  it("returns false for partial/non-matching buffer", () => {
    const state: CoreState = { active: true, buffer: "/si" }
    expect(isExact(state, macros)).toBe(false)
  })

  it("returns true for another macro", () => {
    const state: CoreState = { active: true, buffer: "/bye" }
    expect(isExact(state, macros)).toBe(true)
  })
})