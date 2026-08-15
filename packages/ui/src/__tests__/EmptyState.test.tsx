import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders title, description, and an optional action", () => {
    render(
      <EmptyState
        title="No customers yet"
        description="Create your first customer to get started."
        action={<button>Create customer</button>}
      />,
    );
    expect(screen.getByText("No customers yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first customer to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create customer" })).toBeInTheDocument();
  });

  it("renders without description/action when omitted", () => {
    render(<EmptyState title="No results" />);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });
});
