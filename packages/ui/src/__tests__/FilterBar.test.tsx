import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterBar } from "../FilterBar";

/** Structural/class assertions only (WEB-01E UX correction brief §29-32) - jsdom has no real
 *  layout engine, so there's no way to measure an actual viewport-pixel breakpoint switch here.
 *  What IS verifiable, and what actually drives the responsive contract, is that the wrapper
 *  carries Tailwind's mobile-first stacked classes unconditionally and only gains the `lg:` row
 *  classes as additional (not replacing) classes - domain-agnostic, no per-page logic. */
describe("FilterBar", () => {
  it("renders its children", () => {
    render(
      <FilterBar>
        <div>Status filter</div>
        <div>Search filter</div>
      </FilterBar>,
    );

    expect(screen.getByText("Status filter")).toBeInTheDocument();
    expect(screen.getByText("Search filter")).toBeInTheDocument();
  });

  it("stacks children in a column by default (below the lg breakpoint)", () => {
    render(
      <FilterBar>
        <div>Status filter</div>
      </FilterBar>,
    );

    const wrapper = screen.getByText("Status filter").parentElement;
    expect(wrapper).toHaveClass("flex", "flex-col");
  });

  it("switches to a single non-wrapping horizontal row at the lg breakpoint", () => {
    render(
      <FilterBar>
        <div>Status filter</div>
      </FilterBar>,
    );

    const wrapper = screen.getByText("Status filter").parentElement;
    expect(wrapper).toHaveClass("lg:flex-row", "lg:flex-nowrap", "lg:items-end");
  });

  it("owns no domain-specific child width/growth logic - only lays out whatever children it's given", () => {
    render(
      <FilterBar>
        <div data-testid="a">A</div>
        <div data-testid="b">B</div>
        <div data-testid="c">C</div>
      </FilterBar>,
    );

    // FilterBar renders exactly what it's given, unmodified - it never adds width/flex classes to
    // individual children itself; that's each feature's own Filters component's responsibility.
    expect(screen.getByTestId("a")).not.toHaveAttribute("class");
    expect(screen.getByTestId("b")).not.toHaveAttribute("class");
    expect(screen.getByTestId("c")).not.toHaveAttribute("class");
  });
});
