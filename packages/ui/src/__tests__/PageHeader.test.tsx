import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("renders the title as a heading", () => {
    render(<PageHeader title="Customers" />);
    expect(screen.getByRole("heading", { name: "Customers" })).toBeInTheDocument();
  });

  it("renders an optional description", () => {
    render(<PageHeader title="Customers" description="Manage vendor customer accounts." />);
    expect(screen.getByText("Manage vendor customer accounts.")).toBeInTheDocument();
  });

  it("renders an optional actions slot", () => {
    render(<PageHeader title="Customers" actions={<button>New Customer</button>} />);
    expect(screen.getByRole("button", { name: "New Customer" })).toBeInTheDocument();
  });
});
