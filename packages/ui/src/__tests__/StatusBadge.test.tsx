import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders its children for every semantic variant", () => {
    const variants = ["success", "warning", "danger", "neutral", "info"] as const;
    for (const variant of variants) {
      render(<StatusBadge variant={variant}>Label {variant}</StatusBadge>);
      expect(screen.getByText(`Label ${variant}`)).toBeInTheDocument();
    }
  });
});
