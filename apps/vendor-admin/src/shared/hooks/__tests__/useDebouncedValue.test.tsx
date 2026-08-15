import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useDebouncedValue } from "../useDebouncedValue";

function Probe({ value, delayMs }: { value: string; delayMs?: number }) {
  const debounced = useDebouncedValue(value, delayMs);
  return <div data-testid="value">{debounced}</div>;
}

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    render(<Probe value="a" />);
    expect(screen.getByTestId("value").textContent).toBe("a");
  });

  it("delays reflecting a changed value until delayMs has elapsed", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Probe value="a" delayMs={300} />);

    rerender(<Probe value="b" delayMs={300} />);
    expect(screen.getByTestId("value").textContent).toBe("a");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(screen.getByTestId("value").textContent).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("value").textContent).toBe("b");

    vi.useRealTimers();
  });

  it("resets the timer on rapid changes instead of applying an intermediate value", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Probe value="a" delayMs={300} />);

    rerender(<Probe value="b" delayMs={300} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender(<Probe value="c" delayMs={300} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId("value").textContent).toBe("a");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId("value").textContent).toBe("c");

    vi.useRealTimers();
  });
});
