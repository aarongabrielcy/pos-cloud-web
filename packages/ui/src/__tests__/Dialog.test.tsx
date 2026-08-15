import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "../Dialog";

describe("Dialog", () => {
  it("does not render its content when closed", () => {
    render(
      <Dialog open={false} onOpenChange={vi.fn()} title="Edit customer">
        <p>Dialog body</p>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders title and content when open", () => {
    render(
      <Dialog open onOpenChange={vi.fn()} title="Edit customer" description="Update details">
        <p>Dialog body</p>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Edit customer")).toBeInTheDocument();
    expect(screen.getByText("Update details")).toBeInTheDocument();
    expect(screen.getByText("Dialog body")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when the close button is clicked", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Edit customer">
        <p>Dialog body</p>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when Escape is pressed", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Edit customer">
        <p>Dialog body</p>
      </Dialog>,
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("stays mounted/closed correctly when the consumer wires open state end-to-end", async () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog open={open} onOpenChange={setOpen} title="Edit customer">
          <p>Dialog body</p>
        </Dialog>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
