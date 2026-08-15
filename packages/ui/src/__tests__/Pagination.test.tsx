import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("renders the current item range summary", () => {
    render(<Pagination page={2} pageSize={25} total={120} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText("Showing 26-50 of 120")).toBeInTheDocument();
  });

  it("renders nothing when total is 0", () => {
    const { container } = render(
      <Pagination page={1} pageSize={25} total={0} totalPages={0} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("disables Previous on the first page and Next on the last page", () => {
    render(<Pagination page={1} pageSize={25} total={30} totalPages={2} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).not.toBeDisabled();
  });

  it("calls onPageChange with the target page when a page button is clicked", async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={1} pageSize={25} total={75} totalPages={3} onPageChange={onPageChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("clamps the range display defensively when page is stale and exceeds totalPages", () => {
    render(
      <Pagination page={99} pageSize={25} total={100} totalPages={4} onPageChange={vi.fn()} />,
    );
    expect(screen.getByText("Showing 100-100 of 100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("calls onPageChange with page + 1 when Next is clicked", async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={1} pageSize={25} total={75} totalPages={3} onPageChange={onPageChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
