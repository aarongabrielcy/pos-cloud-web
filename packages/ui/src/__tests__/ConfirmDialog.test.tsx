import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../ConfirmDialog";

function Harness({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [open, setOpen] = useState(true);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Suspend customer"
      description="This will suspend the customer's access."
      confirmLabel="Suspend"
      variant="danger"
      onConfirm={onConfirm}
    />
  );
}

describe("ConfirmDialog", () => {
  it("closes and calls onConfirm on success", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<Harness onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows the error and stays open when onConfirm rejects", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("Cannot suspend the last active admin."));
    render(<Harness onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));

    await waitFor(() =>
      expect(screen.getByText("Cannot suspend the last active admin.")).toBeInTheDocument(),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes without calling onConfirm when Cancel is clicked", async () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
