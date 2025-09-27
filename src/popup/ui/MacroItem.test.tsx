// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MacroItem from "./MacroItem";

describe("MacroItem", () => {
  it("renders trigger and preview", () => {
    render(<MacroItem macro={{ id: "1", command: "/sig", text: "Saludos cordiales" }} />);
    expect(screen.getByText("/sig")).toBeTruthy();
  });

  it("expands content on click", () => {
    render(<MacroItem macro={{ id: "1", command: "/brb", text: "Estare de regreso en un momento" }} />);
    fireEvent.click(screen.getByText("/brb"));
    expect(screen.getByText("Estare de regreso en un momento")).toBeTruthy();
  });
});